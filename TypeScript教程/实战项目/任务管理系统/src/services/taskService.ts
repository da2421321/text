import { Task } from "../models/Task";
import {
    CreateTaskDTO,
    ITaskDocument,
    PaginatedResponse,
    TaskQueryParams,
    TaskStatistics,
    UpdateTaskDTO
} from "../types";

export class TaskService {
    /**
     * 创建任务
     */
    async createTask(userId: string, data: CreateTaskDTO): Promise<ITaskDocument> {
        const task = await Task.create({
            ...data,
            userId
        });
        
        return task;
    }
    
    /**
     * 获取任务列表（分页和筛选）
     */
    async getTasks(
        userId: string,
        params: TaskQueryParams
    ): Promise<PaginatedResponse<ITaskDocument>> {
        const {
            status,
            priority,
            tags,
            page = 1,
            limit = 10,
            sortBy = "createdAt",
            sortOrder = "desc"
        } = params;
        
        // 构建查询条件
        const query: any = { userId };
        
        if (status) {
            query.status = status;
        }
        
        if (priority) {
            query.priority = priority;
        }
        
        if (tags) {
            query.tags = { $in: tags.split(",") };
        }
        
        // 计算分页
        const skip = (page - 1) * limit;
        const sort: any = { [sortBy]: sortOrder === "asc" ? 1 : -1 };
        
        // 执行查询
        const [tasks, total] = await Promise.all([
            Task.find(query).sort(sort).skip(skip).limit(limit),
            Task.countDocuments(query)
        ]);
        
        return {
            success: true,
            data: tasks,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }
    
    /**
     * 获取单个任务
     */
    async getTaskById(taskId: string, userId: string): Promise<ITaskDocument | null> {
        return Task.findOne({ _id: taskId, userId });
    }
    
    /**
     * 更新任务
     */
    async updateTask(
        taskId: string,
        userId: string,
        data: UpdateTaskDTO
    ): Promise<ITaskDocument | null> {
        const task = await Task.findOneAndUpdate(
            { _id: taskId, userId },
            { $set: data },
            { new: true, runValidators: true }
        );
        
        return task;
    }
    
    /**
     * 删除任务
     */
    async deleteTask(taskId: string, userId: string): Promise<boolean> {
        const result = await Task.deleteOne({ _id: taskId, userId });
        return result.deletedCount > 0;
    }
    
    /**
     * 获取任务统计
     */
    async getStatistics(userId: string): Promise<TaskStatistics> {
        const tasks = await Task.find({ userId });
        
        const statistics: TaskStatistics = {
            total: tasks.length,
            byStatus: {
                todo: 0,
                inProgress: 0,
                done: 0
            },
            byPriority: {
                low: 0,
                medium: 0,
                high: 0,
                urgent: 0
            }
        };
        
        tasks.forEach(task => {
            // 按状态统计
            if (task.status === "todo") statistics.byStatus.todo++;
            else if (task.status === "in_progress") statistics.byStatus.inProgress++;
            else if (task.status === "done") statistics.byStatus.done++;
            
            // 按优先级统计
            if (task.priority === "low") statistics.byPriority.low++;
            else if (task.priority === "medium") statistics.byPriority.medium++;
            else if (task.priority === "high") statistics.byPriority.high++;
            else if (task.priority === "urgent") statistics.byPriority.urgent++;
        });
        
        return statistics;
    }
    
    /**
     * 批量删除已完成任务
     */
    async deleteCompletedTasks(userId: string): Promise<number> {
        const result = await Task.deleteMany({
            userId,
            status: "done"
        });
        
        return result.deletedCount || 0;
    }
}

