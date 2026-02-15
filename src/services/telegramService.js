// services/telegramService.js
require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const db = require("../models");

const Supplier = db?.Supplier;
const token = process.env.TG_BOT_TOKEN;

if (!token) throw new Error("Missing TG_BOT_TOKEN in .env");
if (!Supplier) console.error(" Supplier model not loaded (db.Supplier undefined)");

//  polling true for /register commands
const bot = new TelegramBot(token, { polling: true });

// Avoid noisy polling errors
bot.on("polling_error", (error) => {
  const msg = error?.message || "";
  if (error?.code === "ETELEGRAM" && msg.includes("409 Conflict")) {
    console.log("⚠️ 409 Conflict: another bot instance is running (stop the other server).");
    return;
  }
  console.error(" Telegram polling error:", msg);
});

function helpText() {
  return (
    "✅ IMS Supplier Stock Bot Connected!\n\n" +
    "Commands:\n" +
    "• /register <supplier_id>  - Link this Telegram to your supplier account\n" +
    "• /myid                   - Show your Telegram chat id\n" +
    "• /help                   - Show commands\n\n" +
    "Example:\n" +
    "/register 5\n"
  );
}

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    await bot.sendMessage(chatId, helpText());
  } catch (err) {
    console.error("/start error:", err?.message || err);
  }
});

bot.onText(/\/help/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    await bot.sendMessage(chatId, helpText());
  } catch (err) {
    console.error("/help error:", err?.message || err);
  }
});

bot.onText(/\/myid/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    await bot.sendMessage(chatId, `🆔 Your Telegram chat id: ${chatId}`);
  } catch (err) {
    console.error("/myid error:", err?.message || err);
  }
});

bot.onText(/\/register\s+(\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const supplierId = parseInt(match?.[1], 10);

  try {
    if (!Supplier) {
      await bot.sendMessage(chatId, " Server error: Supplier model not loaded.");
      return;
    }

    const supplier = await Supplier.findByPk(supplierId);
    if (!supplier) {
      await bot.sendMessage(chatId, " Supplier not found. Please check supplier_id.");
      return;
    }

    await supplier.update({ telegram_chat_id: chatId });

    await bot.sendMessage(
      chatId,
      `✅ Registered successfully!\nSupplier: ${supplier.name}\nYou will now receive stock alerts.`
    );
  } catch (err) {
    console.error(" /register error:", err?.message || err);
    try {
      await bot.sendMessage(chatId, " Error registering. Please try again later.");
    } catch (_) {}
  }
});

// ✅ Send text
async function sendToSupplierChatId(chatId, text) {
  if (!chatId) return false;
  try {
    await bot.sendMessage(chatId, text);
    return true;
  } catch (err) {
    console.error(" Telegram sendMessage error:", err?.message || err);
    return false;
  }
}

// ✅ Send photo + caption (Image on Telegram)
async function sendPhotoToSupplierChatId(chatId, photoUrl, caption = "") {
  if (!chatId || !photoUrl) return false;
  try {
    await bot.sendPhoto(chatId, photoUrl, {
      caption: caption ? caption.slice(0, 1024) : "",
    });
    return true;
  } catch (err) {
    console.error("Telegram sendPhoto error:", err?.message || err);
    return false;
  }
}

// ✅ Optional: send to admin group
async function sendToAdmin(text, photoUrl = null) {
  const adminChatId = process.env.TG_ADMIN_CHAT_ID;
  if (!adminChatId) return false;

  const isPhoto = !!photoUrl && /^https?:\/\//i.test(photoUrl);
  if (isPhoto) return await sendPhotoToSupplierChatId(adminChatId, photoUrl, text);
  return await sendToSupplierChatId(adminChatId, text);
}

module.exports = {
  sendToSupplierChatId,
  sendPhotoToSupplierChatId,
  sendToAdmin,
};
