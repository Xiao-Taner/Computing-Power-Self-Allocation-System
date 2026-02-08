const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const messageHandler = require('../socket/messageHandler');
const axios = require('axios');
const { defaultConfig, nodesConfig } = require('../config/config');
const frontendSocket = require('../socket/frontendSocket');
const requestCounter = require('../utils/requestCounter');

// 生成随机距离（10km-1000km）
function generateRandomDistance() {
    return Math.floor(Math.random() * (1000 - 10 + 1)) + 10;
}

// 计算用户到各个节点组的距离并排序
function calculateDistancePriority() {
    // 1. 先创建距离数据
    const distances = {
        cloud: {
            type: 'cloud',
            distance: generateRandomDistance(),
            priority: 0
        },
        edge1: {
            type: 'edge1',
            distance: generateRandomDistance(),
            priority: 0
        },
        edge2: {
            type: 'edge2',
            distance: generateRandomDistance(),
            priority: 0
        }
    };

    // 2. 将距离信息转换为数组并按距离排序
    const sortedDistances = Object.values(distances)
        .sort((a, b) => a.distance - b.distance);

    // 3. 设置优先级（0最高，2最低）
    sortedDistances.forEach((item, index) => {
        item.priority = index;
        // 4. 重要: 同步更新原distances对象中对应节点的优先级
        distances[item.type].priority = index;
    });

    // 5. 返回结果
    return {
        sortedPriority: sortedDistances,
        distances: distances
    };
}

// 添加一个请求特定节点组的函数
async function tryRequestNodeGroup(appliId, groupId, parallelCloud, logger) {
    const renderManagerUrl = `http://${parallelCloud.host}:${parallelCloud.render_port}/appli/getStartURL?appliId=${appliId}&groupId=${groupId}`;
    logger.info(`尝试请求节点组(${groupId})的URL: ${renderManagerUrl}`, 'UserAPI');

    try {
        const response = await axios.get(renderManagerUrl, {
            timeout: parallelCloud.timeout
        });

        if (!response.data) {
            return {
                success: false,
                error: "云渲染管理节点返回空数据"
            };
        }

      // 资源不足时返回特殊标记
        if (response.data.message && response.data.message.includes('渲染资源不足')) {
            return {
                success: false,
                resourceInsufficient: true,
                message: response.data.message
            };
        }

        // 其他错误
        if (response.data.code !== 1000) {
            return {
                success: false,
                error: response.data.message || "云渲染管理节点返回错误"
            };
        }

        // 成功情况
        return {
            success: true,
            data: response.data
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

// 添加一个辅助函数来将groupId转换为组名
function getGroupNameById(groupId) {
    const groupMapping = {
        [nodesConfig.group_id.cloud]: 'cloud',
        [nodesConfig.group_id.edge1]: 'edge1',
        [nodesConfig.group_id.edge2]: 'edge2'
    };
    return groupMapping[groupId] || 'unknown';
}

// 修改主要的请求处理逻辑
router.get('/render/appli/getStartURL', async (req, res) => {
    try {
        const startTime = Date.now();
        const appliId = req.query.appliId;
        const playerMode = req.query.playerMode;
        
        // 发送初始请求消息
        frontendSocket.broadcast({
            type: 'schedule_process',
            message: '用户正在请求云渲染资源',
            timestamp: Date.now()
        });

        // 发送前端调度请求消息
        frontendSocket.broadcast({
            type: 'schedule_request',
            message: '正在请求云渲染资源的调度',
            timestamp: Date.now()
        });

        // 增加渲染请求计数
        const currentCount = requestCounter.incrementRender();
        logger.info(`当前云渲染请求总数: ${currentCount}`, 'UserAPI');

        // 检查必要参数
        if (!appliId) {
            frontendSocket.broadcast({
                type: 'schedule_process',
                message: '调配失败：缺少必要参数appliId',
                status: 'error',
                timestamp: Date.now()
            });
            return res.status(400).json({
                code: 400,
                message: "缺少必要参数appliId",
                error: "参数错误"
            });
        }

        logger.info(`收到云渲染请求，应用ID: ${appliId}, 玩家模式: ${playerMode}`, 'UserAPI');
        
        frontendSocket.broadcast({
            type: 'schedule_process',
            message: '正在检查可用渲染节点状态',
            timestamp: Date.now()
        });

        // 获取设备状态前检查是否有在线节点
        const { successfulNodes, deviceStates } = await messageHandler.requestLatestDeviceStates();
        if (successfulNodes.length === 0) {
            frontendSocket.broadcast({
                type: 'schedule_process',
                message: '调配失败：所有渲染节点离线',
                status: 'error',
                timestamp: Date.now()
            });
            logger.error('没有可用的渲染节点', 'UserAPI');
            frontendSocket.broadcast({
                type: 'schedule_result',
                message: `[云渲染-${currentCount}] 调度失败 | 原因：所有节点离线`,
                status: 'error',
                data: {
                    taskType: 'render',
                    requestId: currentCount,
                    error: {
                        message: "所有渲染节点离线",
                        type: "NodesOffline"
                    },
                    timing: {
                        timestamp: Date.now()
                    }
                }
            });
            return res.status(503).json({
                code: 503,
                message: "所有渲染节点离线",
                error: "服务不可用"
            });
        }
        logger.info(`已获取最新设备状态，成功响应节点数: ${successfulNodes.length}`, 'UserAPI');
        
        frontendSocket.broadcast({
            type: 'schedule_process',
            message: `发现${successfulNodes.length}个在线节点，正在计算节点优先级`,
            timestamp: Date.now()
        });

        // 计算距离和优先级
        const distanceInfo = calculateDistancePriority();
        logger.info('用户到各节点组的距离计算完成:', 'UserAPI');

        // 发送距离计算结果
        Object.entries(distanceInfo.distances).forEach(([type, info]) => {
            frontendSocket.broadcast({
                type: 'schedule_process',
                message: `${type}节点组距离: ${info.distance}km (优先级: ${info.priority})`,
                timestamp: Date.now()
            });
        });

        // 选择节点并获取配置
        const highestPriorityNode = distanceInfo.sortedPriority[0];
        logger.info(`选择优先级最高的节点类型: ${highestPriorityNode.type}`, 'UserAPI');
        
        frontendSocket.broadcast({
            type: 'schedule_process',
            message: `优先尝试${highestPriorityNode.type}节点组，正在获取组配置`,
            timestamp: Date.now()
        });

        const groupId = nodesConfig.group_id[highestPriorityNode.type];
        if (!groupId) {
            frontendSocket.broadcast({
                type: 'schedule_process',
                message: `调配失败：无法获取${highestPriorityNode.type}节点组的配置`,
                status: 'error',
                timestamp: Date.now()
            });
            logger.error(`无法获取节点组ID: ${highestPriorityNode.type}`, 'UserAPI');
            return res.status(500).json({
                code: 500,
                message: "节点组配置错误",
                error: "系统配置错误"
            });
        }
        logger.info(`对应的组ID: ${groupId}`, 'UserAPI');

        // 获取平行云配置并验证
        const parallelCloud = defaultConfig.external_services.parallel_cloud;
        if (!parallelCloud || !parallelCloud.host || !parallelCloud.render_port) {
            frontendSocket.broadcast({
                type: 'schedule_process',
                message: '调配失败：渲染管理节点配置缺失',
                status: 'error',
                timestamp: Date.now()
            });
            logger.error('平行云管理中心配置缺失', 'UserAPI');
            return res.status(500).json({
                code: 500,
                message: "渲染管理节点配置错误",
                error: "系统配置错误"
            });
        }

        // 按优先级依次尝试请求不同节点组
        let finalResult = null;
        let attemptLogs = [];

        frontendSocket.broadcast({
            type: 'schedule_process',
            message: '开始按优先级尝试请求渲染资源',
            timestamp: Date.now()
        });

        for (const node of distanceInfo.sortedPriority) {
            const groupId = nodesConfig.group_id[node.type];
            if (!groupId) {
                frontendSocket.broadcast({
                    type: 'schedule_process',
                    message: `跳过${node.type}节点组：未找到配置`,
                    timestamp: Date.now()
                });
                logger.warn(`跳过节点组${node.type}: 未找到groupId配置`, 'UserAPI');
                continue;
            }

            frontendSocket.broadcast({
                type: 'schedule_process',
                message: `正在尝试${node.type}节点组`,
                timestamp: Date.now()
            });

            const result = await tryRequestNodeGroup(appliId, groupId, parallelCloud, logger);
          
            attemptLogs.push({
                nodeType: node.type,
                groupId: groupId,
                success: result.success,
                message: result.message || result.error
            });

            if (result.success) {
                finalResult = result;
                frontendSocket.broadcast({
                    type: 'schedule_process',
                    message: `成功获取${node.type}节点组的渲染资源`,
                    status: 'success',
                    timestamp: Date.now()
                });
                logger.info(`成功获取节点组(${node.type})的资源`, 'UserAPI');
                break;
            } else if (result.resourceInsufficient) {
                frontendSocket.broadcast({
                    type: 'schedule_process',
                    message: `${node.type}节点组资源不足，尝试下一个节点组`,
                    timestamp: Date.now()
                });
                logger.warn(`节点组(${node.type})资源不足，尝试下一个节点组`, 'UserAPI');
            } else {
                // 如果是非资源不足的错误，直接返回错误
                frontendSocket.broadcast({
                    type: 'schedule_process',
                    message: `调配失败：${node.type}节点组请求出错 - ${result.error}`,
                    status: 'error',
                    timestamp: Date.now()
                });
                logger.error(`请求节点组(${node.type})时发生错误: ${result.error}`, 'UserAPI');
                return res.status(500).json({
                    code: 500,
                    message: result.error,
                    error: "请求失败"
                });
            }
        }

        // 如果所有节点组都尝试完仍未成功
        if (!finalResult) {
            frontendSocket.broadcast({
                type: 'schedule_process',
                message: '调配失败：所有节点组资源都不足',
                status: 'error',
                timestamp: Date.now()
            });
            logger.error('所有节点组的资源都不足', 'UserAPI');
            frontendSocket.broadcast({
                type: 'schedule_result',
                message: `[云渲染-${currentCount}] 调度失败 | 原因：所有节点组资源不足`,
                status: 'error',
                data: {
                    taskType: 'render',
                    requestId: currentCount,
                    error: {
                        message: "所有可用节点组资源都不足",
                        type: "ResourceInsufficient"
                    },
                    timing: {
                        timestamp: Date.now()
                    }
                }
            });
            return res.status(503).json({
                code: 503,
                message: "所有可用节点组资源都不足，请稍后重试",
                error: "资源不足",
                attempts: attemptLogs
            });
        }

        // 处理成功获取的URL
        const applicationUrl = finalResult.data.result;
        if (!applicationUrl) {
            frontendSocket.broadcast({
                type: 'schedule_process',
                message: '调配失败：获取到的应用URL为空',
                status: 'error',
                timestamp: Date.now()
            });
            logger.error('获取到的应用URL为空', 'UserAPI');
            return res.status(500).json({
                code: 500,
                message: "获取应用URL失败",
                error: "返回数据错误"
            });
        }
        logger.info(`获取到应用URL: ${applicationUrl}`, 'UserAPI');

        frontendSocket.broadcast({
            type: 'schedule_process',
            message: '正在解析渲染服务器地址',
            timestamp: Date.now()
        });

        // 提取renderServerIp
        let renderServerIp = '';
        try {
            const urlParams = new URLSearchParams(applicationUrl.split('?')[1]);
            renderServerIp = urlParams.get('renderServerIp');
            if (!renderServerIp) {
                throw new Error('URL中未包含renderServerIp参数');
            }
            logger.info(`提取到渲染服务器IP: ${renderServerIp}`, 'UserAPI');
        } catch (error) {
            frontendSocket.broadcast({
                type: 'schedule_process',
                message: `调配失败：解析渲染服务器地址失败 - ${error.message}`,
                status: 'error',
                timestamp: Date.now()
            });
            logger.error(`提取渲染服务器IP失败: ${error.message}`, 'UserAPI');
            return res.status(500).json({
                code: 500,
                message: "解析渲染服务器地址失败",
                error: error.message
            });
        }

        // 构建简洁URL
        const simpleUrl = `http://${parallelCloud.host}:${parallelCloud.render_port}/webclient/?appliId=${appliId}&groupId=${groupId}&codeRate=${parallelCloud.codeRate}&frameRate=${parallelCloud.frameRate}&playerMode=${playerMode}&renderServerIp=${renderServerIp}`;
        logger.info(`简洁的URL: ${simpleUrl}`, 'UserAPI');

        const endTime = Date.now();
        const duration = endTime - startTime;

        // 发送最终成功消息
        frontendSocket.broadcast({
            type: 'schedule_process',
            message: `调配云渲染资源成功，调配耗时${duration}ms，已分配${renderServerIp}服务器提供服务`,
            status: 'success',
            nodeInfo: {
                ip: renderServerIp,
                url: simpleUrl
            },
            timestamp: Date.now()
        });

        // 在成功调度后、发送schedule_result消息之前添加
        const groupName = getGroupNameById(groupId);
        requestCounter.incrementGroupCount(groupName, 'render');
        // 打印requestCounter.getCounts()
        console.log('requestCounter.getCounts()', requestCounter.getCounts());
        
        // 修改schedule_result消息，添加counts数据
        frontendSocket.broadcast({
            type: 'schedule_result',
            message: `[云渲染-${currentCount}] 调度成功 | 分配至${groupName}组${renderServerIp}节点 | 耗时${duration}ms`,
            status: 'success',
            data: {
                taskType: 'render',
                requestId: currentCount,
                selectedNode: {
                    ip: renderServerIp,
                    group: groupName,
                    url: simpleUrl
                },
                groupStats: {
                    selectedGroup: groupName,
                    allGroupsUsage: Object.fromEntries(
                        Object.entries(distanceInfo.distances)
                            .map(([group, data]) => [group, data.priority])
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

        // 在返回数据中添加尝试记录
        res.json({
            code: 200,
            message: "success",
            data: {
                simpleUrl: simpleUrl,
                distances: distanceInfo.distances,
                sortedPriority: distanceInfo.sortedPriority,
                successfulNodes: successfulNodes,
                deviceStates: deviceStates,
                applicationUrl: applicationUrl,
                playerMode: playerMode,
                renderServerIp: renderServerIp,
                attempts: attemptLogs,
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
        logger.error(`处理云渲染请求失败: ${error.message}`, 'UserAPI');
        frontendSocket.broadcast({
            type: 'schedule_result',
            message: `[云渲染-${currentCount}] 调度失败 | 原因：${error.message}`,
            status: 'error',
            data: {
                taskType: 'render',
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