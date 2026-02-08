import request from '@/utils/request'

/**
 * 获取渲染应用启动URL
 * @param {string} appliId - 应用ID
 * @param {string} playerMode - 播放器模式
 * @returns {Promise} 返回启动URL信息
 * @example
 * getStartURL('123', 'normal')
 */
export function getStartURL(appliId, playerMode) {
  return request({
    url: '/render/appli/getStartURL',
    method: 'get',
    params: {
      appliId,
      playerMode,
    },
    baseURL: 'http://192.168.31.35:3200', // 覆盖默认的baseURL
  })
}
