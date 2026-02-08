import request from '@/utils/request'

/**
 * 获取设备更新数据
 * @returns {Promise} 返回设备更新信息
 * @example 返回数据格式
 * {
 *   success: true,
 *   data: {
 *     [deviceId: string]: {
 *       name: string,
 *       type: 'cloud' | 'edge1' | 'edge2',
 *       ip: string,
 *       connected: boolean,
 *       lastUpdate: string,
 *       metrics: {
 *         cpu: {
 *           model: string,
 *           usage: number
 *         },
 *         memory: {
 *           total: number,
 *           used: number,
 *           usage: number,
 *           details: Array<{
 *             model: string,
 *             size: number,
 *             used: number,
 *             usage: number
 *           }>
 *         },
 *         gpu: {
 *           count: number,
 *           devices: Array<{
 *             model: string,
 *             vram: number,
 *             vramUsed: number,
 *             vramUsage: number,
 *             usage: number
 *           }>
 *         },
 *         network: {
 *           count: number,
 *           interfaces: Array<{
 *             name: string,
 *             model: string,
 *             speed: number,
 *             txRate: number,
 *             rxRate: number,
 *             utilization: number
 *           }>
 *         }
 *       }
 *     }
 *   },
 *   timestamp: number
 * }
 */
export function getDeviceUpdate() {
  return request({
    url: '/show/device/update',
    method: 'get',
  })
}
