import request from '@/utils/request'

/**
 * 获取仿真节点IP
 * @returns {Promise} 返回仿真节点IP信息
 * @example 返回数据格式
 * {
 *   code: 200,
 *   message: 'success',
 *   data: {
 *     nodeState: {
 *       ip: string
 *     }
 *   }
 * }
 */
export function getSimulationNode() {
  return request({
    url: '/simulation/getNode',
    method: 'get',
    baseURL: 'http://192.168.31.35:3200', // 覆盖默认的baseURL
  })
}
