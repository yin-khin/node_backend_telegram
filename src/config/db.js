// const { Sequelize } = require("sequelize");

// const sequelize = new Sequelize("fullstacks", "root", "", {
//   host: "localhost",
//   dialect: "mysql",
//   port: 3306,
//   logging: false,
// });

// module.exports = sequelize;


// require("dotenv").config();
// const { Sequelize } = require("sequelize");

// const url = process.env.DATABASE_URL || process.env.MYSQL_URL;

// const sequelize = url
//   ? new Sequelize(url, { logging: false })
//   : new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
//       host: process.env.DB_HOST,
//       port: process.env.DB_PORT,
//       dialect: "mysql",
//       logging: false,
//     });

// module.exports = sequelize;


require("dotenv").config();
const fs = require("fs");
const { Sequelize } = require("sequelize");

const url = process.env.DATABASE_URL || process.env.MYSQL_URL;

const sslEnabled = process.env.DB_SSL === "true";
const caFromEnv = process.env.DB_SSL_CA;

const dialectOptions = sslEnabled
  ? {
      ssl: {
        ca: caFromEnv ? caFromEnv : fs.readFileSync(process.env.DB_SSL_CA_PATH, "utf8"),
        rejectUnauthorized: true,
      },
    }
  : {};

const sequelize = url
  ? new Sequelize(url, { logging: false, dialect: "mysql", dialectOptions })
  : new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      dialect: "mysql",
      logging: false,
      dialectOptions,
    });

module.exports = sequelize;
