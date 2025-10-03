const { validationResult } = require('express-validator');
const { prisma } = require('../services/databaseService');
const ossService = require('../services/ossService');

// 字段映射函数
const mapFileFieldToEnum = (fieldName) => {
    const mapping = {
        'idCardFront': 'ID_CARD_FRONT',
        'idCardBack': 'ID_CARD_BACK',
        'bankCard': 'BANK_CARD',
        'qrCode': 'QR_CODE',
        'storeFront': 'STORE_FRONT',
        'storeInside': 'STORE_INSIDE',
        'cashier': 'CASHIER',
        'businessLicense': 'BUSINESS_LICENSE'
    };
    return mapping[fieldName] || fieldName;
};

const submitForm = async (req, res) => {
    try {
        // 验证请求数据
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: '验证失败',
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
            bankBranch
        } = req.body;

        console.log('收到的表单数据:', req.body);
        console.log('收到的文件数量:', Object.keys(req.files || {}).length);

        // 解析地区值
        let parsedRegionValues;
        try {
            parsedRegionValues = typeof regionValues === 'string'
                ? JSON.parse(regionValues)
                : regionValues;
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: '地区数据格式错误'
            });
        }

        // 使用 Prisma 事务
        const result = await prisma.$transaction(async (tx) => {
            // 创建商户记录
            const merchant = await tx.merchant.create({
                data: {
                    name,
                    region_values: parsedRegionValues,
                    detail_address: detailAddress,
                    contact_name: contactName,
                    phone_number: phoneNumber,
                    bank_card_holder: bankCardHolder || null,
                    bank_city: bankCity || null,
                    bank_branch: bankBranch || null,
                }
            });

            console.log('商户记录创建成功，ID:', merchant.id);

            // 处理文件上传到OSS
            const filePromises = [];

            if (req.files) {
                for (const fieldName of Object.keys(req.files)) {
                    const files = req.files[fieldName];

                    for (const file of files) {
                        try {
                            // 生成OSS路径
                            const ossPath = ossService.generateOSSPath(
                                merchant.id,
                                fieldName,
                                file.originalname
                            );

                            console.log(`上传文件到OSS: ${fieldName} -> ${ossPath}`);

                            // 上传到OSS
                            const ossResult = await ossService.uploadFile(
                                file.buffer,
                                ossPath,
                                file.mimetype
                            );

                            // 创建文件记录
                            filePromises.push(
                                tx.file.create({
                                    data: {
                                        merchant_id: merchant.id,
                                        field_name: mapFileFieldToEnum(fieldName),
                                        filename: ossPath, // OSS路径作为文件名
                                        original_name: file.originalname,
                                        file_path: ossResult.url, // OSS完整URL
                                        file_size: file.size,
                                        mime_type: file.mimetype,
                                    }
                                })
                            );

                            console.log(`文件上传成功: ${ossResult.url}`);
                        } catch (ossError) {
                            console.error(`文件上传失败 ${fieldName}:`, ossError);
                            throw new Error(`文件上传失败: ${file.originalname}`);
                        }
                    }
                }
            }

            // 等待所有文件记录创建完成
            if (filePromises.length > 0) {
                await Promise.all(filePromises);
                console.log(`成功创建 ${filePromises.length} 个文件记录`);
            }

            return merchant;
        });

        console.log('商户信息提交成功:', result);

        res.json({
            success: true,
            message: '提交成功',
            data: {
                merchantId: result.id
            }
        });

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
        const merchants = await prisma.merchant.findMany({
            include: {
                files: true
            },
            orderBy: {
                created_at: 'desc'
            }
        });

        res.json({
            success: true,
            data: merchants
        });
    } catch (error) {
        console.error('获取商户列表失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
};

const getMerchantById = async (req, res) => {
    try {
        const { id } = req.params;

        const merchant = await prisma.merchant.findUnique({
            where: { id },
            include: {
                files: true
            }
        });

        if (!merchant) {
            return res.status(404).json({
                success: false,
                message: '商户不存在'
            });
        }

        res.json({
            success: true,
            data: merchant
        });
    } catch (error) {
        console.error('获取商户详情失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
};

module.exports = {
    submitForm,
    getMerchants,
    getMerchantById
};