import { NextFunction, Response } from "express";
import { AuthRequest, UserRole } from "../types";
import { verifyToken } from "../utils/jwt";

/**
 * 认证中间件
 */
export function authenticate(
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void {
    try {
        // 获取 Token
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({
                success: false,
                error: "未提供认证令牌"
            });
            return;
        }
        
        const token = authHeader.substring(7);
        
        // 验证 Token
        const payload = verifyToken(token);
        
        // 将用户信息附加到请求对象
        req.user = {
            userId: payload.userId,
            email: payload.email,
            role: payload.role
        };
        
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            error: "认证失败"
        });
    }
}

/**
 * 授权中间件（检查角色）
 */
export function authorize(...roles: UserRole[]) {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: "未认证"
            });
            return;
        }
        
        if (!roles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                error: "权限不足"
            });
            return;
        }
        
        next();
    };
}

