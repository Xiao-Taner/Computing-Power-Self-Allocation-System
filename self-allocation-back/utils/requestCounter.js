// 全局请求计数器
let aiCount = 0;
let renderCount = 0;
let simCount = 0;

// 云节点组请求计数器
const cloudCounts = {
    ai: 0,
    render: 0,
    simulation: 0
};

// 边1节点组请求计数器
const edge1Counts = {
    ai: 0,
    render: 0,
    simulation: 0
};

// 边2节点组请求计数器
const edge2Counts = {
    ai: 0,
    render: 0,
    simulation: 0
};

module.exports = {
    // 原有的计数方法
    incrementAI: () => ++aiCount,
    incrementRender: () => ++renderCount,
    incrementSim: () => ++simCount,
    
    // 新增的节点组计数方法
    incrementGroupCount: (group, type) => {
        switch(group) {
            case 'cloud':
                cloudCounts[type]++;
                break;
            case 'edge1':
                edge1Counts[type]++;
                break;
            case 'edge2':
                edge2Counts[type]++;
                break;
        }
    },
    
    // 获取所有计数
    getCounts: () => ({
        total: {
            ai: aiCount,
            render: renderCount,
            simulation: simCount
        },
        cloud: { ...cloudCounts },
        edge1: { ...edge1Counts },
        edge2: { ...edge2Counts }
    })
}; 