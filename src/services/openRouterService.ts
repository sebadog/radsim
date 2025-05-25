// OpenRouter API service for RadTrainer

interface OpenRouterResponse {
  id: string;
  choices: {
    message: {
      content: string;
    };
  }[];
}

interface FeedbackRequest {
  userImpression: string;
  expectedFindings: string[];
  caseTitle: string;
  clinicalInfo: string;
  summaryOfPathology: string;
  accessionNumber: string;
  additionalFindings: string[];
  images: string[];
  completed: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface FeedbackResponse {
  feedback: string;
  score: number;
  showExpectedImpression: boolean;
  clueGiven: boolean;
}

export async function generateFeedback(request: FeedbackRequest): Promise<FeedbackResponse> {
  try {
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    
    if (!apiKey) {
      console.error('OpenRouter API key is missing');
      return {
        feedback: "Error: OpenRouter API key is missing. Please check your environment variables.",
        score: 0,
        showExpectedImpression: false,
        clueGiven: false
      };
    }

    const prompt = `
You are a radiology expert grading a trainee's response. Follow these scoring rules strictly:

1. Each case has one or multiple diagnoses (findings)
2. Total points are 100, divided by the number of findings
3. Full points for correct detection AND interpretation of each finding
4. No points for incorrect or missing findings (they can try again)

Case Information:
Title: ${request.caseTitle}
Clinical Information: ${request.clinicalInfo}
Expected Findings: ${request.expectedFindings.join(', ')}

Trainee's impression:
"${request.userImpression}"

Calculate the score based on:
- Number of findings: ${request.expectedFindings.length}
- Points per finding: ${Math.floor(100 / request.expectedFindings.length)}

Format your response as:
FEEDBACK: [Your feedback]
SCORE: [Numerical score]
CLUE_GIVEN: [true/false]
SHOW_EXPECTED: [true if score is 100]`;
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'RadTrainer'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-opus',
        messages: [
          {
            role: 'system',
            content: `You are a radiology expert providing feedback using the Socratic method. Follow these instructions strictly:

1. For correct findings:
   - Congratulate by paraphrasing their correct findings
   - Award full points for exact matches

2. For missed findings:
   - Ask them to review specific areas without revealing the finding
   - Provide ONE clue per finding
   - Never use words from the diagnosis in clues
   - Do not reveal diagnoses in clues

3. For misinterpreted findings:
   - Encourage considering other etiologies
   - Example: "Consider other possible etiologies for (finding)"
   - Do not disclose the correct diagnosis

4. For extra findings:
   - If they describe findings not in Expected/Additional lists
   - Inform: "The abnormality you described was not included among the findings for this case. If you consider it relevant, please submit it in the feedback section."

5. Scoring:
   - Total points (100) divided by number of findings
   - Full points for exact matches on first attempt
   - Half points if matched after clue
   - No points if not matched after clue`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 400
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenRouter API error:', errorData);
      return {
        feedback: `Error communicating with the LLM service: ${response.statusText}`,
        score: 0,
        showExpectedImpression: false,
        clueGiven: false
      };
    }

    const data: OpenRouterResponse = await response.json();
    const llmResponse = data.choices[0].message.content;
    
    // Parse the LLM response
    const result = parseLLMResponse(llmResponse, request);
    
    return {
      feedback: result.feedback,
      score: result.score,
      showExpectedImpression: result.showExpectedImpression,
      clueGiven: result.clueGiven
    };
    
  } catch (error) {
    console.error('Error generating feedback:', error);
    return {
      feedback: `An error occurred: ${error.message}`,
      score: 0,
      showExpectedImpression: false,
      clueGiven: false
    };
  }
}

function createPrompt(request: FeedbackRequest): string {
  const expectedFindings = Array.isArray(request.expectedFindings) ? request.expectedFindings : [];
  const additionalFindings = Array.isArray(request.additionalFindings) ? request.additionalFindings : [];
  const pointsPerFinding = Math.floor(100 / expectedFindings.length);

  return `
Evaluate this trainee's response using the Socratic method and exact matching with expected findings.

Case Information:
Title: ${request.caseTitle}
Accession Number: ${request.accessionNumber}
Clinical Information: ${request.clinicalInfo}
Summary of Pathology: ${request.summaryOfPathology}
Number of Images: ${request.images?.length || 0}

Expected Findings (${expectedFindings.length} findings, ${pointsPerFinding} points each):
${expectedFindings.map(finding => `- ${finding}`).join('\n')}

Additional Findings (For context):
${additionalFindings.map(finding => `- ${finding}`).join('\n')}

Trainee's impression:
"${request.userImpression}"

Instructions:
1. Compare each finding EXACTLY with expected findings
2. For each finding:
   - If exact match: Congratulate and award ${pointsPerFinding} points
   - If missed: Ask Socratic questions about the relevant area
   - If misinterpreted: Guide to consider other etiologies
   - If extra finding: Note it's not in expected/additional lists
3. Provide ONE clue per missed finding
4. Never reveal diagnoses in clues or feedback
5. Use Socratic method to guide learning

Format response as:
FEEDBACK: [Your Socratic feedback]
SCORE: [Points for exact matches]
CLUE_GIVEN: [true if any clues provided]
SHOW_EXPECTED: [true only if all exactly matched]`;
}

function parseLLMResponse(response: string, request: FeedbackRequest): FeedbackResponse {
  let feedback = '';
  let score = 0;
  let showExpectedImpression = false;
  let clueGiven = false;
  
  const feedbackMatch = response.match(/FEEDBACK:\s*([\s\S]*?)(?=SCORE:|$)/i);
  const scoreMatch = response.match(/SCORE:\s*(\d+)/i);
  const clueMatch = response.match(/CLUE_GIVEN:\s*(true|false)/i);
  const showExpectedMatch = response.match(/SHOW_EXPECTED:\s*(true|false)/i);
  
  if (feedbackMatch) {
    feedback = feedbackMatch[1].trim();
  }
  
  if (scoreMatch) {
    score = parseInt(scoreMatch[1], 10);
  }
  
  if (clueMatch) {
    clueGiven = clueMatch[1].toLowerCase() === 'true';
  }
  
  if (showExpectedMatch) {
    showExpectedImpression = showExpectedMatch[1].toLowerCase() === 'true';
  }
  
  // Calculate score based on exact matches
  const expectedFindings = Array.isArray(request.expectedFindings) ? request.expectedFindings : [];
  const pointsPerFinding = Math.floor(100 / expectedFindings.length);
  
  let calculatedScore = 0;
  const userImpression = request.userImpression.toLowerCase().trim();
  
  expectedFindings.forEach(finding => {
    const expectedLower = finding.toLowerCase().trim();
    if (userImpression.includes(expectedLower)) {
      calculatedScore += pointsPerFinding;
    }
  });
  
  // Use calculated score if LLM didn't provide one
  if (!score) {
    score = calculatedScore;
  }
  
  // Show expected impression only if all findings matched exactly
  showExpectedImpression = score === 100;
  
  return {
    feedback,
    score,
    showExpectedImpression,
    clueGiven: score < 100
  };
}

export async function generateSecondAttemptFeedback(
  firstAttempt: string,
  secondAttempt: string,
  request: FeedbackRequest
): Promise<FeedbackResponse> {
  try {
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    
    if (!apiKey) {
      return {
        feedback: "Error: OpenRouter API key is missing",
        score: 0,
        showExpectedImpression: false,
        clueGiven: false
      };
    }

    const prompt = `
You are a radiology expert grading a trainee's second attempt. Follow these scoring rules strictly:

1. Each case has one or multiple diagnoses (findings)
2. Total points are 100, divided by the number of findings
3. Half points for correct detection after receiving a clue
4. No points for findings still not identified

First attempt:
"${firstAttempt}"

Second attempt:
"${secondAttempt}"

Expected Findings:
${request.expectedFindings.join('\n')}

Calculate the score based on:
- Number of findings: ${request.expectedFindings.length}
- Points per finding on second attempt: ${Math.floor(50 / request.expectedFindings.length)}

Format your response as:
FEEDBACK: [Your feedback]
SCORE: [Total score including first and second attempts]
SHOW_EXPECTED: true`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'RadTrainer'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-opus',
        messages: [
          {
            role: 'system',
            content: 'You are a radiology expert evaluating a trainee\'s second attempt using the Socratic method. Award points based on exact matches with expected findings.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 400
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data: OpenRouterResponse = await response.json();
    const llmResponse = data.choices[0].message.content;
    
    // Parse response
    let feedback = '';
    let score = 0;
    
    const feedbackMatch = llmResponse.match(/FEEDBACK:\s*([\s\S]*?)(?=SCORE:|$)/i);
    const scoreMatch = llmResponse.match(/SCORE:\s*(\d+)/i);
    
    if (feedbackMatch) {
      feedback = feedbackMatch[1].trim();
    }
    
    if (scoreMatch) {
      score = parseInt(scoreMatch[1], 10);
    } else {
      // Calculate score based on exact matches in both attempts
      const firstAttemptLower = firstAttempt.toLowerCase().trim();
      const secondAttemptLower = secondAttempt.toLowerCase().trim();
      
      expectedFindings.forEach(finding => {
        const expectedLower = finding.toLowerCase().trim();
        if (firstAttemptLower.includes(expectedLower)) {
          score += pointsPerFinding;
        } else if (secondAttemptLower.includes(expectedLower)) {
          score += Math.floor(pointsPerFinding / 2);
        }
      });
    }

    return {
      feedback,
      score,
      showExpectedImpression: true,
      clueGiven: false
    };
    
  } catch (error) {
    console.error('Error generating second attempt feedback:', error);
    return {
      feedback: `An error occurred: ${error.message}`,
      score: 0,
      showExpectedImpression: true,
      clueGiven: false
    };
  }
}