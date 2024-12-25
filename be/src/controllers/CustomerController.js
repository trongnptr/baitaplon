const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { jwtDecode } = require('jwt-decode');

const User = require('../models/user');
const Customer_Info = require('../models/customer_info');

// Đăng ký người dùng
let register = async (req, res, next) => {
    let email = req.body.email;
    if (email === undefined) return res.status(400).send({ message: 'Vui lòng nhập Email của bạn' });
    let password = req.body.password;
    if (password === undefined) return res.status(400).send({ message: 'Vui lòng nhập Mật khẩu của bạn' });
    let customer_name = req.body.customer_name;
    if (customer_name === undefined) return res.status(400).send({ message: 'Vui lòng nhập Họ và Tên của bạn' });
    let phone_number = req.body.phone_number;
    if (phone_number === undefined) return res.status(400).send({ message: 'Vui lòng nhập Số điện thoại của bạn' });

    // Kiểm tra xem email đã tồn tại chưa
    let customer = await User.findOne({ where: { email } });
    if (customer) return res.status(409).send({ message: 'Email đã tồn tại' });

    try {
        // Mã hóa mật khẩu
        let hashPassword = await bcrypt.hash(password, 10);
        
        // Tạo mới người dùng
        let newCustomer = await User.create({ email: email, password: hashPassword }); 
        
        // Tạo thông tin khách hàng
        await Customer_Info.create({ user_id: newCustomer.user_id, customer_name, phone_number });

        // Tạo access token
        const accessToken = jwt.sign(
            { customer_id: newCustomer.user_id },
            process.env.ACCESSTOKEN_SECRET_KEY,
            { expiresIn: process.env.ACCESSTOKEN_EXPIRES_IN }
        );

        const { exp } = jwtDecode(accessToken);
        const accessTokenExpires = exp;

        // Tạo refresh token
        const refreshToken = jwt.sign(
            { customer_id: newCustomer.user_id },
            process.env.REFRESHTOKEN_SECRET_KEY,
            { expiresIn: process.env.REFRESHTOKEN_EXPIRES_IN }
        );

        // Cấu hình cookie cho refresh token
        res.cookie('refresh_token', refreshToken, {
            httpOnly: true,
            path: '/',
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production' // Chỉ sử dụng HTTPS khi môi trường sản xuất
        });

        // Trả về thông báo và thông tin token
        return res.send({
            message: 'Đăng ký thành công!',
            access_token: accessToken,
            access_token_expires: accessTokenExpires,
        });
    } catch (err) {
        console.error('Lỗi khi tạo người dùng:', err.message || err); // In ra lỗi chi tiết
        return res.status(500).send({ message: 'Có lỗi xảy ra, vui lòng thử lại' });
    }
}

// Đăng nhập người dùng
let login = async (req, res, next) => {
    let email = req.body.email;
    if (email === undefined) return res.status(400).send({ message: 'Email hoặc Mật khẩu không đúng' });
    let password = req.body.password;
    if (password === undefined) return res.status(400).send({ message: 'Email hoặc Mật khẩu không đúng' });

    try {
        let customer = await User.findOne({ where: { email } });
        if (!customer) {
            return res.status(401).send({ message: 'Email hoặc Mật khẩu không đúng' });
        }

        let isPasswordValid = await bcrypt.compare(password, customer.password); // Sử dụng async compare
        if (!isPasswordValid) {
            return res.status(401).send({ message: 'Email hoặc Mật khẩu không đúng' });
        }

        // Tạo access token
        const accessToken = jwt.sign(
            { customer_id: customer.user_id },
            process.env.ACCESSTOKEN_SECRET_KEY,
            { expiresIn: process.env.ACCESSTOKEN_EXPIRES_IN }
        );

        const { exp } = jwtDecode(accessToken);
        const accessTokenExpires = exp;

        // Tạo refresh token
        const refreshToken = jwt.sign(
            { customer_id: customer.user_id },
            process.env.REFRESHTOKEN_SECRET_KEY,
            { expiresIn: process.env.REFRESHTOKEN_EXPIRES_IN }
        );

        // Cấu hình cookie cho refresh token
        res.cookie('refresh_token', refreshToken, {
            httpOnly: true,
            path: '/',
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production'
        });

        // Trả về thông tin token
        return res.send({
            access_token: accessToken,
            access_token_expires: accessTokenExpires
        });
    } catch (err) {
        console.log(err);
        return res.status(400).send({ message: 'Có lỗi xảy ra, vui lòng thử lại' });
    }
}

// Đăng xuất người dùng
let logout = async (req, res, next) => {
    res.clearCookie('refresh_token');
    return res.send({ message: 'Đăng xuất thành công' });
}

// Làm mới access token
let refreshAccessToken = async (req, res, next) => {
    const refreshToken = req.cookies?.refresh_token;
    if (refreshToken === undefined) return res.status(400).send({ message: 'Refresh Token không hợp lệ' });

    try {
        const { iat, exp, ...payload } = jwt.verify(refreshToken, process.env.REFRESHTOKEN_SECRET_KEY);

        const newAccessToken = jwt.sign(
            payload,
            process.env.ACCESSTOKEN_SECRET_KEY,
            { expiresIn: process.env.ACCESSTOKEN_EXPIRES_IN }
        );

        const decode = jwtDecode(newAccessToken);
        const newAccessTokenExpires = decode.exp;

        const newRefreshToken = jwt.sign(
            payload,
            process.env.REFRESHTOKEN_SECRET_KEY,
            { expiresIn: process.env.REFRESHTOKEN_EXPIRES_IN }
        );

        // Cấu hình cookie cho refresh token mới
        res.cookie('refresh_token', newRefreshToken, {
            httpOnly: true,
            path: '/',
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production'
        });

        return res.send({
            access_token: newAccessToken,
            access_token_expires: newAccessTokenExpires
        });
    } catch (error) {
        console.log(error);
        return res.status(401).send({ message: 'Refresh Token không hợp lệ hoặc đã hết hạn' });
    }
}

// Lấy thông tin người dùng
let getInfor = async (req, res, next) => {
    const customerId = req.token?.customer_id;
    if (!customerId) return res.status(400).send({ message: 'Access Token không hợp lệ' });

    try {
        const customer = await User.findOne({
            where: { user_id: customerId },
            include: [
                { model: Customer_Info, attributes: ['customer_name', 'phone_number', 'address'] },
            ]
        });

        return res.send({
            email: customer.email,
            customer_name: customer.Customer_Info.customer_name,
            phone_number: customer.Customer_Info.phone_number,
            address: customer.Customer_Info.address,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).send({ message: 'Có lỗi xảy ra, vui lòng thử lại' });
    }
}

// Cập nhật thông tin người dùng
let update = async (req, res, next) => {
    const user_id = req.token.customer_id;
    if (!user_id) return res.status(400).send({ message: 'Access Token không hợp lệ' });
    const { customer_name, phone_number, address } = req.body;

    if (!customer_name || !phone_number || !address) {
        return res.status(400).send({ message: 'Vui lòng cung cấp đầy đủ thông tin' });
    }

    try {
        const customer = await User.findOne({ where: { user_id } });
        if (!customer) return res.status(409).send({ message: 'Customer không tồn tại' });

        const numberUpdate = await Customer_Info.update(
            { customer_name, phone_number, address },
            { where: { user_id } }
        );

        if (numberUpdate) {
            return res.send({
                customer_name,
                phone_number,
                address
            });
        } else {
            return res.status(500).send({ message: 'Có lỗi xảy ra, vui lòng thử lại' });
        }
    } catch (err) {
        console.log(err);
        return res.status(500).send({ message: 'Có lỗi xảy ra, vui lòng thử lại' });
    }
}

module.exports = {
    register,
    login,
    logout,
    refreshAccessToken,
    getInfor,
    update
};
