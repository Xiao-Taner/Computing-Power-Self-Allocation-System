const express = require('express');
const http = require('http');
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');
const logger = require('./utils/logger');
const socketManager = require('./socket/socketManager');
const frontendSocket = require('./socket/frontendSocket');
const cors = require('cors');

class App {
    constructor() {
        this.app = express();  // API服务器(3100端口)
        this.userApp = express();  // 用户请求服务器(3200端口)
        this.config = this.loadConfig();
        
        // 创建三个服务器
        this.apiServer = http.createServer(this.app);       // API服务器
        this.socketServer = http.createServer();            // Socket服务器
        this.userServer = http.createServer(this.userApp);  // 用户请求服务器

        // 初始化前端WebSocket服务
        frontendSocket.initialize(this.apiServer);

        // 为两个express应用添加中间件
        this.setupMiddleware(this.app);
        this.setupMiddleware(this.userApp);
        
        // 初始化路由
        this.initializeRoutes();
    }

    // 设置中间件
    setupMiddleware(app) {
        app.use(cors());
        app.use(express.json());
    }

    // 初始化路由
    initializeRoutes() {
        // API服务器路由(3100端口)
        const showDeviceRoutes = require('./routes/show/device');
        this.app.use('/show/device', showDeviceRoutes);

        // 用户请求服务器路由(3200端口)
        const userRenderRoutes = require('./routes/userRenderService');
        const userOllamaRoutes = require('./routes/userOllamaService');
        const userSimulationRoutes = require('./routes/userSimulationService');
        this.userApp.use('/', userRenderRoutes);
        this.userApp.use('/', userOllamaRoutes);
        this.userApp.use('/', userSimulationRoutes);
    }

    // 加载配置文件
    loadConfig() {
        try {
            const configPath = path.join(process.cwd(), 'config', 'default.yaml');
            return yaml.load(fs.readFileSync(configPath, 'utf8'));
        } catch (error) {
            logger.error(`加载配置文件失败: ${error.message}`, 'App');
            process.exit(1);
        }
    }

    // 初始化应用
    async initialize() {
        try {
            // 初始化Socket服务
            socketManager.initialize(this.socketServer);

            // 启动Socket服务器(3000端口)
            const { socket_port } = this.config.server;
            this.socketServer.listen(socket_port, () => {
                logger.info(`Socket服务器已启动，监听端口 ${socket_port}`, 'App');
            });

            // 启动API服务器(3100端口)
            const { api_port } = this.config.server;
            this.apiServer.listen(api_port, () => {
                logger.info(`API服务器已启动，监听端口 ${api_port}`, 'App');
            });

            // 启动用户请求服务器(3200端口)
            const { user_port } = this.config.server;
            this.userServer.listen(user_port, () => {
                logger.info(`用户请求服务器已启动，监听端口 ${user_port}`, 'App');
            });

            // 处理进程退出
            this.handleProcessExit();

        } catch (error) {
            logger.error(`应用初始化失败: ${error.message}`, 'App');
            process.exit(1);
        }
    }

    // 处理进程退出
    handleProcessExit() {
        process.on('SIGINT', () => this.shutdown());
        process.on('SIGTERM', () => this.shutdown());
    }

    // 优雅关闭
    shutdown() {
        logger.info('正在关闭应用...', 'App');
        
        // 关闭所有socket连接
        socketManager.shutdown();
        frontendSocket.shutdown();

        // 然后关闭所有服务器
        this.socketServer.close();
        this.apiServer.close();
        this.userServer.close(() => {
            logger.info('应用已关闭', 'App');
            process.exit(0);
        });

        // 设置超时强制退出
        setTimeout(() => {
            logger.error('关闭超时，强制退出', 'App');
            process.exit(1);
        }, 5000);
    }
}

// 创建并启动应用
const app = new App();
app.initialize();

// 导出app实例，以便其他模块使用
module.exports = app;
