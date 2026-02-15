// services/smsService.js
require("dotenv").config();

const PROVIDER = process.env.SMS_PROVIDER || "console";
const COUNTRY = process.env.SMS_COUNTRY_CODE || "+855";

let twilioClient = null;

function normalizePhone(phone) {
  if (!phone) return null;
  let p = String(phone).trim();
  if (!p) return null;

  // remove spaces
  p = p.replace(/\s+/g, "");

  // if starts with 0 => convert to +855
  if (p.startsWith("0")) p = COUNTRY + p.slice(1);

  // if no + and starts with digits => add country
  if (!p.startsWith("+")) p = COUNTRY + p;

  return p;
}

function formatStockAlertSMS({ level, productName, brandName, qty, threshold }) {
  return `[IMS] ${level} STOCK: ${productName} (${brandName}) qty=${qty} threshold=${threshold}`;
}

async function sendTwilio(to, message) {
  if (!twilioClient) {
    const twilio = require("twilio");
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }

  const from = process.env.TWILIO_FROM_NUMBER;
  if (!from) throw new Error("Missing TWILIO_FROM_NUMBER");

  await twilioClient.messages.create({ from, to, body: message });
  return true;
}

async function sendToSupplier(supplier, message) {
  const numbers = [supplier?.phone_first, supplier?.phone_second]
    .map(normalizePhone)
    .filter(Boolean);

  if (numbers.length === 0) {
    console.log("⚠️ No supplier phone numbers found");
    return false;
  }

  if (PROVIDER === "console") {
    numbers.forEach((n) => console.log(`📨 [SMS-CONSOLE] -> ${n}: ${message}`));
    return true;
  }

  if (PROVIDER === "twilio") {
    try {
      for (const n of numbers) await sendTwilio(n, message);
      return true;
    } catch (e) {
      console.error("❌ Twilio error:", e?.message || e);
      return false;
    }
  }

  console.log(`⚠️ Unknown SMS_PROVIDER=${PROVIDER}`);
  return false;
}

module.exports = {
  sendToSupplier,
  normalizePhone,
  formatStockAlertSMS,
};
