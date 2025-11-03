import { AppDataSource } from "../config/database";
import { Product } from "../entity/Product";
import { CreateProductDTO, ProductQueryParams, UpdateProductDTO } from "../types";

export class ProductService {
    private productRepository = AppDataSource.getRepository(Product);
    
    /**
     * 创建商品
     */
    async createProduct(sellerId: number, data: CreateProductDTO): Promise<Product> {
        const product = this.productRepository.create({
            ...data,
            sellerId
        });
        
        return this.productRepository.save(product);
    }
    
    /**
     * 获取商品列表
     */
    async getProducts(params: ProductQueryParams) {
        const {
            page = 1,
            limit = 10,
            categoryId,
            status,
            minPrice,
            maxPrice,
            keyword,
            sortBy = "createdAt",
            sortOrder = "DESC"
        } = params;
        
        const query = this.productRepository
            .createQueryBuilder("product")
            .leftJoinAndSelect("product.category", "category")
            .leftJoinAndSelect("product.seller", "seller");
        
        // 分类筛选
        if (categoryId) {
            query.andWhere("product.categoryId = :categoryId", { categoryId });
        }
        
        // 状态筛选
        if (status) {
            query.andWhere("product.status = :status", { status });
        }
        
        // 价格范围
        if (minPrice !== undefined) {
            query.andWhere("product.price >= :minPrice", { minPrice });
        }
        
        if (maxPrice !== undefined) {
            query.andWhere("product.price <= :maxPrice", { maxPrice });
        }
        
        // 关键词搜索
        if (keyword) {
            query.andWhere(
                "(product.name LIKE :keyword OR product.description LIKE :keyword)",
                { keyword: `%${keyword}%` }
            );
        }
        
        // 排序
        query.orderBy(`product.${sortBy}`, sortOrder);
        
        // 分页
        const skip = (page - 1) * limit;
        query.skip(skip).take(limit);
        
        const [products, total] = await query.getManyAndCount();
        
        return {
            success: true,
            data: products,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
    
    /**
     * 获取单个商品
     */
    async getProductById(id: number): Promise<Product | null> {
        return this.productRepository.findOne({
            where: { id },
            relations: ["category", "seller"]
        });
    }
    
    /**
     * 更新商品
     */
    async updateProduct(
        id: number,
        sellerId: number,
        data: UpdateProductDTO
    ): Promise<Product | null> {
        const product = await this.productRepository.findOne({
            where: { id, sellerId }
        });
        
        if (!product) {
            return null;
        }
        
        Object.assign(product, data);
        return this.productRepository.save(product);
    }
    
    /**
     * 删除商品
     */
    async deleteProduct(id: number, sellerId: number): Promise<boolean> {
        const result = await this.productRepository.delete({ id, sellerId });
        return (result.affected || 0) > 0;
    }
    
    /**
     * 更新库存
     */
    async updateStock(id: number, quantity: number): Promise<void> {
        await this.productRepository.decrement({ id }, "stock", quantity);
    }
}

