const router = require("express").Router();
const db = require("../models");
const { sendToSupplierChatId } = require("../services/telegramService");

router.get("/test/telegram/:supplierId", async (req, res) => {
  const supplier = await db.Supplier.findByPk(req.params.supplierId);

  if (!supplier?.telegram_chat_id) {
    return res.json({
      success: false,
      message: "Supplier not registered on Telegram",
    });
  }

  await sendToSupplierChatId(
    supplier.telegram_chat_id,
    "✅ Telegram test message from IMS"
  );

  res.json({
    success: true,
    chat_id: supplier.telegram_chat_id,
  });
});

module.exports = router;
