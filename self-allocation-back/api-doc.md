# 算力自调配服务器 API 文档

## 基础信息

- 基础URL: `http://localhost:3000/api`
- 所有请求和响应均使用 JSON 格式
- 认证方式：Bearer Token
- API版本：v1

## 通用响应格式

所有API响应都遵循以下格式：

```json
{
    "code": 200,           // 状态码
    "message": "success",  // 状态信息
    "data": { }           // 响应数据
}
```

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 400 | 请求参数错误 |
| 401 | 未授权 |
| 403 | 禁止访问 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

## API 接口列表

### 1. AI推理接口

#### 请求AI推理任务

- **接口**：`POST /ai/inference`
- **描述**：发起一个AI推理任务请求
- **请求参数**：

```json
{
    "model": "string",     // 模型名称，必填
    "prompt": "string",    // 推理提示词，必填
    "max_tokens": number,  // 最大token数，可选
    "temperature": number  // 温度参数，可选，默认0.7
}
```

- **响应示例**：

```json
{
    "code": 200,
    "message": "success",
    "data": {
        "task_id": "string",      // 任务ID
        "node": "string",         // 分配的节点
        "status": "processing",   // 任务状态
        "created_at": "string"    // 创建时间
    }
}
```

#### 查询AI推理任务状态

- **接口**：`GET /ai/inference/:taskId`
- **描述**：查询特定AI推理任务的状态
- **响应示例**：

```json
{
    "code": 200,
    "message": "success",
    "data": {
        "task_id": "string",
        "status": "completed",    // processing/completed/failed
        "result": "string",       // 推理结果
        "error": "string",        // 错误信息（如果有）
        "completed_at": "string"  // 完成时间
    }
}
```

### 2. 云渲染接口

#### 发起云渲染任务

- **接口**：`POST /render`
- **描述**：发起一个云渲染任务
- **请求参数**：

```json
{
    "scene_file": "string",    // 场景文件路径，必填
    "output_format": "string", // 输出格式，必填
    "quality": "string",       // 渲染质量，可选
    "resolution": {            // 分辨率，必填
        "width": number,
        "height": number
    }
}
```

- **响应示例**：

```json
{
    "code": 200,
    "message": "success",
    "data": {
        "task_id": "string",
        "node": "string",
        "status": "processing",
        "estimated_time": number,  // 预计完成时间（秒）
        "created_at": "string"
    }
}
```

#### 查询云渲染任务状态

- **接口**：`GET /render/:taskId`
- **描述**：查询特定云渲染任务的状态
- **响应示例**：

```json
{
    "code": 200,
    "message": "success",
    "data": {
        "task_id": "string",
        "status": "completed",     // processing/completed/failed
        "progress": number,        // 进度百分比
        "result_url": "string",    // 结果文件URL
        "error": "string",         // 错误信息（如果有）
        "completed_at": "string"
    }
}
```

### 3. 仿真解算接口

#### 发起仿真解算任务

- **接口**：`POST /simulation`
- **描述**：发起一个仿真解算任务
- **请求参数**：

```json
{
    "model_file": "string",     // 模型文件路径，必填
    "simulation_type": "string", // 仿真类型，必填
    "parameters": {             // 仿真参数，必填
        "time_step": number,
        "total_time": number,
        "solver_type": "string"
    }
}
```

- **响应示例**：

```json
{
    "code": 200,
    "message": "success",
    "data": {
        "task_id": "string",
        "node": "string",
        "status": "processing",
        "estimated_time": number,
        "created_at": "string"
    }
}
```

#### 查询仿真解算任务状态

- **接口**：`GET /simulation/:taskId`
- **描述**：查询特定仿真解算任务的状态
- **响应示例**：

```json
{
    "code": 200,
    "message": "success",
    "data": {
        "task_id": "string",
        "status": "completed",     // processing/completed/failed
        "progress": number,        // 进度百分比
        "result_url": "string",    // 结果文件URL
        "error": "string",         // 错误信息（如果有）
        "completed_at": "string"
    }
}
```

### 4. 节点状态接口

#### 获取所有节点状态

- **接口**：`GET /nodes`
- **描述**：获取所有计算节点的当前状态
- **响应示例**：

```json
{
    "code": 200,
    "message": "success",
    "data": {
        "nodes": [
            {
                "id": "string",
                "name": "string",
                "type": "string",      // cloud/edge1/edge2
                "status": "online",    // online/offline
                "resources": {
                    "cpu_usage": number,
                    "memory_usage": number,
                    "gpu_usage": number
                },
                "tasks": [
                    {
                        "task_id": "string",
                        "type": "string",
                        "status": "string"
                    }
                ]
            }
        ]
    }
}
```

#### 获取特定节点状态

- **接口**：`GET /nodes/:nodeId`
- **描述**：获取特定节点的详细状态信息
- **响应示例**：

```json
{
    "code": 200,
    "message": "success",
    "data": {
        "id": "string",
        "name": "string",
        "type": "string",
        "status": "online",
        "resources": {
            "cpu_usage": number,
            "memory_usage": number,
            "gpu_usage": number,
            "network": {
                "in_speed": number,
                "out_speed": number
            },
            "disk": {
                "total": number,
                "used": number
            }
        },
        "tasks": [
            {
                "task_id": "string",
                "type": "string",
                "status": "string",
                "created_at": "string",
                "progress": number
            }
        ]
    }
}
```

### 5. 系统监控接口

#### 获取系统概览

- **接口**：`GET /system/overview`
- **描述**：获取整个系统的运行状态概览
- **响应示例**：

```json
{
    "code": 200,
    "message": "success",
    "data": {
        "total_nodes": number,
        "online_nodes": number,
        "total_tasks": {
            "ai": number,
            "render": number,
            "simulation": number
        },
        "active_tasks": {
            "ai": number,
            "render": number,
            "simulation": number
        },
        "system_load": {
            "cpu_average": number,
            "memory_average": number,
            "gpu_average": number
        }
    }
}
```

#### 获取系统日志

- **接口**：`GET /system/logs`
- **描述**：获取系统运行日志
- **请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| level | string | 否 | 日志级别(info/warning/error) |
| start_time | string | 否 | 开始时间 |
| end_time | string | 否 | 结束时间 |
| page | number | 否 | 页码，默认1 |
| size | number | 否 | 每页条数，默认20 |

- **响应示例**：

```json
{
    "code": 200,
    "message": "success",
    "data": {
        "total": number,
        "logs": [
            {
                "id": "string",
                "level": "string",
                "message": "string",
                "timestamp": "string",
                "details": { }
            }
        ]
    }
}
```

## WebSocket 接口

### 实时状态更新

- **连接URL**：`ws://localhost:3000/ws`
- **认证**：通过URL参数传递token
- **事件类型**：

1. 节点状态更新
```json
{
    "type": "node_update",
    "data": {
        "node_id": "string",
        "status": "object"
    }
}
```

2. 任务状态更新
```json
{
    "type": "task_update",
    "data": {
        "task_id": "string",
        "status": "string",
        "progress": number
    }
}
```

3. 系统告警
```json
{
    "type": "alert",
    "data": {
        "level": "string",
        "message": "string",
        "timestamp": "string"
    }
}
```

## 安全说明

1. 所有API请求都需要通过Bearer Token认证
2. Token格式：`Authorization: Bearer <token>`
3. Token有效期为24小时
4. 请求频率限制：
   - 普通接口：60次/分钟
   - 监控接口：120次/分钟
   - WebSocket连接：无限制

## 注意事项

1. 所有时间戳均使用ISO 8601格式
2. 文件上传大小限制为100MB
3. WebSocket连接断开后会自动重连
4. 建议使用HTTPS进行安全传输 