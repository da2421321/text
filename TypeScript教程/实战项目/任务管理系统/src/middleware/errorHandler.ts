import { NextFunction, Request, Response } from "express";

/**
 * 自定义错误类
 */
export class AppError extends Error {
    constructor(
        public statusCode: number,
        public message: string
    ) {
        super(message);
        this.name = "AppError";
    }
}

/**
 * 错误处理中间件
 */
export function errorHandler(
    error: Error | AppError,
    req: Request,
    res: Response,
    next: NextFunction
): void {
    console.error("Error:", error);
    
    if (error instanceof AppError) {
        res.status(error.statusCode).json({
            success: false,
            error: error.message
        });
        return;
    }
    
    // Mongoose 验证错误
    if (error.name === "ValidationError") {
        res.status(400).json({
            success: false,
            error: "数据验证失败",
            details: error.message
        });
        return;
    }
    
    // Mongoose 重复键错误
    if (error.name === "MongoError" && (error as any).code === 11000) {
        res.status(400).json({
            success: false,
            error: "数据已存在"
        });
        return;
    }
    
    // 默认错误
    res.status(500).json({
        success: false,
        error: "服务器内部错误"
    });
}

/**
 * 异步错误包装器
 */
export function asyncHandler(
    fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
    return (req: Request, res: Response, next: NextFunction): void => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

