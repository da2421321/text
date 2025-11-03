import bcrypt from "bcrypt";
import {
    BeforeInsert,
    BeforeUpdate,
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import { UserRole } from "../types";
import { Order } from "./Order";
import { Product } from "./Product";

@Entity("users")
export class User {
    @PrimaryGeneratedColumn()
    id: number;
    
    @Column({ length: 50, unique: true })
    username: string;
    
    @Column({ length: 100, unique: true })
    email: string;
    
    @Column()
    password: string;
    
    @Column({
        type: "enum",
        enum: UserRole,
        default: UserRole.Customer
    })
    role: UserRole;
    
    @OneToMany(() => Product, product => product.seller)
    products: Product[];
    
    @OneToMany(() => Order, order => order.user)
    orders: Order[];
    
    @CreateDateColumn()
    createdAt: Date;
    
    @UpdateDateColumn()
    updatedAt: Date;
    
    @BeforeInsert()
    @BeforeUpdate()
    async hashPassword() {
        if (this.password) {
            const salt = await bcrypt.genSalt(10);
            this.password = await bcrypt.hash(this.password, salt);
        }
    }
    
    async comparePassword(candidatePassword: string): Promise<boolean> {
        return bcrypt.compare(candidatePassword, this.password);
    }
}

