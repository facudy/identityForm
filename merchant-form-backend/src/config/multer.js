const multer = require('multer');

// 使用内存存储，文件将上传到OSS
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    // 只允许图片文件
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('只允许上传图片文件'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
        files: 20 // 最多20个文件
    }
});

module.exports = upload;