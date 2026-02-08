<script setup>
import { ref, onMounted, watch } from 'vue'
import CommunicateAnimationEnd from './CommunicateAnimationEnd.vue'
import CommunicateAnimationCloud from './CommunicateAnimationCloud.vue'
import CommunicateAnimationEdge from './CommunicateAnimationEdge.vue'
import { Refresh } from '@element-plus/icons-vue'

// 实时日志数据
const logs = ref([])

// 等待消息数组
const waitingMessages = [
  '正在等待请求...',
  '等待新的调度任务...',
  '系统空闲中...',
  '等待用户请求中...',
  '准备接收新任务...'
]

// 添加随机等待消息
const addWaitingMessages = () => {
  // 随机生成1-3的数字
  const count = Math.floor(Math.random() * 3) + 1

  // 添加指定数量的等待消息
  for (let i = 0; i < count; i++) {
    const randomMessage = waitingMessages[Math.floor(Math.random() * waitingMessages.length)]
    const waitLog = {
      time: formatTime(Date.now()),
      status: 'waiting',
      message: randomMessage
    }
    logs.value.push(waitLog)

    // 保持最多显示15条日志
    if (logs.value.length > 15) {
      logs.value = logs.value.slice(-15)
    }
  }
}

// 格式化时间
const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const seconds = date.getSeconds().toString().padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

// 定义props接收调度数据
const props = defineProps({
  scheduleData: {
    type: Object,
    required: true,
    default: () => ({
      message: '',
      status: '',
      timestamp: null,
      type: ''
    })
  }
})

// 监听调度数据变化
watch(
  () => props.scheduleData,
  (newData) => {
    if (newData.message) {
      console.log('MiddleBottom收到新的调度数据:', {
        message: newData.message,
        status: newData.status,
        timestamp: new Date(newData.timestamp).toLocaleString(),
        type: newData.type
      })

      // 添加新日志到底部
      const newLog = {
        time: formatTime(newData.timestamp),
        status: newData.status,
        message: newData.message
      }
      logs.value.push(newLog)

      // 保持最多显示15条日志
      if (logs.value.length > 15) {
        logs.value = logs.value.slice(-15)
      }

      // 如果是成功消息，添加等待消息
      if (newData.status === 'success') {
        setTimeout(() => {
          addWaitingMessages()
          // 滚动到最新消息
          const logContainer = document.querySelector('.log-container')
          if (logContainer) {
            logContainer.scrollTop = logContainer.scrollHeight
          }
        }, 300) // 延迟300ms添加等待消息
      }

      // 滚动到最新消息
      const logContainer = document.querySelector('.log-container')
      if (logContainer) {
        logContainer.scrollTop = logContainer.scrollHeight
      }
    }
  },
  { deep: true, immediate: true }
)
</script>

<template>
  <div class="middle-bottom">
    <div class="topBox">
      <CommunicateAnimationCloud class="allocation-cloud" />
      <div class="allocation">
        <div class="allocation-top">
          <div class="left-animation">
            <div class="box1"></div>
            <div class="box2"></div>
            <div class="box-circle"></div>
            <el-icon :size="40" color="#538135" class="refresh-icon">
              <Refresh />
            </el-icon>
          </div>
          <div class="right-algorithm">ALPHA 调度</div>
        </div>
        <div class="allocation-bottom">
          <div class="log-container">
            <div v-for="(log, index) in logs" :key="index" class="log-item">
              <span class="log-time">{{ log.time }}</span>
              <span class="log-status" v-if="log.status">[ {{ log.status }} ]</span>
              <span class="log-message">{{ log.message }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="box-right">
        <CommunicateAnimationEdge class="allocation-edge1" />
        <CommunicateAnimationEdge class="allocation-edge2" />
      </div>
    </div>
    <div class="bottomBox">
      <CommunicateAnimationEnd />
    </div>
  </div>
</template>

<style scoped lang="scss">
.middle-bottom {
  width: 23vw;
  height: 45vh;
  background-color: transparent;
  margin-right: -2.1vh;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
  .topBox {
    width: 77%;
    height: 88%;
    background-color: transparent;
    margin-left: 2.8vh;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .allocation-cloud {
      margin-left: 1.2vh;
      // transform: rotateZ(90deg);
      height: 70%;
      margin-left: -6.2vh;
    }
    .allocation {
      width: 100%;
      height: 100%;
      background-color: #344564;
      margin-left: 1.2vh;
      margin-right: -1.2vh;
      border-radius: 2vh;
      position: relative;

      &::before {
        content: '';
        position: absolute;
        inset: -0.5vh;
        border-radius: 3vh;
        padding: 0.3vh;
        background: linear-gradient(135deg, #adb9ca, #ffd966, #87ceeb);
        -webkit-mask:
          linear-gradient(#fff 0 0) content-box,
          linear-gradient(#fff 0 0);
        -webkit-mask-composite: xor;
        mask-composite: exclude;
      }

      .allocation-top {
        width: 100%;
        height: 22%;
        // background-color: blue;
        display: flex;
        justify-content: space-between;
        align-items: center;
        .left-animation {
          width: 35%;
          height: 100%;
          background-color: transparent;
          position: relative;
          margin-left: 1.5vh;
          .box1 {
            width: 90%;
            height: 65%;
            background-color: #ffffff;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            border-radius: 38%;
            border: 1px solid #70ad47;
            box-shadow: 0 0 4px 3px #70ad47;
            animation: rotate1 1.7s linear infinite;
          }
          .box2 {
            width: 90%;
            height: 65%;
            background-color: #ffffff;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            border-radius: 38%;
            border: 1px solid #70ad47;
            box-shadow: 0 0 6px 1px #70ad47;
            animation: rotate2 2.4s linear infinite;
          }
          .box-circle {
            width: 89%;
            height: 66%;
            // background-color: #2c3a55;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            border-radius: 40%;
            // animation: rotate3 7s linear infinite;
          }
          .refresh-icon {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            animation: rotate3 3s linear infinite;
          }

          @keyframes rotate1 {
            from {
              transform: translate(-50%, -50%) rotate(0deg);
            }
            to {
              transform: translate(-50%, -50%) rotate(360deg);
            }
          }

          @keyframes rotate2 {
            from {
              transform: translate(-50%, -50%) rotate(0deg);
            }
            to {
              transform: translate(-50%, -50%) rotate(360deg);
            }
          }

          @keyframes rotate3 {
            from {
              transform: translate(-50%, -50%) rotate(0deg);
            }
            to {
              transform: translate(-50%, -50%) rotate(360deg);
            }
          }
        }
        .right-algorithm {
          width: 100%;
          height: 100%;
          // background-color: yellow;
          font-family: 'D-DINExp';
          font-family: '方正粗黑宋简体';
          font-size: 2.8vh;
          color: #ffd966;
          transform: scaleY(0.9);
          margin-left: 1.6vh;
          margin-top: 1vh;

          padding-top: 1.9vh;
        }
      }
      .allocation-bottom {
        width: 100%;
        height: 78%;
        background-color: #2c3a55;
        border-radius: 0 0 2vh 2vh;
        padding: 0.6vh 0.1vh;

        .log-container {
          width: 100%;
          height: 100%;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          gap: 0.3vh;
          padding-left: -0.2vh;
          overflow-y: auto;
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE and Edge */
          &::-webkit-scrollbar {
            display: none; /* Chrome, Safari, Opera */
          }

          .log-item {
            color: #e7e6e6;
            font-size: 1.2vh;
            font-family: 'D-DINExp';
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            line-height: 2.2vh;
            transform: scaleY(0.95);
            transition: all 0.3s ease;
            padding-left: 1vh;
            opacity: 1;

            .log-time {
              color: #ffd966;
              margin-right: 1vh;
            }

            .log-status {
              color: #8eaadb;
              margin-right: 1vh;
            }

            .log-message {
              color: #e7e6e6;
            }

            &:first-child {
              animation: fadeIn 0.3s ease-out;
            }
          }
        }
      }
    }

    .box-right {
      height: 90%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      margin-top: -4vh;
      margin-right: -6.4vh;
      .allocation-edge1 {
        margin-right: 1.2vh;
        margin-bottom: 1vh;
        // transform: rotateZ(-90deg);
      }
      .allocation-edge2 {
        margin-right: 1.2vh;
        // transform: rotateZ(-90deg);
      }
    }
  }
  .bottomBox {
    width: 100%;
    height: 10%;
    background-color: transparent;
    margin-top: -5.9vh;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
