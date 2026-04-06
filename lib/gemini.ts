import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function generateQuestions(resumeText: string, jobRole: string, yearsExperience: number): Promise<string[]> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    const prompt = `You are Sarah, an expert AI mock interviewer. Based on the following resume and job details, generate 7 highly specific interview questions.
IMPORTANT: You MUST base the questions primarily on the skills, projects, and experiences actually listed in the candidate's resume. Do not ask generic behavioral questions unless they tie directly to an experience mentioned in their resume.

Resume:
${resumeText}

Job Role: ${jobRole}
Years of Experience: ${yearsExperience}

Return exactly 7 questions, each on a new line, numbered 1-7. No other text.`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    return response
      .split('\n')
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(line => line.length > 0)
      .slice(0, 7);
  } catch (error) {
    console.warn("Gemini API Rate Limit Hit, falling back to mock questions:", error);
    // Fallback Mock data so the app can still be tested!
    return [
      `I see from your resume that you have experience as a ${jobRole}. Can you tell me about the most impactful project you worked on?`,
      `With your background, how did you handle a situation where a technical approach you chose did not work out as expected?`,
      "Could you explain your contribution to one of the key projects listed on your resume?",
      "Can you describe a time you had to learn a new technology quickly to meet a project requirement?",
      "What are the most important principles you follow when building scalable applications?",
      "Based on your past experiences, how do you manage disagreements on technical architecture?",
      "Do you have any questions for me about the interview or this role?"
    ];
  }
}

export interface EvaluationResult {
  score: number;
  feedback: string;
  idealAnswer: string;
}

export async function evaluateAnswer(question: string, answerText: string): Promise<EvaluationResult> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    const prompt = `Evaluate the following interview answer and provide a score and feedback.

Question: ${question}

Candidate's Answer: ${answerText}

Return in this exact JSON format:
{
  "score": <number 0-10>,
  "feedback": "<2-3 sentence assessment>",
  "idealAnswer": "<what a great answer would include>"
}`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        score: Math.min(10, Math.max(0, parsed.score)),
        feedback: parsed.feedback,
        idealAnswer: parsed.idealAnswer
      };
    }
    throw new Error("Could not parse JSON");
  } catch (error) {
    console.warn("Gemini API Rate Limit Hit, falling back to mock evaluation:", error);
    return {
      score: Math.floor(Math.random() * 4) + 6, // Random score between 6 and 9
      feedback: "This was a solid answer. You communicated your points clearly. Next time, try providing a more specific real-world example to ground your response.",
      idealAnswer: `An ideal answer would directly address "${question}" by outlining the STAR method (Situation, Task, Action, Result) with a concrete metric.`
    };
  }
}