const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

// 测试数据库连接
const testConnection = async () => {
    try {
        await prisma.$connect();
        console.log('✅ 数据库连接成功');
    } catch (error) {
        console.error('❌ 数据库连接失败:', error);
        throw error;
    }
};

// 优雅关闭
const disconnect = async () => {
    await prisma.$disconnect();
};

module.exports = {
    prisma,
    testConnection,
    disconnect,
};