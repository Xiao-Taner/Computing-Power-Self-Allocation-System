<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import CloudNodeStatus from '@/components/CloudNodeStatus.vue'
import TitleHeader from '@/components/TitleHeader.vue'
import FooterEnd from '@/components/FooterEnd.vue'
import LeftPanel from '@/components/LeftPanel.vue'
import RightTopPanel from '@/components/RightTopPanel.vue'
import RightBottomPanel from '@/components/RightBottomPanel.vue'
import MiddleTop from '@/components/MiddleTop.vue'
import MiddleBottom from '@/components/MiddleBottom.vue'
import ConnetLine from '@/components/ConnetLine.vue'
import { getDeviceUpdate } from '@/api/device'
import wsClient from '@/utils/websocket'

const title = ref('云边端算力自调配系统')
const money = ref(100)

// 设备状态数据
const deviceData = ref(null)
const selectedNodeInfo = ref(null) // 存储当前选中的节点信息
// 按类型分类的设备数据
const cloudDevices = computed(() => {
  if (!deviceData.value) return []
  return Object.values(deviceData.value)
    .filter((device) => device.type === 'cloud')
    .map((device) => ({
      ...device,
      highlight: selectedNodeInfo.value?.ip === device.ip
    }))
})

const edge1Devices = computed(() => {
  if (!deviceData.value) return []
  return Object.values(deviceData.value)
    .filter((device) => device.type === 'edge1')
    .map((device) => ({
      ...device,
      highlight: selectedNodeInfo.value?.ip === device.ip
    }))
})

const edge2Devices = computed(() => {
  if (!deviceData.value) return []
  return Object.values(deviceData.value)
    .filter((device) => device.type === 'edge2')
    .map((device) => ({
      ...device,
      highlight: selectedNodeInfo.value?.ip === device.ip
    }))
})

// 定时器引用
let timer = null

// WebSocket相关
const aiMessage = ref('')
const scheduleStatus = ref('')
const scheduleTimestamp = ref(null)
const scheduleCount = ref({
  data: null,
  timestamp: null
})
const scheduleRequest = ref({
  message: '',
  timestamp: null
})

const scheduleData = ref({
  message: '',
  status: '',
  timestamp: null,
  type: ''
})
const scheduleResult = ref({
  message: '',
  status: '',
  data: null
})

// WebSocket消息处理函数
const handleWsMessage = (data) => {
  console.log('WebSocket收到原始数据:', data)
  if (data && data.type === 'schedule_count') {
    scheduleCount.value = {
      data: data.data,
      timestamp: data.timestamp
    }
    console.log('收到调度计数:', {
      counts: data.data,
      timestamp: new Date(data.timestamp).toLocaleString()
    })
  }
  if (data && data.type === 'schedule_request') {
    scheduleRequest.value = {
      message: data.message,
      timestamp: data.timestamp
    }
    console.log('收到调度请求request:', {
      message: data.message,
      timestamp: new Date(data.timestamp).toLocaleString()
    })
  }
  if (data && data.type === 'schedule_process') {
    // 更新调度数据
    scheduleData.value = {
      message: data.message,
      status: data.status,
      timestamp: data.timestamp,
      type: data.type
    }
    console.log('收到调度消息:', {
      type: data.type,
      message: data.message,
      status: data.status,
      timestamp: new Date(data.timestamp).toLocaleString()
    })
  }
  if (data && data.type === 'schedule_result') {
    scheduleResult.value = {
      message: data.message,
      status: data.status,
      data: data.data
    }
    // 处理成功的调度结果
    if (data.status === 'success' && data.data?.selectedNode) {
      const nodeInfo = {
        ip: data.data.selectedNode.ip,
        group: data.data.selectedNode.group,
        gpuUsage: data.data.selectedNode.gpuUsage,
        timestamp: data.data.timing.timestamp,
        duration: data.data.timing.duration
      }
      selectedNodeInfo.value = nodeInfo
      console.log('节点选择信息:', nodeInfo)

      // 1秒后清除高亮
      setTimeout(() => {
        selectedNodeInfo.value = null
        console.log('高亮已清除')
      }, 300)
    }
    console.log('收到调度结果:', {
      message: data.message,
      status: data.status,
      data: data.data
    })
  }
}

// 获取设备状态数据
const fetchDeviceData = async () => {
  try {
    const res = await getDeviceUpdate()
    if (res && res.code === 200) {
      deviceData.value = res.data
      console.log('设备数据更新成功:', {
        cloud: cloudDevices.value,
        edge1: edge1Devices.value,
        edge2: edge2Devices.value
      })
    }
  } catch (error) {
    console.error('获取设备数据失败:', error)
  }
}

// 背景音乐视频引用
const bgMusic = ref(null)

// 处理背景音乐播放
const handleBgMusic = async () => {
  try {
    if (bgMusic.value) {
      bgMusic.value.volume = 0.3 // 设置音量
      bgMusic.value.muted = false // 取消静音
      const playPromise = bgMusic.value.play()
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.log('自动播放被阻止:', error)
          // 监听用户交互事件来启动播放
          const startPlay = () => {
            bgMusic.value.play()
            document.removeEventListener('click', startPlay)
          }
          document.addEventListener('click', startPlay)
        })
      }
    }
  } catch (error) {
    console.error('播放背景音乐失败:', error)
  }
}

// 组件挂载时启动定时器
onMounted(() => {
  // 立即执行一次
  fetchDeviceData()

  // 设置5秒定时器
  timer = setInterval(fetchDeviceData, 5000)

  // 初始化背景音乐
  handleBgMusic()

  // 连接WebSocket
  wsClient.connect()
  // 添加消息处理函数
  wsClient.addHandler('schedule_count', handleWsMessage)
  wsClient.addHandler('schedule_request', handleWsMessage)
  wsClient.addHandler('schedule_process', handleWsMessage)
  wsClient.addHandler('schedule_result', handleWsMessage)
})

// 组件卸载时清除定时器
onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }

  // 移除消息处理函数
  wsClient.removeHandler('schedule_count')
  wsClient.removeHandler('schedule_request')
  wsClient.removeHandler('schedule_process')
  wsClient.removeHandler('schedule_result')
})

// 监听selectedNodeInfo变化，清除之前的高亮
watch(selectedNodeInfo, (newValue, oldValue) => {
  if (oldValue && !newValue) {
    // 当selectedNodeInfo被清空时，重新获取设备数据以清除高亮
    fetchDeviceData()
  }
})
</script>

<template>
  <main class="main">
    <!-- 背景音乐视频 -->
    <video
      class="background-music"
      src="@/assets/bgmusic.mp4"
      autoplay
      loop
      ref="bgMusic"
      preload="auto"
    ></video>
    <TitleHeader></TitleHeader>
    <div class="middlePanel">
      <LeftPanel :devices="cloudDevices" :schedule-count="scheduleCount"></LeftPanel>
      <div class="middleBox">
        <MiddleTop :schedule-result="scheduleResult"></MiddleTop>
        <MiddleBottom :schedule-data="scheduleData"></MiddleBottom>
      </div>
      <div class="RightPanel">
        <RightTopPanel
          id="edge1"
          :devices="edge1Devices"
          :schedule-count="scheduleCount"
        ></RightTopPanel>
        <RightBottomPanel
          id="edge2"
          :devices="edge2Devices"
          :schedule-count="scheduleCount"
        ></RightBottomPanel>
      </div>
    </div>

    <FooterEnd :schedule-request="scheduleRequest" :schedule-count="scheduleCount"></FooterEnd>
    <ConnetLine class="line1" width="13vw"></ConnetLine>
    <ConnetLine class="line2" width="7vw"></ConnetLine>
  </main>
</template>

<style scoped lang="scss">
.background-music {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
  z-index: -1;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.main {
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: linear-gradient(to top, #0d1424 3%, #4a5f85 65%);
  justify-content: space-between; // 添加此行使子元素分布在两端
  align-items: center; // 添加此行使子元素水平居中
  position: relative;

  .line1 {
    position: absolute;
    bottom: 25%;
    left: 38%;
    transform: translateX(-50%) rotate(33deg);
    // width: 100vw;
    // height: 100vh;
  }
  .line2 {
    position: absolute;
    bottom: 21%;
    right: 28%;
    transform: translateX(-50%) rotate(-30deg);
    // width: 100vw;
    // height: 100vh;
  }

  .middlePanel {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 15vh;
    background-color: transparent;
    position: absolute;
    top: 7%;
    left: 0;
    width: 100vw;
    height: 60vh;

    .middleBox {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
    }
  }

  .RightPanel {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
  }
}
</style>
