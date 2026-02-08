const systemCollector = require('./index');
const logger = require('../utils/logger');

class CPUCollector {
    constructor() {
        this.model = '';
        this.usage = 0;
    }

    async startMonitoring(interval = 5000) {
        // 注册回调
        systemCollector.registerCallback('cpu', (data) => {
            this.model = data.model;
            this.usage = data.usage;
            logger.info(`CPU使用率: ${this.usage}%`, 'CPU');
        });

        // 使用中心化的采集器
        return systemCollector.startMonitoring(interval);
    }

    stopMonitoring() {
        systemCollector.stopMonitoring();
    }
}

module.exports = new CPUCollector(); 