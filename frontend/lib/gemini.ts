export async function askGemini(userMessage: string, tenderContext: string, userProfile: {
  company: string;
  niches: string[];
}): Promise<string> {
  const systemPrompt = `You are an expert procurement assistant for a Pakistani B2B platform called EPADS Intelligence.
You help businesses find and evaluate government tenders from the Federal PPRA (EPADS portal).

User's company: ${userProfile.company}
User's industry niches: ${userProfile.niches.join(', ')}

Here is the current tender data relevant to the user's query:
${tenderContext}

Instructions:
- Answer in clear, professional English (or Urdu if the user writes in Urdu)
- Be specific — reference actual tender titles, agencies, and deadlines from the data
- If the user asks about eligibility or how to apply, give practical advice for Pakistani procurement
- If no relevant tenders found, say so and suggest what to search for
- Keep responses concise (under 300 words unless asked for detail)`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${systemPrompt}\n\nUser: ${userMessage}` }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 512 }
      })
    }
  )
  const data = await response.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Sorry, I could not get a response.'
}