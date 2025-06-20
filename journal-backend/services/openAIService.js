const OpenAI = require('openai');

exports.generateSummary = async (prompt) => {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
        model: 'gpt-4.1-mini',
        messages: [{ role: 'user', content: prompt }],
    });

    return completion.choices[0].message.content.trim();
};
