import { ElMessage } from 'element-plus'

class WebSocketClient {
  constructor() {
    this.ws = null
    this.url = 'ws://192.168.31.35:3100/ws'
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 20
    this.handlers = new Map()
  }

  connect() {
    try {
      this.ws = new WebSocket(this.url)

      this.ws.onopen = () => {
        console.log('WebSocket连接成功')
        this.reconnectAttempts = 0
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          // 调用所有注册的处理函数
          this.handlers.forEach((handler) => {
            handler(data)
          })
        } catch (error) {
          console.error('WebSocket消息解析失败:', error)
        }
      }

      this.ws.onclose = () => {
        console.log('WebSocket连接关闭')
        this.reconnect()
      }

      this.ws.onerror = (error) => {
        console.error('WebSocket错误:', error)
        ElMessage.error('WebSocket连接错误')
      }
    } catch (error) {
      console.error('WebSocket连接失败:', error)
      this.reconnect()
    }
  }

  reconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`尝试重新连接... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
      setTimeout(() => {
        this.connect()
      }, 3000)
    } else {
      ElMessage.error('WebSocket连接失败，请刷新页面重试')
    }
  }

  // 添加消息处理函数
  addHandler(key, handler) {
    this.handlers.set(key, handler)
  }

  // 移除消息处理函数
  removeHandler(key) {
    this.handlers.delete(key)
  }

  // 关闭连接
  close() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
}

// 创建单例
const wsClient = new WebSocketClient()
export default wsClient
