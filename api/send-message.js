import { URLSearchParams } from 'url';

const BOT_TOKEN = process.env.BOT_TOKEN; // Ambil dari environment variables
const CHAT_IDS = ['1666468669', '1096767416', '7259779050', '6864351300', '6906470442'];

export const config = {
  api: {
    bodyParser: false, // Penting: nonaktifkan body-parser bawaan Vercel
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Menggunakan library untuk parsing multipart/form-data
  const formidable = require('formidable');
  const form = new formidable.IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to parse form data' });
    }

    const message = fields.message ? fields.message[0] : null;
    const file = files.file ? files.file[0] : null;

    if (!message && !file) {
      return res.status(400).json({ error: 'Message or file is required' });
    }

    try {
      let promises;

      if (file) {
        // Mengirim file
        const fs = require('fs');
        const fileStream = fs.createReadStream(file.filepath);
        const fileName = file.originalFilename || 'unnamed_file';
        
        promises = CHAT_IDS.map(chatId => {
          const formData = new FormData();
          formData.append('chat_id', chatId);
          formData.append('document', fileStream, fileName);
          
          if (message) {
            formData.append('caption', message);
          }
          
          return fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`, {
            method: 'POST',
            body: formData,
          });
        });

      } else {
        // Mengirim pesan teks saja
        promises = CHAT_IDS.map(chatId => {
          const params = new URLSearchParams({
            chat_id: chatId,
            text: message,
          });
          const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage?${params.toString()}`;
          return fetch(url);
        });
      }

      const responses = await Promise.all(promises);
      const failedResponses = responses.filter(response => !response.ok);

      if (failedResponses.length > 0) {
        console.error('Some messages failed to send:', failedResponses);
        return res.status(500).json({ error: 'Failed to send some messages to Telegram.' });
      }

      res.status(200).json({ success: true, message: 'Messages sent successfully to all chats.' });

    } catch (error) {
      console.error('Error sending message/file:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
}