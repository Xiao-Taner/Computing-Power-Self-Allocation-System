const systemCollector = require('./index');
const logger = require('../utils/logger');

class GPUCollector {
    constructor() {
        this.count = 0;
        this.gpus = [];
    }

    async startMonitoring(interval = 5000) {
        // 注册回调
        systemCollector.registerCallback('gpu', (data) => {
            this.count = data.count;
            this.gpus = data.gpus;
            
            // 打印每个GPU的使用情况
            this.gpus.forEach(gpu => {
                logger.info(
                    `GPU ${gpu.index + 1} [${gpu.model}] - ` +
                    `显存: ${gpu.vramUsed}GB/${gpu.vram}GB (${gpu.vramUsage}%), ` +
                    `使用率: ${gpu.usage}%`,
                    'GPU'
                );
            });
        });

        // 使用中心化的采集器
        return systemCollector.startMonitoring(interval);
    }

    stopMonitoring() {
        systemCollector.stopMonitoring();
    }
}

module.exports = new GPUCollector(); 