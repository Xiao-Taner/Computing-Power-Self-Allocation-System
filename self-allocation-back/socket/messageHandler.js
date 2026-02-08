const logger = require('../utils/logger');

class MessageHandler {
    constructor() {
        this.deviceStates = new Map();
        this.socketManager = null;
    }

    initialize(socketManager) {
        this.socketManager = socketManager;
    }

    handleDeviceInfo(socketId, data) {
        try {
            const node = this.socketManager.getNode(socketId);
            if (!node) {
                logger.warn(`收到未知节点的设备信息: ${socketId}`, 'MessageHandler');
                return;
            }

            this.deviceStates.set(socketId, {
                ...data,
                lastUpdate: new Date(),
                nodeInfo: node
            });

            const now = new Date().toLocaleTimeString();
            console.log(`[${now}] 节点 ${node.name} 设备信息更新:`);
            /*
            // CPU信息
            console.log(JSON.stringify({
                cpu: {
                    model: data.cpu.model,
                    usage: `${data.cpu.usage.toFixed(2)}%`
                }
            }));

            // 内存信息
            console.log(JSON.stringify({
                memory: {
                    total: `${data.memory.total}GB`,
                    used: `${data.memory.used.toFixed(2)}GB`, 
                    usage: `${data.memory.usage.toFixed(2)}%`
                }
            }));

            // GPU信息
            if (data.gpu && data.gpu.devices.length > 0) {
                console.log(JSON.stringify({
                    gpu: data.gpu.devices.map((gpu, index) => ({
                        device: index + 1,
                        model: gpu.model,
                        vram: `${gpu.vram}GB`,
                        vramUsed: `${gpu.vramUsed.toFixed(2)}GB`,
                        vramUsage: `${gpu.vramUsage.toFixed(2)}%`,
                        usage: `${gpu.usage.toFixed(2)}%`
                    }))
                }));
            }

            // 网络信息
            if (data.network && data.network.interfaces.length > 0) {
                console.log(JSON.stringify({
                    network: data.network.interfaces.map((nic, index) => ({
                        interface: index + 1,
                        name: nic.name,
                        speed: `${nic.speed.toFixed(2)}Gbps`,
                        txRate: `${(nic.txRate * 1024).toFixed(2)}KB/s`,
                        rxRate: `${(nic.rxRate * 1024).toFixed(2)}KB/s`,
                        utilization: `${nic.utilization.toFixed(2)}%`
                    }))
                }));
            }

            // 磁盘信息
            if (data.disk && data.disk.devices.length > 0) {
                console.log(JSON.stringify({
                    disk: data.disk.devices.map((disk, index) => ({
                        device: index + 1,
                        mount: disk.mount,
                        model: disk.model,
                        totalSize: `${disk.totalSize.toFixed(2)}GB`,
                        usedSize: `${disk.usedSize.toFixed(2)}GB`,
                        usagePercent: `${disk.usagePercent.toFixed(2)}%`
                    }))
                }));
            }

            logger.info('-------------------', 'MessageHandler');
            */

            this.socketManager.broadcast('node:status:update', {
                nodeId: socketId,
                status: this.getNodeStatus(socketId)
            });

        } catch (error) {
            logger.error(`处理设备信息失败: ${error.message}`, 'MessageHandler');
        }
    }

    getNodeStatus(socketId) {
        const state = this.deviceStates.get(socketId);
        if (!state) {
            return null;
        }

        // 计算GPU总体利用率（所有GPU设备的平均值）
        const gpuTotalUsage = state.gpu && state.gpu.devices.length > 0
            ? state.gpu.devices.reduce((sum, gpu) => sum + gpu.usage, 0) / state.gpu.devices.length
            : 0;

        // 计算GPU总体显存使用率（所有GPU设备的平均值）
        const gpuTotalVramUsage = state.gpu && state.gpu.devices.length > 0
            ? state.gpu.devices.reduce((sum, gpu) => sum + gpu.vramUsage, 0) / state.gpu.devices.length
            : 0;

        // 计算磁盘总体使用率（所有磁盘的平均值）
        const diskTotalUsage = state.disk && state.disk.devices.length > 0
            ? state.disk.devices.reduce((sum, disk) => sum + disk.usagePercent, 0) / state.disk.devices.length
            : 0;

        // 计算网络总体速率（所有网络接口的总和）
        const networkTotalTx = state.network && state.network.interfaces.length > 0
            ? state.network.interfaces.reduce((sum, nic) => sum + nic.txRate, 0)
            : 0;
        const networkTotalRx = state.network && state.network.interfaces.length > 0
            ? state.network.interfaces.reduce((sum, nic) => sum + nic.rxRate, 0)
            : 0;

        return {
            name: state.nodeInfo.name,
            type: state.nodeInfo.type,
            ip: state.nodeInfo.ip,
            os: state.nodeInfo.os,
            connected: true,
            lastUpdate: state.lastUpdate,
            metrics: {
                cpu: {
                    model: state.cpu.model,
                    usage: state.cpu.usage,
                    totalUsage: state.cpu.usage  // CPU总体利用率
                },
                memory: {
                    total: state.memory.total,
                    used: state.memory.used,
                    usage: state.memory.usage,  // 内存总体利用率
                    totalUsage: state.memory.usage,
                    details: state.memory.details
                },
                gpu: state.gpu ? {
                    count: state.gpu.count,
                    totalUsage: gpuTotalUsage,  // GPU总体利用率
                    totalVramUsage: gpuTotalVramUsage,  // GPU显存总体使用率
                    devices: state.gpu.devices.map(gpu => ({
                        model: gpu.model,
                        vram: gpu.vram,
                        vramUsed: gpu.vramUsed,
                        vramUsage: gpu.vramUsage,
                        usage: gpu.usage
                    }))
                } : null,
                network: state.network ? {
                    count: state.network.count,
                    totalTxRate: networkTotalTx,  // 总发送速率
                    totalRxRate: networkTotalRx,  // 总接收速率
                    interfaces: state.network.interfaces.map(nic => ({
                        name: nic.name,
                        model: nic.model,
                        speed: nic.speed,
                        txRate: nic.txRate,
                        rxRate: nic.rxRate,
                        utilization: nic.utilization
                    }))
                } : null,
                disk: state.disk ? {
                    count: state.disk.count,
                    totalUsage: diskTotalUsage,  // 磁盘总体使用率
                    devices: state.disk.devices.map(disk => ({
                        mount: disk.mount,
                        model: disk.model,
                        totalSize: disk.totalSize,
                        usedSize: disk.usedSize,
                        usagePercent: disk.usagePercent
                    }))
                } : null
            }
        };
    }

    getAllNodeStates() {
        const states = {};
        for (const [socketId, state] of this.deviceStates) {
            if (this.socketManager.getNode(socketId)) {
                states[socketId] = this.getNodeStatus(socketId);
            } else {
                this.cleanupNodeState(socketId);
            }
        }
        return states;
    }

    cleanupDisconnectedNodes() {
        for (const [socketId, state] of this.deviceStates) {
            if (!this.socketManager.getNode(socketId)) {
                this.deviceStates.delete(socketId);
                logger.info(`清理断开节点的状态: ${state.nodeInfo.name}`, 'MessageHandler');
            }
        }
    }

    cleanupNodeState(socketId) {
        if (this.deviceStates.has(socketId)) {
            const node = this.deviceStates.get(socketId).nodeInfo;
            this.deviceStates.delete(socketId);
            logger.info(`清理断开节点的状态: ${node.name}`, 'MessageHandler');
        }
    }

    // 请求并等待所有设备的最新状态
    async requestLatestDeviceStates() {
        try {
            const connectedNodes = this.socketManager.getConnectedNodes();
            const promises = [];
            const latestStates = {};

            for (const node of connectedNodes) {
                const promise = new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        reject(new Error(`节点 ${node.name} 响应超时`));
                    }, 10000);

                    // 使用 socket.id 监听特定节点的响应
                    const socket = this.socketManager.io.sockets.sockets.get(node.socketId);
                    if (!socket) {
                        reject(new Error(`未找到节点 ${node.name} 的socket连接`));
                        return;
                    }

                    // 修改这里：监听正确的事件 'device:info:response'
                    socket.once('device:info:response', (data) => {
                        clearTimeout(timeout);
                        latestStates[node.socketId] = {
                            ...data,
                            lastUpdate: new Date(),
                            nodeInfo: node
                        };
                        resolve(node.socketId);
                    });

                    // 请求设备信息
                    console.log('node.socketId', node.socketId);
                    this.socketManager.sendToNode(node.socketId, 'device:info:request', {});
                });

                promises.push(promise);
            }

            // 等待所有设备响应或超时
            const results = await Promise.allSettled(promises);
            
            // 只处理成功响应的节点
            const successfulNodes = results
                .filter(result => result.status === 'fulfilled')
                .map(result => result.value);

            // 记录超时的节点
            const timeoutNodes = results
                .filter(result => result.status === 'rejected')
                .map(result => result.reason.message);
            
            if (timeoutNodes.length > 0) {
                logger.warn(`部分节点响应超时: ${timeoutNodes.join(', ')}`, 'MessageHandler');
            }

            // 只更新成功响应的节点的状态
            for (const socketId of successfulNodes) {
                if (latestStates[socketId]) {
                    // 只更新设备状态信息，不影响节点的连接状态
                    this.deviceStates.set(socketId, latestStates[socketId]);
                }
            }

            logger.info(`成功获取 ${successfulNodes.length} 个设备的最新状态`, 'MessageHandler');
            
            // 返回成功节点列表和所有节点状态
            return {
                successfulNodes,  // 成功响应的节点ID列表
                deviceStates: this.getAllNodeStates()  // 所有节点的状态（包括未响应的）
            };

        } catch (error) {
            logger.error(`获取设备最新状态失败: ${error.message}`, 'MessageHandler');
            throw error;
        }
    }

    // 获取指定节点列表的状态
    getSpecificNodesStates(socketIds) {
        const states = {};
        for (const socketId of socketIds) {
            if (this.deviceStates.has(socketId)) {
                states[socketId] = this.getNodeStatus(socketId);
            }
        }
        return states;
    }
}

module.exports = new MessageHandler();
