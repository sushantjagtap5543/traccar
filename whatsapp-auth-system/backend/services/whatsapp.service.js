const axios = require('axios');

const sendOTP = async (whatsapp_number, otp) => {
  const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
  const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
  const TEMPLATE_NAME = process.env.WHATSAPP_OTP_TEMPLATE || 'otp_verification';

  if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
    console.warn('WhatsApp credentials missing. Logging OTP to console for development:');
    console.log(`[DEV] OTP for ${whatsapp_number}: ${otp}`);
    return true;
  }

  try {
    const response = await axios.post(
      `https://graph.facebook.com/v17.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: whatsapp_number,
        type: 'template',
        template: {
          name: TEMPLATE_NAME,
          language: {
            code: 'en_US',
          },
          components: [
            {
              type: 'body',
              parameters: [
                {
                  type: 'text',
                  text: otp,
                },
              ],
            },
            {
              type: 'button',
              sub_type: 'url',
              index: '0',
              parameters: [
                {
                  type: 'text',
                  text: otp,
                },
              ],
            },
          ],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error sending WhatsApp OTP:', error.response ? error.response.data : error.message);
    throw new Error('Failed to send OTP via WhatsApp');
  }
};

module.exports = {
  sendOTP,
};
