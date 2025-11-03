import { DataSource } from "typeorm";
import { Category } from "../entity/Category";
import { Order } from "../entity/Order";
import { OrderItem } from "../entity/OrderItem";
import { Product } from "../entity/Product";
import { User } from "../entity/User";

export const AppDataSource = new DataSource({
    type: "mysql",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "3306"),
    username: process.env.DB_USERNAME || "root",
    password: process.env.DB_PASSWORD || "password",
    database: process.env.DB_DATABASE || "ecommerce",
    synchronize: process.env.NODE_ENV === "development",
    logging: process.env.NODE_ENV === "development",
    entities: [User, Product, Category, Order, OrderItem],
    migrations: [],
    subscribers: []
});

/**
 * 初始化数据库连接
 */
export async function initializeDatabase(): Promise<void> {
    try {
        await AppDataSource.initialize();
        console.log("数据库连接成功");
    } catch (error) {
        console.error("数据库连接失败:", error);
        throw error;
    }
}

