/**
 * 用户路由
 * 处理用户相关的所有API端点
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

// ===============================================
// 验证中间件
// ===============================================

// 注册验证规则
const registerValidation = [
    body('username')
        .isLength({ min: 3, max: 30 })
        .withMessage('用户名长度必须在3-30个字符之间')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('用户名只能包含字母、数字和下划线'),
    
    body('email')
        .isEmail()
        .withMessage('请输入有效的邮箱地址')
        .normalizeEmail(),
    
    body('password')
        .isLength({ min: 6 })
        .withMessage('密码至少6个字符')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('密码必须包含大小写字母和数字'),
    
    body('firstName')
        .optional()
        .isLength({ max: 50 })
        .withMessage('名字不能超过50个字符'),
    
    body('lastName')
        .optional()
        .isLength({ max: 50 })
        .withMessage('姓氏不能超过50个字符')
];

// 登录验证规则
const loginValidation = [
    body('credential')
        .notEmpty()
        .withMessage('请输入用户名或邮箱'),
    
    body('password')
        .notEmpty()
        .withMessage('请输入密码')
];

// ===============================================
// 公开路由（无需认证）
// ===============================================

/**
 * @route   POST /api/users/register
 * @desc    用户注册
 * @access  Public
 */
router.post('/register', registerValidation, async (req, res) => {
    try {
        // 检查验证错误
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: '验证失败',
                errors: errors.array()
            });
        }
        
        const { username, email, password, firstName, lastName } = req.body;
        
        // 检查用户是否已存在
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });
        
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: existingUser.email === email ? '邮箱已被注册' : '用户名已被使用'
            });
        }
        
        // 创建新用户
        const user = new User({
            username,
            email,
            password,
            firstName,
            lastName
        });
        
        await user.save();
        
        // 生成token
        const token = user.generateAuthToken();
        
        res.status(201).json({
            success: true,
            message: '注册成功',
            data: {
                user: user.getPublicProfile(),
                token
            }
        });
        
    } catch (error) {
        console.error('用户注册错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

/**
 * @route   POST /api/users/login
 * @desc    用户登录
 * @access  Public
 */
router.post('/login', loginValidation, async (req, res) => {
    try {
        // 检查验证错误
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: '验证失败',
                errors: errors.array()
            });
        }
        
        const { credential, password } = req.body;\n        \n        // 查找并验证用户
        const user = await User.findByCredentials(credential, password);
        \n        // 生成token
        const token = user.generateAuthToken();
        \n        res.json({
            success: true,
            message: '登录成功',
            data: {
                user: user.getPublicProfile(),
                token
            }
        });
        \n    } catch (error) {
        console.error('用户登录错误:', error);
        \n        let message = '登录失败';
        if (error.message === '用户不存在') {
            message = '用户名或邮箱不存在';
        } else if (error.message === '密码错误') {
            message = '密码错误';
        } else if (error.message === '账户已被禁用') {
            message = '账户已被禁用，请联系管理员';
        }
        \n        res.status(401).json({
            success: false,
            message
        });
    }
});

// ===============================================
// 需要认证的路由
// ===============================================

/**
 * @route   GET /api/users/profile
 * @desc    获取用户信息
 * @access  Private
 */
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .populate('cart.product', 'name price images')
            .populate('wishlist', 'name price images');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }
        
        res.json({
            success: true,
            data: {
                user: user.getPublicProfile()
            }
        });
        
    } catch (error) {
        console.error('获取用户信息错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

/**
 * @route   PUT /api/users/profile
 * @desc    更新用户信息
 * @access  Private
 */
router.put('/profile', auth, [
    body('firstName').optional().isLength({ max: 50 }),
    body('lastName').optional().isLength({ max: 50 }),
    body('phone').optional().matches(/^1[3-9]\d{9}$/)
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: '验证失败',
                errors: errors.array()
            });
        }
        
        const { firstName, lastName, phone } = req.body;
        
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { firstName, lastName, phone },
            { new: true, runValidators: true }
        );
        
        res.json({
            success: true,
            message: '用户信息更新成功',
            data: {
                user: user.getPublicProfile()
            }
        });
        
    } catch (error) {
        console.error('更新用户信息错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

/**
 * @route   POST /api/users/addresses
 * @desc    添加收货地址
 * @access  Private
 */
router.post('/addresses', auth, [
    body('name').notEmpty().withMessage('收货人姓名不能为空'),
    body('phone').matches(/^1[3-9]\d{9}$/).withMessage('请输入有效的手机号'),
    body('province').notEmpty().withMessage('省份不能为空'),
    body('city').notEmpty().withMessage('城市不能为空'),
    body('district').notEmpty().withMessage('区县不能为空'),
    body('detail').notEmpty().withMessage('详细地址不能为空')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: '验证失败',
                errors: errors.array()
            });
        }
        
        const user = await User.findById(req.user.id);
        const { name, phone, province, city, district, detail, isDefault } = req.body;
        
        // 如果设置为默认地址，先取消其他默认地址
        if (isDefault) {
            user.addresses.forEach(addr => addr.isDefault = false);
        }
        
        user.addresses.push({
            name,
            phone,
            province,
            city,
            district,
            detail,
            isDefault: isDefault || user.addresses.length === 0
        });
        
        await user.save();
        
        res.status(201).json({
            success: true,
            message: '地址添加成功',
            data: {
                addresses: user.addresses
            }
        });
        
    } catch (error) {
        console.error('添加地址错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

/**
 * @route   GET /api/users/orders
 * @desc    获取用户订单列表
 * @access  Private
 */
router.get('/orders', auth, async (req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;
        
        // 构建查询条件
        const query = { user: req.user.id };
        if (status) {
            query.status = status;
        }
        
        // 这里需要Order模型，暂时返回示例数据
        const orders = [
            {
                _id: '1',
                orderNumber: 'ORD001',
                status: 'pending',
                totalAmount: 299.99,
                createdAt: new Date()
            }
        ];
        
        res.json({
            success: true,
            data: {
                orders,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: orders.length,
                    pages: Math.ceil(orders.length / limit)
                }
            }
        });
        
    } catch (error) {
        console.error('获取订单列表错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

/**
 * @route   DELETE /api/users/account
 * @desc    删除用户账户
 * @access  Private
 */
router.delete('/account', auth, async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user.id, { isActive: false });
        
        res.json({
            success: true,
            message: '账户已删除'
        });
        
    } catch (error) {
        console.error('删除账户错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

module.exports = router;