const express = require('express');
const router = express.Router();
const messageHandler = require('../../socket/messageHandler');
const logger = require('../../utils/logger');

// GET /show/device/update
router.get('/update', (req, res) => {
    try {
        // 获取所有节点的状态信息
        const deviceStates = messageHandler.getAllNodeStates();
        
        // 返回状态信息，添加code和message字段
        res.json({
            code: 200,  // 添加状态码
            message: 'success',  // 添加消息
            data: deviceStates,
            timestamp: Date.now()
        });

        logger.info('已响应前端设备状态更新请求', 'DeviceAPI');
    } catch (error) {
        logger.error(`处理设备状态更新请求失败: ${error.message}`, 'DeviceAPI');
        res.status(500).json({
            code: 500,  // 错误状态码
            message: error.message || '服务器内部错误',
            error: error.message
        });
    }
});

module.exports = router; 