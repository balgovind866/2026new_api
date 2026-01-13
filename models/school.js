"use strict";

module.exports = (sequelize, DataTypes) => {
  const School = sequelize.define(
    "School",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      //djdfdhf

      // ======================
      // Basic School Info
      // ======================
      code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },

      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      subdomain: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isLowercase: true,
          isAlphanumeric: true,
          len: [3, 50],
        },
      },

      address: DataTypes.TEXT,
      phone: DataTypes.STRING,

      email: {
        type: DataTypes.STRING,
        validate: { isEmail: true },
      },

      // ======================
      // Branding
      // ======================
      logoPath: DataTypes.STRING,
      bannerPath: DataTypes.STRING,

      // ======================
      // Academic Info
      // ======================
      principalName: DataTypes.STRING,
      establishedYear: DataTypes.INTEGER,

      // ======================
      // Database (Multi Tenant)
      // ======================
      db_name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },

      db_host: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      db_port: {
        type: DataTypes.INTEGER,
        defaultValue: 5432,
      },

      db_username: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      db_password: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      // ======================
      // Status
      // ======================
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },

      setup_completed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "schools",
      timestamps: true,
    }
  );

  return School;
};
