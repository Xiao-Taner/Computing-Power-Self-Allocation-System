const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

// 加载配置文件
function loadConfig() {
    try {
        // 加载default.yaml
        const defaultConfigPath = path.join(__dirname, 'default.yaml');
        const defaultConfig = yaml.load(fs.readFileSync(defaultConfigPath, 'utf8'));

        // 加载nodes.yaml
        const nodesConfigPath = path.join(__dirname, 'nodes.yaml');
        const nodesConfig = yaml.load(fs.readFileSync(nodesConfigPath, 'utf8'));

        // 合并配置
        return {
            defaultConfig,
            nodesConfig
        };
    } catch (error) {
        console.error('加载配置文件失败:', error);
        process.exit(1);
    }
}

// 导出配置
const config = loadConfig();
module.exports = config;
