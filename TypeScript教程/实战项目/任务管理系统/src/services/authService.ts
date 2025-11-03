import { User } from "../models/User";
import { IUserDocument, LoginDTO, RegisterDTO } from "../types";
import { generateToken } from "../utils/jwt";

export class AuthService {
    /**
     * 用户注册
     */
    async register(data: RegisterDTO): Promise<{
        user: IUserDocument;
        token: string;
    }> {
        // 检查用户是否已存在
        const existingUser = await User.findOne({
            $or: [{ email: data.email }, { username: data.username }]
        });
        
        if (existingUser) {
            throw new Error("用户名或邮箱已存在");
        }
        
        // 创建用户
        const user = await User.create(data);
        
        // 生成 Token
        const token = generateToken({
            userId: user.id,
            email: user.email,
            role: user.role
        });
        
        return { user, token };
    }
    
    /**
     * 用户登录
     */
    async login(data: LoginDTO): Promise<{
        user: IUserDocument;
        token: string;
    }> {
        // 查找用户
        const user = await User.findOne({ email: data.email });
        
        if (!user) {
            throw new Error("邮箱或密码错误");
        }
        
        // 验证密码
        const isPasswordValid = await user.comparePassword(data.password);
        
        if (!isPasswordValid) {
            throw new Error("邮箱或密码错误");
        }
        
        // 生成 Token
        const token = generateToken({
            userId: user.id,
            email: user.email,
            role: user.role
        });
        
        return { user, token };
    }
    
    /**
     * 获取用户信息
     */
    async getUserById(userId: string): Promise<IUserDocument | null> {
        return User.findById(userId);
    }
}

