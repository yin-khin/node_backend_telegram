"use strict";

const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const process = require("process");

const basename = path.basename(__filename);
const env = process.env.NODE_ENV || "development";
const config = require(__dirname + "/../config/config.json")[env];

const db = {};

let sequelize;

if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

fs.readdirSync(__dirname)
  .filter((file) => file.indexOf(".") !== 0 && file !== basename && file.slice(-3) === ".js")
  .forEach((file) => {
    const modelExport = require(path.join(__dirname, file));

    if (typeof modelExport !== "function") {
      console.error(`❌ Invalid model export in: ${file}`);
      return;
    }

    const model = modelExport(sequelize, Sequelize.DataTypes);

    if (!model || !model.name) {
      console.error(`❌ Model returned invalid object in: ${file}`);
      return;
    }

    db[model.name] = model;
    console.log(`✅ Loaded model: ${model.name}`);
  });

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) db[modelName].associate(db);
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;



// "use strict";

// const fs = require("fs");
// const path = require("path");
// const Sequelize = require("sequelize");
// const process = require("process");

// const basename = path.basename(__filename);
// const env = process.env.NODE_ENV || "development";
// const config = require(__dirname + "/../config/config.json")[env];

// const db = {};

// let sequelize;

// if (config.use_env_variable) {
//   // ✅ FIX: use_env_variable (Sequelize CLI standard)
//   sequelize = new Sequelize(process.env[config.use_env_variable], config);
// } else {
//   sequelize = new Sequelize(
//     config.database,
//     config.username,
//     config.password,
//     config
//   );
// }

// fs.readdirSync(__dirname)
//   .filter((file) => {
//     return (
//       file.indexOf(".") !== 0 &&
//       file !== basename &&
//       file.slice(-3) === ".js" &&
//       file.indexOf(".test.js") === -1
//     );
//   })
//   .forEach((file) => {
//     try {
//       const modelExport = require(path.join(__dirname, file));

//       // model must export function (sequelize, DataTypes) => Model
//       const model =
//         typeof modelExport === "function"
//           ? modelExport(sequelize, Sequelize.DataTypes)
//           : modelExport;

//       if (!model || !model.name) {
//         console.error(`❌ Invalid model export in: ${file}`);
//         return;
//       }

//       db[model.name] = model;
//       console.log(`✅ Loaded model: ${model.name}`);
//     } catch (error) {
//       console.error(`❌ Error loading model ${file}:`, error.message);
//     }
//   });

// Object.keys(db).forEach((modelName) => {
//   if (db[modelName].associate) {
//     try {
//       db[modelName].associate(db);
//     } catch (error) {
//       console.error(`❌ Error associating model ${modelName}:`, error.message);
//     }
//   }
// });

// db.sequelize = sequelize;
// db.Sequelize = Sequelize;

// // ✅ FIX: export db
// module.exports = db;
