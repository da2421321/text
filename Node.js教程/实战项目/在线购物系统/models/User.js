/**
 * 用户数据模型
 * 定义用户的数据结构和方法
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
    // 基本信息
    username: {
        type: String,
        required: [true, '用户名是必需的'],
        unique: true,
        trim: true,
        minlength: [3, '用户名至少3个字符'],
        maxlength: [30, '用户名不能超过30个字符']
    },
    email: {
        type: String,
        required: [true, '邮箱是必需的'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, '请输入有效的邮箱地址']
    },
    password: {
        type: String,
        required: [true, '密码是必需的'],
        minlength: [6, '密码至少6个字符'],
        select: false // 查询时默认不返回密码
    },
    
    // 个人信息
    firstName: {
        type: String,
        trim: true,
        maxlength: [50, '名字不能超过50个字符']
    },
    lastName: {
        type: String,
        trim: true,
        maxlength: [50, '姓氏不能超过50个字符']
    },
    phone: {
        type: String,
        trim: true,
        match: [/^1[3-9]\d{9}$/, '请输入有效的手机号']
    },
    avatar: {
        type: String,
        default: ''
    },
    
    // 地址信息
    addresses: [{
        name: { type: String, required: true },
        phone: { type: String, required: true },
        province: { type: String, required: true },
        city: { type: String, required: true },
        district: { type: String, required: true },
        detail: { type: String, required: true },
        isDefault: { type: Boolean, default: false }
    }],
    
    // 账户状态
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    
    // 购物相关
    cart: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    wishlist: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    
    // 统计信息
    totalOrders: {
        type: Number,
        default: 0
    },
    totalSpent: {
        type: Number,
        default: 0
    },
    
    // 时间戳
    lastLogin: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// ===============================================
// 中间件
// ===============================================

// 保存前处理
userSchema.pre('save', async function(next) {
    // 更新时间戳
    this.updatedAt = Date.now();
    
    // 如果密码没有修改，跳过加密
    if (!this.isModified('password')) return next();
    
    try {
        // 加密密码
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// ===============================================
// 实例方法
// ===============================================

// 验证密码
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// 生成JWT token
userSchema.methods.generateAuthToken = function() {
    const payload = {
        id: this._id,
        username: this.username,
        email: this.email,
        role: this.role
    };
    
    return jwt.sign(
        payload,
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
};

// 获取公开信息（不包含敏感数据）
userSchema.methods.getPublicProfile = function() {
    const userObject = this.toObject();
    
    // 删除敏感信息
    delete userObject.password;
    delete userObject.__v;
    
    return userObject;
};

// 添加商品到购物车
userSchema.methods.addToCart = function(productId, quantity = 1) {
    const existingItem = this.cart.find(item => 
        item.product.toString() === productId.toString()
    );
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        this.cart.push({
            product: productId,
            quantity: quantity
        });
    }
    
    return this.save();
};

// 从购物车移除商品
userSchema.methods.removeFromCart = function(productId) {
    this.cart = this.cart.filter(item => 
        item.product.toString() !== productId.toString()
    );
    
    return this.save();
};

// 清空购物车
userSchema.methods.clearCart = function() {
    this.cart = [];
    return this.save();
};

// 添加到收藏夹
userSchema.methods.addToWishlist = function(productId) {
    if (!this.wishlist.includes(productId)) {
        this.wishlist.push(productId);
    }
    return this.save();
};

// 从收藏夹移除
userSchema.methods.removeFromWishlist = function(productId) {
    this.wishlist = this.wishlist.filter(id => 
        id.toString() !== productId.toString()
    );
    return this.save();
};

// ===============================================
// 静态方法
// ===============================================

// 根据用户名或邮箱查找用户
userSchema.statics.findByCredentials = async function(credential, password) {
    // 判断是邮箱还是用户名
    const isEmail = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(credential);
    
    const query = isEmail ? { email: credential } : { username: credential };
    
    const user = await this.findOne(query).select('+password');
    
    if (!user) {
        throw new Error('用户不存在');
    }
    
    if (!user.isActive) {
        throw new Error('账户已被禁用');
    }
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        throw new Error('密码错误');
    }
    
    // 更新最后登录时间
    user.lastLogin = new Date();
    await user.save();
    
    return user;
};

// ===============================================
// 索引
// ===============================================

userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ role: 1 });

const User = mongoose.model('User', userSchema);

module.exports = User;