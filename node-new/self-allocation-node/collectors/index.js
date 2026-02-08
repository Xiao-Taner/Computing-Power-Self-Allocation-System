const si = require('systeminformation');
const logger = require('../utils/logger');

class SystemCollector {
    constructor() {
        this.data = {
            cpu: { model: '', usage: 0 },
            memory: { count: 0, memories: [], total: 0, used: 0, usage: 0 },
            disk: { count: 0, disks: [] },
            gpu: { count: 0, gpus: [] },
            network: { count: 0, networks: [] }
        };
        this.callbacks = new Map();  // 存储各个模块的回调函数
        this.timer = null;
        this.isFirstRun = true;
        this.latestData = null;  // 添加存储最新数据的属性
    }

    // 统一初始化
    async initialize() {
        try {
            // 一次性获取所有需要的信息
            const [
                cpuInfo,
                memLayout,
                diskLayout,
                gpuInfo,
                networkInterfaces,
                networkStats
            ] = await Promise.all([
                si.cpu(),
                si.memLayout(),
                si.diskLayout(),
                si.graphics(),
                si.networkInterfaces(),
                si.networkStats()
            ]);

            // 初始化各个模块的静态信息
            this.initCPU(cpuInfo);
            this.initMemory(memLayout);
            this.initDisk(diskLayout);
            this.initGPU(gpuInfo);
            this.initNetwork(networkInterfaces, networkStats);

            this.isFirstRun = false;
            logger.info('系统信息采集器初始化完成', 'System');
        } catch (error) {
            logger.error(`系统信息采集器初始化失败: ${error.message}`, 'System');
        }
    }

    // 统一的数据更新
    async updateData() {
        try {
            // 一次性获取所有动态信息
            const [
                cpuLoad,
                memInfo,
                fsSize,
                gpuInfo,
                networkStats
            ] = await Promise.all([
                si.currentLoad(),
                si.mem(),
                si.fsSize(),
                si.graphics(),
                si.networkStats()
            ]);

            // 更新各个模块的动态信息
            this.updateCPU(cpuLoad);
            this.updateMemory(memInfo);
            this.updateDisk(fsSize);
            this.updateGPU(gpuInfo);
            this.updateNetwork(networkStats);

            // 触发各个模块的回调
            for (const [module, callback] of this.callbacks) {
                callback(this.data[module]);
            }

            // 保存最新数据
            this.latestData = {
                timestamp: Date.now(),
                cpu: {
                    model: this.data.cpu.model,
                    usage: this.data.cpu.usage
                },
                memory: {
                    total: this.data.memory.total,
                    used: this.data.memory.used,
                    usage: this.data.memory.usage,
                    details: this.data.memory.memories.map(mem => ({
                        model: mem.model,
                        size: mem.size,
                        used: mem.used,
                        usage: mem.usage
                    }))
                },
                gpu: {
                    count: this.data.gpu.count,
                    devices: this.data.gpu.gpus.map(gpu => ({
                        model: gpu.model,
                        vram: gpu.vram,
                        vramUsed: gpu.vramUsed,
                        vramUsage: gpu.vramUsage,
                        usage: gpu.usage
                    }))
                },
                disk: {
                    count: this.data.disk.count,
                    devices: this.data.disk.disks.map(disk => ({
                        mount: disk.mount,
                        model: disk.model,
                        totalSize: disk.totalSize,
                        usedSize: disk.usedSize,
                        usagePercent: disk.usagePercent
                    }))
                },
                network: {
                    count: this.data.network.count,
                    interfaces: this.data.network.networks.map(net => ({
                        name: net.name,
                        model: net.model,
                        speed: net.speedMbps,
                        txRate: net.txRate,
                        rxRate: net.rxRate,
                        utilization: net.utilization
                    }))
                }
            };
        } catch (error) {
            logger.error(`系统信息更新失败: ${error.message}`, 'System');
        }
    }

    // 注册模块回调
    registerCallback(module, callback) {
        this.callbacks.set(module, callback);
    }

    // 启动监控
    async startMonitoring(interval = 5000) {
        if (this.isFirstRun) {
            await this.initialize();
        }

        this.timer = setInterval(() => this.updateData(), interval);
        return this.timer;
    }

    // 停止监控
    stopMonitoring() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
            logger.info('系统信息采集器已停止', 'System');
        }
    }

    // CPU相关方法
    initCPU(cpuInfo) {
        this.data.cpu.model = cpuInfo.manufacturer + ' ' + cpuInfo.brand;
        logger.info(`CPU型号: ${this.data.cpu.model}`, 'CPU');
    }

    updateCPU(cpuLoad) {
        this.data.cpu.usage = Math.round(cpuLoad.currentLoad * 100) / 100;
    }

    // GPU相关方法
    initGPU(gpuInfo) {
        const controllers = gpuInfo.controllers.filter(ctrl => 
            ctrl.vendor && 
            ctrl.vendor.toUpperCase().includes('NVIDIA')
        );

        this.data.gpu.count = controllers.length;
        this.data.gpu.gpus = controllers.map((gpu, index) => ({
            index: index,
            model: `${gpu.vendor} ${gpu.model}`.trim(),
            vram: Math.round(gpu.memoryTotal / 1024), // 转换为GB
            vramUsed: 0,
            vramUsage: 0,
            usage: 0
        }));

        logger.info(`发现 ${this.data.gpu.count} 个GPU`, 'GPU');
        this.data.gpu.gpus.forEach(gpu => {
            logger.info(`GPU ${gpu.index + 1} - 型号: ${gpu.model}, 显存: ${gpu.vram}GB`, 'GPU');
        });
    }

    updateGPU(gpuInfo) {
        const controllers = gpuInfo.controllers.filter(ctrl => 
            ctrl.vendor && 
            ctrl.vendor.toUpperCase().includes('NVIDIA')
        );

        this.data.gpu.gpus = this.data.gpu.gpus.map((gpu, index) => {
            const controller = controllers[index];
            if (controller) {
                return {
                    ...gpu,
                    vramUsed: Math.round(controller.memoryUsed / 1024 * 100) / 100,
                    vramUsage: Math.round(controller.memoryUsed / controller.memoryTotal * 10000) / 100,
                    usage: Math.round(controller.utilizationGpu || 0)
                };
            }
            return gpu;
        });
    }

    // 内存相关方法
    initMemory(memLayout) {
        this.data.memory.count = memLayout.length;
        this.data.memory.memories = memLayout.map((mem, index) => ({
            index: index,
            model: `${mem.manufacturer} ${mem.partNum}`.trim() || 'Unknown Memory',
            size: Math.round(mem.size / (1024 * 1024 * 1024) * 100) / 100, // GB
            type: mem.type || 'Unknown',
            clockSpeed: mem.clockSpeed ? `${mem.clockSpeed}MHz` : 'Unknown',
            used: 0,
            usage: 0
        }));

        this.data.memory.total = this.data.memory.memories.reduce((total, mem) => total + mem.size, 0);

        logger.info(`发现 ${this.data.memory.count} 条内存`, 'Memory');
        this.data.memory.memories.forEach(mem => {
            logger.info(
                `内存 ${mem.index + 1} - 型号: ${mem.model}, ` +
                `容量: ${mem.size}GB, 类型: ${mem.type}, 频率: ${mem.clockSpeed}`,
                'Memory'
            );
        });
    }

    updateMemory(memInfo) {
        this.data.memory.used = Math.round(memInfo.active / (1024 * 1024 * 1024) * 100) / 100;
        this.data.memory.usage = Math.round(memInfo.active / memInfo.total * 10000) / 100;

        this.data.memory.memories = this.data.memory.memories.map(mem => ({
            ...mem,
            used: Math.round(mem.size * this.data.memory.usage / 100 * 100) / 100,
            usage: this.data.memory.usage
        }));
    }

    // 磁盘相关方法
    async initDisk(diskLayout) {
        const fsSize = await si.fsSize();
        this.data.disk.disks = fsSize.map((fs, index) => {
            const matchingDisk = diskLayout[index] || {};
            return {
                mount: fs.mount,
                model: `${matchingDisk.vendor || ''} ${matchingDisk.name || ''}`.trim() || 'Unknown Disk',
                totalSize: 0,
                usedSize: 0,
                usagePercent: 0
            };
        });

        this.data.disk.count = this.data.disk.disks.length;

        logger.info(`发现 ${this.data.disk.count} 个磁盘`, 'Disk');
        this.data.disk.disks.forEach(disk => {
            logger.info(`磁盘信息 - 挂载点: ${disk.mount}, 型号: ${disk.model}`, 'Disk');
        });
    }

    updateDisk(fsSize) {
        this.data.disk.disks = this.data.disk.disks.map((disk, index) => {
            const fs = fsSize[index];
            if (fs) {
                return {
                    ...disk,
                    totalSize: Math.round(fs.size / (1024 * 1024 * 1024) * 100) / 100,
                    usedSize: Math.round(fs.used / (1024 * 1024 * 1024) * 100) / 100,
                    usagePercent: Math.round(fs.use * 100) / 100
                };
            }
            return disk;
        });
    }

    // 网络相关方法
    initNetwork(networkInterfaces, networkStats) {
        // 过滤掉虚拟接口和未启用的接口
        const activeInterfaces = networkInterfaces.filter(net => 
            net.operstate === 'up' && 
            !net.internal && 
            net.type !== 'virtual'
        );

        this.data.network.count = activeInterfaces.length;
        this.data.network.networks = activeInterfaces.map((net, index) => ({
            index: index,
            name: net.iface,
            model: `${net.manufacturer || ''} ${net.model || ''}`.trim() || 'Unknown Network Card',
            speed: net.speed || 1000,
            speedMbps: Math.round((net.speed || 1000) / 1024 * 100) / 100,
            txRate: 0,
            rxRate: 0,
            utilization: 0
        }));

        logger.info(`发现 ${this.data.network.count} 个网卡`, 'Network');
        this.data.network.networks.forEach(net => {
            logger.info(
                `网卡 ${net.index + 1} - 名称: ${net.name}, ` +
                `型号: ${net.model}, 带宽: ${net.speedMbps}Gbps`,
                'Network'
            );
        });

        // 初始化网络统计数据
        this.lastNetworkStats = new Map();
        networkStats.forEach(stat => {
            this.lastNetworkStats.set(stat.iface, {
                tx_bytes: stat.tx_bytes,
                rx_bytes: stat.rx_bytes,
                timestamp: Date.now()
            });
        });
    }

    updateNetwork(networkStats) {
        const currentTime = Date.now();

        this.data.network.networks = this.data.network.networks.map(net => {
            const currentStat = networkStats.find(stat => stat.iface === net.name);
            const lastStat = this.lastNetworkStats.get(net.name);

            if (currentStat && lastStat) {
                const timeDiff = (currentTime - lastStat.timestamp) / 1000;
                const txDiff = currentStat.tx_bytes - lastStat.tx_bytes;
                const rxDiff = currentStat.rx_bytes - lastStat.rx_bytes;

                const txRate = Math.round(txDiff * 8 / timeDiff / 1024 / 1024 * 100) / 100;
                const rxRate = Math.round(rxDiff * 8 / timeDiff / 1024 / 1024 * 100) / 100;
                const totalRate = txRate + rxRate;
                const utilization = Math.round(totalRate / (net.speed || 1000) * 10000) / 100;

                this.lastNetworkStats.set(net.name, {
                    tx_bytes: currentStat.tx_bytes,
                    rx_bytes: currentStat.rx_bytes,
                    timestamp: currentTime
                });

                return {
                    ...net,
                    txRate,
                    rxRate,
                    utilization
                };
            }
            return net;
        });
    }

    // 获取所有设备信息
    async get() {
        try {
            // 如果是首次运行，先初始化
            if (this.isFirstRun) {
                await this.initialize();
            }

            // 更新所有数据
            await this.updateData();

            // 返回当前设备信息
            return {
                timestamp: Date.now(),
                cpu: {
                    model: this.data.cpu.model,
                    usage: this.data.cpu.usage
                },
                memory: {
                    total: this.data.memory.total,
                    used: this.data.memory.used,
                    usage: this.data.memory.usage,
                    details: this.data.memory.memories.map(mem => ({
                        model: mem.model,
                        size: mem.size,
                        used: mem.used,
                        usage: mem.usage
                    }))
                },
                gpu: {
                    count: this.data.gpu.count,
                    devices: this.data.gpu.gpus.map(gpu => ({
                        model: gpu.model,
                        vram: gpu.vram,
                        vramUsed: gpu.vramUsed,
                        vramUsage: gpu.vramUsage,
                        usage: gpu.usage
                    }))
                },
                disk: {
                    count: this.data.disk.count,
                    devices: this.data.disk.disks.map(disk => ({
                        mount: disk.mount,
                        model: disk.model,
                        totalSize: disk.totalSize,
                        usedSize: disk.usedSize,
                        usagePercent: disk.usagePercent
                    }))
                },
                network: {
                    count: this.data.network.count,
                    interfaces: this.data.network.networks.map(net => ({
                        name: net.name,
                        model: net.model,
                        speed: net.speedMbps,
                        txRate: net.txRate,
                        rxRate: net.rxRate,
                        utilization: net.utilization
                    }))
                }
            };
        } catch (error) {
            logger.error(`获取设备信息失败: ${error.message}`, 'System');
            throw error;
        }
    }

    // 获取最新数据
    getLatest() {
        return this.latestData || {
            timestamp: Date.now(),
            cpu: { model: '', usage: 0 },
            memory: { total: 0, used: 0, usage: 0, details: [] },
            gpu: { count: 0, devices: [] },
            disk: { count: 0, devices: [] },
            network: { count: 0, interfaces: [] }
        };
    }
}

// 导出单例
const systemCollector = new SystemCollector();
module.exports = systemCollector;

// 如果直接运行此文件，则执行测试代码
if (require.main === module) {
    async function test() {
        try {
            // 加载所有采集器
            const cpuCollector = require('./cpu');
            const gpuCollector = require('./gpu');
            const memoryCollector = require('./memory');
            const diskCollector = require('./disk');
            const networkCollector = require('./network');

            // 启动所有监控，设置2秒的间隔时间
            await Promise.all([
                cpuCollector.startMonitoring(2000),
                gpuCollector.startMonitoring(2000),
                memoryCollector.startMonitoring(2000),
                diskCollector.startMonitoring(2000),
                networkCollector.startMonitoring(2000)
            ]);

            // 运行30秒后停止
            setTimeout(() => {
                cpuCollector.stopMonitoring();
                gpuCollector.stopMonitoring();
                memoryCollector.stopMonitoring();
                diskCollector.stopMonitoring();
                networkCollector.stopMonitoring();
                logger.info('测试完成', 'System');
            }, 30000);

        } catch (error) {
            logger.error(`测试失败: ${error.message}`, 'System');
        }
    }

    test();
} 