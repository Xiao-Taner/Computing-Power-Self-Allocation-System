<script setup>
import { ref, computed, watch } from 'vue'
import ProgressBar from './ProgressBar.vue'
import windowsIcon from '@/assets/windows-icon.jpg'
import ubuntuIcon from '@/assets/ubuntu-icon.jpg'

const networkStatus = {
  up: '12k/s',
  down: '12800k/s'
}

const storageUsage = '85%'

// 定义 props 接收设备数据
const props = defineProps({
  deviceData: {
    type: Object,
    required: true
  }
})
// 打印device
// console.log('EdgeNodeStatus 收到的设备数据:', props.deviceData)
// // 监听设备数据变化并打印
// watch(
//   () => props.deviceData,
//   (newData) => {
//     console.log('EdgeNodeStatus 收到的设备数据:', {
//       name: newData.name,
//       ip: newData.ip,
//       metrics: {
//         cpu: newData.metrics.cpu,
//         memory: newData.metrics.memory,
//         gpu: newData.metrics.gpu,
//         network: newData.metrics.network
//       }
//     })
//   },
//   { immediate: true, deep: true }
// )

// 修改操作系统图标计算属性
const osIcon = computed(() => {
  if (!props.deviceData.os) return windowsIcon
  return props.deviceData.os.toLowerCase().includes('window') ? windowsIcon : ubuntuIcon
})

// 格式化GPU信息
const gpuInfo = computed(() => {
  const { gpu } = props.deviceData.metrics
  if (!gpu.devices.length) return ''

  // 从完整型号中提取简短名称
  const modelFull = gpu.devices[0].model
  let shortModel = ''

  // 如果包含RTX，提取"NVIDIA RTX xxx"部分
  if (modelFull.includes('RTX')) {
    shortModel = 'NVIDIA ' + modelFull.match(/RTX\s+[A-Z0-9]+/)[0]
  } else {
    // 如果没有RTX，则去掉"Corporation"和方括号部分
    shortModel = modelFull
      .replace('Corporation', '')
      .replace(/\[.*?\]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }

  return `${gpu.count} x ${shortModel}`
})

// 格式化内存信息
const memoryInfo = computed(() => {
  const { memory } = props.deviceData.metrics
  return `${memory.total} GB RAM`
})

// 格式化网络速率
const formatNetworkSpeed = (speed) => {
  if (speed < 100) {
    return `${speed.toFixed(2)}Kb/s`
  } else if (speed >= 100 && speed < 1000) {
    return `${Math.floor(speed)}Kb/s`
  } else {
    return `${(speed / 1024).toFixed(2)}Mb/s`
  }
}
</script>

<template>
  <div
    :class="['edge-node-status', { 'edge-node-status--highlight': deviceData.highlight }]"
    :title="deviceData.name"
  >
    <div class="node-name">
      <div
        class="node-name-icon"
        :style="{
          backgroundImage: `url(${osIcon})`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center center',
          backgroundSize: '100% 100%'
        }"
      ></div>
      <div class="node-name-text">{{ deviceData.name }}</div>
    </div>
    <div class="node-status">
      <div class="node-status-top">
        <ProgressBar
          :percentage="deviceData.metrics.cpu.totalUsage"
          :color="'#ffd966'"
          :text="deviceData.metrics.cpu.model"
        />
        <ProgressBar
          :percentage="deviceData.metrics.gpu.totalUsage"
          :color="'#f4b183'"
          :text="gpuInfo"
        />
        <ProgressBar
          :percentage="deviceData.metrics.memory.totalUsage"
          :color="'#d9f36d'"
          :text="memoryInfo"
        />
      </div>
      <div class="node-status-bottom">
        <div class="topbox">
          <div class="topBoxTop">
            <div class="network-status">
              <img src="@/assets/network.svg" alt="network" class="status-icon" />
              <div class="network-speeds">
                <div class="speed">
                  {{ formatNetworkSpeed(deviceData.metrics.network.totalTxRate) }}
                </div>
                <div class="speed">
                  {{ formatNetworkSpeed(deviceData.metrics.network.totalRxRate) }}
                </div>
              </div>
            </div>
            <div class="storage-status">
              <img src="@/assets/storage.svg" alt="storage" class="status-icon" />
              <div class="storage-usage">{{ deviceData.metrics.disk.totalUsage.toFixed(2) }}%</div>
            </div>
          </div>
        </div>
        <div class="node-ip">{{ deviceData.ip }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.edge-node-status {
  width: 31.5%;
  height: 19.5vh;
  background-color: #1f3255;
  background: linear-gradient(-70deg, transparent 7vh, #1f3255 0);
  box-shadow: 1px 1px 4px 1px #a5a5a5;
  border-radius: 1vh;
  border: 1px solid #d4dbe4;
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  &--highlight {
    border-color: #ffd966;
    box-shadow: 0 0 10px 5px #ffd966;
    animation: pulseHighlight 0.3s infinite;
  }

  .node-name {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    background-color: transparent;
    height: 2.7vh;
    border-bottom: 1px solid #8496b0;

    .node-name-icon {
      width: 2vh;
      height: 2vh;
      margin-left: 1vh;
      background-color: #fff;
      background: url('@/assets/windows-icon.jpg') no-repeat center center;
      background-size: 100% 100%;
      border-radius: 18%;
    }
    .node-name-text {
      color: #fff;
      font-size: 1.5vh;
      margin: -0.4vh 0;
      margin-left: 0.6vh;
      margin-right: 2vh;
      font-family: 'D-DINExp';
      font-weight: 530;
      transform: scaleY(0.9);
    }
  }

  .node-status {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;

    .node-status-top {
      width: 90%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      margin-bottom: 1.7vh;
      margin-left: -1vh;
    }
    .node-status-bottom {
      width: 100%;
      height: 100%;
      border-top: 1px solid #8496b0;
      padding: 1vh 0;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 0;

      .topbox {
        width: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;

        .topBoxTop {
          display: flex;
          flex-direction: row;
          justify-content: center;
          gap: 1.5vh;

          .network-status,
          .storage-status {
            display: flex;
            align-items: center;
            gap: 1vh;

            .status-icon {
              width: 2.5vh;
              height: 2.5vh;
              filter: brightness(0) invert(1);
              color: #8eaadb;
            }
          }

          .network-status {
            .network-speeds {
              .speed {
                color: #e7e6e6;
                font-size: 1.3vh;
                font-family: 'D-DINExp';
                transform: scaleY(0.8);
                line-height: 1.6vh;
                margin-left: -1.2vh;
              }
            }
          }

          .storage-status {
            .storage-usage {
              color: #e7e6e6;
              font-size: 1.5vh;
              font-family: 'D-DINExp';
              transform: scaleY(0.8);
              margin-left: -0.7vh;
            }
          }
        }
      }

      .node-ip {
        color: #fff;
        width: 100%;
        font-size: 1.6vh;
        font-family: 'D-DINExp';
        transform: scaleY(0.8);
        text-align: left;
        padding-left: 2vh;
      }
    }
  }
}

@keyframes pulseHighlight {
  0% {
    box-shadow: 0 0 10px 2px rgba(255, 217, 102, 0.99);
  }
  50% {
    box-shadow: 0 0 15px 4px rgba(255, 217, 102, 0.99);
  }
  100% {
    box-shadow: 0 0 10px 2px rgba(255, 217, 102, 0.99);
  }
}
</style>
