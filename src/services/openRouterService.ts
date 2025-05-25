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
    // Get API key from environment variable
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    
    if (!apiKey) {
      console.error('OpenRouter API key is missing');
      return {
        feedback: "Error: OpenRouter API key is missing. Please check your environment variables.",
        score: null,
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
            content: 'You are a radiology expert providing feedback on trainee impressions. Use the Socratic method to guide them to the correct diagnosis without revealing the answer. The trainee may make multiple attempts, so provide helpful clues that guide them toward the correct answer without giving it away. NEVER reveal the full diagnosis or expected findings unless the trainee has correctly identified them. Always provide clues that help the trainee think through the case themselves.'
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
        score: null,
        showExpectedImpression: false,
        clueGiven: false
      };
    }

    const data: OpenRouterResponse = await response.json();
    const llmResponse = data.choices[0].message.content;
    
    // Parse the LLM response to extract feedback, score, etc.
    const result = parseLLMResponse(llmResponse, request);
    const score = result.score || 0; // Ensure score is a number
    
    return {
      feedback: result.feedback,
      score,
      showExpectedImpression: result.showExpectedImpression,
      clueGiven: result.clueGiven
    };
    
  } catch (error) {
    console.error('Error generating feedback:', error);
    return {
      feedback: `An error occurred: ${error.message}`,
      score: null,
      showExpectedImpression: false,
      clueGiven: false
    };
  }
}

function createPrompt(request: FeedbackRequest): string {
  // Add safety checks for undefined or null values
  const expectedFindings = Array.isArray(request.expectedFindings) ? request.expectedFindings : [];
  const caseTitle = request.caseTitle || 'Untitled Case';
  const clinicalInfo = request.clinicalInfo || 'No clinical information provided';
  const userImpression = request.userImpression || '';

  return `
You are a trainer for radiology residents and fellows. The trainee has reviewed radiological images and written a diagnostic impression. They will be allowed multiple attempts to identify the findings correctly.

Case Information:
- Title: ${caseTitle}
- Clinical Information: ${clinicalInfo}

Expected Findings that should be included in the impression:
${expectedFindings.map(finding => `- ${finding}`).join('\n')}

The trainee's impression:
"${userImpression}"

Please evaluate the trainee's response following these instructions:
1. Check if the trainee correctly identified all expected findings.
2. Provide feedback using the Socratic method:
   - If findings are correctly identified, congratulate the trainee and explain why their interpretation is correct.
   - If findings are missed, ask the trainee to review specific areas of interest. Give one focused clue per finding without revealing the diagnosis.
   - If findings are detected but misinterpreted, guide them to reconsider their interpretation by highlighting key features they may have overlooked.
   - Encourage critical thinking by asking questions that help them analyze the image systematically.
3. Determine a score:
   - 100 points if all findings are correctly identified
   - No score yet if findings are partially identified or missed (the trainee will get more attempts)

CRITICAL INSTRUCTIONS:
- NEVER reveal the expected findings or diagnosis in your feedback
- NEVER show the expected impression unless the trainee has correctly identified all findings
- ALWAYS provide specific, focused clues that help the trainee think through the case themselves
- Each clue should build upon previous feedback and guide them closer to the correct interpretation
- Use a step-by-step approach to help them systematically analyze the images
- Acknowledge correct observations while guiding them to look for additional findings
- Do not assign a score of 0 - only assign 100 for correct answers or no score for incomplete answers

Format your response as follows:
FEEDBACK: [Your feedback to the trainee]
SCORE: [Numerical score - only 100 if correct, otherwise leave blank]
CLUE_GIVEN: [true/false]
SHOW_EXPECTED: [false - only true if trainee got everything correct]
`;
}

function parseLLMResponse(response: string, request: FeedbackRequest): FeedbackResponse {
  // Default values
  let feedback = response;
  let score = null;
  let showExpectedImpression = false;
  let clueGiven = false;
  
  // Extract structured data from LLM response with improved parsing
  const feedbackMatch = response.match(/FEEDBACK:\s*([\s\S]*?)(?=SCORE:|$)/i);
  const scoreMatch = response.match(/SCORE:\s*(\d+)/i);
  const clueMatch = response.match(/CLUE_GIVEN:\s*(true|false)/i);
  const showExpectedMatch = response.match(/SHOW_EXPECTED:\s*(true|false)/i);
  
  if (feedbackMatch) {
    // Clean up the feedback text and ensure proper formatting
    feedback = feedbackMatch[1]
      .trim()
      .replace(/\n{3,}/g, '\n\n') // Normalize multiple newlines
      .replace(/^\s+/gm, ''); // Remove leading whitespace from each line
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
  
  // Enhanced scoring logic for multiple attempts
  if (score === null) {
    // Add safety check for expectedFindings
    const expectedFindings = Array.isArray(request.expectedFindings) ? request.expectedFindings : [];
    
    // More sophisticated matching that looks for key concepts rather than exact matches
    const allFound = expectedFindings.every(finding => {
      const keyTerms = finding.toLowerCase().split(/\s+/).filter(term => term.length > 3);
      const impression = request.userImpression.toLowerCase();
      return keyTerms.some(term => impression.includes(term));
    });
    
    if (allFound) {
      score = 100;
      showExpectedImpression = true;
    } else {
      // Provide progressive feedback for partial matches
      score = null;
      clueGiven = true;
      showExpectedImpression = false;
    }
  }
  
  // Force showExpectedImpression to false unless score is 100
  if (score !== 100) {
    showExpectedImpression = false;
  }
  
  return {
    feedback,
    score,
    showExpectedImpression,
    clueGiven
  };
}

export async function generateResponseToClue(
  initialImpression: string,
  responseToClue: string,
  expectedFindings: string[],
  caseTitle: string,
  clinicalInfo: string,
  summaryOfPathology: string
): Promise<FeedbackResponse> {
  try {
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    
    if (!apiKey) {
      console.error('OpenRouter API key is missing');
      return {
        feedback: "Error: OpenRouter API key is missing. Please check your environment variables.",
        score: null,
        showExpectedImpression: false,
        clueGiven: false
      };
    }

    // Add safety checks for undefined or null values
    const safeExpectedFindings = Array.isArray(expectedFindings) ? expectedFindings : [];
    const safeCaseTitle = caseTitle || 'Untitled Case';
    const safeClinicalInfo = clinicalInfo || 'No clinical information provided';
    const safeInitialImpression = initialImpression || '';
    const safeResponseToClue = responseToClue || '';

    const prompt = `
You are a trainer for radiology residents and fellows. The trainee has reviewed radiological images and written a diagnostic impression. After receiving a clue, they have provided an updated impression.

Case Information:
- Title: ${safeCaseTitle}
- Clinical Information: ${safeClinicalInfo}

Expected Findings that should be included in the impression:
${safeExpectedFindings.map(finding => `- ${finding}`).join('\n')}

The trainee's initial impression:
"${safeInitialImpression}"

After receiving a clue, the trainee's updated impression:
"${safeResponseToClue}"

Please evaluate the trainee's updated response following these instructions:
1. Check if the trainee now correctly identified all expected findings.
2. Provide feedback:
   - If findings are now correctly identified, congratulate the trainee.
   - If findings are still missed, provide another clue that guides them closer to the correct answer without giving it away completely.
3. Determine a score:
   - 50 points if all findings are correctly identified after the clue
   - If findings are still not identified, don't assign a score yet and provide another clue

CRITICAL INSTRUCTIONS:
- NEVER reveal the expected findings or diagnosis in your feedback unless the trainee has correctly identified them
- NEVER show the expected impression unless the trainee has correctly identified all findings
- ALWAYS provide clues that help the trainee think through the case themselves
- The trainee will be allowed to make multiple attempts, so your feedback should guide them toward the correct answer without giving it away
- Do not assign a score of 0 - only assign 50 for correct answers after clues or no score for incomplete answers

Format your response as follows:
FEEDBACK: [Your feedback to the trainee]
SCORE: [Numerical score - only 50 if correct after clue, otherwise leave blank]
CLUE_GIVEN: [true/false]
SHOW_EXPECTED: [false - only true if trainee got everything correct]
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
            content: 'You are a radiology expert providing feedback on trainee impressions after they have received a clue. NEVER reveal the full diagnosis or expected findings unless the trainee has correctly identified them. Always provide clues that help the trainee think through the case themselves.'
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
        score: null,
        showExpectedImpression: false,
        clueGiven: false
      };
    }

    const data: OpenRouterResponse = await response.json();
    const llmResponse = data.choices[0].message.content;
    
    // Parse the LLM response
    let feedback = llmResponse;
    let score = null;
    let showExpectedImpression = false;
    let clueGiven = false;
    
    const feedbackMatch = llmResponse.match(/FEEDBACK:\s*([\s\S]*?)(?=SCORE:|$)/i);
    const scoreMatch = llmResponse.match(/SCORE:\s*(\d+)/i);
    const showExpectedMatch = llmResponse.match(/SHOW_EXPECTED:\s*(true|false)/i);
    const clueMatch = llmResponse.match(/CLUE_GIVEN:\s*(true|false)/i);
    
    if (feedbackMatch) {
      feedback = feedbackMatch[1].trim();
    }
    
    if (scoreMatch) {
      score = parseInt(scoreMatch[1], 10);
    }
    
    if (showExpectedMatch) {
      showExpectedImpression = showExpectedMatch[1].toLowerCase() === 'true';
    }
    
    if (clueMatch) {
      clueGiven = clueMatch[1].toLowerCase() === 'true';
    }
    
    // If the LLM didn't follow the format, make a best guess
    if (score === null) {
      const allFound = safeExpectedFindings.every(finding => 
        safeResponseToClue.toLowerCase().includes(finding.substring(0, Math.min(20, finding.length)).toLowerCase())
      );
      
      if (allFound) {
        score = 50;
        showExpectedImpression = true;
      } else {
        // If not all findings were found, provide another clue
        score = null;
        clueGiven = true;
        showExpectedImpression = false;
      }
    }
    
    // Force showExpectedImpression to false unless score is 50
    if (score !== 50) {
      showExpectedImpression = false;
    }
    
    const result = {
      feedback,
      score,
      showExpectedImpression,
      clueGiven
    };
    
    const scoreResult = result.score || 0; // Ensure score is a number
    
    return {
      feedback: result.feedback,
      score: scoreResult,
      showExpectedImpression: result.showExpectedImpression,
      clueGiven: result.clueGiven
    };
    
  } catch (error) {
    console.error('Error generating response to clue:', error);
    return {
      feedback: `An error occurred: ${error.message}`,
      score: null,
      showExpectedImpression: false,
      clueGiven: false
    };
  }
}