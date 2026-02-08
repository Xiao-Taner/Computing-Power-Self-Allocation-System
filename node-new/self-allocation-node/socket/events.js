const logger = require('../utils/logger');
const systemCollector = require('../collectors/index');
const { log } = require('winston');

class EventHandler {
    constructor() {
        this.handlers = new Map();
    }

    // 注册所有事件处理器
    async registerEvents(socket) {
        // 清理旧的事件处理器
        this.unregisterEvents(socket);
        
        // 获取即时设备信息的处理器
        const getDeviceInfoHandler = () => {
            try {
                // 直接获取最新数据
                console.log('获取最新数据222');
                const deviceInfo = systemCollector.getLatest();
                socket.emit('device:info:response', deviceInfo);
                logger.info('已发送最新设备信息', 'Events');
                // socketid
                logger.info(`socketid: ${socket.id}`, 'Events');
            } catch (error) {
                logger.error(`获取设备信息失败: ${error.message}`, 'Events');
            }
        };

        // 存储处理器引用，以便后续清理
        this.handlers.set('device:info:request', getDeviceInfoHandler);

        // 注册事件处理器
        console.log('注册事件处理器');
        socket.on('device:info:request', getDeviceInfoHandler);
        
        // 接收服务器的命令
        socket.on('command', this.handleCommand);
        
        // 接收配置更新
        socket.on('config:update', this.handleConfigUpdate);

        logger.info('事件处理器注册完成', 'Events');
    }

    // 清理事件处理器
    unregisterEvents(socket) {
        if (this.handlers.size > 0) {
            for (const [event, handler] of this.handlers) {
                socket.off(event, handler);
            }
            this.handlers.clear();
            logger.info('事件处理器已清理', 'Events');
        }
    }

    // 处理服务器命令
    handleCommand(command) {
        try {
            logger.info(`收到服务器命令: ${command.type}`, 'Events');
            
            switch (command.type) {
                case 'stop':
                    logger.info('收到停止命令', 'Events');
                    // 处理停止命令
                    break;
                case 'restart':
                    logger.info('收到重启命令', 'Events');
                    // 处理重启命令
                    break;
                default:
                    logger.warn(`未知的命令类型: ${command.type}`, 'Events');
            }
        } catch (error) {
            logger.error(`处理命令失败: ${error.message}`, 'Events');
        }
    }

    // 处理配置更新
    handleConfigUpdate(newConfig) {
        try {
            logger.info('收到配置更新', 'Events');
            // 处理配置更新
            // TODO: 调用配置更新逻辑
        } catch (error) {
            logger.error(`更新配置失败: ${error.message}`, 'Events');
        }
    }
}

// 导出单例
module.exports = new EventHandler(); 