const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const logger = require('./logger');

class ConfigLoader {
    constructor() {
        this.config = null;
        this.configPath = path.join(__dirname, '../config');
        this.defaultConfigPath = path.join(this.configPath, 'default.yaml');
        this.nodeConfigPath = path.join(this.configPath, 'node-config.yaml');
    }

    // 加载YAML文件
    loadYamlFile(filePath) {
        try {
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const config = yaml.load(fileContent) || {};
            return config;
        } catch (error) {
            if (error.code === 'ENOENT') {
                logger.warn(`配置文件不存在: ${filePath}`, 'Config');
                return {};
            }
            logger.error(`加载配置文件失败: ${error.message}`, 'Config');
            return {};
        }
    }

    // 合并配置
    mergeConfig(defaultConfig, nodeConfig) {
        return {
            server: {
                host: nodeConfig.server?.host || defaultConfig.server?.host || 'localhost',
                port: nodeConfig.server?.port || defaultConfig.server?.port || 3000
            },
            node: {
                ip: nodeConfig.node?.ip || defaultConfig.node?.ip || 'localhost'
            },
            logging: {
                level: nodeConfig.logging?.level || defaultConfig.logging?.level || 'info'
            }
        };
    }

    // 加载配置
    load() {
        try {
            // 加载默认配置
            const defaultConfig = this.loadYamlFile(this.defaultConfigPath) || {};
            logger.info('已加载默认配置文件', 'Config');

            // 加载节点配置
            const nodeConfig = this.loadYamlFile(this.nodeConfigPath) || {};
            if (Object.keys(nodeConfig).length > 0) {
                logger.info('已加载节点配置文件', 'Config');
            }

            // 合并配置
            this.config = this.mergeConfig(defaultConfig, nodeConfig);

            // 只在首次加载或重新加载时输出配置信息
            if (process.env.NODE_ENV !== 'test') {
                logger.info(`当前节点配置:`, 'Config');
                logger.info(`- IP地址: ${this.config.node.ip}`, 'Config');
            }

            return this.config;
        } catch (error) {
            logger.error(`加载配置失败: ${error.message}`, 'Config');
            // 返回默认配置
            return this.config = {
                server: { host: 'localhost', port: 3000 },
                node: { ip: 'localhost' },
                logging: { level: 'info' }
            };
        }
    }

    // 获取配置
    get() {
        // 如果配置未初始化，则加载配置
        if (!this.config) {
            this.load();
        }
        return this.config;
    }

    // 重新加载配置
    reload() {
        logger.info('正在重新加载配置...', 'Config');
        return this.load();
    }
}

// 创建单例
const configLoader = new ConfigLoader();

// 导出单例（不在这里初始化）
module.exports = configLoader;

// 如果直接运行此文件，则执行测试
if (require.main === module) {
    // 测试代码
    console.log('=== 配置加载测试 ===');
    
    // 首次获取配置
    const config = configLoader.get();
    console.log('\n初始配置:', JSON.stringify(config, null, 2));

    // 测试重新加载
    setTimeout(() => {
        console.log('\n=== 重新加载测试 ===');
        const newConfig = configLoader.reload();
        console.log('\n更新后的配置:', JSON.stringify(newConfig, null, 2));
    }, 1000);
} 