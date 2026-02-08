const systemCollector = require('./index');
const logger = require('../utils/logger');

class MemoryCollector {
    constructor() {
        this.count = 0;
        this.memories = [];
        this.total = 0;
        this.used = 0;
        this.usage = 0;
    }

    async startMonitoring(interval = 5000) {
        // 注册回调
        systemCollector.registerCallback('memory', (data) => {
            this.count = data.count;
            this.memories = data.memories;
            this.total = data.total;
            this.used = data.used;
            this.usage = data.usage;
            
            // 打印总体使用情况
            logger.info(
                `系统内存使用: ${this.used}GB/${this.total}GB (${this.usage}%)`,
                'Memory'
            );

            // 打印每条内存的使用情况
            this.memories.forEach(mem => {
                logger.info(
                    `内存 ${mem.index + 1} [${mem.model}] - ` +
                    `已用: ${mem.used}GB/${mem.size}GB (${mem.usage}%)`,
                    'Memory'
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

module.exports = new MemoryCollector(); 