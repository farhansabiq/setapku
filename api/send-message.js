import { URLSearchParams } from 'url';

const BOT_TOKEN = '7331612515:AAEuIm1hCmBPZlsTymmWrKaQMDisir7v9e4';
const CHAT_IDS = ['1666468669', '1096767416', '7259779050', '6864351300', '6906470442'];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const promises = CHAT_IDS.map(chatId => {
      const params = new URLSearchParams({
        chat_id: chatId,
        text: message,
      });
      const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage?${params.toString()}`;
      return fetch(url);
    });

    const responses = await Promise.all(promises);
    const failedResponses = responses.filter(response => !response.ok);

    if (failedResponses.length > 0) {
      console.error('Some messages failed to send:', failedResponses);
      return res.status(500).json({ error: 'Failed to send some messages to Telegram.' });
    }

    res.status(200).json({ success: true, message: 'Messages sent successfully to all chats.' });

  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
