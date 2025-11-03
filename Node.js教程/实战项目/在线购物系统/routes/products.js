/**
 * 商品路由 - 基础版本
 */

const express = require('express');
const router = express.Router();

// 获取商品列表
router.get('/', (req, res) => {
    res.json({
        success: true,
        message: '商品列表API - 开发中',
        data: {
            products: [
                {
                    id: 1,
                    name: '示例商品',
                    price: 99.99,
                    description: '这是一个示例商品'
                }
            ]
        }
    });
});

// 获取商品详情
router.get('/:id', (req, res) => {
    res.json({
        success: true,
        message: '商品详情API - 开发中',
        data: {
            product: {
                id: req.params.id,
                name: '示例商品',
                price: 99.99
            }
        }
    });
});

module.exports = router;