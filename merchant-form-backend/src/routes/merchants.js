const express = require('express');
const { body } = require('express-validator');
const upload = require('../config/multer');
const {
  submitForm,
  getMerchants,
  getMerchantById
} = require('../controllers/merchantController');

const router = express.Router();

// 验证规则
const validateMerchant = [
  body('name').notEmpty().withMessage('名称不能为空'),
  body('regionValues').notEmpty().withMessage('请选择地区'),
  body('detailAddress').notEmpty().withMessage('详细地址不能为空'),
  body('contactName').notEmpty().withMessage('联系人姓名不能为空'),
  body('phoneNumber').isMobilePhone('zh-CN').withMessage('请输入正确的手机号码'),
];

// 文件上传字段配置
const uploadFields = upload.fields([
  { name: 'idCardFront', maxCount: 1 },
  { name: 'idCardBack', maxCount: 1 },
  { name: 'bankCard', maxCount: 1 },
  { name: 'qrCode', maxCount: 1 },
  { name: 'storeFront', maxCount: 5 },
  { name: 'storeInside', maxCount: 5 },
  { name: 'cashier', maxCount: 5 },
  { name: 'businessLicense', maxCount: 1 },
]);

// 路由定义
router.post('/submit', uploadFields, validateMerchant, submitForm);
router.get('/', getMerchants);
router.get('/:id', getMerchantById);

module.exports = router;