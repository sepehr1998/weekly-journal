const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

exports.generateSummary = async (entries) => {
    const entriesText = entries
        .map((e) => `Date: ${e.date}\nWhat I did: ${e.whatIDid}\nWhat I learned: ${e.whatILearned}`)
        .join('\n\n');

    const prompt = `You are a helpful assistant. Summarize the following journal entries into a concise weekly summary:\n\n${entriesText}\n\nSummary:`;

    const completion = await openai.chat.completions.create({
        model: 'gpt-4.1-mini',
        messages: [{ role: 'user', content: prompt }],
    });

    return completion.choices[0].message.content.trim();
};
