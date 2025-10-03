const jwt = require('jsonwebtoken');

// JWT密钥 - 与adminController中保持一致
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-hw0401-admin';

// 管理员认证中间件
const authenticateAdmin = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        console.log('认证中间件 - 收到Authorization头:', authHeader);

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('认证失败 - 未提供有效的Authorization头');
            return res.status(401).json({
                success: false,
                message: '未提供认证令牌'
            });
        }

        const token = authHeader.substring(7); // 移除 'Bearer ' 前缀
        console.log('认证中间件 - 提取的token:', token.substring(0, 50) + '...');

        // 验证JWT token
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('认证中间件 - JWT验证成功:', { username: decoded.username, role: decoded.role });

        // 检查是否为管理员
        if (decoded.role !== 'admin') {
            console.log('认证失败 - 非管理员用户');
            return res.status(403).json({
                success: false,
                message: '权限不足'
            });
        }

        // 将用户信息添加到请求对象
        req.user = decoded;
        next();
    } catch (error) {
        console.error('认证中间件 - JWT验证失败:', error.message);

        let message = '认证令牌无效';
        if (error.name === 'TokenExpiredError') {
            message = '认证令牌已过期';
        } else if (error.name === 'JsonWebTokenError') {
            message = '认证令牌格式错误';
        }

        return res.status(401).json({
            success: false,
            message: message
        });
    }
};

module.exports = {
    authenticateAdmin
};