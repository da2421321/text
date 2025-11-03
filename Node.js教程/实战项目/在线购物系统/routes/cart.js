/**
 * 购物车路由 - 基础版本
 */

const express = require('express');
const auth = require('../middleware/auth');
const router = express.Router();

// 获取购物车
router.get('/', auth, (req, res) => {
    res.json({
        success: true,
        message: '购物车API - 开发中',
        data: {
            cart: []
        }
    });
});

// 添加商品到购物车
router.post('/add', auth, (req, res) => {
    res.json({
        success: true,
        message: '添加到购物车 - 开发中'
    });
});

module.exports = router;