const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const merchantRoutes = require('./routes/merchants');

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 路由
app.use('/api/merchants', merchantRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 错误处理
app.use((error, req, res, next) => {
    console.error('错误:', error);
    res.status(500).json({
        success: false,
        message: '服务器内部错误',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
});

// 404处理
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: '路由不存在'
    });
});

app.listen(PORT, () => {
    console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
});