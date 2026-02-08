const { Server } = require('socket.io');
const logger = require('../utils/logger');
const messageHandler = require('./messageHandler');
const { defaultConfig, nodesConfig } = require('../config/config');

class SocketManager {
    constructor() {
        this.io = null;
        this.nodes = new Map(); // 存储所有连接的节点信息
        this.nodesConfig = nodesConfig;
        // 初始化 messageHandler
        messageHandler.initialize(this);
    }

    // 初始化Socket服务
    initialize(server) {
        this.io = new Server(server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });

        this.io.on('connection', (socket) => {
            logger.info(`新的Socket连接: ${socket.id}`, 'SocketManager');

            // 处理节点注册
            socket.on('node:register', (data) => {
                this.handleNodeRegistration(socket, data);
            });

            // 处理设备信息（包括定期发送和立即响应）
            socket.on('device:info', (data) => {
                const node = this.nodes.get(socket.id);
                if (node) {
                    // 更新最后活动时间
                    node.lastUpdate = new Date();
                    messageHandler.handleDeviceInfo(socket.id, data);
                } else {
                    logger.warn(`收到未知节点的设备信息: ${socket.id}`, 'SocketManager');
                }
            });

            // 恢复心跳处理
            socket.on('heartbeat', () => {
                socket.emit('heartbeat');
            });

            // 处理断开连接
            socket.on('disconnect', (reason) => {
                this.handleDisconnect(socket, reason);
            });
        });

        logger.info('Socket服务已初始化', 'SocketManager');
    }

    // 处理节点注册
    handleNodeRegistration(socket, data) {
        try {
            const nodeIP = data.ip;
            let nodeConfig = null;
            let nodeType = null;
            let nodeDistance = null;
            let nodeOS = null;  // 添加操作系统变量

            // 在配置文件中查找节点
            for (const group of ['cloud_nodes', 'edge1_nodes', 'edge2_nodes']) {
                const node = this.nodesConfig[group]?.find(n => n.ip === nodeIP && n.enabled);
                if (node) {
                    nodeType = group.replace('_nodes', '');
                    nodeDistance = this.nodesConfig.distances[nodeType];
                    nodeOS = node.os;  // 获取操作系统信息
                    nodeConfig = {
                        name: node.name,
                        type: nodeType,
                        description: node.description,
                        distance: nodeDistance,
                        os: nodeOS  // 添加操作系统信息
                    };
                    break;
                }
            }

            // 如果找到节点配置
            if (nodeConfig) {
                // 存储节点信息
                this.nodes.set(socket.id, {
                    ...nodeConfig,
                    ip: nodeIP,
                    socketId: socket.id,
                    connected: true,
                    lastUpdate: new Date()
                });

                // 发送配置给节点
                socket.emit('server:config', {
                    name: nodeConfig.name,
                    type: nodeConfig.type,
                    distance: nodeConfig.distance,
                    os: nodeConfig.os,  // 添加操作系统信息
                    collectionInterval: this.nodesConfig.connection.collection_interval,
                    heartbeatInterval: this.nodesConfig.connection.heartbeat_interval
                });

                logger.info(`节点注册成功: ${nodeConfig.name} (${nodeIP}), 类型: ${nodeConfig.type}, 系统: ${nodeConfig.os}, 距离: ${nodeConfig.distance}km`, 'SocketManager');
                logger.info(`设备信息采集间隔: ${this.nodesConfig.connection.collection_interval}ms`, 'SocketManager');
                
                // 打印所有节点信息
                this.printNodesInfo('新节点注册');

                // 延迟2秒后发送配置就绪信号
                setTimeout(() => {
                    if (socket.connected) {  // 确保socket还在连接状态
                        logger.info(`向节点 ${nodeConfig.name} 发送采集启动信号`, 'SocketManager');
                        socket.emit('config:ready', {
                            collectionInterval: this.nodesConfig.connection.collection_interval
                        });
                    }
                }, 2000);  // 2秒延迟

            } else {
                // 未授权的节点
                logger.warn(`未授权的节点尝试连接: ${nodeIP}`, 'SocketManager');
                socket.disconnect();
            }
        } catch (error) {
            logger.error(`处理节点注册失败: ${error.message}`, 'SocketManager');
            socket.disconnect();
        }
    }

    // 处理断开连接
    handleDisconnect(socket, reason) {
        const node = this.nodes.get(socket.id);
        if (node) {
            node.connected = false;
            logger.warn(`节点断开连接: ${node.name} (${reason})`, 'SocketManager');
            
            // 从节点列表中删除
            this.nodes.delete(socket.id);
            
            // 清理该节点的设备状态信息
            messageHandler.cleanupNodeState(socket.id);

            // 广播节点断开事件
            this.broadcast('node:disconnect', {
                nodeId: socket.id,
                name: node.name
            });

            // 打印剩余节点信息
            this.printNodesInfo('节点断开');
        }
    }

    // 获取所有已连接的节点
    getConnectedNodes() {
        return Array.from(this.nodes.values());
    }

    // 获取特定节点
    getNode(socketId) {
        return this.nodes.get(socketId);
    }

    // 向特定节点发送消息
    sendToNode(socketId, event, data) {
        if (this.io) {
            const socket = this.io.sockets.sockets.get(socketId);
            if (socket) {
                socket.emit(event, data);
                logger.info(`向节点 ${socketId} 发送事件: ${event}`, 'SocketManager');
                return true;
            } else {
                logger.warn(`未找到节点 ${socketId} 的socket连接`, 'SocketManager');
                return false;
            }
        }
        return false;
    }

    // 向所有节点广播消息
    broadcast(event, data) {
        if (this.io) {
            this.io.emit(event, data);
            logger.info(`广播事件: ${event}`, 'SocketManager');
        }
    }

    // 添加关闭方法
    shutdown() {
        if (this.io) {
            // 获取所有连接的socket
            const connectedSockets = this.io.sockets.sockets;
            
            // 主动断开所有连接
            connectedSockets.forEach((socket) => {
                socket.disconnect(true);
            });

            // 关闭socket.io服务器
            this.io.close(() => {
                logger.info('所有Socket连接已关闭', 'SocketManager');
            });

            // 清空节点列表
            this.nodes.clear();
            this.io = null;
        }
    }

    // 打印所有节点信息
    printNodesInfo(action = '') {
        const connectedNodes = this.getConnectedNodes();
        const nodeCount = connectedNodes.length;

        logger.info(`${action ? action + ' - ' : ''}当前在线节点数量: ${nodeCount}`, 'SocketManager');
        
        if (nodeCount > 0) {
            logger.info('--------------------------------', 'SocketManager');
            logger.info('节点详细信息:', 'SocketManager');
            connectedNodes.forEach(node => {
                logger.info(`- ${node.name}:`, 'SocketManager');
                logger.info(`  IP: ${node.ip}`, 'SocketManager');
                logger.info(`  类型: ${node.type}`, 'SocketManager');
            });
        }
    }
}

// 导出实例
module.exports = new SocketManager();
