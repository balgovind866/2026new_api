"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("schools", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },

      code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },

      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      subdomain: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },

      address: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      phone: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      email: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      logoPath: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      bannerPath: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      principalName: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      establishedYear: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },

      db_name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },

      db_host: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      db_port: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 5432,
      },

      db_username: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      db_password: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },

      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },

      setup_completed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },

      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },

      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("schools");
  },
};
