// 主程序入口文件
const socketClient = require('./socket/client');
const systemCollector = require('./collectors/index');
const config = require('./utils/config');
const logger = require('./utils/logger');

class NodeApplication {
    constructor() {
        this.config = config.get();
        this.collectionTimer = null;
        this.isCollecting = false;  // 添加标志位
    }

    // 启动应用
    async start() {
        try {
            logger.info('正在启动云边节点应用...', 'App');

            // 初始化socket连接
            socketClient.initialize();

            // 启动设备信息采集
            this.startCollection();

            // 处理进程退出
            this.handleProcessExit();

            logger.info('云边节点应用已启动', 'App');
        } catch (error) {
            logger.error(`启动失败: ${error.message}`, 'App');
            process.exit(1);
        }
    }

    // 启动设备信息采集
    startCollection() {
        // 等待服务器配置
        socketClient.on('config:ready', (serverConfig) => {
            // 如果已经在采集，先停止
            if (this.isCollecting) {
                this.stopCollection();
            }

            const interval = serverConfig.collectionInterval;
            
            // 启动所有采集器
            this.collectionTimer = setInterval(async () => {
                try {
                    const deviceInfo = await systemCollector.get();
                    socketClient.sendDeviceInfo(deviceInfo);
                    // 打印socketid
                    logger.info(`socketid: ${socketClient.socket.id}`, 'App');
                } catch (error) {
                    logger.error(`采集设备信息失败: ${error.message}`, 'App');
                }
            }, interval);

            this.isCollecting = true;
            logger.info(`设备信息采集已启动，间隔: ${interval}ms`, 'App');
        });

        // 监听断开连接事件
        socketClient.on('connection:lost', () => {
            this.stopCollection();
        });
    }

    // 停止设备信息采集
    stopCollection() {
        if (this.collectionTimer) {
            clearInterval(this.collectionTimer);
            this.collectionTimer = null;
            this.isCollecting = false;
            logger.info('设备信息采集已停止', 'App');
        }
    }

    // 处理进程退出
    handleProcessExit() {
        process.on('SIGINT', () => this.shutdown());
        process.on('SIGTERM', () => this.shutdown());
    }

    // 优雅关闭
    shutdown() {
        logger.info('正在关闭应用...', 'App');
        this.stopCollection();
        socketClient.disconnect();
        logger.info('应用已关闭', 'App');
        process.exit(0);
    }
}

// 创建并启动应用
const app = new NodeApplication();
app.start(); 