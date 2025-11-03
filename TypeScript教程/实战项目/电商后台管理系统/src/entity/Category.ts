import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn
} from "typeorm";
import { Product } from "./Product";

@Entity("categories")
export class Category {
    @PrimaryGeneratedColumn()
    id: number;
    
    @Column({ length: 100 })
    name: string;
    
    @Column("text", { nullable: true })
    description: string;
    
    @Column({ nullable: true })
    parentId: number;
    
    @ManyToOne(() => Category, category => category.children, {
        nullable: true
    })
    @JoinColumn({ name: "parentId" })
    parent: Category;
    
    @OneToMany(() => Category, category => category.parent)
    children: Category[];
    
    @OneToMany(() => Product, product => product.category)
    products: Product[];
    
    @CreateDateColumn()
    createdAt: Date;
}

