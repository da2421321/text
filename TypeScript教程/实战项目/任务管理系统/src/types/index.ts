/**
 * 类型定义文件
 */

import { Request } from "express";
import { Document } from "mongoose";

// ========== 枚举定义 ==========

export enum UserRole {
    Admin = "admin",
    User = "user"
}

export enum TaskStatus {
    Todo = "todo",
    InProgress = "in_progress",
    Done = "done"
}

export enum TaskPriority {
    Low = "low",
    Medium = "medium",
    High = "high",
    Urgent = "urgent"
}

// ========== 基础接口 ==========

export interface IUser {
    username: string;
    email: string;
    password: string;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
}

export interface ITask {
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    userId: string;
    tags: string[];
    dueDate?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface ITag {
    name: string;
    color: string;
    userId: string;
    createdAt: Date;
}

// ========== Mongoose Document 类型 ==========

export interface IUserDocument extends IUser, Document {
    comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface ITaskDocument extends ITask, Document {}

export interface ITagDocument extends ITag, Document {}

// ========== DTO (Data Transfer Object) ==========

export interface RegisterDTO {
    username: string;
    email: string;
    password: string;
}

export interface LoginDTO {
    email: string;
    password: string;
}

export interface CreateTaskDTO {
    title: string;
    description: string;
    priority?: TaskPriority;
    tags?: string[];
    dueDate?: Date;
}

export interface UpdateTaskDTO {
    title?: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    tags?: string[];
    dueDate?: Date;
}

export interface CreateTagDTO {
    name: string;
    color: string;
}

// ========== API 响应类型 ==========

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

// ========== JWT Payload ==========

export interface JWTPayload {
    userId: string;
    email: string;
    role: UserRole;
}

// ========== Express Request 扩展 ==========

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        email: string;
        role: UserRole;
    };
}

// ========== 查询参数 ==========

export interface TaskQueryParams {
    status?: TaskStatus;
    priority?: TaskPriority;
    tags?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}

// ========== 统计类型 ==========

export interface TaskStatistics {
    total: number;
    byStatus: {
        todo: number;
        inProgress: number;
        done: number;
    };
    byPriority: {
        low: number;
        medium: number;
        high: number;
        urgent: number;
    };
}

