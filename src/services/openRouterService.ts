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

    const prompt = createPrompt(request);
    
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
            content: 'You are a radiology expert providing feedback on trainee impressions. Compare their response exactly with the expected findings. A finding is only considered correct if it matches the expected finding precisely. Evaluate based on these criteria:\n\n- Each case has one or multiple expected findings that must match exactly\n- Total points (100) are divided by the number of expected findings\n- Full points only for exact matches on first attempt\n- Half points if exact match achieved after receiving a clue\n- No points for findings that don\'t match exactly even after clues'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
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
  const pointsPerFinding = Math.floor(100 / expectedFindings.length);

  return `
Evaluate this radiology trainee's response by comparing it exactly with the expected findings.

Case Information:
Title: ${request.caseTitle}
Clinical Information: ${request.clinicalInfo}

Expected Findings (${expectedFindings.length} findings, ${pointsPerFinding} points each):
${expectedFindings.map(finding => `- ${finding}`).join('\n')}

Trainee's impression:
"${request.userImpression}"

Evaluation Instructions:
1. For each expected finding:
   - Compare the trainee's response EXACTLY with the expected finding
   - Award ${pointsPerFinding} points ONLY for exact matches
   - For non-exact matches, provide a clue that helps identify the specific finding
   - Do not accept similar or partial matches

2. Calculate total score:
   - Sum points only for exact matches
   - No partial points for similar findings
   - Mark non-matching findings for second attempt

3. Feedback format:
   - For exact matches: Confirm the correct finding
   - For non-matches: Provide specific clues about what to look for
   - Be educational but don't reveal unmatched findings

Format your response as:
FEEDBACK: [Your detailed feedback]
SCORE: [Total points for exact matches]
CLUE_GIVEN: [true if any findings didn't match exactly]
SHOW_EXPECTED: [true only if all findings match exactly]
`;
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

    const expectedFindings = Array.isArray(request.expectedFindings) ? request.expectedFindings : [];
    const pointsPerFinding = Math.floor(100 / expectedFindings.length);

    const prompt = `
Evaluate this radiology trainee's second attempt by comparing it exactly with the expected findings.

Case Information:
Title: ${request.caseTitle}
Clinical Information: ${request.clinicalInfo}

Expected Findings (${expectedFindings.length} findings, ${pointsPerFinding} points each):
${expectedFindings.map(finding => `- ${finding}`).join('\n')}

First attempt:
"${firstAttempt}"

Second attempt after receiving clues:
"${secondAttempt}"

Evaluation Instructions:
1. For each expected finding:
   - Compare EXACTLY with both attempts
   - Award ${pointsPerFinding} points for exact matches in first attempt
   - Award ${pointsPerFinding/2} points for exact matches in second attempt
   - No points for non-exact matches

2. Calculate total score:
   - Sum points from both attempts
   - Only count exact matches
   - Show all expected findings after second attempt

3. Feedback format:
   - Identify which findings matched exactly in each attempt
   - Explain any remaining non-matches
   - Be educational and supportive

Format your response as:
FEEDBACK: [Your detailed feedback]
SCORE: [Total points for exact matches]
SHOW_EXPECTED: true
`;

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
            content: 'You are a radiology expert evaluating a trainee\'s second attempt. Only award points for exact matches with the expected findings.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
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