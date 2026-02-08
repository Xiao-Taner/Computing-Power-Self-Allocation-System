import axios from 'axios'
import { ElMessage } from 'element-plus'

// 创建axios实例
const service = axios.create({
  baseURL: '', // 改为空字符串，因为我们使用了 Vite 的代理
  timeout: 5000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json;charset=utf-8',
  },
})

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    ElMessage({
      message: '请求发送失败，请检查网络连接',
      type: 'error',
      duration: 3000,
    })
    return Promise.reject(error)
  },
)

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    // 判断HTTP状态码
    if (response.status === 200) {
      return response.data
    }

    ElMessage({
      message: '服务器响应异常',
      type: 'error',
      duration: 3000,
    })
    return Promise.reject(new Error('服务器响应异常'))
  },
  (error) => {
    // 处理不同类型的错误
    let message = '服务器响应失败'
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      message = '请求超时，请检查网络连接'
    } else if (error.response) {
      switch (error.response.status) {
        case 400:
          message = '请求错误'
          break
        case 404:
          message = '请求地址不存在'
          break
        case 500:
          message = '服务器内部错误'
          break
        case 502:
          message = '网关错误'
          break
        case 503:
          message = '服务不可用'
          break
        case 504:
          message = '网关超时'
          break
        default:
          message = `连接错误 ${error.response.status}`
      }
    } else if (error.request) {
      message = '服务器无响应'
    }

    ElMessage({
      message: message,
      type: 'error',
      duration: 3000,
    })
    return Promise.reject(error)
  },
)

// 导出实例
export default service
