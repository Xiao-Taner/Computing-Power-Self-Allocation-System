const logger = require('../utils/logger');

class Heartbeat {
    constructor() {
        this.interval = null;
        this.timeoutId = null;
        this.missedHeartbeats = 0;
        this.maxMissedHeartbeats = 3;  // 最大允许丢失心跳次数
    }

    // 启动心跳检测
    startHeartbeat(socket, interval = 30000) {
        // 清除可能存在的旧心跳
        this.stopHeartbeat();
        this.missedHeartbeats = 0;

        // 发送心跳
        this.interval = setInterval(() => {
            if (socket.connected) {
                logger.info('发送心跳包...', 'Heartbeat');
                socket.emit('heartbeat');
                
                // 设置超时检测
                this.timeoutId = setTimeout(() => {
                    this.missedHeartbeats++;
                    logger.warn(`心跳超时 (${this.missedHeartbeats}/${this.maxMissedHeartbeats})`, 'Heartbeat');
                    
                    if (this.missedHeartbeats >= this.maxMissedHeartbeats) {
                        logger.error('多次心跳失败，断开连接', 'Heartbeat');
                        socket.disconnect();
                        this.missedHeartbeats = 0;  // 重置计数
                    }
                }, 5000);
                
                // 接收心跳响应
                socket.once('heartbeat', () => {
                    clearTimeout(this.timeoutId);
                    this.missedHeartbeats = 0;  // 重置计数
                    logger.info('收到心跳响应 ✓', 'Heartbeat');
                });
            }
        }, interval);

        logger.info('心跳检测已启动', 'Heartbeat');
    }

    // 停止心跳检测
    stopHeartbeat() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
        this.missedHeartbeats = 0;
        logger.info('心跳检测已停止', 'Heartbeat');
    }
}

module.exports = new Heartbeat(); 