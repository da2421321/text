const express = require('express');
const router = express.Router();

// 模拟商品数据
let products = [
    { id: 1, name: 'iPhone 14', price: 7999, category: '手机', stock: 50 },
    { id: 2, name: 'MacBook Pro', price: 12999, category: '电脑', stock: 30 },
    { id: 3, name: 'AirPods Pro', price: 1999, category: '配件', stock: 100 }
];

// 获取所有商品
router.get('/', (req, res) => {
    const { page = 1, limit = 10, category, minPrice, maxPrice } = req.query;
    
    let filteredProducts = products;
    
    // 按分类过滤
    if (category) {
        filteredProducts = filteredProducts.filter(p => p.category === category);
    }
    
    // 按价格过滤
    if (minPrice) {
        filteredProducts = filteredProducts.filter(p => p.price >= parseInt(minPrice));
    }
    if (maxPrice) {
        filteredProducts = filteredProducts.filter(p => p.price <= parseInt(maxPrice));
    }
    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
    
    res.json({
        products: paginatedProducts,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: filteredProducts.length,
            pages: Math.ceil(filteredProducts.length / limit)
        }
    });
});

// 获取单个商品
router.get('/:id', (req, res) => {
    const { id } = req.params;
    const product = products.find(p => p.id === parseInt(id));
    
    if (!product) {
        return res.status(404).json({ error: '商品不存在' });
    }
    
    res.json(product);
});

// 创建商品
router.post('/', (req, res) => {
    const { name, price, category, stock } = req.body;
    
    if (!name || !price || !category) {
        return res.status(400).json({ error: '商品名称、价格和分类是必填项' });
    }
    
    const newProduct = {
        id: Math.max(...products.map(p => p.id)) + 1,
        name,
        price: parseInt(price),
        category,
        stock: stock || 0,
        createdAt: new Date().toISOString()
    };
    
    products.push(newProduct);
    res.status(201).json(newProduct);
});

// 更新商品
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { name, price, category, stock } = req.body;
    
    const productIndex = products.findIndex(p => p.id === parseInt(id));
    
    if (productIndex === -1) {
        return res.status(404).json({ error: '商品不存在' });
    }
    
    products[productIndex] = {
        ...products[productIndex],
        name: name || products[productIndex].name,
        price: price !== undefined ? parseInt(price) : products[productIndex].price,
        category: category || products[productIndex].category,
        stock: stock !== undefined ? parseInt(stock) : products[productIndex].stock,
        updatedAt: new Date().toISOString()
    };
    
    res.json(products[productIndex]);
});

// 删除商品
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const productIndex = products.findIndex(p => p.id === parseInt(id));
    
    if (productIndex === -1) {
        return res.status(404).json({ error: '商品不存在' });
    }
    
    products.splice(productIndex, 1);
    res.status(204).send();
});

// 获取商品分类
router.get('/categories/list', (req, res) => {
    const categories = [...new Set(products.map(p => p.category))];
    res.json({ categories });
});

module.exports = router;

