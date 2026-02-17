const db = require("../models");
const { Op } = db.Sequelize;

const Notification = db.Notification;
const Product = db.Product;
const Brand = db.Brand;
const Category = db.Category;
const Supplier = db.Supplier;

//  Image model (adjust if your model name is different)
const ImageModel = db.Image || db.ProductImage || db.ProductImages;

const {
  sendToSupplierChatId,
  sendPhotoToSupplierChatId,
} = require("./telegramService");

const smsService = require("./smsService");

class NotificationService {
  // ======== CONFIG ========
  static STOCK_TYPE_OUT = "out_of_stock";
  static STOCK_TYPE_LOW = "low_stock";

  static LEVEL_OUT = "OUT"; // qty=0
  static LEVEL_CRITICAL = "CRITICAL"; // qty <= critical
  static LEVEL_LOW = "LOW"; // qty <= low

  // cooldown minutes per level
  static COOLDOWN_MINUTES = {
    OUT: 1,
    CRITICAL: 1,
    LOW: 1,
  };

  // ======== BASIC DB ========
  static async createNotification({
    type,
    title,
    message,
    referenceId = null,
  }) {
    return await Notification.create({
      type,
      title,
      message,
      reference_id: referenceId,
    });
  }

  static async getUnreadCount() {
    return await Notification.count({ where: { is_read: false } });
  }

  static async getRecentNotifications(limit = 10, unreadOnly = false) {
    const where = {};
    if (unreadOnly) where.is_read = false;

    return await Notification.findAll({
      where,
      include: [
        {
          model: Product,
          as: "Product",
          attributes: ["id", "name", "expire_date", "qty"], // ✅ Added qty to verify stock status
          required: false,
        },
      ],
      order: [["created_at", "DESC"]],
      limit: parseInt(limit),
    });
  }

  static async getNotificationById(id) {
    return await Notification.findByPk(id, {
      include: [
        {
          model: Product,
          as: "Product",
          attributes: ["id", "name", "expire_date", "qty"],
          required: false,
        },
      ],
    });
  }

  static async markAllAsRead() {
    const [updatedCount] = await Notification.update(
      { is_read: true },
      { where: { is_read: false } },
    );
    return updatedCount;
  }

  static async deleteNotification(id) {
    const notification = await Notification.findByPk(id);
    if (!notification) return false;
    await notification.destroy();
    return true;
  }

  static async markAsRead(notificationId) {
    const notification = await Notification.findByPk(notificationId);
    if (!notification) return null;
    notification.is_read = true;
    await notification.save();
    return notification;
  }

  // ======== HELPERS ========

  static getStockLevel(qty, lowThreshold, criticalThreshold) {
    const q = Number(qty || 0);
    if (q === 0) return this.LEVEL_OUT;
    if (q <= Number(criticalThreshold)) return this.LEVEL_CRITICAL;
    if (q <= Number(lowThreshold)) return this.LEVEL_LOW;
    return null;
  }

  // cooldown by checking last notification title prefix (key) in time window
  static async recentlySentByKey(productId, key, minutes) {
    const since = new Date(Date.now() - minutes * 60 * 1000);

    const last = await Notification.findOne({
      where: {
        reference_id: productId,
        title: { [Op.like]: `${key}%` },
        created_at: { [Op.gte]: since },
      },
      order: [["created_at", "DESC"]],
    });

    return !!last;
  }

  // ✅ FIXED: Changed to DELETE notifications instead of just marking as read
  static async dismissUnreadStockAlerts(productId) {
    const deletedCount = await Notification.destroy({
      where: {
        reference_id: productId,
        type: { [Op.in]: [this.STOCK_TYPE_OUT, this.STOCK_TYPE_LOW] },
        is_read: false,
      },
    });

    console.log(
      `🗑️ Deleted ${deletedCount} resolved stock notifications for product ${productId}`,
    );
    return deletedCount;
  }

  // ✅ NEW: Dismiss resolved expiration notifications (when product no longer expires soon)
  static async dismissUnreadExpirationAlerts(productId) {
    const deletedCount = await Notification.destroy({
      where: {
        reference_id: productId,
        type: { [Op.in]: ['expiring_soon', 'expiring_today', 'expired'] },
        is_read: false,
      },
    });

    console.log(
      `🗑️ Deleted ${deletedCount} resolved expiration notifications for product ${productId}`,
    );
    return deletedCount;
  }

  // ✅ NEW: Clean up old read stock notifications (optional - run periodically)
  static async cleanupOldStockNotifications(olderThanHours = 24) {
    const cutoffDate = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);

    const deletedCount = await Notification.destroy({
      where: {
        type: { [Op.in]: [this.STOCK_TYPE_OUT, this.STOCK_TYPE_LOW] },
        is_read: true,
        created_at: { [Op.lt]: cutoffDate },
      },
    });

    console.log(`🧹 Cleaned up ${deletedCount} old read stock notifications`);
    return deletedCount;
  }

  // ✅ NEW: Clean up old read expiration notifications (optional - run periodically)
  static async cleanupOldExpirationNotifications(olderThanHours = 24) {
    const cutoffDate = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);

    const deletedCount = await Notification.destroy({
      where: {
        type: { [Op.in]: ['expiring_soon', 'expiring_today', 'expired'] },
        is_read: true,
        created_at: { [Op.lt]: cutoffDate },
      },
    });

    console.log(`🧹 Cleaned up ${deletedCount} old read expiration notifications`);
    return deletedCount;
  }

  // ✅ send telegram + sms to supplier (photo if imageUrl exists)
  static async notifySupplier(product, { telegramText, smsText, imageUrl }) {
    const supplier = product?.Supplier;

    if (!supplier) {
      console.log(
        `⚠️ Product ${product?.id} has no supplier - skipping alerts`,
      );
      return { telegram: false, sms: false };
    }

    let telegramOk = false;

    // Telegram
    if (supplier.telegram_chat_id) {
      const canSendPhoto =
        !!imageUrl &&
        typeof imageUrl === "string" &&
        /^https?:\/\//i.test(imageUrl);

      if (canSendPhoto) {
        telegramOk = await sendPhotoToSupplierChatId(
          supplier.telegram_chat_id,
          imageUrl,
          telegramText,
        );
      } else {
        telegramOk = await sendToSupplierChatId(
          supplier.telegram_chat_id,
          telegramText,
        );
      }
    } else {
      console.log(
        `⚠️ Supplier ${supplier.id} has no telegram_chat_id (not registered)`,
      );
    }

    // SMS
    const smsOk = await smsService.sendToSupplier(supplier, smsText);

    return { telegram: telegramOk, sms: smsOk };
  }

  static buildTelegramText({
    level,
    productName,
    brandName,
    categoryName,
    barcode,
    supplierName,
    qty,
    low,
    critical,
  }) {
    if (level === this.LEVEL_OUT) {
      return (
        ` ===== STOCK ALERT: OUT OF STOCK =====   \n` +
        `               PRODUCT DETAILS           \n` +
        `                                    \n` +
        `       -  Product :      ${productName}\n` +
        `       -  Brand :       ${brandName}\n` +
        `       -  Category :    ${categoryName}\n` +
        `       -  Barcode :     ${barcode}\n` +
        `       -  Supplier :    ${supplierName}\n` +
        `       -  Quantity :   ${qty}\n\n ` +
        `                                    \n` +
        `               ACTION REQUIRED         \n` +
        `   URGENT: Please reorder immediately! \n` +
        `   Last updated:   ${new Date().toLocaleString()}\n`
      );
    }

    if (level === this.LEVEL_CRITICAL) {
      return (
        `=== CRITICAL LOW STOCK ===\n\n` +
        `- Name : ${productName}\n` +
        `- Brand : ${brandName}\n` +
        `- Category : ${categoryName}\n` +
        `- Barcode : ${barcode}\n` +
        `- Supplier : ${supplierName}\n` +
        `- Qty : ${qty} (≤ ${critical})\n\n` +
        `- Reorder immediately.\n` +
        `- Last updated :   ${new Date().toLocaleString()}\n`
      );
    }

    return (
      `=== LOW STOCK ===\n\n` +
      `- Product : ${productName}\n` +
      `- Brand: ${brandName}\n` +
      `- Category: ${categoryName}\n` +
      `- Barcode: ${barcode}\n` +
      `- Supplier: ${supplierName}\n` +
      `- Qty: ${qty} (≤ ${low})\n\n` +
      `- Please reorder soon.\n` +
      `- Last updated:   ${new Date().toLocaleString()}\n`
    );
  }

  static buildSmsText({ level, productName, brandName, qty, low, critical }) {
    if (level === this.LEVEL_OUT) {
      return smsService.formatStockAlertSMS({
        level: "OUT",
        productName,
        brandName,
        qty,
        threshold: 0,
      });
    }
    if (level === this.LEVEL_CRITICAL) {
      return smsService.formatStockAlertSMS({
        level: "CRITICAL",
        productName,
        brandName,
        qty,
        threshold: critical,
      });
    }
    return smsService.formatStockAlertSMS({
      level: "LOW",
      productName,
      brandName,
      qty,
      threshold: low,
    });
  }

  // ======== CORE: CHECK ONE PRODUCT ========
  static async checkProductStockLevel(
    productId,
    lowStockThreshold = 10,
    criticalStockThreshold = 5,
  ) {
    const product = await Product.findByPk(productId, {
      include: [
        { model: Brand, as: "Brand", attributes: ["name"] },
        { model: Category, as: "Category", attributes: ["name"] },
        {
          model: Supplier,
          as: "Supplier",
          attributes: [
            "id",
            "name",
            "phone_first",
            "phone_second",
            "telegram_chat_id",
          ],
          required: false,
        },

        // ✅ include image if your association exists
        ...(ImageModel
          ? [
              {
                model: ImageModel,
                as: "Image", // must match your association alias
                attributes: ["image"], // must match your column name
                required: false,
              },
            ]
          : []),
      ],
    });

    if (!product) {
      return {
        created: false,
        level: null,
        telegramSent: false,
        smsSent: false,
      };
    }

    const qty = Number(product.qty || 0);
    const level = this.getStockLevel(
      qty,
      lowStockThreshold,
      criticalStockThreshold,
    );

    // ✅ if OK stock, DELETE unread old alerts and stop
    if (!level) {
      await this.dismissUnreadStockAlerts(product.id);
      console.log(
        `✅ Product ${product.id} stock is OK - notifications cleared`,
      );
      return {
        created: false,
        level: null,
        telegramSent: false,
        smsSent: false,
      };
    }

    // DB type: only 2 types in DB
    const dbType =
      level === this.LEVEL_OUT ? this.STOCK_TYPE_OUT : this.STOCK_TYPE_LOW;

    const productName = product.name || "Unknown Product";
    const brandName = product.Brand?.name || "Unknown Brand";
    const categoryName = product.Category?.name || "Unknown Category";
    const supplierName = product.Supplier?.name || "Unknown Supplier";
    const barcode = product.barcode || "-";

    // ✅ image url (must be full public URL for Telegram photo)
    const imageUrl = product.Image?.image || null;

    // ✅ Level key used for "same state" + cooldown
    const titleKey = `[STOCK:${level}]`;

    // ✅ duplicate state protection (same state = same dbType + same titleKey)
    const recentWindow = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const existing = await Notification.findOne({
      where: {
        reference_id: product.id,
        type: { [Op.in]: [this.STOCK_TYPE_OUT, this.STOCK_TYPE_LOW] },
        created_at: { [Op.gte]: recentWindow },
        title: { [Op.like]: `${titleKey}%` },
      },
      order: [["created_at", "DESC"]],
    });

    const shouldCreateDbNotification = !existing;

    // ✅ Create DB notification (Admin UI)
    if (shouldCreateDbNotification) {
      const title =
        level === this.LEVEL_OUT
          ? `${titleKey} Out of Stock`
          : level === this.LEVEL_CRITICAL
            ? `${titleKey} Critical Low Stock`
            : `${titleKey} Low Stock`;

      const message =
        level === this.LEVEL_OUT
          ? `${productName} (${brandName}) is out of stock. Barcode: ${barcode}`
          : `${productName} (${brandName}) is low. Qty: ${qty}. Barcode: ${barcode}`;

      await this.createNotification({
        type: dbType,
        title,
        message,
        referenceId: product.id,
      });

      console.log(`📝 Created DB notification: ${title}`);
    } else {
      console.log(
        `📝 Skipping DB notification (same state already exists): ${titleKey}`,
      );
    }

    // ✅ Cooldown check (per level)
    const cooldownMin = this.COOLDOWN_MINUTES[level] || 120;
    const recentlySent = await this.recentlySentByKey(
      product.id,
      titleKey,
      cooldownMin,
    );

    console.log(
      `🕐 Cooldown ${titleKey}: ${recentlySent ? "BLOCKED" : "ALLOWED"} (${cooldownMin} min)`,
    );

    if (!recentlySent) {
      const telegramText = this.buildTelegramText({
        level,
        productName,
        brandName,
        categoryName,
        barcode,
        supplierName,
        qty,
        low: lowStockThreshold,
        critical: criticalStockThreshold,
      });

      const smsText = this.buildSmsText({
        level,
        productName,
        brandName,
        qty,
        low: lowStockThreshold,
        critical: criticalStockThreshold,
      });

      const alertResults = await this.notifySupplier(product, {
        telegramText,
        smsText,
        imageUrl,
      });

      return {
        created: shouldCreateDbNotification,
        level,
        telegramSent: alertResults.telegram,
        smsSent: alertResults.sms,
      };
    }

    return {
      created: shouldCreateDbNotification,
      level,
      telegramSent: false,
      smsSent: false,
    };
  }

  // ✅ NEW: Check product expiration and create/cleanup notifications
  static async checkProductExpiration(productId) {
    const product = await Product.findByPk(productId, {
      include: [
        { model: Brand, as: "Brand", attributes: ["name"] },
        { model: Category, as: "Category", attributes: ["name"] },
      ],
    });

    if (!product || !product.expire_date) {
      // No expiration date set - clear any existing expiration alerts
      await this.dismissUnreadExpirationAlerts(productId);
      return { created: false, status: 'no_expiry_date' };
    }

    const now = new Date();
    const expireDate = new Date(product.expire_date);
    const daysUntilExpiry = Math.ceil((expireDate - now) / (1000 * 60 * 60 * 24));

    // ✅ If product is far from expiration (more than 7 days), clear old notifications
    if (daysUntilExpiry > 7) {
      await this.dismissUnreadExpirationAlerts(productId);
      console.log(
        `✅ Product ${productId} expiry is far away (${daysUntilExpiry} days) - notifications cleared`,
      );
      return { created: false, status: 'ok', daysUntilExpiry };
    }

    // Determine expiration status
    let notificationType;
    let titleKey;
    let title;
    let message;

    if (daysUntilExpiry < 0) {
      // Already expired
      notificationType = 'expired';
      titleKey = '[EXPIRY:EXPIRED]';
      title = `${titleKey} មានផលិតផលផុតកំណត់`;
      message = `ផលិតផល "${product.name}" (${product.Brand?.name || 'Unknown'}) បានផុតកំណត់ហើយ ${Math.abs(daysUntilExpiry)} ថ្ងៃមកហើយ`;
    } else if (daysUntilExpiry === 0) {
      // Expiring today
      notificationType = 'expiring_today';
      titleKey = '[EXPIRY:TODAY]';
      title = `${titleKey} មានផលិតផលផុតកំណត់ថ្ងៃនេះ`;
      message = `ផលិតផល "${product.name}" (${product.Brand?.name || 'Unknown'}) នឹងផុតកំណត់ថ្ងៃនេះ`;
    } else {
      // Expiring soon (1-7 days)
      notificationType = 'expiring_soon';
      titleKey = '[EXPIRY:SOON]';
      title = `${titleKey} មានផលិតផលជិតផុតកំណត់`;
      message = `ផលិតផល "${product.name}" (${product.Brand?.name || 'Unknown'}) នឹងផុតកំណត់ក្នុងរយៈពេល ${daysUntilExpiry} ថ្ងៃទៀត`;
    }

    // ✅ Check for duplicate notification (same state within last 2 hours)
    const recentWindow = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const existing = await Notification.findOne({
      where: {
        reference_id: productId,
        type: notificationType,
        created_at: { [Op.gte]: recentWindow },
        title: { [Op.like]: `${titleKey}%` },
      },
      order: [["created_at", "DESC"]],
    });

    if (existing) {
      console.log(`📝 Skipping expiration notification (same state exists): ${titleKey}`);
      return { created: false, status: notificationType, daysUntilExpiry, duplicate: true };
    }

    // ✅ Create notification
    await this.createNotification({
      type: notificationType,
      title,
      message,
      referenceId: productId,
    });

    console.log(`📝 Created expiration notification: ${title}`);
    return { created: true, status: notificationType, daysUntilExpiry };
  }

  // ======== CORE: CHECK ALL PRODUCTS (JOB) ========
  static async checkStockLevels(
    lowStockThreshold = 10,
    criticalStockThreshold = 5,
  ) {
    const products = await Product.findAll({ attributes: ["id"] });

    let createdCount = 0;
    let telegramSent = 0;
    let smsSent = 0;

    for (const p of products) {
      try {
        const result = await this.checkProductStockLevel(
          p.id,
          lowStockThreshold,
          criticalStockThreshold,
        );
        if (result?.created) createdCount++;
        if (result?.telegramSent) telegramSent++;
        if (result?.smsSent) smsSent++;
      } catch (err) {
        console.error(
          "❌ checkStockLevels error for product:",
          p.id,
          err?.message || err,
        );
      }
    }

    // ✅ Optional: Clean up old read notifications
    await this.cleanupOldStockNotifications(24);

    return {
      createdNotifications: createdCount,
      telegramSent,
      smsSent,
      totalProductsChecked: products.length,
    };
  }

  // ✅ NEW: Check all products for expiration
  static async checkExpirationDates() {
    const products = await Product.findAll({ 
      attributes: ["id"],
      where: {
        expire_date: { [Op.ne]: null } // Only check products with expiration dates
      }
    });

    let createdCount = 0;

    for (const p of products) {
      try {
        const result = await this.checkProductExpiration(p.id);
        if (result?.created) createdCount++;
      } catch (err) {
        console.error(
          "❌ checkExpirationDates error for product:",
          p.id,
          err?.message || err,
        );
      }
    }

    // ✅ Clean up old read expiration notifications
    await this.cleanupOldExpirationNotifications(24);

    return {
      createdNotifications: createdCount,
      totalProductsChecked: products.length,
    };
  }
}

module.exports = NotificationService;