require('dotenv').config();

module.exports = {
  development: {
    username: process.env.MASTER_DB_USERNAME || "neondb_owner",
    password: process.env.MASTER_DB_PASSWORD || "npg_p9UntrSCLlQ2",
    database: process.env.MASTER_DB_NAME || "neondb",
    host: process.env.MASTER_DB_HOST || "ep-misty-pine-ahvyaylp-pooler.us-east-1.aws.neon.tech",
    port: process.env.MASTER_DB_PORT || 5432,
    dialect: process.env.MASTER_DB_DIALECT || "postgres",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false
  },
  test: {
    username: process.env.MASTER_DB_USERNAME,
    password: process.env.MASTER_DB_PASSWORD,
    database: process.env.MASTER_DB_NAME,
    host: process.env.MASTER_DB_HOST,
    port: process.env.MASTER_DB_PORT,
    dialect: process.env.MASTER_DB_DIALECT || "postgres",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false
  },
  production: {
    username: process.env.MASTER_DB_USERNAME,
    password: process.env.MASTER_DB_PASSWORD,
    database: process.env.MASTER_DB_NAME,
    host: process.env.MASTER_DB_HOST,
    port: process.env.MASTER_DB_PORT,
    dialect: process.env.MASTER_DB_DIALECT || "postgres",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false
  }
};