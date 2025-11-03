import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import { ProductStatus } from "../types";
import { Category } from "./Category";
import { OrderItem } from "./OrderItem";
import { User } from "./User";

@Entity("products")
export class Product {
    @PrimaryGeneratedColumn()
    id: number;
    
    @Column({ length: 200 })
    name: string;
    
    @Column("text")
    description: string;
    
    @Column("decimal", { precision: 10, scale: 2 })
    price: number;
    
    @Column("int", { default: 0 })
    stock: number;
    
    @Column({
        type: "enum",
        enum: ProductStatus,
        default: ProductStatus.Active
    })
    status: ProductStatus;
    
    @Column("json", { nullable: true })
    images: string[];
    
    @Column()
    categoryId: number;
    
    @ManyToOne(() => Category, category => category.products)
    @JoinColumn({ name: "categoryId" })
    category: Category;
    
    @Column()
    sellerId: number;
    
    @ManyToOne(() => User, user => user.products)
    @JoinColumn({ name: "sellerId" })
    seller: User;
    
    @OneToMany(() => OrderItem, orderItem => orderItem.product)
    orderItems: OrderItem[];
    
    @CreateDateColumn()
    createdAt: Date;
    
    @UpdateDateColumn()
    updatedAt: Date;
}

