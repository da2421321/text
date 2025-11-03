import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/task-manager";

/**
 * 连接 MongoDB 数据库
 */
export async function connectDatabase(): Promise<void> {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("MongoDB 连接成功");
        
        mongoose.connection.on("error", (error) => {
            console.error("MongoDB 连接错误:", error);
        });
        
        mongoose.connection.on("disconnected", () => {
            console.log("MongoDB 断开连接");
        });
        
    } catch (error) {
        console.error("MongoDB 连接失败:", error);
        throw error;
    }
}

/**
 * 断开数据库连接
 */
export async function disconnectDatabase(): Promise<void> {
    try {
        await mongoose.disconnect();
        console.log("MongoDB 已断开");
    } catch (error) {
        console.error("断开 MongoDB 失败:", error);
        throw error;
    }
}

