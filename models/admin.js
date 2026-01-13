const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  const Admin = sequelize.define('Admin', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Super Admin'
    },
    role: {
      type: DataTypes.STRING,
      defaultValue: 'super_admin'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'admins',
    timestamps: true,
    hooks: {
      beforeCreate: async (admin) => {
        if (admin.password) {
          const salt = await bcrypt.genSalt(10);
          admin.password = await bcrypt.hash(admin.password, salt);
        }
      },
      beforeUpdate: async (admin) => {
        if (admin.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          admin.password = await bcrypt.hash(admin.password, salt);
        }
      }
    }
  });

  Admin.prototype.validatePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
  };

  Admin.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    delete values.password;
    return values;
  };

  return Admin;
};
