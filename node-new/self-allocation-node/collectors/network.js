const systemCollector = require('./index');
const logger = require('../utils/logger');

class NetworkCollector {
    constructor() {
        this.count = 0;
        this.networks = [];
    }

    async startMonitoring(interval = 5000) {
        // 注册回调
        systemCollector.registerCallback('network', (data) => {
            this.count = data.count;
            this.networks = data.networks;
            
            // 打印每个网卡的使用情况
            this.networks.forEach(net => {
                logger.info(
                    `网卡 ${net.index + 1} [${net.name}] - ` +
                    `发送: ${net.txRate}Mbps, ` +
                    `接收: ${net.rxRate}Mbps, ` +
                    `带宽利用率: ${net.utilization}%`,
                    'Network'
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

module.exports = new NetworkCollector(); 