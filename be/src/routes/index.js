const express = require('express');


const customerRouter = require('./customer');
const colourRouter = require('./colour');
const sizeRouter = require('./size');
const categoryRouter = require('./category');
const productRouter = require('./product');
const product_variantRouter = require('./product_variant');
const order = require('./order');

function setRoute(server) {

    server.use('/api/customer', customerRouter);

    server.use('/api/colour', colourRouter);

    server.use('/api/size', sizeRouter);

    server.use('/api/category', categoryRouter);

    server.use('/api/product', productRouter);

    server.use('/api/product-variant', product_variantRouter);

    server.use('/api/order', order);


}

module.exports = setRoute;
