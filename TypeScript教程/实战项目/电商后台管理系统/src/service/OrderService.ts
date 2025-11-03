import { AppDataSource } from "../config/database";
import { Order } from "../entity/Order";
import { OrderItem } from "../entity/OrderItem";
import { Product } from "../entity/Product";
import { CreateOrderDTO, OrderQueryParams, OrderStatus } from "../types";

export class OrderService {
    private orderRepository = AppDataSource.getRepository(Order);
    private orderItemRepository = AppDataSource.getRepository(OrderItem);
    private productRepository = AppDataSource.getRepository(Product);
    
    /**
     * 创建订单
     */
    async createOrder(userId: number, data: CreateOrderDTO): Promise<Order> {
        // 使用事务确保数据一致性
        return AppDataSource.transaction(async (manager) => {
            let totalAmount = 0;
            const orderItems: OrderItem[] = [];
            
            // 验证商品并计算总价
            for (const item of data.items) {
                const product = await manager.findOne(Product, {
                    where: { id: item.productId }
                });
                
                if (!product) {
                    throw new Error(`商品 ${item.productId} 不存在`);
                }
                
                if (product.stock < item.quantity) {
                    throw new Error(`商品 ${product.name} 库存不足`);
                }
                
                const subtotal = product.price * item.quantity;
                totalAmount += subtotal;
                
                // 创建订单项
                const orderItem = manager.create(OrderItem, {
                    productId: item.productId,
                    quantity: item.quantity,
                    price: product.price,
                    subtotal
                });
                
                orderItems.push(orderItem);
                
                // 减少库存
                await manager.decrement(Product, { id: product.id }, "stock", item.quantity);
            }
            
            // 创建订单
            const order = manager.create(Order, {
                userId,
                totalAmount,
                shippingAddress: data.shippingAddress,
                items: orderItems
            });
            
            return manager.save(order);
        });
    }
    
    /**
     * 获取订单列表
     */
    async getOrders(userId: number, userRole: string, params: OrderQueryParams) {
        const {
            page = 1,
            limit = 10,
            status,
            paymentStatus,
            startDate,
            endDate
        } = params;
        
        const query = this.orderRepository
            .createQueryBuilder("order")
            .leftJoinAndSelect("order.items", "items")
            .leftJoinAndSelect("items.product", "product")
            .leftJoinAndSelect("order.user", "user");
        
        // 非管理员只能查看自己的订单
        if (userRole !== "admin") {
            query.where("order.userId = :userId", { userId });
        }
        
        // 状态筛选
        if (status) {
            query.andWhere("order.status = :status", { status });
        }
        
        if (paymentStatus) {
            query.andWhere("order.paymentStatus = :paymentStatus", { paymentStatus });
        }
        
        // 时间范围
        if (startDate) {
            query.andWhere("order.createdAt >= :startDate", { startDate });
        }
        
        if (endDate) {
            query.andWhere("order.createdAt <= :endDate", { endDate });
        }
        
        // 分页
        const skip = (page - 1) * limit;
        query.orderBy("order.createdAt", "DESC").skip(skip).take(limit);
        
        const [orders, total] = await query.getManyAndCount();
        
        return {
            success: true,
            data: orders,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
    
    /**
     * 获取订单详情
     */
    async getOrderById(id: number): Promise<Order | null> {
        return this.orderRepository.findOne({
            where: { id },
            relations: ["items", "items.product", "user"]
        });
    }
    
    /**
     * 更新订单状态
     */
    async updateOrderStatus(id: number, status: OrderStatus): Promise<Order | null> {
        const order = await this.orderRepository.findOne({ where: { id } });
        
        if (!order) {
            return null;
        }
        
        order.status = status;
        return this.orderRepository.save(order);
    }
    
    /**
     * 取消订单
     */
    async cancelOrder(id: number, userId: number): Promise<Order | null> {
        return AppDataSource.transaction(async (manager) => {
            const order = await manager.findOne(Order, {
                where: { id, userId },
                relations: ["items"]
            });
            
            if (!order) {
                return null;
            }
            
            if (order.status !== OrderStatus.Pending) {
                throw new Error("只能取消待处理的订单");
            }
            
            // 恢复库存
            for (const item of order.items) {
                await manager.increment(
                    Product,
                    { id: item.productId },
                    "stock",
                    item.quantity
                );
            }
            
            order.status = OrderStatus.Cancelled;
            return manager.save(order);
        });
    }
}

