// const { Sequelize } = require("sequelize");

// const sequelize = new Sequelize("fullstacks", "root", "", {
//   host: "localhost",
//   dialect: "mysql",
//   port: 3306,
//   logging: false,
// });

// module.exports = sequelize;


require("dotenv").config();
const { Sequelize } = require("sequelize");

const url = process.env.DATABASE_URL || process.env.MYSQL_URL;

const sequelize = url
  ? new Sequelize(url, { logging: false })
  : new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      dialect: "mysql",
      logging: false,
    });

module.exports = sequelize;
