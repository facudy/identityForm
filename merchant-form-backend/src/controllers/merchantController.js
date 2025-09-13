const pool = require('../config/database');
const { validationResult } = require('express-validator');

const submitForm = async (req, res) => {
    try {
        // 验证输入
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: '数据验证失败',
                errors: errors.array()
            });
        }

        const {
            name,
            regionValues,
            detailAddress,
            contactName,
            phoneNumber,
            bankCardHolder,
            bankCity,
            bankBranch,
        } = req.body;

        // 开始事务
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 插入商户数据
            const merchantResult = await client.query(
                `INSERT INTO merchants 
         (name, region_values, detail_address, contact_name, phone_number, 
          bank_card_holder, bank_city, bank_branch) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
         RETURNING id`,
                [
                    name,
                    typeof regionValues === 'string' ? JSON.parse(regionValues) : regionValues,
                    detailAddress,
                    contactName,
                    phoneNumber,
                    bankCardHolder || null,
                    bankCity || null,
                    bankBranch || null,
                ]
            );

            const merchantId = merchantResult.rows[0].id;

            // 处理文件上传
            if (req.files) {
                const filePromises = [];

                Object.keys(req.files).forEach(fieldName => {
                    const files = Array.isArray(req.files[fieldName])
                        ? req.files[fieldName]
                        : [req.files[fieldName]];

                    files.forEach(file => {
                        filePromises.push(
                            client.query(
                                `INSERT INTO file_uploads 
                 (merchant_id, field_name, file_name, original_name, file_path, file_size, mime_type) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                                [merchantId, fieldName, file.filename, file.originalname, file.path, file.size, file.mimetype]
                            )
                        );
                    });
                });

                await Promise.all(filePromises);
            }

            await client.query('COMMIT');

            res.status(201).json({
                success: true,
                message: '商户信息提交成功',
                data: { id: merchantId }
            });

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('提交商户信息失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

const getMerchants = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, search } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        let whereClause = '';
        let params = [];
        let paramIndex = 1;

        if (status) {
            whereClause += ` WHERE status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        if (search) {
            const searchClause = ` ${whereClause ? 'AND' : 'WHERE'} (name ILIKE $${paramIndex} OR contact_name ILIKE $${paramIndex} OR phone_number ILIKE $${paramIndex})`;
            whereClause += searchClause;
            params.push(`%${search}%`);
            paramIndex++;
        }

        // 获取总数
        const countResult = await pool.query(
            `SELECT COUNT(*) FROM merchants ${whereClause}`,
            params
        );

        // 获取数据
        const dataResult = await pool.query(
            `SELECT m.*, 
       json_agg(
         json_build_object(
           'id', f.id,
           'fieldName', f.field_name,
           'fileName', f.file_name,
           'originalName', f.original_name,
           'filePath', f.file_path
         )
       ) FILTER (WHERE f.id IS NOT NULL) as files
       FROM merchants m
       LEFT JOIN file_uploads f ON m.id = f.merchant_id
       ${whereClause}
       GROUP BY m.id
       ORDER BY m.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
            [...params, Number(limit), offset]
        );

        const total = parseInt(countResult.rows[0].count);

        res.json({
            success: true,
            message: '获取商户列表成功',
            data: {
                merchants: dataResult.rows,
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    totalPages: Math.ceil(total / Number(limit)),
                }
            }
        });

    } catch (error) {
        console.error('获取商户列表失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

const getMerchantById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT m.*, 
       json_agg(
         json_build_object(
           'id', f.id,
           'fieldName', f.field_name,
           'fileName', f.file_name,
           'originalName', f.original_name,
           'filePath', f.file_path,
           'fileSize', f.file_size,
           'mimeType', f.mime_type
         )
       ) FILTER (WHERE f.id IS NOT NULL) as files
       FROM merchants m
       LEFT JOIN file_uploads f ON m.id = f.merchant_id
       WHERE m.id = $1
       GROUP BY m.id`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: '商户不存在'
            });
        }

        res.json({
            success: true,
            message: '获取商户详情成功',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('获取商户详情失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    submitForm,
    getMerchants,
    getMerchantById,
};