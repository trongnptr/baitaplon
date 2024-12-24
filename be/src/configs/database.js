require('dotenv').config({ path: 'C:\Users\admin\Downloads\nodejs-clothes-web-shop-master\nodejs-clothes-web-shop-master\be\.env' });  // Nạp .env từ thư mục ngoài src

const { Sequelize } = require('sequelize');
const mysql = require('mysql2/promise');

// Cấu hình Sequelize kết nối cơ sở dữ liệu
const sequelize = new Sequelize(
  process.env.DATABASE_NAME,
  process.env.DATABASE_USERNAME,
  process.env.DATABASE_PASSWORD,
  { 
    host: process.env.DATABASE_HOST, 
    dialect: 'mysql', 
    logging: false,
    pool: {
      max: 5, // Số kết nối tối đa trong pool
      min: 0, // Số kết nối tối thiểu trong pool
      acquire: 30000, // Thời gian chờ kết nối tối đa trong mili giây
      idle: 10000 // Thời gian tối đa cho kết nối rảnh
    }
  }
);

module.exports = {
  sequelize,
  connect: async () => {
    try {
      // Kết nối với MySQL để kiểm tra và tạo cơ sở dữ liệu nếu cần
      const connection = await mysql.createConnection({
        host: process.env.DATABASE_HOST,
        user: process.env.DATABASE_USERNAME,
        password: process.env.DATABASE_PASSWORD,
      });

      // Tạo cơ sở dữ liệu nếu chưa tồn tại
      await connection.query(
        `CREATE DATABASE IF NOT EXISTS \`${process.env.DATABASE_NAME}\``
      );

      // Đóng kết nối sau khi xử lý
      await connection.end();

      // Sử dụng Sequelize để kết nối đến cơ sở dữ liệu
      await sequelize.authenticate();
      console.log('Connection has been established successfully.');

      // Đồng bộ hóa tất cả các mô hình Sequelize với cơ sở dữ liệu
      await sequelize.sync({ force: false });

    } catch (error) {
      console.error('Unable to connect to the database:', error);
    }
  }
};
