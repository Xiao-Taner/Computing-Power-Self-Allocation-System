const { io } = require('socket.io-client');
const config = require('../utils/config');
const logger = require('../utils/logger');
const events = require('./events');
const heartbeat = require('./heartbeat');

class SocketClient {
    constructor() {
        this.socket = null;
        this.config = config.get();
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.collectionInterval = null;
        this.nodeType = null;
        this.nodeDistance = null;
        this.nodeName = null;
        this.eventEmitter = new (require('events'))();
    }

    // 初始化所有服务
    initializeServices() {
        // 注册事件处理器
        events.registerEvents(this.socket);
        logger.info('事件处理器已初始化', 'Socket');
        
        // 启动心跳检测
        heartbeat.startHeartbeat(this.socket);
        logger.info('心跳检测已启动', 'Socket');

        // 发送节点注册信息
        this.socket.emit('node:register', {
            ip: this.config.node.ip
        });
        logger.info('节点注册信息已发送', 'Socket');
    }

    // 初始化socket连接
    initialize() {
        const serverUrl = `ws://${this.config.server.host}:${this.config.server.port}`;
        
        this.socket = io(serverUrl, {
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 20000
        });

        // 连接成功
        this.socket.on('connect', () => {
            this.isConnected = true;
            this.reconnectAttempts = 0;
            logger.info(`已连接到服务器: ${serverUrl}`, 'Socket');
            
            // 初始化所有服务
            this.initializeServices();
        });

        // 接收服务器配置
        this.socket.on('server:config', (serverConfig) => {
            this.nodeType = serverConfig.type;
            this.nodeDistance = serverConfig.distance;
            this.collectionInterval = serverConfig.collectionInterval;
            this.nodeName = serverConfig.name;
            
            logger.info(`收到服务器配置:`, 'Socket');
            logger.info(`- 节点名称: ${this.nodeName}`, 'Socket');
            logger.info(`- 节点类型: ${this.nodeType}`, 'Socket');
            logger.info(`- 节点距离: ${this.nodeDistance}km`, 'Socket');
            logger.info(`- 采集间隔: ${this.collectionInterval}ms`, 'Socket');

            // 触发配置就绪事件
            this.emit('config:ready', serverConfig);
        });

        // 连接断开
        this.socket.on('disconnect', (reason) => {
            this.isConnected = false;
            logger.warn(`与服务器断开连接: ${reason}`, 'Socket');
            
            // 触发连接断开事件
            this.eventEmitter.emit('connection:lost');
            
            // 清理事件处理器
            events.unregisterEvents(this.socket);
            
            // 停止心跳检测
            heartbeat.stopHeartbeat();

            if (reason === 'io server disconnect') {
                logger.info('服务器主动断开，尝试重新连接...', 'Socket');
                this.socket.connect();
            } else {
                logger.info('等待重新连接...', 'Socket');
            }
        });

        // 重新连接中
        this.socket.on('reconnecting', (attemptNumber) => {
            logger.info(`正在尝试重新连接 (第${attemptNumber}次)...`, 'Socket');
        });

        // 连接错误
        this.socket.on('connect_error', (error) => {
            logger.error(`连接错误: ${error.message}`, 'Socket');
        });

        // 重新连接失败
        this.socket.on('reconnect_failed', () => {
            logger.error('重新连接失败，将继续尝试...', 'Socket');
            // 重新初始化连接
            setTimeout(() => {
                logger.info('重新初始化连接...', 'Socket');
                this.socket.connect();
            }, 5000);
        });
    }

    // 获取socket实例
    getSocket() {
        return this.socket;
    }

    // 获取采集间隔
    getCollectionInterval() {
        return this.collectionInterval;
    }

    // 获取节点类型
    getNodeType() {
        return this.nodeType;
    }

    // 获取节点距离
    getNodeDistance() {
        return this.nodeDistance;
    }

    // 获取节点名称
    getNodeName() {
        return this.nodeName;
    }

    // 发送设备信息
    sendDeviceInfo(data) {
        if (this.isConnected) {
            // 添加节点信息
            const deviceInfo = {
                ...data,
                nodeName: this.nodeName,
                nodeType: this.nodeType,
                nodeDistance: this.nodeDistance
            };
            // 打印
            logger.info(`发送设备信息: ${JSON.stringify(deviceInfo)}`, 'Socket');
            this.socket.emit('device:info', deviceInfo);
        }
    }

    // 断开连接
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
        }
    }

    // 事件监听器
    on(event, callback) {
        if (event === 'config:ready' || event === 'connection:lost') {
            this.eventEmitter.on(event, callback);
        } else if (this.socket) {
            this.socket.on(event, callback);
        }
    }

    // 事件触发器
    emit(event, data) {
        if (event === 'config:ready' || event === 'connection:lost') {
            this.eventEmitter.emit(event, data);
        } else if (this.socket) {
            this.socket.emit(event, data);
        }
    }
}

// 导出单例
module.exports = new SocketClient(); 