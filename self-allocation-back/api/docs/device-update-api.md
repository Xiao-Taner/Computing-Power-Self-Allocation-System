# 设备状态更新 API 文档

## 接口说明

获取所有设备的实时状态信息，包括CPU、内存、GPU、网络和磁盘使用情况。

### 请求信息

- **接口URL**: `/show/device/update`
- **请求方法**: GET
- **请求参数**: 无
- **返回格式**: JSON

### 响应数据结构

响应数据为一个对象，其中key为设备的Socket连接ID，value为设备的详细信息。

```typescript
{
    [socketId: string]: {
        name: string;          // 设备名称
        type: string;          // 设备类型（cloud/edge）
        ip: string;            // 设备IP地址
        os: string;            // 操作系统
        connected: boolean;     // 连接状态
        lastUpdate: string;     // 最后更新时间
        metrics: {             // 设备指标
            cpu: {
                model: string;    // CPU型号
                usage: number;    // CPU使用率（百分比）
                totalUsage: number; // 总体CPU使用率
            };
            memory: {
                total: number;    // 总内存（GB）
                used: number;     // 已使用内存（GB）
                usage: number;    // 内存使用率（百分比）
                totalUsage: number; // 总体内存使用率
                details: Array<{   // 内存条详情
                    model: string;  // 内存条型号
                    size: number;   // 内存大小（GB）
                    used: number;   // 已使用（GB）
                    usage: number;  // 使用率（百分比）
                }>;
            };
            gpu: {
                count: number;     // GPU数量
                totalUsage: number; // 总GPU使用率
                totalVramUsage: number; // 总显存使用率
                devices: Array<{    // GPU设备列表
                    model: string;   // GPU型号
                    vram: number;    // 显存大小（GB）
                    vramUsed: number; // 已用显存（GB）
                    vramUsage: number; // 显存使用率（百分比）
                    usage: number;    // GPU使用率（百分比）
                }>;
            };
            network: {
                count: number;      // 网卡数量
                totalTxRate: number; // 总发送速率（MB/s）
                totalRxRate: number; // 总接收速率（MB/s）
                interfaces: Array<{  // 网卡列表
                    name: string;     // 网卡名称
                    model: string;    // 网卡型号
                    speed: number;    // 网卡速率（Gbps）
                    txRate: number;   // 发送速率（MB/s）
                    rxRate: number;   // 接收速率（MB/s）
                    utilization: number; // 使用率（百分比）
                }>;
            };
            disk: {
                count: number;      // 磁盘数量
                totalUsage: number; // 总使用率（百分比）
                devices: Array<{    // 磁盘设备列表
                    mount: string;    // 挂载点
                    model: string;    // 磁盘型号
                    totalSize: number; // 总大小（GB）
                    usedSize: number;  // 已用大小（GB）
                    usagePercent: number; // 使用率（百分比）
                }>;
            };
        };
    };
}
```

### 请求示例

```javascript
// 使用fetch API请求示例
fetch('http://10.1.112.65:3000/show/device/update', {
  method: 'GET',
  headers: {
    'Accept': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));

// 使用axios请求示例
axios.get('http://10.1.112.65:3000/show/device/update')
  .then(response => {
    console.log(response.data);
  })
  .catch(error => {
    console.error('Error:', error);
  });
```

### 响应示例

```javascript
{
    "2Jat4XXO_dLhlY9dAAAB": {  // Socket连接ID
        "name": "cloud-server-1",  // 服务器名称
        "type": "cloud",          // 服务器类型（云服务器）
        "ip": "10.1.112.65",      // 服务器IP地址
        "os": "Windows 11",       // 操作系统
        "connected": true,        // 连接状态
        "lastUpdate": "2025-01-19T07:09:04.872Z",  // 最后更新时间
        "metrics": {
            "cpu": {
                "model": "Intel Gen Intel® Core™ i7-13700K",  // CPU型号
                "usage": 1.68,        // CPU使用率1.68%
                "totalUsage": 1.68    // 总CPU使用率1.68%
            },
            "memory": {
                "total": 64,          // 总内存64GB
                "used": 28.81,        // 已使用28.81GB
                "usage": 45.49,       // 内存使用率45.49%
                "totalUsage": 45.49,  // 总内存使用率45.49%
                "details": [
                    {
                        "model": "Kingston KF552C40-32",  // 内存条型号
                        "size": 32,                       // 内存大小32GB
                        "used": 14.56,                    // 已使用14.56GB
                        "usage": 45.49                    // 使用率45.49%
                    }
                    // ... 其他内存条信息
                ]
            },
            "gpu": {
                "count": 1,           // 1个GPU
                "totalUsage": 2,      // GPU总使用率2%
                "totalVramUsage": 61.83,  // 显存总使用率61.83%
                "devices": [
                    {
                        "model": "NVIDIA GeForce RTX 2070",  // GPU型号
                        "vram": 8,        // 显存8GB
                        "vramUsed": 4.95, // 已用显存4.95GB
                        "vramUsage": 61.83, // 显存使用率61.83%
                        "usage": 2         // GPU使用率2%
                    }
                ]
            },
            "network": {
                "count": 1,           // 1个网卡
                "totalTxRate": 0,     // 总发送速率0MB/s
                "totalRxRate": 0,     // 总接收速率0MB/s
                "interfaces": [
                    {
                        "name": "以太网",   // 网卡名称
                        "model": "Unknown Network Card",  // 网卡型号
                        "speed": 0.98,    // 网卡速率0.98Gbps
                        "txRate": 0,      // 发送速率0MB/s
                        "rxRate": 0,      // 接收速率0MB/s
                        "utilization": 0  // 使用率0%
                    }
                ]
            },
            "disk": {
                "count": 2,           // 2个磁盘
                "totalUsage": 62.955, // 总使用率62.955%
                "devices": [
                    {
                        "mount": "C:",    // 挂载点
                        "model": "ZHITAI TiPro7000 1TB",  // 磁盘型号
                        "totalSize": 952.99,  // 总大小952.99GB
                        "usedSize": 669.9,    // 已用669.9GB
                        "usagePercent": 70.29 // 使用率70.29%
                    }
                    // ... 其他磁盘信息
                ]
            }
        }
    }
    // ... 其他设备信息
}
```

### 注意事项

1. 所有数值类型的单位说明：
   - 内存/显存大小：GB
   - 使用率：百分比（%）
   - 网络速率：kb/s
   - 网卡速度：Gbps
   - 磁盘大小：GB

2. 建议前端实现：
   - 建议使用WebSocket或轮询方式定期获取最新数据（如每5秒请求一次）
   - 在展示数据时注意数值的单位转换和格式化
   - 可以根据`connected`字段显示设备在线状态
   - 可以使用`lastUpdate`字段显示数据的实时性 