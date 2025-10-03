const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { testConnection, disconnect } = require('./services/databaseService');
const merchantRoutes = require('./routes/merchants');
const adminRoutes = require('./routes/admin'); // 新增管理员路由

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors({
    origin: [
        process.env.CORS_ORIGIN || 'http://localhost:3000',
        'http://localhost:3002' // 新增管理员后台的域名
    ],
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 路由
app.use('/api/merchants', merchantRoutes);
app.use('/api/admin', adminRoutes); // 新增管理员路由

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 错误处理中间件
app.use((error, req, res, next) => {
    console.error('错误:', error);
    res.status(500).json({
        success: false,
        message: '服务器内部错误',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
});

// 404处理 - 修复后的版本
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `路由不存在: ${req.method} ${req.path}`
    });
});

// 启动服务器
const startServer = async () => {
    try {
        await testConnection();

        app.listen(PORT, () => {
            console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
            console.log(`📝 用户表单: http://localhost:3000`);
            console.log(`🔧 管理员后台: http://localhost:3002`);
        });
    } catch (error) {
        console.error('启动服务器失败:', error);
        process.exit(1);
    }
};

// 优雅关闭
process.on('SIGINT', async () => {
    console.log('正在关闭服务器...');
    await disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('正在关闭服务器...');
    await disconnect();
    process.exit(0);
});

startServer();