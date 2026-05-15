const axios = require('axios');

const postWebhook = async (url, payload, headers = {}) => {
  if (!url) throw new Error('Webhook URL is required');
  const response = await axios.post(url, payload, { headers, timeout: 15000 });
  return { status: response.status, data: response.data };
};

module.exports = { postWebhook };
