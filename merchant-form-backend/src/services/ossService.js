const OSS = require('ali-oss');
const path = require('path');

class OSSService {
    constructor() {
        try {
            // 方式1：使用region，让SDK自动确定endpoint
            this.client = new OSS({
                region: process.env.OSS_REGION,
                accessKeyId: process.env.OSS_ACCESS_KEY_ID,
                accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
                bucket: process.env.OSS_BUCKET,
                // 不设置endpoint，让SDK自动处理
            });

            console.log('OSS 客户端初始化成功');
            console.log('Region:', process.env.OSS_REGION);
            console.log('Bucket:', process.env.OSS_BUCKET);
        } catch (error) {
            console.error('OSS 客户端初始化失败:', error);
        }
    }

    generateOSSPath(merchantId, fieldName, originalName) {
        const timestamp = Date.now();
        const random = Math.round(Math.random() * 1E9);
        const ext = path.extname(originalName);
        const filename = `${timestamp}-${random}${ext}`;
        return `merchants/${merchantId}/${fieldName}/${filename}`;
    }

    async uploadFile(buffer, objectName, contentType) {
        try {
            console.log('准备上传文件到OSS:', objectName);

            const result = await this.client.put(objectName, buffer, {
                headers: {
                    'Content-Type': contentType,
                },
            });

            console.log('文件上传成功:', result.url);

            return {
                success: true,
                url: result.url,
                name: result.name,
                size: buffer.length
            };
        } catch (error) {
            console.error('OSS上传失败:', error);
            console.error('错误详情:', {
                status: error.status,
                code: error.code,
                message: error.message,
                hostId: error.hostId
            });
            throw new Error(`文件上传失败: ${error.message}`);
        }
    }

    async deleteFile(objectName) {
        try {
            await this.client.delete(objectName);
            console.log('文件删除成功:', objectName);
            return true;
        } catch (error) {
            console.error('OSS删除失败:', error);
            return false;
        }
    }

    getSignedUrl(objectName, expires = 3600) {
        try {
            return this.client.signatureUrl(objectName, {
                expires: expires
            });
        } catch (error) {
            console.error('生成签名URL失败:', error);
            return null;
        }
    }

    async uploadFiles(files) {
        const uploadPromises = files.map(file =>
            this.uploadFile(file.buffer, file.objectName, file.contentType)
        );

        try {
            const results = await Promise.all(uploadPromises);
            return results;
        } catch (error) {
            console.error('批量上传失败:', error);
            throw error;
        }
    }

    // 测试OSS连接的方法
    async testConnection() {
        try {
            const result = await this.client.listBuckets();
            console.log('OSS连接测试成功，可访问的buckets:', result.buckets.map(b => b.name));
            return true;
        } catch (error) {
            console.error('OSS连接测试失败:', error);
            return false;
        }
    }
}

module.exports = new OSSService();