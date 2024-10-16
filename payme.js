const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const crypto = require('crypto');
const cors = require("cors")

const app = express();
const PORT = 5000;

app.use(bodyParser.json());
app.use(cors())

// Sandboxda foydalanadigan kalitlar
const MERCHANT_ID = '67052066e51de1c6a3a509bd';
const SECRET_KEY = 'E8WFc9jVy%ICQRIaQtVUgJj6o2gM7BvFenx1';

// Imzo (sign) yaratish funksiyasi
function createSignature(payload) {
   return crypto.createHmac('sha1', SECRET_KEY)
                .update(payload)
                .digest('hex');
}

// To'lovni boshlash uchun endpoint
app.post('/payme/payment', async (req, res) => {
   const { amount, orderId } = req.body;

   try {
      // Mijoz uchun yuboradigan so'rov
      const payload = {
         method: "CreateTransaction",
         params: {
            merchant_id: MERCHANT_ID,
            account: { order_id: orderId },
            amount: amount * 100,  // So'mni tiyinlarga o'tkazamiz
            detail: "To'lov detallari"
         }
      };

      // Imzo yaratish
      const sign = createSignature(JSON.stringify(payload));
      const headers = {
         'Content-Type': 'application/json',
         'X-Auth': sign
      };

      // Payme API'ga so'rov yuborish
      const response = await axios.post('https://checkout.test.paycom.uz/api', payload, { headers });

      // To'lov linkini qaytarish
      const { result } = response.data;
      return res.json({
         payment_url: `https://checkout.test.paycom.uz/${result.token}`
      });

   } catch (error) {
      console.error('To‘lovni yuborishda xato:', error.message);
      return res.status(500).json({ error: 'To‘lovni amalga oshirishda xato yuz berdi' });
   }
});

// To'lov holatini tekshirish uchun endpoint
app.post('/payme/check', async (req, res) => {
   const { orderId } = req.body;

   try {
      const payload = {
         method: "CheckTransaction",
         params: {
            merchant_id: MERCHANT_ID,
            account: { order_id: orderId }
         }
      };

      const sign = createSignature(JSON.stringify(payload));
      const headers = {
         'Content-Type': 'application/json',
         'X-Auth': sign
      };

      const response = await axios.post('https://checkout.test.paycom.uz/api', payload, { headers });

      // Holatni qaytarish
      const { result } = response.data;
      return res.json({
         status: result.state === 1 ? 'Muvaffaqiyatli' : 'Qabul qilinmadi'
      });

   } catch (error) {
      console.error('Holatni tekshirishda xato:', error.message);
      return res.status(500).json({ error: 'To‘lov holatini tekshirishda xato yuz berdi' });
   }
});

app.listen(PORT, () => {
   console.log(`Server ishga tushdi: http://localhost:${PORT}`);
});
