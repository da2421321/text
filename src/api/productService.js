import request from '../utils/requests';

export const ProductService = {
  // 获取所有商品
  async getAllProducts() {
    try {
      return await request.get('/products');
    } catch (error) {
      throw error;
    }
  },

  // 获取单个商品详情
  async getProductById(id) {
    try {
      return await request.get(`/products/${id}`);
    } catch (error) {
      throw error;
    }
  },

  // 获取商品分类
  async getCategories() {
    try {
      return await request.get('/products/categories');
    } catch (error) {
      throw error;
    }
  },

  // 按分类获取商品
  async getProductsByCategory(category) {
    try {
      const response = await axios.get(`${API_BASE_URL}/products/category/${category}`);
      return response.data;
    } catch (error) {
      console.error('按分类获取商品失败:', error);
      throw error;
    }
  },

  // 修改获取用户购物车方法
  async getCart(userId) {
    try {
      return await request.get(`/carts/user/${userId}`);
    } catch (error) {
      console.error('获取购物车失败:', error);
      throw error;
    }
  },

  // 修改添加商品到购物车方法
  async addToCart(productId, quantity = 1) {
    try {
      return await request.post('/carts', {
        userId: 1, // 实际项目中应该使用当前用户ID
        products: [
          {
            productId,
            quantity
          }
        ]
      });
    } catch (error) {
      console.error('添加到购物车失败:', error);
      throw error;
    }
  },

  // 新增编辑商品API
  async updateProduct(product) {
    try {
      return await request.put(`/products/${product.id}`, product);
    } catch (error) {
      console.error('更新商品失败:', error);
      throw error;
    }
  },

  // 新增删除商品API
  async deleteProduct(id) {
    try {
      return await request.delete(`/products/${id}`);
    } catch (error) {
      console.error('删除商品失败:', error);
      throw error;
    }
  }
};
