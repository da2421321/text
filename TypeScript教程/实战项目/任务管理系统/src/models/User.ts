import bcrypt from "bcrypt";
import mongoose, { Schema } from "mongoose";
import { IUserDocument, UserRole } from "../types";

const UserSchema = new Schema<IUserDocument>(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            minlength: 3,
            maxlength: 30
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        },
        password: {
            type: String,
            required: true,
            minlength: 6
        },
        role: {
            type: String,
            enum: Object.values(UserRole),
            default: UserRole.User
        }
    },
    {
        timestamps: true,
        toJSON: {
            transform: (_, ret) => {
                delete ret.password;
                return ret;
            }
        }
    }
);

// 密码加密中间件
UserSchema.pre("save", async function(next) {
    if (!this.isModified("password")) {
        return next();
    }
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error as Error);
    }
});

// 密码比对方法
UserSchema.methods.comparePassword = async function(
    candidatePassword: string
): Promise<boolean> {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        return false;
    }
};

export const User = mongoose.model<IUserDocument>("User", UserSchema);

