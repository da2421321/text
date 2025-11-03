import mongoose, { Schema } from "mongoose";
import { ITagDocument } from "../types";

const TagSchema = new Schema<ITagDocument>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 50
        },
        color: {
            type: String,
            required: true,
            match: /^#[0-9A-Fa-f]{6}$/
        },
        userId: {
            type: String,
            required: true,
            index: true
        }
    },
    {
        timestamps: true
    }
);

// 组合唯一索引：同一用户不能创建同名标签
TagSchema.index({ name: 1, userId: 1 }, { unique: true });

export const Tag = mongoose.model<ITagDocument>("Tag", TagSchema);

