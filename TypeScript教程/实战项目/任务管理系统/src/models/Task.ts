import mongoose, { Schema } from "mongoose";
import { ITaskDocument, TaskPriority, TaskStatus } from "../types";

const TaskSchema = new Schema<ITaskDocument>(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200
        },
        description: {
            type: String,
            required: true,
            trim: true
        },
        status: {
            type: String,
            enum: Object.values(TaskStatus),
            default: TaskStatus.Todo
        },
        priority: {
            type: String,
            enum: Object.values(TaskPriority),
            default: TaskPriority.Medium
        },
        userId: {
            type: String,
            required: true,
            index: true
        },
        tags: {
            type: [String],
            default: []
        },
        dueDate: {
            type: Date
        }
    },
    {
        timestamps: true
    }
);

// 索引
TaskSchema.index({ userId: 1, status: 1 });
TaskSchema.index({ userId: 1, priority: 1 });
TaskSchema.index({ tags: 1 });

export const Task = mongoose.model<ITaskDocument>("Task", TaskSchema);

