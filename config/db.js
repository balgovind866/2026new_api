const { Sequelize } = require("sequelize");
require("dotenv").config();

const env = process.env.NODE_ENV || "development";
const config = require("./config")[env];

const sequelize = new Sequelize(process.env[config.use_env_variable], {
  dialect: config.dialect,
  dialectOptions: config.dialectOptions || {},
  logging: false,
});

sequelize
  .authenticate()
  .then(() => console.log(`✅ Connected to ${env} database successfully!`))
  .catch((err) => console.error("❌ Database connection failed:", err));

module.exports = sequelize;
