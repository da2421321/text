import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn
} from "typeorm";
import { Order } from "./Order";
import { Product } from "./Product";

@Entity("order_items")
export class OrderItem {
    @PrimaryGeneratedColumn()
    id: number;
    
    @Column()
    orderId: number;
    
    @ManyToOne(() => Order, order => order.items)
    @JoinColumn({ name: "orderId" })
    order: Order;
    
    @Column()
    productId: number;
    
    @ManyToOne(() => Product, product => product.orderItems)
    @JoinColumn({ name: "productId" })
    product: Product;
    
    @Column("int")
    quantity: number;
    
    @Column("decimal", { precision: 10, scale: 2 })
    price: number;
    
    @Column("decimal", { precision: 10, scale: 2 })
    subtotal: number;
}

