const { Op } = require("sequelize");

const Product_Variant = require('../models/product_variant');
const Product = require('../models/product');
const Colour = require('../models/colour');
const Size = require('../models/size');
const Product_Price_History = require('../models/product_price_history');
const Product_Image = require('../models/product_image');
const Category = require("../models/category");

let create = async (req, res, next) => {
    let product_name = req.body.product_name;
    if (product_name === undefined) return res.status(400).send('Trường product_name không tồn tại');
    let category_id = req.body.category_id;
    if (category_id === undefined) return res.status(400).send('Trường category_id không tồn tại');
    let price = parseInt(req.body.price);
    if (price === undefined) return res.status(400).send('Trường price không tồn tại');
    let description = req.body.description;
    if (description === undefined) return res.status(400).send('Trường description không tồn tại');

    try {
        let newProduct = await Product.create({ product_name, description, category_id });
        let newProductPriceHistory = await Product_Price_History.create({
            product_id: newProduct.product_id,
            price: price
        });
        return res.send(newProduct);
    } catch (e) {
        console.log(e);
        return res.status(500).send(e);
    }
}

let update = async (req, res, next) => {
    let product_id = req.body.product_id;
    if (product_id === undefined) return res.status(400).send('Trường product_id không tồn tại');
    let product_name = req.body.product_name;
    if (product_name === undefined) return res.status(400).send('Trường product_name không tồn tại');
    let category_id = req.body.category_id;
    if (category_id === undefined) return res.status(400).send('Trường category_id không tồn tại');
    let price = parseInt(req.body.price);
    if (price === undefined) return res.status(400).send('Trường price không tồn tại');
    let description = req.body.description;
    if (description === undefined) return res.status(400).send('Trường description không tồn tại');
    try {
        let category = await Category.findOne({ where: { category_id } });
        if (category == null) return res.status(400).send('Danh mục này không tồn tại');
        let product = await Product.findOne({ where: { product_id } });
        if (product == null) return res.status(400).send('Sản phẩm này không tồn tại');

        await Product_Price_History.create({ product_id, price })
        await product.update({ product_name, category_id, description })

        return res.send("Success")
    } catch (err) {
        console.log(err);
        return res.status(500).send('Gặp lỗi khi tạo đơn hàng vui lòng thử lại');
    }
}



let listCustomerSide = async (req, res, next) => {
    let category_id = Number(req.query.category);
    let whereClause;
    if (category_id != undefined && Number.isInteger(category_id))
        whereClause = { category_id }

    try {
        let listProduct = await Product.findAll({
            attributes: ['product_id'],
            order: [['created_at', 'DESC']],
            raw: true
        });

        let listProductVariant = [];

        for (let { product_id } of listProduct) {
            let listColor = await Product_Variant.findAll({
                attributes: ['colour_id'],
                where: { product_id },
                group: ['colour_id'],
                raw: true
            });
            for (let { colour_id } of listColor) {
                let listProductVariantSameColour = await Product_Variant.findAll({
                    attributes: ['product_variant_id', 'colour_id'],
                    include: [
                        {
                            model: Product, attributes: ['product_id', 'product_name', 'rating', 'sold'],
                            include: {
                                model: Product_Price_History,
                                attributes: ['price'],
                                separate: true, order: [['created_at', 'DESC']]
                            },
                            where: whereClause
                        },
                        { model: Colour, attributes: ['colour_name'] },
                        { model: Size, attributes: ['size_name'] },
                        { model: Product_Image, attributes: ['path'] },
                    ],
                    where: {
                        [Op.and]: [
                            { colour_id },
                            { state: true },
                            { quantity: { [Op.gt]: 0 } }
                        ]
                    },
                });
                if (listProductVariantSameColour.length) {
                    let productVariant = {
                        product_id: listProductVariantSameColour[0].Product.product_id,
                        product_name: listProductVariantSameColour[0].Product.product_name,
                        rating: listProductVariantSameColour[0].Product.rating,
                        sold: listProductVariantSameColour[0].Product.sold,
                        product_variant_id: listProductVariantSameColour[0].product_variant_id,
                        colour_id: listProductVariantSameColour[0].colour_id,
                        colour_name: listProductVariantSameColour[0].Colour.colour_name,
                        price: listProductVariantSameColour[0].Product.Product_Price_Histories[0].price,
                        product_image: listProductVariantSameColour[0].Product_Images[0].path,
                        sizes: []
                    };
                    for (let { Size } of listProductVariantSameColour)
                        productVariant.sizes.push(Size.size_name);
                    listProductVariant.push(productVariant);
                }
            }
        }
        return res.send(listProductVariant);
    } catch (err) {
        console.log(err);
        return res.status(500).send('Gặp lỗi khi tải dữ liệu vui lòng thử lại');
    }
}

let detailCustomerSide = async (req, res, next) => {
    let product_id = req.params.product_id;
    if (product_id === undefined) return res.status(400).send('Trường product_id không tồn tại');

    try {
        let productDetail = await Product.findOne({
            attributes: ['product_id', 'product_name', 'description', 'rating', 'sold'],
            where: { product_id },
            raw: true
        });
        return res.send(productDetail);
    } catch (err) {
        console.log(err);
        return res.status(500).send('Gặp lỗi khi tải dữ liệu vui lòng thử lại');
    }
}


let listColour = async (req, res, next) => {
    let product_id = req.params.product_id;
    if (product_id === undefined) return res.status(400).send('Trường product_id không tồn tại');

    try {
        let listColour = await Product_Variant.findAll({
            attributes: ['colour_id'],
            include: [
                { model: Colour, attributes: ['colour_name'] },
            ],
            where: { product_id },
            group: ['colour_id'],
        });

        listColour = listColour.map((colour) => {
            let newColour = {
                colour_id: colour.colour_id,
                colour_name: colour.Colour.colour_name
            }
            return newColour;
        });

        return res.send(listColour);
    } catch (err) {
        console.log(err);
        return res.status(500).send('Gặp lỗi khi tải dữ liệu vui lòng thử lại');
    }
}

let listSize = async (req, res, next) => {
    let product_id = req.params.product_id;
    if (product_id === undefined) return res.status(400).send('Trường product_id không tồn tại');
    let colour_id = req.params.colour_id;
    if (colour_id === undefined) return res.status(400).send('Trường colour_id không tồn tại');

    try {
        let listSize = await Product_Variant.findAll({
            attributes: ['size_id'],
            include: [
                { model: Size, attributes: ['size_name'] },
            ],
            where: { product_id, colour_id, state: true },
        });

        listSize = listSize.map((size) => {
            let newSize = {
                size_id: size.size_id,
                size_name: size.Size.size_name
            }
            return newSize;
        });

        return res.send(listSize);
    } catch (err) {
        console.log(err);
        return res.status(500).send('Gặp lỗi khi tải dữ liệu vui lòng thử lại');
    }
}

module.exports = {
    create,
    update,
    listCustomerSide,
    detailCustomerSide,
    listColour,
    listSize
};
