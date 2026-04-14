export async function generateQuestions(resumeText: string, jobRole: string, yearsExperience: number, jobDescription: string = ''): Promise<string[]> {
  try {
    const prompt = `You are Sarah, an expert AI mock interviewer. 
Based on the candidate's resume, the specific Job Role, and the detailed Job Description provided below, generate 7 highly specific interview questions.

CRITICAL INSTRUCTIONS:
1. Cross-reference the skills in the Resume with the requirements in the Job Description. Ask questions that evaluate whether their past experience actually matches the specific needs of this role.
2. Formulate questions as "Follow-up" or scenario-based style. (e.g., "I see you used [Technology] at [Company]. Given that this role requires [Job Description Requirement], how would you handle...?")
3. Do not ask generic questions. They must be intricately tied to the provided context.

Context:
Job Role: ${jobRole}
Years of Experience: ${yearsExperience}
Job Description:
${jobDescription || 'Standard requirements for this role.'}

Resume:
${resumeText}

Return exactly 7 questions, each on a new line, numbered 1-7. No other text.`;

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      })
    });

    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    const responseText = data.choices[0]?.message?.content || '';
    
    return responseText
      .split('\n')
      .map((line: string) => line.replace(/^\d+\.\s*/, '').trim())
      .filter((line: string) => line.length > 0)
      .slice(0, 7);
  } catch (error) {
    console.warn("Groq API Error, falling back to mock questions:", error);
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
    const prompt = `Evaluate the following interview answer and provide a score and feedback.

Question: ${question}

Candidate's Answer: ${answerText}

Return in this exact JSON format:
{
  "score": <number 0-10>,
  "feedback": "<2-3 sentence assessment>",
  "idealAnswer": "<what a great answer would include>"
}`;

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant', // Using current supported model
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3, 
        response_format: { type: "json_object" }
      })
    });

    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    const responseText = data.choices[0]?.message?.content || '{}';
    
    const parsed = JSON.parse(responseText);
    return {
      score: Math.min(10, Math.max(0, parsed.score || 0)),
      feedback: parsed.feedback || "Good response.",
      idealAnswer: parsed.idealAnswer || "An answer outlining STAR methodology."
    };
  } catch (error) {
    console.warn("Groq API Error, falling back to mock evaluation:", error);
    return {
      score: Math.floor(Math.random() * 4) + 6,
      feedback: "This was a solid answer. You communicated your points clearly. Next time, try providing a more specific real-world example to ground your response.",
      idealAnswer: `An ideal answer would directly address "${question}" by outlining the STAR method (Situation, Task, Action, Result) with a concrete metric.`
    };
  }
}