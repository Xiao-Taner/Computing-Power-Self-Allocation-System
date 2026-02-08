<script setup>
import { ref, onMounted, watch } from 'vue'
import * as echarts from 'echarts'
import { Platform } from '@element-plus/icons-vue'

// 存储请求消息历史
const requestMessages = ref([])

// 存储图表实例
let myChart = null

// 存储历史数据
const historyData = ref({
  AI: new Array(15).fill(0),
  Rendering: new Array(15).fill(0),
  Simulation: new Array(15).fill(0),
  times: new Array(15).fill('00')
})

// 格式化时间
const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const seconds = date.getSeconds().toString().padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

// 格式化时间戳为秒
const formatChartTime = (timestamp) => {
  const date = new Date(timestamp)
  return date.getSeconds().toString().padStart(2, '0')
}

const props = defineProps({
  scheduleRequest: {
    type: Object,
    required: true,
    default: () => ({
      message: '',
      timestamp: null
    })
  },
  scheduleCount: {
    type: Object,
    required: true,
    default: () => ({
      data: null,
      timestamp: null
    })
  }
})

// 更新图表数据
const updateChartData = (newData, timestamp) => {
  // 移除最旧的数据，添加新数据
  historyData.value.times.shift()
  historyData.value.times.push(formatChartTime(timestamp))

  // 移除最旧的数据，添加新数据
  historyData.value.AI.shift()
  historyData.value.AI.push(newData.total.ai || 0)
  historyData.value.Rendering.shift()
  historyData.value.Rendering.push(newData.total.rendering || 0)
  historyData.value.Simulation.shift()
  historyData.value.Simulation.push(newData.total.simulation || 0)

  // 更新图表
  if (myChart) {
    myChart.setOption({
      xAxis: {
        data: historyData.value.times
      },
      series: [
        {
          name: 'AI推理',
          data: historyData.value.AI
        },
        {
          name: '云渲染',
          data: historyData.value.Rendering
        },
        {
          name: '仿真解算',
          data: historyData.value.Simulation
        }
      ]
    })
  }
}

onMounted(() => {
  const chartDom = document.getElementById('stackChart')
  myChart = echarts.init(chartDom)

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#6a7985'
        }
      }
    },
    legend: {
      top: '7%',
      data: ['AI推理', '云渲染', '仿真解算'],
      textStyle: {
        color: '#fff',
        fontSize: 17,
        fontWeight: 580
      }
    },
    grid: {
      top: '22%',
      left: '1%',
      right: '4%',
      bottom: '27%',
      containLabel: true
    },
    xAxis: [
      {
        type: 'category',
        boundaryGap: false,
        data: historyData.value.times,
        axisLabel: {
          color: '#fff',
          fontSize: 12,
          fontWeight: 600
        }
      }
    ],
    yAxis: [
      {
        type: 'value',
        axisLabel: {
          color: '#fff',
          fontSize: 12,
          fontWeight: 600
        }
      }
    ],
    series: [
      {
        name: 'AI推理',
        type: 'line',
        stack: 'Total',
        areaStyle: {
          opacity: 0.8
        },
        emphasis: {
          focus: 'series'
        },
        data: historyData.value.AI
      },
      {
        name: '云渲染',
        type: 'line',
        stack: 'Total',
        areaStyle: {
          opacity: 0.8
        },
        emphasis: {
          focus: 'series'
        },
        data: historyData.value.Rendering
      },
      {
        name: '仿真解算',
        type: 'line',
        stack: 'Total',
        areaStyle: {
          opacity: 0.8
        },
        emphasis: {
          focus: 'series'
        },
        data: historyData.value.Simulation
      }
    ]
  }

  myChart.setOption(option)

  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    myChart.resize()
  })
})

// 监听调度请求变化
watch(
  () => props.scheduleRequest,
  (newRequest) => {
    if (newRequest.message) {
      console.log('FooterEnd收到调度请求:', {
        message: newRequest.message,
        timestamp: new Date(newRequest.timestamp).toLocaleString()
      })
      // 添加新消息到数组
      requestMessages.value.push({
        time: formatTime(newRequest.timestamp),
        message: newRequest.message
      })

      // 保持最多显示4条消息
      if (requestMessages.value.length > 5) {
        requestMessages.value = requestMessages.value.slice(-4)
      }
    }
  },
  { deep: true, immediate: true }
)

// 监听调度计数变化
watch(
  () => props.scheduleCount,
  (newCount) => {
    if (newCount.data) {
      console.log('FooterEnd收到调度计数:', {
        cloud: newCount.data.cloud,
        edge1: newCount.data.edge1,
        edge2: newCount.data.edge2,
        timestamp: new Date(newCount.timestamp).toLocaleString()
      })
      // 更新图表数据
      updateChartData(newCount.data, newCount.timestamp)
    }
  },
  { deep: true, immediate: true }
)
</script>

<template>
  <div class="footerEnd">
    <div class="end-title">End</div>
    <div class="footerBox">
      <div class="leftBox">
        <div class="leftBoxTitle message-box">
          <div v-for="(message, index) in requestMessages" :key="index" class="message-item">
            <span class="message-time">{{ message.time }}</span>
            <span class="message-text">{{ message.message }}</span>
          </div>
        </div>
      </div>
      <div class="end">
        <div class="platform-pc">
          <img class="pc-svg" src="../assets/pc.svg" alt="" />
          <img class="pc-svg" src="../assets/pc.svg" alt="" />
          <img class="pc-svg" src="../assets/pc.svg" alt="" />
          <img class="pc-svg" src="../assets/pc.svg" alt="" />
        </div>
        <!-- <div class="platform-pc">
          <el-icon class="platform-icon"><Platform /></el-icon>
          <el-icon class="platform-icon"><Platform /></el-icon>
          <el-icon class="platform-icon"><Platform /></el-icon>
          <el-icon class="platform-icon"><Platform /></el-icon>
        </div>
        <div class="platform-pc-screen">
          <div class="screen"></div>
          <div class="screen"></div>
          <div class="screen"></div>
          <div class="screen"></div>
        </div> -->
        <div class="pc-distance">
          <div class="distance">100km</div>
          <div class="distance">200km</div>
          <div class="distance">400km</div>
          <div class="distance">1000km</div>
        </div>
      </div>
      <div class="rightBox">
        <div id="stackChart"></div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
body {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
.footerEnd {
  width: 100vw;
  height: 23.52vh;
  background-color: transparent;
  perspective: 1000px;
  position: relative;
  .end-title {
    position: absolute;
    top: 8%;
    left: 38%;
    transform: translateX(-50%);
    z-index: 100;

    font-family: 'D-DINExp';
    font-size: 3vh;
    background: linear-gradient(to right, #c0eaee 20%, #8ab0e4 100%);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-weight: 600;
  }

  .footerBox {
    width: 94vw;
    height: 120%;
    background-color: #192b4e;
    margin: 0 auto;
    position: absolute;
    bottom: -8.3vh;
    left: 50%;
    transform: translateX(-50%) rotateX(50deg);
    transform-origin: center;
    box-shadow: 0 -10px 20px rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 3vh;
    padding-bottom: 0;

    .leftBox {
      width: 30%;
      height: 80%;
      background-color: #223962;
      box-shadow: 0 -10px 20px rgba(0, 0, 0, 0.5);
      color: #fff;
      padding: 2vh;

      padding-left: 3vh;

      .message-box {
        height: 100%;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        gap: 0.8vh;

        .message-item {
          color: #e7e6e6;
          font-size: 2vh;
          font-family: 'D-DINExp';
          white-space: normal;
          line-height: 2.2vh;
          transform: scaleY(0.95);
          transition: all 0.3s ease;
          animation: popUp 0.01s cubic-bezier(0.18, 0.89, 0.32, 1.28);

          .message-time {
            color: #ffd966;
            margin-right: 1vh;
          }

          .message-text {
            color: #e7e6e6;
          }
        }
      }
    }
    .end {
      position: absolute;
      top: -15vh;
      left: 50%;
      transform: translateX(-50%);
      width: 37%;
      height: 170%;
      background-color: #1b2e53;
      box-shadow: 0 -10px 20px rgba(0, 0, 0, 0.5);

      .platform-pc {
        position: absolute;
        bottom: 25%;
        left: 50%;
        transform: translateX(-50%);
        width: 100%;
        display: flex;
        justify-content: space-around;
        align-items: center;
        padding: 2vh;
        .pc-svg {
          width: 12vh;
          height: 13vh;
        }
      }
      // .platform-pc {
      //   position: absolute;
      //   bottom: 40%;
      //   left: 50%;
      //   transform: translateX(-50%);
      //   width: 100%;
      //   display: flex;
      //   justify-content: space-around;
      //   align-items: center;
      //   padding: 2vh;

      //   .platform-icon {
      //     color: #fff;
      //     font-size: 25vh;
      //     width: 13vh;
      //     height: 1vh;
      //   }
      // }
      .pc-distance {
        position: absolute;
        bottom: 63%;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        justify-content: space-around;
        align-items: center;
        font-size: 3vh;
        font-weight: 530;
        color: #fff;
        .distance {
          margin: 0 1.3vh;
          width: 10vh;
          height: 1vh;
          text-align: center;
        }
      }
      // .platform-pc-screen {
      //   position: absolute;
      //   bottom: 38%;
      //   left: 50%;
      //   transform: translateX(-50%);
      //   width: 100%;
      //   display: flex;
      //   justify-content: space-around;
      //   align-items: center;
      //   padding: 2vh;
      //   .screen {
      //     width: 9vh;
      //     height: 5vh;
      //     background-color: #1b2e53;
      //   }
      // }
    }
    .rightBox {
      width: 30%;
      height: 100%;
      background-color: #223962;
      box-shadow: 0 -10px 20px rgba(0, 0, 0, 0.5);
      margin-top: 0;
      // padding: 2vh;

      #stackChart {
        width: 100%;
        height: 100%;
      }
    }
  }
}

@keyframes popUp {
  from {
    opacity: 0;
    transform: translateY(20px) scaleY(0.95) scale(0.8);
  }
  50% {
    opacity: 1;
    transform: translateY(-5px) scaleY(0.95) scale(1.02);
  }
  to {
    opacity: 1;
    transform: translateY(0) scaleY(0.95) scale(1);
  }
}
</style>
