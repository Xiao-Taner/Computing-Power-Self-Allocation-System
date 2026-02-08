const io = require('socket.io-client');
const logger = require('../utils/logger');

// 测试配置
const TEST_CONFIG = {
    serverUrl: 'http://localhost:3000',  // 算力自调配后端的socket地址
    nodeInfo: {
        ip: '192.168.3.5'  // 这个IP需要在nodes.yaml中配置为允许连接
    }
};

// 创建测试客户端
function createTestClient() {
    const socket = io(TEST_CONFIG.serverUrl);

    // 连接成功
    socket.on('connect', () => {
        logger.info('测试客户端已连接', 'Test');
        
        // 发送注册信息
        socket.emit('node:register', TEST_CONFIG.nodeInfo);
    });

    // 接收服务器配置
    socket.on('server:config', (config) => {
        logger.info(`收到服务器配置: ${JSON.stringify(config)}`, 'Test');
        
        // 模拟发送设备信息
        setInterval(() => {
            socket.emit('device:info', {
                cpu: Math.random() * 100,
                memory: Math.random() * 100,
                gpu: Math.random() * 100,
                network: {
                    up: Math.random() * 1000,
                    down: Math.random() * 1000
                }
            });
        }, config.collectionInterval || 5000);
    });

    // 连接错误
    socket.on('connect_error', (error) => {
        logger.error(`连接错误: ${error.message}`, 'Test');
    });

    // 断开连接
    socket.on('disconnect', (reason) => {
        logger.warn(`断开连接: ${reason}`, 'Test');
    });

    return socket;
}

// 运行测试
function runTest() {
    logger.info('开始测试...', 'Test');
    createTestClient();
}

// 执行测试
runTest();
