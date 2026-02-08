const WebSocket = require('ws');
const logger = require('../utils/logger');

class FrontendSocketManager {
    constructor() {
        this.wss = null;
        this.clients = new Set();
    }

    initialize(server) {
        this.wss = new WebSocket.Server({ server, path: '/ws' });
        
        this.wss.on('connection', (ws) => {
            logger.info('前端WebSocket客户端已连接', 'FrontendSocket');
            this.clients.add(ws);

            ws.on('close', () => {
                logger.info('前端WebSocket客户端已断开', 'FrontendSocket');
                this.clients.delete(ws);
            });

            ws.on('error', (error) => {
                logger.error(`WebSocket错误: ${error.message}`, 'FrontendSocket');
            });
        });

        logger.info('前端WebSocket服务已初始化', 'FrontendSocket');
    }

    broadcast(data) {
        const message = JSON.stringify(data);
        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }

    shutdown() {
        if (this.wss) {
            this.wss.close();
            this.clients.clear();
            logger.info('前端WebSocket服务已关闭', 'FrontendSocket');
        }
    }
}

// 导出单例
module.exports = new FrontendSocketManager(); 