/**
 * 电商系统类型定义
 */

import { Context } from "koa";

// ========== 枚举定义 ==========

export enum UserRole {
    Admin = "admin",
    Merchant = "merchant",
    Customer = "customer"
}

export enum ProductStatus {
    Active = "active",
    Inactive = "inactive",
    OutOfStock = "out_of_stock"
}

export enum OrderStatus {
    Pending = "pending",
    Paid = "paid",
    Shipped = "shipped",
    Completed = "completed",
    Cancelled = "cancelled"
}

export enum PaymentStatus {
    Unpaid = "unpaid",
    Paid = "paid",
    Refunded = "refunded"
}

// ========== DTO 类型 ==========

export interface RegisterDTO {
    username: string;
    email: string;
    password: string;
    role?: UserRole;
}

export interface LoginDTO {
    email: string;
    password: string;
}

export interface CreateProductDTO {
    name: string;
    description: string;
    price: number;
    stock: number;
    categoryId: number;
    images?: string[];
}

export interface UpdateProductDTO {
    name?: string;
    description?: string;
    price?: number;
    stock?: number;
    categoryId?: number;
    images?: string[];
    status?: ProductStatus;
}

export interface CreateOrderDTO {
    items: {
        productId: number;
        quantity: number;
    }[];
    shippingAddress: ShippingAddress;
}

export interface ShippingAddress {
    name: string;
    phone: string;
    province: string;
    city: string;
    district: string;
    address: string;
    zipCode?: string;
}

export interface CreateCategoryDTO {
    name: string;
    description?: string;
    parentId?: number;
}

// ========== 查询参数 ==========

export interface ProductQueryParams {
    page?: number;
    limit?: number;
    categoryId?: number;
    status?: ProductStatus;
    minPrice?: number;
    maxPrice?: number;
    keyword?: string;
    sortBy?: string;
    sortOrder?: "ASC" | "DESC";
}

export interface OrderQueryParams {
    page?: number;
    limit?: number;
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    startDate?: Date;
    endDate?: Date;
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
        totalPages: number;
    };
}

// ========== JWT Payload ==========

export interface JWTPayload {
    userId: number;
    email: string;
    role: UserRole;
}

// ========== Koa Context 扩展 ==========

export interface AuthState {
    user?: JWTPayload;
}

export type AuthContext = Context & {
    state: AuthState;
};

// ========== 统计类型 ==========

export interface DashboardStats {
    totalOrders: number;
    totalRevenue: number;
    totalProducts: number;
    totalUsers: number;
    recentOrders: any[];
    topProducts: any[];
}

export interface SalesStatistics {
    date: string;
    orders: number;
    revenue: number;
}

