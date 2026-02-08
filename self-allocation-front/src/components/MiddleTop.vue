<script setup>
import { ref, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { getStartURL } from '@/api/render'
import { getAINode } from '@/api/ollama'
import { getSimulationNode } from '@/api/simulation'
import { aiQuestions } from '@/utils/AIquestions'
import { simulationQuestions } from '@/utils/Simuquestion'

// 定义props接收调度结果数据
const props = defineProps({
  scheduleResult: {
    type: Object,
    required: true,
    default: () => ({
      message: '',
      status: '',
      data: null
    })
  }
})

// 模拟消息数据
const messages = ref([])

// 格式化时间
const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const seconds = date.getSeconds().toString().padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

// 监听调度结果变化
watch(
  () => props.scheduleResult,
  (newResult) => {
    if (newResult.message) {
      console.log('MiddleTop收到新的调度结果:', {
        message: newResult.message,
        status: newResult.status,
        data: newResult.data
      })

      // 添加新消息到底部
      const newMessage = {
        time: formatTime(newResult.data?.timing?.timestamp),
        status: newResult.status,
        message: newResult.message
      }
      messages.value.push(newMessage)

      // 保持最多显示8条消息
      if (messages.value.length > 8) {
        messages.value = messages.value.slice(-8)
      }

      // 滚动到最新消息
      const messageBox = document.querySelector('.message-box')
      if (messageBox) {
        messageBox.scrollTop = messageBox.scrollHeight
      }
    }
  },
  { deep: true, immediate: true }
)
</script>

<template>
  <div class="middle-top">
    <div class="message-box">
      <div v-for="(message, index) in messages" :key="index" class="message-item">
        <span class="message-time">{{ message.time }}</span>
        <span class="message-status" v-if="message.status">[ {{ message.status }} ]</span>
        <span class="message-text">{{ message.message }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.middle-top {
  width: 23vw;
  height: 21vh;
  background-color: #3d4f71;
  padding: 1.5vh;
  display: flex;
  flex-direction: column;
  border-radius: 0.5vh;
  margin-left: 1.2vh;
  margin-right: -2.2vh;
  margin-top: -4.2vh;
  transform: perspective(1000px) rotateX(-18deg);
  transform-origin: bottom;
  box-shadow: 0 3px 5px rgba(0, 0, 0, 0.6);
  background: linear-gradient(180deg, #3d4f71 0%, #2c3a55 100%);

  .message-box {
    width: 100%;
    height: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 0.8vh;
    overflow-y: auto;
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE and Edge */
    &::-webkit-scrollbar {
      display: none; /* Chrome, Safari, Opera */
    }
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);

    .message-item {
      color: #e7e6e6;
      font-size: 1.3vh;
      font-family: 'D-DINExp';
      white-space: normal;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.8vh;
      min-height: 3.6vh;
      transform: scaleY(0.9);
      transition: all 0.3s ease;
      animation: popUp 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28);
      padding-right: 1vh;
      margin-left: 1vh;

      .message-time {
        color: #ffd966;
        margin-right: 1vh;
        display: inline-block;
      }

      .message-status {
        color: #8eaadb;
        margin-right: 1vh;
        display: inline-block;
      }

      .message-text {
        color: #e7e6e6;
        display: inline;
      }
    }
  }
}

@keyframes popUp {
  from {
    opacity: 0;
    transform: translateY(20px) scaleY(0.9) scale(0.8);
  }
  50% {
    opacity: 1;
    transform: translateY(-5px) scaleY(0.9) scale(1.02);
  }
  to {
    opacity: 1;
    transform: translateY(0) scaleY(0.9) scale(1);
  }
}
</style>
