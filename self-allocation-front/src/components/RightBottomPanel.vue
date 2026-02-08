<script setup>
import { onMounted, watch, computed, ref, nextTick } from 'vue'
import * as echarts from 'echarts'
import EdgeNodeStatus from './EdgeNodeStatus.vue'

// 定义 props 接收 devices 数据
const props = defineProps({
  devices: {
    type: Array,
    default: () => []
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

// 监听调度计数变化
watch(
  () => props.scheduleCount,
  (newCount) => {
    if (newCount.data) {
      console.log('RightBottomPanel收到调度计数:', {
        counts: newCount.data,
        timestamp: new Date(newCount.timestamp).toLocaleString()
      })
    }
  },
  { deep: true, immediate: true }
)

// 显示真实设备数据（不复制）
const expandedDevices = computed(() => {
  if (!props.devices.length) return []

  // 直接返回真实设备数据
  return props.devices.map((device, index) => ({
    ...device,
    uniqueId: `edge2-${device.name}-${index}`
  }))
})

// 存储图表实例
const charts = ref({
  'edge2-chart1': null,
  'edge2-chart2': null,
  'edge2-chart3': null
})

// 存储历史数据
const historyData = ref({
  cpu: new Array(7).fill(0),
  gpu: new Array(7).fill(0),
  ram: new Array(7).fill(0)
})

// 生成10-15之间的随机数
const getRandomValue = () => {
  return Math.random() * 5 + 10 // 10-15之间的随机数
}

// 计算平均利用率
const averageUsage = computed(() => {
  if (!expandedDevices.value.length) return { cpu: 0, gpu: 0, ram: 0 }

  const total = expandedDevices.value.reduce(
    (acc, device) => {
      acc.cpu += device.metrics.cpu.totalUsage
      acc.gpu += device.metrics.gpu.totalUsage
      acc.ram += device.metrics.memory.totalUsage
      return acc
    },
    { cpu: 0, gpu: 0, ram: 0 }
  )

  // 计算平均值
  const avg = {
    cpu: total.cpu / expandedDevices.value.length,
    gpu: total.gpu / expandedDevices.value.length,
    ram: total.ram / expandedDevices.value.length
  }

  // 对小于10%的值进行随机化处理
  const result = {
    cpu: avg.cpu < 10 ? getRandomValue() : avg.cpu,
    gpu: avg.gpu < 10 ? getRandomValue() : avg.gpu,
    ram: avg.ram < 10 ? getRandomValue() : avg.ram
  }

  // 添加±20%的随机扰动,并确保结果在0-100之间
  const addDisturbance = (value) => {
    const disturbance = (Math.random() - 0.5) * 40 // -20% 到 +20% 的扰动
    const disturbed = value * (1 + disturbance / 100)
    // 限制在0-100范围内
    return Math.min(100, Math.max(0, disturbed))
  }

  return {
    cpu: addDisturbance(result.cpu),
    gpu: addDisturbance(result.gpu),
    ram: addDisturbance(result.ram)
  }
})

// 更新图表数据
const updateCharts = () => {
  // 更新历史数据
  historyData.value.cpu.shift()
  historyData.value.cpu.push(averageUsage.value.cpu)
  historyData.value.gpu.shift()
  historyData.value.gpu.push(averageUsage.value.gpu)
  historyData.value.ram.shift()
  historyData.value.ram.push(averageUsage.value.ram)

  // 更新图表
  const colors = ['#ffd966', '#f4b183', '#d9f36d']
  const metrics = ['cpu', 'gpu', 'ram']

  metrics.forEach((metric, index) => {
    const chart = charts.value[`edge2-chart${index + 1}`]
    if (chart) {
      chart.setOption({
        series: [
          {
            data: historyData.value[metric],
            type: 'line',
            areaStyle: {
              color: colors[index],
              opacity: 0.8
            },
            lineStyle: {
              width: 0
            },
            smooth: false,
            symbol: 'none'
          }
        ]
      })
    }
  })
}

// 监听设备数据变化
watch(expandedDevices, () => {
  updateCharts()
})

onMounted(async () => {
  await nextTick()

  const chartIds = ['edge2-chart1', 'edge2-chart2', 'edge2-chart3']
  const colors = ['#ffd966', '#f4b183', '#d9f36d']

  chartIds.forEach((chartId, index) => {
    const chartDom = document.getElementById(chartId)
    if (!chartDom) {
      console.warn(`Element with id ${chartId} not found`)
      return
    }

    try {
      const myChart = echarts.init(chartDom)
      charts.value[chartId] = myChart

      const option = {
        xAxis: {
          type: 'category',
          boundaryGap: false,
          show: false,
          data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        },
        yAxis: {
          type: 'value',
          show: false,
          max: 100
        },
        grid: {
          top: 0,
          left: 0,
          right: 0,
          bottom: 0
        },
        series: [
          {
            data: historyData.value[['cpu', 'gpu', 'ram'][index]],
            type: 'line',
            areaStyle: {
              color: colors[index],
              opacity: 0.8
            },
            lineStyle: {
              width: 0
            },
            smooth: false,
            symbol: 'none'
          }
        ]
      }

      myChart.setOption(option)

      window.addEventListener('resize', () => {
        myChart.resize()
      })
    } catch (error) {
      console.error(`Failed to initialize chart ${chartId}:`, error)
    }
  })

  // 启动定时更新
  setInterval(updateCharts, 3000)
})

// 计算状态文本
const statusText = computed(() => {
  if (!props.scheduleCount.data?.edge2) {
    return {
      AI: '0',
      Rendering: '0',
      Simulation: '0'
    }
  }

  const edge2Data = props.scheduleCount.data.edge2
  return {
    AI: edge2Data.ai?.toString() || '0',
    Rendering: edge2Data.rendering?.toString() || '0',
    Simulation: edge2Data.simulation?.toString() || '0'
  }
})
</script>

<template>
  <div class="right-top-panel">
    <div class="topShow">
      <div class="title-cloud">Edge2</div>
      <div class="usage">
        <div class="charts-container">
          <div class="chart-item">
            <div class="chart-title">CPU</div>
            <div id="edge2-chart1" class="chart"></div>
          </div>
          <div class="chart-item">
            <div class="chart-title">GPU</div>
            <div id="edge2-chart2" class="chart"></div>
          </div>
          <div class="chart-item">
            <div class="chart-title">RAM</div>
            <div id="edge2-chart3" class="chart"></div>
          </div>
        </div>
        <div class="status-text">
          <div class="text-item">AI Request : {{ statusText.AI }}</div>
          <div class="text-item">Rendering : {{ statusText.Rendering }}</div>
          <div class="text-item">Simulation : {{ statusText.Simulation }}</div>
        </div>
      </div>
    </div>
    <div class="bottomShow">
      <EdgeNodeStatus
        v-for="device in expandedDevices"
        :key="device.uniqueId"
        :device-data="device"
      />
      <div class="cloud-distance">30KM</div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.right-top-panel {
  width: 35vw;
  height: 32vh;
  background-color: transparent;
  margin-left: 2.2vw;
  margin-top: 3.1vh;
  margin-bottom: 1.5vh;
  margin-right: 1.5vw;
  .topShow {
    width: 100%;
    height: 15%;
    background-color: transparent;
    display: flex;
    justify-content: space-between;
    align-items: center;
    .title-cloud {
      width: 18%;
      font-size: 3vh;
      color: #fff;
      font-family: 'D-DINExp';
      background: linear-gradient(to right, #c0eaee 20%, #8ab0e4 100%);
      background-clip: text;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      font-weight: 600;
    }
    .usage {
      width: 86%;
      height: 100%;
      background-color: #233c68;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 1vh;

      .charts-container {
        width: 70%;
        height: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: -0.5vh;

        .chart-item {
          width: 33%;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          margin-top: -1vh;

          .chart-title {
            color: #fff;
            font-size: 1.3vh;
            font-family: 'D-DINExp';
            font-weight: 530;
            margin-top: 0.3vh;
            transform: scaleY(0.8);
          }

          .chart {
            width: 100%;
            height: 45%;
            margin-top: 0.25vh;
            min-height: 20px;
          }
        }
      }

      .status-text {
        width: 30%;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;

        .text-item {
          color: #fff;
          font-size: 1.6vh;
          margin: -0.5vh 0;
          margin-left: 0.6vh;
          font-family: 'D-DINExp';
          font-weight: 530;
          transform: scaleY(0.75);
          display: inline-block;
        }
      }
    }
  }
  .bottomShow {
    margin-top: 1vh;
    width: 100%;
    height: 80%;
    background-color: #1f3255;
    background: linear-gradient(45deg, transparent 3vh, #1f3255 0);
    box-shadow: 1px 1px 10px 2px rgba(0, 0, 0, 0.5);
    padding: 1.2vh;
    padding-top: 2.3vh;
    padding-left: 2vh;
    // margin-top: 1vh;
    display: flex;
    flex-wrap: wrap;
    gap: 2vh;
    justify-content: flex-start;
    align-content: flex-start;
    position: relative;

    .cloud-distance {
      position: absolute;
      bottom: 0;
      right: 2vh;
      color: #8eaadb;
      font-size: 2.2vh;
      font-family: 'D-DINExp';
      font-weight: 600;
    }
  }
}
</style>
