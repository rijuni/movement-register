const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Admin = sequelize.define('Admin', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  empId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('SUPER_ADMIN', 'ADMIN'),
    allowNull: false,
    defaultValue: 'ADMIN',
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'IT DATA CENTER',
  }
}, {
  timestamps: true,
});

module.exports = Admin;
