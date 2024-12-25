const { DataTypes } = require('sequelize');
const { sequelize } = require('../configs/database');

const User = sequelize.define('User', {
    user_id: { 
        type: DataTypes.UUID, 
        defaultValue: DataTypes.UUIDV4, 
        allowNull: false, 
        primaryKey: true 
    },
    email: { 
        type: DataTypes.STRING, 
        allowNull: false 
    },
    password: { 
        type: DataTypes.STRING, 
        allowNull: false 
    },
}, {
    timestamps: false 
});

module.exports = User;
