import cors from "cors";
import express, { Express } from "express";
import helmet from "helmet";
import morgan from "morgan";
import { connectDatabase } from "./config/database";
import { errorHandler } from "./middleware/errorHandler";

// 导入路由（这里简化，实际项目中需要创建路由文件）
// import authRoutes from "./routes/auth";
// import taskRoutes from "./routes/tasks";
// import tagRoutes from "./routes/tags";

class Application {
    public app: Express;
    private port: number;
    
    constructor() {
        this.app = express();
        this.port = parseInt(process.env.PORT || "3000");
        
        this.initializeMiddlewares();
        this.initializeRoutes();
        this.initializeErrorHandling();
    }
    
    private initializeMiddlewares(): void {
        // 安全中间件
        this.app.use(helmet());
        
        // CORS
        this.app.use(cors());
        
        // 日志
        this.app.use(morgan("dev"));
        
        // 解析 JSON
        this.app.use(express.json());
        
        // 解析 URL-encoded
        this.app.use(express.urlencoded({ extended: true }));
    }
    
    private initializeRoutes(): void {
        // 健康检查
        this.app.get("/health", (req, res) => {
            res.json({
                success: true,
                message: "服务正常运行"
            });
        });
        
        // API 路由
        // this.app.use("/api/auth", authRoutes);
        // this.app.use("/api/tasks", taskRoutes);
        // this.app.use("/api/tags", tagRoutes);
    }
    
    private initializeErrorHandling(): void {
        this.app.use(errorHandler);
    }
    
    public async start(): Promise<void> {
        try {
            // 连接数据库
            await connectDatabase();
            
            // 启动服务器
            this.app.listen(this.port, () => {
                console.log(`服务器运行在 http://localhost:${this.port}`);
            });
        } catch (error) {
            console.error("应用启动失败:", error);
            process.exit(1);
        }
    }
}

// 创建并启动应用
const application = new Application();
application.start();

export default application.app;

