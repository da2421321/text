import mongoose from 'mongoose';

// 优化后的连接配置
const connectDB = async () => {
  const options = {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 30000,
    maxPoolSize: 10,
    retryWrites: true,
    retryReads: true
  };

  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/my_database', options);
    console.log('✅ MongoDB 连接成功');
  } catch (err) {
    console.error('❌ MongoDB 连接失败:', err.message);
    process.exit(1);
  }
};

// 定义 Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, min: 0 },
  email: { type: String, unique: true }
});

// 创建 Model
const User = mongoose.model('User', userSchema);

// 增删改查操作
const runCrudOperations = async () => {
  try {
    await connectDB();

    // 创建用户
    const newUser = await User.create({ 
      name: '张三', 
      age: 30, 
      email: 'zhangsan@example.com' 
    });
    console.log('用户创建成功:', newUser);

    // 查询所有用户
    const users = await User.find().lean();
    console.log('所有用户:', users);

    // 更新用户
    const updateResult = await User.updateOne(
      { name: '张三' }, 
      { $set: { age: 31 } }
    );
    console.log('更新结果:', updateResult);

    // 删除用户
    const deleteResult = await User.deleteOne({ name: '张三' });
    console.log('删除结果:', deleteResult);

  } catch (error) {
    console.error('操作失败:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB 连接已关闭');
  }
};

runCrudOperations();
