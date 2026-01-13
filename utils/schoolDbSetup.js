const { Sequelize, DataTypes } = require('sequelize');

async function createSchoolDatabase({ schema_name, db_host, db_port, db_username, db_password }) {
  const sequelize = new Sequelize(
    'neondb', // SAME DB
    db_username,
    db_password,
    {
      host: db_host,
      port: db_port || 5432,
      dialect: 'postgres',
      dialectOptions: {
        ssl: { require: true, rejectUnauthorized: false }
      },
      logging: false
    }
  );

  await sequelize.authenticate();

  // ✅ Create schema instead of database
  await sequelize.query(
    `CREATE SCHEMA IF NOT EXISTS "${schema_name}";`
  );

  // 🔹 Set search_path to schema
  await sequelize.query(
    `SET search_path TO "${schema_name}";`
  );

  // 🔹 Models
  const Student = sequelize.define('Student', {
    name: DataTypes.STRING,
    class: DataTypes.STRING
  }, { schema: schema_name });

  const Teacher = sequelize.define('Teacher', {
    name: DataTypes.STRING,
    subject: DataTypes.STRING
  }, { schema: schema_name });

  await sequelize.sync({ alter: true });

  await sequelize.close();
}

module.exports = { createSchoolDatabase };