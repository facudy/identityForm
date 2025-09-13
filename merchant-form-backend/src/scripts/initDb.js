const pool = require('../config/database');

const createTables = async () => {
    try {
        // 商户表
        await pool.query(`
      CREATE TABLE IF NOT EXISTS merchants (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        region_values JSONB NOT NULL,
        detail_address TEXT NOT NULL,
        contact_name VARCHAR(100) NOT NULL,
        phone_number VARCHAR(20) NOT NULL,
        bank_card_holder VARCHAR(100),
        bank_city VARCHAR(100),
        bank_branch VARCHAR(255),
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // 文件上传表
        await pool.query(`
      CREATE TABLE IF NOT EXISTS file_uploads (
        id SERIAL PRIMARY KEY,
        merchant_id INTEGER REFERENCES merchants(id) ON DELETE CASCADE,
        field_name VARCHAR(50) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_size INTEGER NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // 创建索引
        await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_merchants_phone ON merchants(phone_number);
      CREATE INDEX IF NOT EXISTS idx_merchants_status ON merchants(status);
      CREATE INDEX IF NOT EXISTS idx_merchants_created_at ON merchants(created_at);
      CREATE INDEX IF NOT EXISTS idx_file_uploads_merchant_id ON file_uploads(merchant_id);
    `);

        console.log('✅ 数据库表创建成功');
        process.exit(0);
    } catch (error) {
        console.error('❌ 数据库初始化失败:', error);
        process.exit(1);
    }
};

createTables();