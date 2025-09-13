const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'merchant_form_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
});

// 测试连接
pool.on('connect', () => {
    console.log('✅ 数据库连接成功');
});

pool.on('error', (err) => {
    console.error('❌ 数据库连接错误:', err);
});

module.exports = pool;