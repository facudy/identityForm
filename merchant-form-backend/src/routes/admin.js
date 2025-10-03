const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateAdmin } = require('../middleware/auth');

// 管理员登录（不需要认证）
router.post('/login', adminController.login);

// 临时：把代理文件路由放在认证中间件之前测试
router.get('/proxy-file/:merchantId/:fileId', adminController.proxyFile);

// 以下路由需要管理员认证
router.use(authenticateAdmin);

// 获取统计信息
router.get('/statistics', adminController.getStatistics);

// 获取商户列表（带分页和搜索）
router.get('/merchants', adminController.getMerchants);

// 获取商户详情
router.get('/merchants/:id', adminController.getMerchantDetail);

// 删除单个商户
router.delete('/merchants/:id', adminController.deleteMerchant);

// 批量删除商户
router.post('/merchants/batch-delete', adminController.batchDeleteMerchants);

router.get('/proxy-file/:merchantId/:fileId', adminController.proxyFile);

module.exports = router;