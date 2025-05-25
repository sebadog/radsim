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
            content: 'You are a radiology expert providing feedback on trainee impressions. Evaluate their responses based on the following criteria:\n\n- Each case has one or multiple diagnoses, each treated independently\n- Total points (100) are divided by the number of diagnoses\n- Full points for correct detection AND interpretation on first attempt\n- Half points if diagnosis identified correctly after receiving a clue\n- No points for diagnoses not identified even after clues'
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
  const pointsPerDiagnosis = Math.floor(100 / expectedFindings.length);

  return `
Evaluate this radiology trainee's response. This is their first attempt.

Case Information:
Title: ${request.caseTitle}
Clinical Information: ${request.clinicalInfo}

Expected Findings (${expectedFindings.length} diagnoses, ${pointsPerDiagnosis} points each):
${expectedFindings.map(finding => `- ${finding}`).join('\n')}

Trainee's impression:
"${request.userImpression}"

Evaluation Instructions:
1. For each diagnosis:
   - Award ${pointsPerDiagnosis} points for correct detection AND interpretation
   - Provide specific feedback on what was identified correctly or missed
   - For missed findings, give a helpful clue without revealing the diagnosis

2. Calculate total score:
   - Sum points for all correctly identified diagnoses
   - Do not award partial points on first attempt
   - Mark findings that need clues for second attempt

3. Feedback format:
   - Acknowledge correct findings
   - For missed findings, provide specific clues
   - Be educational but don't reveal answers

Format your response as:
FEEDBACK: [Your detailed feedback]
SCORE: [Total points earned]
CLUE_GIVEN: [true if any clues provided]
SHOW_EXPECTED: [true only if all diagnoses correct]
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
  
  // Calculate score based on matched findings
  const expectedFindings = Array.isArray(request.expectedFindings) ? request.expectedFindings : [];
  const pointsPerDiagnosis = Math.floor(100 / expectedFindings.length);
  
  let calculatedScore = 0;
  expectedFindings.forEach(finding => {
    const keyTerms = finding.toLowerCase().split(/\s+/).filter(term => term.length > 3);
    const impression = request.userImpression.toLowerCase();
    if (keyTerms.every(term => impression.includes(term))) {
      calculatedScore += pointsPerDiagnosis;
    }
  });
  
  // Use calculated score if LLM didn't provide one
  if (!score) {
    score = calculatedScore;
  }
  
  // Show expected impression only if all diagnoses were correct
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
    const pointsPerDiagnosis = Math.floor(100 / expectedFindings.length);

    const prompt = `
Evaluate this radiology trainee's second attempt after receiving clues.

Case Information:
Title: ${request.caseTitle}
Clinical Information: ${request.clinicalInfo}

Expected Findings (${expectedFindings.length} diagnoses, ${pointsPerDiagnosis} points each):
${expectedFindings.map(finding => `- ${finding}`).join('\n')}

First attempt:
"${firstAttempt}"

Second attempt after receiving clues:
"${secondAttempt}"

Evaluation Instructions:
1. For each diagnosis:
   - Award ${pointsPerDiagnosis} points if correctly identified in first attempt
   - Award ${pointsPerDiagnosis/2} points if correctly identified in second attempt
   - No points if still not identified

2. Calculate total score:
   - Sum points from both attempts
   - Show all expected findings after second attempt

3. Feedback format:
   - Acknowledge improvements from first attempt
   - Explain any remaining misses
   - Be educational and supportive

Format your response as:
FEEDBACK: [Your detailed feedback]
SCORE: [Total points earned]
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
            content: 'You are a radiology expert evaluating a trainee\'s second attempt after receiving clues. Award half points for correct diagnoses identified after clues.'
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
      // Calculate score if not provided by LLM
      expectedFindings.forEach(finding => {
        const keyTerms = finding.toLowerCase().split(/\s+/).filter(term => term.length > 3);
        const firstAttemptMatch = keyTerms.every(term => firstAttempt.toLowerCase().includes(term));
        const secondAttemptMatch = keyTerms.every(term => secondAttempt.toLowerCase().includes(term));
        
        if (firstAttemptMatch) {
          score += pointsPerDiagnosis;
        } else if (secondAttemptMatch) {
          score += Math.floor(pointsPerDiagnosis / 2);
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