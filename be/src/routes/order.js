const express = require('express');

const OrderController = require('../controllers/OrderController');
const jwtAuth = require('../midlewares/jwtAuth');

let router = express.Router();

// Tạo đơn hàng, yêu cầu xác thực bằng JWT
router.post('/create', jwtAuth, OrderController.create);

// Lấy danh sách đơn hàng của khách hàng, yêu cầu xác thực bằng JWT
router.get('/customer/list', jwtAuth, OrderController.listCustomerSide);

// Xem chi tiết đơn hàng của khách hàng, yêu cầu xác thực bằng JWT
router.get('/detail/:order_id', jwtAuth, OrderController.detailCustomerSide);


module.exports = router;
