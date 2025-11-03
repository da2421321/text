import {
    BeforeInsert,
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import { OrderStatus, PaymentStatus, ShippingAddress } from "../types";
import { OrderItem } from "./OrderItem";
import { User } from "./User";

@Entity("orders")
export class Order {
    @PrimaryGeneratedColumn()
    id: number;
    
    @Column({ length: 50, unique: true })
    orderNo: string;
    
    @Column()
    userId: number;
    
    @ManyToOne(() => User, user => user.orders)
    @JoinColumn({ name: "userId" })
    user: User;
    
    @Column("decimal", { precision: 10, scale: 2 })
    totalAmount: number;
    
    @Column({
        type: "enum",
        enum: OrderStatus,
        default: OrderStatus.Pending
    })
    status: OrderStatus;
    
    @Column({
        type: "enum",
        enum: PaymentStatus,
        default: PaymentStatus.Unpaid
    })
    paymentStatus: PaymentStatus;
    
    @Column("json")
    shippingAddress: ShippingAddress;
    
    @OneToMany(() => OrderItem, orderItem => orderItem.order, {
        cascade: true
    })
    items: OrderItem[];
    
    @CreateDateColumn()
    createdAt: Date;
    
    @UpdateDateColumn()
    updatedAt: Date;
    
    @BeforeInsert()
    generateOrderNo() {
        this.orderNo = `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;
    }
}

