const systemCollector = require('./index');
const logger = require('../utils/logger');

class DiskCollector {
    constructor() {
        this.count = 0;
        this.disks = [];
    }

    async startMonitoring(interval = 5000) {
        // 注册回调
        systemCollector.registerCallback('disk', (data) => {
            this.count = data.count;
            this.disks = data.disks;
            
            // 打印每个磁盘的使用情况
            this.disks.forEach(disk => {
                logger.info(
                    `磁盘 ${disk.mount} - 已用: ${disk.usedSize}GB / ${disk.totalSize}GB (${disk.usagePercent}%)`,
                    'Disk'
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

module.exports = new DiskCollector(); 