// db_config.js
import mysql from 'mysql2/promise'; // 使用 import 导入

const pool = mysql.createPool({
  host: 'localhost',
  port: 3306,
  user: 'root', // 替换为你的 MySQL 用户名
  password: '123', // 替换为你的 MySQL 密码
  database: 'bsbook', // 替换为你的数据库名
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

pool.getConnection()
  .then(connection => {
    console.log('MySQL 数据库连接池创建成功！');
    connection.release();
  })
  .catch(err => {
    console.error('MySQL 数据库连接池创建失败:', err.message);
    process.exit(1);
  });

// 使用 export default 导出连接池
export default pool;