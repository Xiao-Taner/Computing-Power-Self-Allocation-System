import request from '@/utils/request'

/**
 * 获取AI节点IP
 * @returns {Promise} 返回AI节点IP信息
 * @example 返回数据格式
 * {
 *   code: 200,
 *   message: 'success',
 *   data: {
 *     ip: string
 *   }
 * }
 */
export function getAINode() {
  return request({
    url: '/ai/getNode',
    method: 'get',
    baseURL: 'http://192.168.31.35:3200', // 覆盖默认的baseURL
  })
}

/**
 * 生成AI回答
 * @param {Object} params - 请求参数
 * @param {string} params.model - 模型名称
 * @param {string} params.prompt - 提示词
 * @param {boolean} params.stream - 是否流式响应
 * @returns {Promise} 返回AI生成的回答
 * @example
 * generateAnswer({
 *   model: 'qwen2:0.5B',
 *   prompt: 'How are you?',
 *   stream: true
 * })
 */
export function generateAnswer(params) {
  return request({
    url: '/api/generate',
    method: 'post',
    baseURL: 'http://10.1.112.46:11434', // Ollama服务器地址
    data: params,
  })
}
