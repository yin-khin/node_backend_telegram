const cron = require("node-cron");
const NotificationService = require("../services/notificationService");

class StockLevelChecker {
  constructor() {
    this.isRunning = false;
    this.lowStockThreshold = 10;
    this.criticalStockThreshold = 5;
    this._isChecking = false;
    this._cronTask = null;
  }
  // constructor() {
  //   this.isRunning = false;
  //   this.intervalId = null;
  //   this.checkInterval = 1 * 60 * 1000; // 30 minutes in milliseconds
  //   this.lowStockThreshold = 10;
  //   this.criticalStockThreshold = 5;
  // }
  start() {
    if (this.isRunning) {
      console.log("📊 Stock level checker is already running");
      return;
    }

    console.log("🚀 ===== STARTING STOCK LEVEL MONITORING =====");
    console.log("⏱ Cron: every 1 minute");
    console.log(`📉 Low stock threshold: ${this.lowStockThreshold}`);
    console.log(`⚠️ Critical stock threshold: ${this.criticalStockThreshold}`);
    console.log("🚀 ===== STOCK MONITORING ACTIVE =====");

    // run once immediately
    this.runCheck();
    // this._cronTask = cron.schedule("32 18 * * *", () => this.runCheck(), {
    //   scheduled: true,
    //   timezone: "Asia/Phnom_Penh",
    // });
    // schedule cron
    // this._cronTask = cron.schedule("*/1 * * * *", () => this.runCheck(), {
    //   scheduled: true,
    //   //  scheduled: true,
    //   timezone: "Asia/Phnom_Penh",
    // });

    // hour = 13,14, 15,16, 17, 18 ,19 ,20, 21 ,
    //         1 ,2, 3 ,4,  5, 6 , 7 , 8 ,  9

    // this._cronTask = cron.schedule("4 12 * * *", () => this.runCheck(), {
    //   scheduled: true,
    //   timezone: "Asia/Phnom_Penh",
    // });
    this._cronTask = cron.schedule("0 8 * * *", () => this.runCheck(), {
      scheduled: true,
      timezone: "Asia/Phnom_Penh",
    });

    this.isRunning = true;
  }

  stop() {
    if (!this.isRunning) {
      console.log("📊 Stock level checker is not running");
      return;
    }

    console.log("🛑 Stopping stock level checker...");
    if (this._cronTask) {
      this._cronTask.stop();
      this._cronTask = null;
    }

    this.isRunning = false;
    console.log("✅ Stock level checker stopped");
  }

  async runCheck() {
    if (this._isChecking) {
      console.log("⏳ Stock check skipped (previous still running)");
      return;
    }

    this._isChecking = true;

    try {
      console.log(
        "🔎 ===== STOCK CHECK START =====",
        new Date().toLocaleString(),
      );

      // ⚠️ this must return a structured result (see note below)
      const result = await NotificationService.checkStockLevels(
        this.lowStockThreshold,
        this.criticalStockThreshold,
      );

      console.log("✅ STOCK CHECK DONE:", result);
      console.log("🔎 ===== STOCK CHECK END =====");
      return result;
    } catch (err) {
      console.error("❌ STOCK CHECK ERROR:", err?.message || err);
      return null;
    } finally {
      this._isChecking = false;
    }
  }

  updateThresholds(lowStock = 10, criticalStock = 5) {
    this.lowStockThreshold = Number(lowStock);
    this.criticalStockThreshold = Number(criticalStock);
    console.log(
      `📊 Updated thresholds - Low: ${lowStock}, Critical: ${criticalStock}`,
    );
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      lowStockThreshold: this.lowStockThreshold,
      criticalStockThreshold: this.criticalStockThreshold,
      isCurrentlyChecking: this._isChecking,
    };
  }
}

module.exports = new StockLevelChecker();
