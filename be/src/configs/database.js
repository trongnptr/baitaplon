require('dotenv').config({ path: 'C:\Users\admin\Downloads\nodejs-clothes-web-shop-master\nodejs-clothes-web-shop-master\be\.env' });  // Nạp .env từ thư mục ngoài src

const { Sequelize } = require('sequelize');
const mysql = require('mysql2/promise');


const sequelize = new Sequelize(
  process.env.DATABASE_NAME,
  process.env.DATABASE_USERNAME,
  process.env.DATABASE_PASSWORD,
  { 
    host: process.env.DATABASE_HOST, 
    dialect: 'mysql', 
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

module.exports = {
  sequelize,
  connect: async () => {
    try {
      const connection = await mysql.createConnection({
        host: process.env.DATABASE_HOST,
        user: process.env.DATABASE_USERNAME,
        password: process.env.DATABASE_PASSWORD,
      });

      await connection.query(
        `CREATE DATABASE IF NOT EXISTS \`${process.env.DATABASE_NAME}\``
      );

      await connection.end();

      await sequelize.authenticate();
      console.log('Connection has been established successfully.');

      await sequelize.sync({ force: false });

    } catch (error) {
      console.error('Unable to connect to the database:', error);
    }
  }
};
