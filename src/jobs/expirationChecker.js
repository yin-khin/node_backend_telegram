
const NotificationService = require("../services/notificationService");
const db = require("../models");
const { Product, Brand, Category, Notification, Sequelize } = db;

const Op = Sequelize.Op;

class ExpirationChecker {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    // Recommended intervals
    // this.checkInterval = 60 * 60 * 1000; // 1 hour for checking expirations
    // this.cleanupInterval = 6 * 60 * 60 * 1000; // 6 hours for cleanup old read notifications
    this.cleanupInterval = 1 * 1000; // 6 hours for cleanup old read notifications
     this.checkInterval = 1 * 1000; // for development/testing only
    this.autoDismissInterval = null;
    this.cleanupIntervalId = null;
  }

  start() {
    if (this.isRunning) {
      return console.log("⚠️ Expiration checker already running");
    }

    console.log("🚀 Starting expiration checker...");
    console.log(`📅 Check every ${this.checkInterval / (1000 * 60)} minutes`);
    console.log(`🧹 Cleanup every ${this.cleanupInterval / (1000 * 60 * 60)} hours`);

    // Run immediately on start
    this.runCheck();
    
    // Schedule periodic checks
    this.intervalId = setInterval(() => this.runCheck(), this.checkInterval);

    // Start auto-dismiss for resolved notifications
    this.startAutoDismiss();
    
    // Start periodic cleanup of old read notifications
    this.startPeriodicCleanup();

    this.isRunning = true;
    console.log("✅ Expiration checker started successfully");
  }

  stop() {
    if (!this.isRunning) return;
    
    if (this.intervalId) clearInterval(this.intervalId);
    if (this.autoDismissInterval) clearInterval(this.autoDismissInterval);
    if (this.cleanupIntervalId) clearInterval(this.cleanupIntervalId);
    
    this.isRunning = false;
    console.log("🛑 Expiration checker stopped");
  }

  /**
   * ✅ Auto-dismiss notifications when products are no longer expiring soon
   * Runs every 15 minutes to keep notifications current
   */
  startAutoDismiss() {
    console.log("🔄 Starting auto-dismiss for resolved expiration alerts (every 15 min)");
    
    // Run immediately
    this.dismissResolvedExpirationNotifications();
    
    // Schedule periodic runs
    this.autoDismissInterval = setInterval(
      () => this.dismissResolvedExpirationNotifications(),
      15 * 60 * 1000, // every 15 minutes
    );
  }

  /**
   * ✅ Periodic cleanup of old read notifications
   * Runs every 6 hours to keep database clean
   */
  startPeriodicCleanup() {
    console.log("🧹 Starting periodic cleanup of old read notifications (every 6 hours)");
    
    // Run immediately
    this.cleanupOldReadNotifications();
    
    // Schedule periodic runs
    this.cleanupIntervalId = setInterval(
      () => this.cleanupOldReadNotifications(),
      this.cleanupInterval,
    );
  }

  /**
   * ✅ IMPROVED: Dismiss unread notifications that are no longer relevant
   * This is called frequently (every 15 min) to keep UI in sync
   */
  async dismissResolvedExpirationNotifications() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get all unread expiration notifications
      const notifications = await Notification.findAll({
        where: {
          type: { [Op.in]: ["expiring_soon", "expiring_today", "expired"] },
          is_read: false,
        },
        include: [
          {
            model: Product,
            as: "Product",
            attributes: ["id", "expire_date"],
            required: false, // Include even if product is deleted
          },
        ],
      });

      let dismissed = 0;

      for (const n of notifications) {
        let shouldDismiss = false;

        // Case 1: Product deleted or has no expire_date
        if (!n.Product || !n.Product.expire_date) {
          shouldDismiss = true;
          console.log(`📝 Dismissing notification ${n.id}: Product deleted or no expire_date`);
        } else {
          // Case 2: Check if notification is still relevant
          const expire = new Date(n.Product.expire_date);
          expire.setHours(0, 0, 0, 0);
          const daysLeft = Math.ceil((expire - today) / (1000 * 60 * 60 * 24));

          // Dismiss based on notification type and current status
          if (n.type === "expiring_soon" && daysLeft > 7) {
            shouldDismiss = true;
            console.log(
              `📝 Dismissing expiring_soon notification for product ${n.Product.id}: ${daysLeft} days left (not urgent anymore)`
            );
          } else if (n.type === "expiring_today" && daysLeft !== 0) {
            shouldDismiss = true;
            console.log(
              `📝 Dismissing expiring_today notification for product ${n.Product.id}: ${daysLeft} days left (not today)`
            );
          } else if (n.type === "expired" && daysLeft > -3) {
            shouldDismiss = true;
            console.log(
              `📝 Dismissing expired notification for product ${n.Product.id}: ${daysLeft} days left (not expired anymore)`
            );
          }
        }

        if (shouldDismiss) {
          await n.destroy();
          dismissed++;
        }
      }

      if (dismissed > 0) {
        console.log(`✅ Dismissed ${dismissed} resolved expiration notifications`);
      }

      return dismissed;
    } catch (err) {
      console.error("❌ Auto-dismiss error:", err);
      return 0;
    }
  }

  /**
   * ✅ NEW: Clean up old read notifications to keep database lean
   * This runs less frequently (every 6 hours)
   */
  async cleanupOldReadNotifications() {
    try {
      const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

      const deletedCount = await Notification.destroy({
        where: {
          type: { [Op.in]: ["expiring_soon", "expiring_today", "expired"] },
          is_read: true,
          created_at: { [Op.lt]: cutoffDate },
        },
      });

      if (deletedCount > 0) {
        console.log(`🧹 Cleaned up ${deletedCount} old read expiration notifications (older than 24h)`);
      }

      return deletedCount;
    } catch (err) {
      console.error("❌ Cleanup error:", err);
      return 0;
    }
  }

  /**
   * ✅ IMPROVED: Main check function - scans all products and creates appropriate notifications
   */
  async runCheck() {
    try {
      console.log("🔍 Running expiration check...");
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Only check products with expiration dates
      const products = await Product.findAll({
        where: { expire_date: { [Op.ne]: null } },
        include: [
          { model: Brand, as: "Brand", attributes: ["name"] },
          { model: Category, as: "Category", attributes: ["name"] },
        ],
      });

      let createdCount = 0;
      let dismissedCount = 0;

      for (const p of products) {
        const expire = new Date(p.expire_date);
        expire.setHours(0, 0, 0, 0);

        const daysLeft = Math.ceil((expire - today) / (1000 * 60 * 60 * 24));

        // ✅ If product is far from expiration, dismiss any existing alerts
        if (daysLeft > 7) {
          const dismissed = await this.dismissProductExpirationAlerts(p.id);
          if (dismissed > 0) dismissedCount += dismissed;
          continue;
        }

        // ✅ If product is expiring soon (0-7 days) or recently expired (-3 to 0 days)
        if (daysLeft >= -3 && daysLeft <= 7) {
          const created = await this.checkAndCreateExpirationNotification(p, daysLeft);
          if (created) createdCount++;
        }
      }

      console.log(
        `✅ Expiration check complete: ${products.length} products checked, ${createdCount} notifications created, ${dismissedCount} dismissed`
      );

      return { checked: products.length, created: createdCount, dismissed: dismissedCount };
    } catch (err) {
      console.error("❌ Expiration check error:", err);
      return { checked: 0, created: 0, dismissed: 0 };
    }
  }

  /**
   * ✅ NEW: Dismiss all expiration alerts for a specific product
   */
  async dismissProductExpirationAlerts(productId) {
    try {
      const deletedCount = await Notification.destroy({
        where: {
          reference_id: productId,
          type: { [Op.in]: ["expiring_soon", "expiring_today", "expired"] },
          is_read: false,
        },
      });

      if (deletedCount > 0) {
        console.log(`🗑️ Dismissed ${deletedCount} expiration alerts for product ${productId}`);
      }

      return deletedCount;
    } catch (err) {
      console.error(`❌ Error dismissing alerts for product ${productId}:`, err);
      return 0;
    }
  }

  /**
   * ✅ IMPROVED: Create notification based on days until expiration
   * Prevents duplicates and ensures only relevant notifications exist
   */
  async checkAndCreateExpirationNotification(product, daysUntilExpiration) {
    try {
      let type = "";
      let titleKey = "";
      let title = "";
      let message = "";

      const name = product.name || "Unknown Product";
      const brandName = product.Brand?.name || "Unknown";

      // ✅ Determine notification type based on days left
      if (daysUntilExpiration === 7) {
        type = "expiring_soon";
        titleKey = "[EXPIRY:SOON:7D]";
        title = `${titleKey} មានផលិតផលជិតផុតកំណត់`;
        message = `ផលិតផល "${name}" (${brandName}) នឹងផុតកំណត់ក្នុងរយៈពេល 7 ថ្ងៃទៀត។`;
      } else if (daysUntilExpiration > 0 && daysUntilExpiration < 7) {
        type = "expiring_soon";
        titleKey = `[EXPIRY:SOON:${daysUntilExpiration}D]`;
        title = `${titleKey} មានផលិតផលជិតផុតកំណត់`;
        message = `ផលិតផល "${name}" (${brandName}) នឹងផុតកំណត់ក្នុងរយៈពេល ${daysUntilExpiration} ថ្ងៃទៀត។`;
      } else if (daysUntilExpiration === 0) {
        type = "expiring_today";
        titleKey = "[EXPIRY:TODAY]";
        title = `${titleKey} មានផលិតផលផុតកំណត់ថ្ងៃនេះ`;
        message = `ផលិតផល "${name}" (${brandName}) ផុតកំណត់ថ្ងៃនេះ! សូមពិនិត្យភ្លាម។`;
      } else if (daysUntilExpiration < 0) {
        type = "expired";
        const overdueDays = Math.abs(daysUntilExpiration);
        titleKey = `[EXPIRY:EXPIRED:${overdueDays}D]`;
        title = `${titleKey} មានផលិតផលបានផុតកំណត់`;
        message = `ផលិតផល "${name}" (${brandName}) ផុតកំណត់ ${overdueDays} ថ្ងៃហើយ! សូមយកចេញ។`;
      } else {
        return false;
      }

      // ✅ Check for duplicate notification (same state within last 2 hours)
      const recentWindow = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const existing = await Notification.findOne({
        where: {
          reference_id: product.id,
          type: type,
          title: { [Op.like]: `${titleKey}%` },
          created_at: { [Op.gte]: recentWindow },
        },
        order: [["created_at", "DESC"]],
      });

      if (existing) {
        console.log(`📝 Skipping duplicate notification: ${titleKey} for product ${product.id}`);
        return false;
      }

      // ✅ Create new notification
      await NotificationService.createNotification({
        type,
        title,
        message,
        referenceId: product.id,
      });

      console.log(`✅ Created ${type} notification for product ${product.id}: ${name} (${daysUntilExpiration} days)`);
      return true;
    } catch (err) {
      console.error(`❌ Failed to create notification for product ${product.id}:`, err);
      return false;
    }
  }

  /**
   * ✅ Manual trigger for immediate check (useful for testing or admin endpoint)
   */
  async forceCheck() {
    console.log("🔍 Force check triggered manually");
    return await this.runCheck();
  }

  /**
   * ✅ Manual trigger for immediate cleanup (useful for testing or admin endpoint)
   */
  async forceCleanup() {
    console.log("🧹 Force cleanup triggered manually");
    const dismissed = await this.dismissResolvedExpirationNotifications();
    const cleaned = await this.cleanupOldReadNotifications();
    return { dismissed, cleaned };
  }

  /**
   * ✅ Get current status for monitoring/debugging
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      checkInterval: `${this.checkInterval / (1000 * 60)} minutes`,
      cleanupInterval: `${this.cleanupInterval / (1000 * 60 * 60)} hours`,
    };
  }
}

const expirationChecker = new ExpirationChecker();
module.exports = expirationChecker;