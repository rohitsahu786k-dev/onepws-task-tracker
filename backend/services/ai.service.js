const axios = require('axios');

const generateText = async ({ prompt, system, model = process.env.OPENAI_MODEL || 'gpt-4o-mini' }) => {
  if (!process.env.OPENAI_API_KEY) return { text: '', skipped: true, reason: 'OPENAI_API_KEY is not configured' };
  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    { model, messages: [{ role: 'system', content: system || 'You are a helpful assistant.' }, { role: 'user', content: prompt }] },
    { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, timeout: 30000 }
  );
  return { text: response.data.choices?.[0]?.message?.content || '' };
};

module.exports = { generateText };
