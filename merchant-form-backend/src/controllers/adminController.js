const { prisma } = require('../services/databaseService'); // 正确的引用路径
const ossService = require('../services/ossService');
const jwt = require('jsonwebtoken');
const axios = require('axios');

// JWT密钥 - 在生产环境中应该使用环境变量
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-hw0401-admin';

// 管理员登录
const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (username === 'hw0401' && password === 'hw0401') {
            // 生成真正的JWT token
            const token = jwt.sign(
                {
                    username,
                    role: 'admin',
                    iat: Math.floor(Date.now() / 1000)
                },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            console.log('管理员登录成功，生成token:', token.substring(0, 50) + '...');

            res.json({
                success: true,
                message: '登录成功',
                data: {
                    username,
                    token: token
                }
            });
        } else {
            res.status(401).json({
                success: false,
                message: '用户名或密码错误'
            });
        }
    } catch (error) {
        console.error('管理员登录失败:', error);
        res.status(500).json({
            success: false,
            message: '登录失败，请重试'
        });
    }
};

const getMerchants = async (req, res) => {
    try {
        const {
            page = 1,
            pageSize = 20,
            search = ''
        } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(pageSize);

        // 构建搜索条件
        const where = search ? {
            OR: [
                { contact_name: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } },
                { phone_number: { contains: search, mode: 'insensitive' } }
            ]
        } : {};

        // 并行查询数据和总数
        const [merchants, total] = await Promise.all([
            prisma.merchant.findMany({
                where,
                include: {
                    files: {
                        orderBy: { created_at: 'asc' }
                    }
                },
                orderBy: { created_at: 'desc' },
                skip,
                take: parseInt(pageSize)
            }),
            prisma.merchant.count({ where })
        ]);

        // 为每个商户的文件生成签名URL
        const merchantsWithSignedUrls = merchants.map(merchant => ({
            ...merchant,
            files: merchant.files.map(file => ({
                ...file,
                // 生成24小时有效的签名URL
                signed_url: ossService.getSignedUrl(file.filename, 24 * 3600)
            }))
        }));

        res.json({
            success: true,
            data: merchantsWithSignedUrls,
            total,
            page: parseInt(page),
            pageSize: parseInt(pageSize)
        });
    } catch (error) {
        console.error('获取商户列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取商户列表失败',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// 同样修改 getMerchantDetail 方法
const getMerchantDetail = async (req, res) => {
    try {
        const { id } = req.params;

        const merchant = await prisma.merchant.findUnique({
            where: { id },
            include: {
                files: {
                    orderBy: { created_at: 'asc' }
                }
            }
        });

        if (!merchant) {
            return res.status(404).json({
                success: false,
                message: '商户不存在'
            });
        }

        // 为文件生成签名URL
        const merchantWithSignedUrls = {
            ...merchant,
            files: merchant.files.map(file => ({
                ...file,
                signed_url: ossService.getSignedUrl(file.filename, 24 * 3600)
            }))
        };

        res.json({
            success: true,
            data: merchantWithSignedUrls
        });
    } catch (error) {
        console.error('获取商户详情失败:', error);
        res.status(500).json({
            success: false,
            message: '获取商户详情失败',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// 删除商户
const deleteMerchant = async (req, res) => {
    try {
        const { id } = req.params;

        // 使用事务确保数据一致性
        await prisma.$transaction(async (tx) => {
            // 先获取商户信息和文件列表
            const merchant = await tx.merchant.findUnique({
                where: { id },
                include: { files: true }
            });

            if (!merchant) {
                throw new Error('商户不存在');
            }

            // 删除OSS中的文件
            for (const file of merchant.files) {
                try {
                    await ossService.deleteFile(file.filename);
                    console.log(`已删除OSS文件: ${file.filename}`);
                } catch (error) {
                    console.warn(`删除OSS文件失败: ${file.filename}`, error);
                    // 不中断删除流程，继续删除其他文件
                }
            }

            // 删除数据库中的文件记录
            await tx.file.deleteMany({
                where: { merchant_id: id }
            });

            // 删除商户记录
            await tx.merchant.delete({
                where: { id }
            });
        });

        res.json({
            success: true,
            message: '删除成功'
        });
    } catch (error) {
        console.error('删除商户失败:', error);

        if (error.message === '商户不存在') {
            return res.status(404).json({
                success: false,
                message: '商户不存在'
            });
        }

        res.status(500).json({
            success: false,
            message: '删除失败，请重试',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

const proxyFile = async (req, res) => {
    try {
        const { merchantId, fileId } = req.params;

        console.log('代理下载请求:', { merchantId, fileId });

        // 修正：使用正确的表名
        const file = await prisma.file.findFirst({
            where: {
                id: fileId,
                merchant_id: merchantId
            }
        });

        if (!file) {
            console.log('文件不存在:', { merchantId, fileId });
            return res.status(404).json({ success: false, message: '文件不存在' });
        }

        console.log('找到文件:', {
            filename: file.filename,
            original_name: file.original_name,
            file_size: file.file_size,
            mime_type: file.mime_type
        });

        // 生成签名URL
        const signedUrl = ossService.getSignedUrl(file.filename, 3600);

        if (!signedUrl) {
            console.log('生成签名URL失败');
            return res.status(500).json({ success: false, message: '生成文件URL失败' });
        }

        console.log('开始从OSS下载:', signedUrl);

        // 使用 axios 下载文件为 arraybuffer，避免流的问题
        const response = await axios({
            method: 'GET',
            url: signedUrl,
            responseType: 'arraybuffer'
        });

        const buffer = Buffer.from(response.data);

        console.log('文件下载完成:', {
            statusCode: response.status,
            contentType: response.headers['content-type'],
            contentLength: response.headers['content-length'],
            actualSize: buffer.length,
            firstBytes: buffer.slice(0, 10).toString('hex')
        });

        // 设置响应头
        res.set({
            'Content-Type': file.mime_type || response.headers['content-type'] || 'application/octet-stream',
            'Content-Length': buffer.length,
            'Content-Disposition': `attachment; filename="${encodeURIComponent(file.original_name)}"`,
            'Cache-Control': 'no-cache'
        });

        // 发送buffer
        res.send(buffer);

    } catch (error) {
        console.error('代理下载失败:', error);
        res.status(500).json({
            success: false,
            message: '下载失败',
            error: process.env.NODE_ENV === 'development' ? error.message : '服务器内部错误'
        });
    }
};

// 批量删除商户
const batchDeleteMerchants = async (req, res) => {
    try {
        const { ids } = req.body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: '请提供要删除的商户ID列表'
            });
        }

        let deletedCount = 0;
        let failedIds = [];

        // 逐个删除商户（为了确保文件删除）
        for (const id of ids) {
            try {
                await prisma.$transaction(async (tx) => {
                    const merchant = await tx.merchant.findUnique({
                        where: { id },
                        include: { files: true }
                    });

                    if (merchant) {
                        // 删除OSS文件
                        for (const file of merchant.files) {
                            try {
                                await ossService.deleteFile(file.filename);
                            } catch (error) {
                                console.warn(`删除OSS文件失败: ${file.filename}`, error);
                            }
                        }

                        // 删除数据库记录
                        await tx.file.deleteMany({
                            where: { merchant_id: id }
                        });

                        await tx.merchant.delete({
                            where: { id }
                        });

                        deletedCount++;
                    }
                });
            } catch (error) {
                console.error(`删除商户失败 ID: ${id}`, error);
                failedIds.push(id);
            }
        }

        res.json({
            success: true,
            message: `成功删除 ${deletedCount} 个商户${failedIds.length > 0 ? `，${failedIds.length} 个删除失败` : ''}`,
            data: {
                deletedCount,
                failedIds
            }
        });
    } catch (error) {
        console.error('批量删除商户失败:', error);
        res.status(500).json({
            success: false,
            message: '批量删除失败',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// 获取统计信息
const getStatistics = async (req, res) => {
    try {
        const [
            totalMerchants,
            todayMerchants,
            weekMerchants,
            monthMerchants
        ] = await Promise.all([
            // 总数
            prisma.merchant.count(),
            // 今天提交的
            prisma.merchant.count({
                where: {
                    created_at: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0))
                    }
                }
            }),
            // 本周提交的
            prisma.merchant.count({
                where: {
                    created_at: {
                        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                    }
                }
            }),
            // 本月提交的
            prisma.merchant.count({
                where: {
                    created_at: {
                        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                    }
                }
            })
        ]);

        res.json({
            success: true,
            data: {
                total: totalMerchants,
                today: todayMerchants,
                week: weekMerchants,
                month: monthMerchants
            }
        });
    } catch (error) {
        console.error('获取统计信息失败:', error);
        res.status(500).json({
            success: false,
            message: '获取统计信息失败',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    login,
    getMerchants,
    getMerchantDetail,
    deleteMerchant,
    batchDeleteMerchants,
    proxyFile,
    getStatistics
};