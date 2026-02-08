const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const messageHandler = require('../socket/messageHandler');
const axios = require('axios');
const { defaultConfig, nodesConfig } = require('../config/config');
const frontendSocket = require('../socket/frontendSocket');
const requestCounter = require('../utils/requestCounter');  // 添加计数器

// 处理仿真解算节点请求
router.get('/simulation/getNode', async (req, res) => {
    try {
        const startTime = Date.now();
        logger.info('收到仿真解算节点请求', 'UserAPI');
        
        // 发送初始请求消息
        frontendSocket.broadcast({
            type: 'schedule_process',
            message: '用户正在请求仿真解算资源',
            timestamp: Date.now()
        });

        // 发送前端调度请求消息
        frontendSocket.broadcast({
            type: 'schedule_request',
            message: '正在请求仿真解算资源的调度',
            timestamp: Date.now()
        });

        // 增加仿真请求计数
        const currentCount = requestCounter.incrementSim();
        logger.info(`当前仿真解算请求总数: ${currentCount}`, 'UserAPI');

        frontendSocket.broadcast({
            type: 'schedule_process',
            message: '正在检查可用节点状态',
            timestamp: Date.now()
        });

        // 获取设备状态前检查是否有在线节点
        const { successfulNodes, deviceStates } = await messageHandler.requestLatestDeviceStates();
        if (successfulNodes.length === 0) {
            frontendSocket.broadcast({
                type: 'schedule_process',
                message: '调配失败：所有仿真解算节点离线',
                status: 'error',
                timestamp: Date.now()
            });
            logger.error('没有可用的仿真解算节点', 'UserAPI');
            frontendSocket.broadcast({
                type: 'schedule_result',
                message: `[仿真解算-${currentCount}] 调度失败 | 原因：所有节点离线`,
                status: 'error',
                data: {
                    taskType: 'simulation',
                    requestId: currentCount,
                    error: {
                        message: "所有仿真解算节点离线",
                        type: "NodesOffline"
                    },
                    timing: {
                        timestamp: Date.now()
                    }
                }
            });
            return res.status(503).json({
                code: 503,
                message: "所有仿真解算节点离线",
                error: "服务不可用"
            });
        }
        logger.info(`已获取最新设备状态，成功响应节点数: ${successfulNodes.length}`, 'UserAPI');

        frontendSocket.broadcast({
            type: 'schedule_process',
            message: `发现${successfulNodes.length}个在线节点，正在筛选Windows节点`,
            timestamp: Date.now()
        });

        // 1. 筛选Windows节点（仿真解算优先使用Windows节点）
        let availableNodes = successfulNodes.filter(nodeId => {
            const nodeState = deviceStates[nodeId];
            return nodeState && nodeState.os && nodeState.os.toLowerCase().includes('windows');
        });

        // 如果没有Windows节点，则使用Ubuntu节点
        if (availableNodes.length === 0) {
            frontendSocket.broadcast({
                type: 'schedule_process',
                message: '未找到Windows节点，将使用Ubuntu节点作为备选',
                timestamp: Date.now()
            });
            logger.warn('没有可用的Windows节点，将使用Ubuntu节点', 'UserAPI');
            availableNodes = successfulNodes;
        } else {
            frontendSocket.broadcast({
                type: 'schedule_process',
                message: `找到${availableNodes.length}个Windows节点`,
                timestamp: Date.now()
            });
        }

        frontendSocket.broadcast({
            type: 'schedule_process',
            message: '正在计算各节点组的GPU资源状态',
            timestamp: Date.now()
        });

        // 2. 按节点组计算GPU利用率
        const groupGpuUsage = {
            cloud: { nodes: [], totalUsage: 0, count: 0 },
            edge1: { nodes: [], totalUsage: 0, count: 0 },
            edge2: { nodes: [], totalUsage: 0, count: 0 }
        };

        // 将节点分组并计算每组的GPU利用率
        availableNodes.forEach(nodeId => {
            const nodeState = deviceStates[nodeId];
            const nodeGroup = nodeState.type;
            if (groupGpuUsage[nodeGroup]) {
                const gpuUsage = nodeState.gpu ? nodeState.gpu.utilizationGpu : 0;
                groupGpuUsage[nodeGroup].nodes.push({
                    nodeId,
                    gpuUsage,
                    state: nodeState
                });
                groupGpuUsage[nodeGroup].totalUsage += gpuUsage;
                groupGpuUsage[nodeGroup].count++;
            }
        });

        // 计算每组的平均GPU利用率并发送状态
        Object.keys(groupGpuUsage).forEach(group => {
            if (groupGpuUsage[group].count > 0) {
                groupGpuUsage[group].avgUsage = groupGpuUsage[group].totalUsage / groupGpuUsage[group].count;
                frontendSocket.broadcast({
                    type: 'schedule_process',
                    message: `${group}组平均GPU利用率: ${groupGpuUsage[group].avgUsage.toFixed(2)}%`,
                    timestamp: Date.now()
                });
            }
        });

        // 找出GPU利用率最低的组
        const lowestGroup = Object.entries(groupGpuUsage)
            .filter(([_, data]) => data.count > 0)
            .reduce((lowest, [group, data]) => {
                if (!lowest || data.avgUsage < lowest.avgUsage) {
                    return { group, avgUsage: data.avgUsage, nodes: data.nodes };
                }
                return lowest;
            }, null);

        if (!lowestGroup) {
            frontendSocket.broadcast({
                type: 'schedule_process',
                message: '调配失败：无法找到合适的节点组',
                status: 'error',
                timestamp: Date.now()
            });
            logger.error('无法找到合适的节点组', 'UserAPI');
            frontendSocket.broadcast({
                type: 'schedule_result',
                message: `[仿真解算-${currentCount}] 调度失败 | 原因：无法找到合适的节点组`,
                status: 'error',
                data: {
                    taskType: 'simulation',
                    requestId: currentCount,
                    error: {
                        message: "无法找到合适的节点组",
                        type: "NoSuitableGroup"
                    },
                    timing: {
                        timestamp: Date.now()
                    }
                }
            });
            return res.status(503).json({
                code: 503,
                message: "无法找到合适的节点",
                error: "资源不可用"
            });
        }

        frontendSocket.broadcast({
            type: 'schedule_process',
            message: `已选择${lowestGroup.group}组作为目标组，正在选择最优节点`,
            timestamp: Date.now()
        });

        // 3. 从最低负载组中选择GPU利用率最低的节点
        const selectedNode = lowestGroup.nodes.reduce((lowest, current) => {
            if (!lowest || current.gpuUsage < lowest.gpuUsage) {
                return current;
            }
            return lowest;
        });

        const endTime = Date.now();
        const duration = endTime - startTime;

        logger.info(`已选择节点: ${selectedNode.nodeId}, GPU利用率: ${selectedNode.gpuUsage}%`, 'UserAPI');

        // 发送最终成功消息
        frontendSocket.broadcast({
            type: 'schedule_process',
            message: `调配仿真解算资源成功，调配耗时${duration}ms，已分配${selectedNode.state.ip}服务器提供服务`,
            status: 'success',
            nodeInfo: {
                ip: selectedNode.state.ip,
                gpuUsage: selectedNode.gpuUsage,
                group: lowestGroup.group
            },
            requestCount: currentCount,
            timestamp: Date.now()
        });

        // 在成功调度后、发送schedule_result消息之前添加
        requestCounter.incrementGroupCount(lowestGroup.group, 'simulation');

        // 修改schedule_result消息，添加counts数据
        frontendSocket.broadcast({
            type: 'schedule_result',
            message: `[仿真解算-${currentCount}] 调度成功 | 分配至${lowestGroup.group}组${selectedNode.state.ip}节点 | GPU利用率${selectedNode.gpuUsage}% | 耗时${duration}ms`,
            status: 'success',
            data: {
                taskType: 'simulation',
                requestId: currentCount,
                selectedNode: {
                    ip: selectedNode.state.ip,
                    group: lowestGroup.group,
                    gpuUsage: `${selectedNode.gpuUsage}%`
                },
                groupStats: {
                    selectedGroup: lowestGroup.group,
                    avgGroupUsage: `${lowestGroup.avgUsage.toFixed(2)}%`,
                    allGroupsUsage: Object.fromEntries(
                        Object.entries(groupGpuUsage)
                            .map(([group, data]) => [group, `${data.avgUsage?.toFixed(2) || 0}%`])
                    )
                },
                timing: {
                    duration: `${duration}ms`,
                    timestamp: Date.now()
                },
                counts: requestCounter.getCounts()
            }
        });

        // 在成功调度后、返回响应之前添加（在schedule_result消息之后）
        frontendSocket.broadcast({
            type: 'schedule_count',
            data: requestCounter.getCounts(),
            timestamp: Date.now()
        });

        // 返回节点信息
        res.json({
            code: 200,
            message: "success",
            data: {
                nodeId: selectedNode.nodeId,
                nodeState: selectedNode.state,
                groupInfo: {
                    group: lowestGroup.group,
                    avgGroupUsage: lowestGroup.avgUsage
                },
                allGroupsUsage: Object.fromEntries(
                    Object.entries(groupGpuUsage)
                        .map(([group, data]) => [group, data.avgUsage])
                ),
                requestCount: currentCount,
                scheduleDuration: duration,
                timestamp: Date.now()
            }
        });

    } catch (error) {
        frontendSocket.broadcast({
            type: 'schedule_process',
            message: `调配失败：${error.message}`,
            status: 'error',
            timestamp: Date.now()
        });
        logger.error(`处理仿真解算节点请求失败: ${error.message}`, 'UserAPI');
        frontendSocket.broadcast({
            type: 'schedule_result',
            message: `[仿真解算-${currentCount}] 调度失败 | 原因：${error.message}`,
            status: 'error',
            data: {
                taskType: 'simulation',
                requestId: currentCount,
                error: {
                    message: error.message,
                    type: error.name
                },
                timing: {
                    timestamp: Date.now()
                }
            }
        });
        res.status(500).json({
            code: 500,
            message: "处理请求时发生未知错误",
            error: error.message
        });
    }
});

module.exports = router;
