<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { getDeviceUpdate } from '@/api/device'
import { getStartURL } from '@/api/render'
import { getAINode } from '@/api/ollama'
import { getSimulationNode } from '@/api/simulation'
import { ElMessage } from 'element-plus'
import { aiQuestions } from '@/utils/AIquestions'
import { simulationQuestions } from '@/utils/Simuquestion'

const deviceData = ref(null)

// AI推理相关
const aiPrompt = ref('') // AI输入的问题
const aiMessages = ref([]) // 存储所有的问题和回答
const aiRequestCount = ref(10) // AI请求总数

// 打印AI问题数组
console.log('AI问题列表:', aiQuestions)

// 仿真推理相关
const simulationMessages = ref([]) // 存储所有的仿真问题和回答
const simulationRequestCount = ref(10) // 仿真请求总数

let timer = null

const fetchDeviceData = async () => {
  try {
    const res = await getDeviceUpdate()
    if (res && res.code === 200) {
      deviceData.value = res.data
      console.log('设备数据更新成功:', deviceData.value)
    }
  } catch (error) {
    console.error('获取设备数据失败:', error)
  }
}

// 获取随机问题
const getRandomQuestion = () => {
  const randomIndex = Math.floor(Math.random() * aiQuestions.length)
  return aiQuestions[randomIndex]
}

// 处理单个AI请求
const handleSingleAIRequest = async (questionId) => {
  try {
    const question = getRandomQuestion()
    const newMessage = {
      id: questionId,
      question,
      answer: '',
      timestamp: Date.now()
    }

    // 添加新消息到列表开头
    aiMessages.value.unshift(newMessage)

    // 获取消息列容器
    const isEven = aiMessages.value.length % 2 === 1
    const columnSelector = isEven ? '.messages-column:first-child' : '.messages-column:last-child'
    const messageColumn = document.querySelector(columnSelector)
    if (messageColumn) {
      // 平滑滚动到顶部
      messageColumn.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    }

    // 获取节点并发送请求
    const nodeRes = await getAINode()
    if (nodeRes && nodeRes.code === 200) {
      const params = {
        model: 'qwen2:0.5B',
        prompt: question,
        stream: true
      }

      const response = await fetch(`http://${nodeRes.data.nodeState.ip}:11434/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      })

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.trim()) {
            try {
              const data = JSON.parse(line)
              if (data.response) {
                // 更新对应消息的回答
                const messageIndex = aiMessages.value.findIndex((msg) => msg.id === questionId)
                if (messageIndex !== -1) {
                  aiMessages.value[messageIndex].answer += data.response
                }

                // 当回答更新时，确保内容可见
                const messageElement = document.querySelector(
                  `${columnSelector} .message[data-id="${questionId}"]`
                )
                if (messageElement) {
                  messageElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
                }
              }
            } catch (e) {
              console.error('解析响应出错:', e)
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('AI请求失败:', error)
  }
}

// 处理随机间隔AI请求
const handleAutoAIRequests = async () => {
  const count = parseInt(aiRequestCount.value)
  if (isNaN(count) || count <= 0) {
    ElMessage.error('请输入有效的请求数量')
    return
  }

  ElMessage.success('开始自动模拟发送AI请求')

  // 清空之前的消息
  aiMessages.value = []

  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      handleSingleAIRequest(Date.now())
      console.log(`发送第 ${i + 1} 组AI请求`)
    }, 1000 * i)
  }
}

// 获取随机仿真问题
const getRandomSimulationQuestion = () => {
  const randomIndex = Math.floor(Math.random() * simulationQuestions.length)
  return simulationQuestions[randomIndex]
}

// 处理单个仿真请求
const handleSingleSimulationRequest = async (questionId) => {
  try {
    const question = getRandomSimulationQuestion()
    const newMessage = {
      id: questionId,
      question,
      answer: '',
      timestamp: Date.now()
    }

    // 添加新消息到列表开头
    simulationMessages.value.unshift(newMessage)

    // 获取消息列容器
    const isEven = simulationMessages.value.length % 2 === 1
    const columnSelector = isEven
      ? '.simulation-column:first-child'
      : '.simulation-column:last-child'
    const messageColumn = document.querySelector(columnSelector)
    if (messageColumn) {
      messageColumn.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    }

    // 获取节点并发送请求
    const nodeRes = await getSimulationNode()
    if (nodeRes && nodeRes.code === 200) {
      const params = {
        model: 'qwen2:0.5B',
        prompt: question,
        stream: true
      }

      const response = await fetch(`http://${nodeRes.data.nodeState.ip}:11434/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      })

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.trim()) {
            try {
              const data = JSON.parse(line)
              if (data.response) {
                const messageIndex = simulationMessages.value.findIndex(
                  (msg) => msg.id === questionId
                )
                if (messageIndex !== -1) {
                  simulationMessages.value[messageIndex].answer += data.response

                  // 当回答更新时，确保内容可见
                  const messageElement = document.querySelector(
                    `${columnSelector} .message[data-id="${questionId}"]`
                  )
                  if (messageElement) {
                    messageElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
                  }
                }
              }
            } catch (e) {
              console.error('解析响应出错:', e)
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('仿真请求失败:', error)
  }
}

// 处理自动仿真请求
const handleAutoSimulationRequests = async () => {
  const count = parseInt(simulationRequestCount.value)
  if (isNaN(count) || count <= 0) {
    ElMessage.error('请输入有效的请求数量')
    return
  }

  ElMessage.success('开始自动模拟发送仿真请求')

  // 清空之前的消息
  simulationMessages.value = []

  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      handleSingleSimulationRequest(Date.now())
      console.log(`发送第 ${i + 1} 组仿真请求`)
    }, 1000 * i)
  }
}

// 处理模式点击
const handleModeClick = async (playerMode) => {
  try {
    const appliId = '1323659194934493184'
    const res = await getStartURL(appliId, playerMode)
    if (res && res.code === 200) {
      const simpleUrl = res.data.simpleUrl
      if (simpleUrl) {
        ElMessage.success('正在打开渲染窗口')
        // 在新窗口中打开URL
        window.open(simpleUrl, '_blank', 'noopener,noreferrer')
      } else {
        ElMessage.warning('未获取到有效的URL')
      }
    }
  } catch (error) {
    ElMessage.error('获取URL失败')
    console.error('获取URL失败:', error)
  }
}

onMounted(() => {
  // 初始获取一次数据
  fetchDeviceData()
  timer = setInterval(fetchDeviceData, 5000)
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
})
</script>

<template>
  <main class="home-container">
    <!-- 左侧：云渲染区域 -->
    <div class="render-section">
      <h2>云渲染控制台</h2>
      <div class="render-controls">
        <div class="button-group">
          <el-button class="render-button" type="primary" @click="handleModeClick('0')"
            >普通模式</el-button
          >
          <el-button class="render-button" type="success" @click="handleModeClick('1')"
            >演示模式</el-button
          >
        </div>
        <div class="image-container">
          <img src="@/assets/hkx.jpg" alt="" />
        </div>
        <div class="image-container">
          <img src="@/assets/hkx2.jpg" alt="" />
        </div>
      </div>
    </div>

    <!-- 中间：AI推理区域 -->
    <div class="ai-section">
      <h2>AI推理控制台</h2>
      <div class="ai-controls">
        <div class="request-controls">
          <el-button type="success" class="auto-request-btn" @click="handleAutoAIRequests"
            >自动模拟发送AI请求</el-button
          >
          <el-input
            v-model="aiRequestCount"
            type="number"
            placeholder="请求总数"
            class="count-input"
          />
        </div>
        <div class="messages-container">
          <div class="messages-columns">
            <!-- 左侧对话 -->
            <div class="messages-column">
              <div
                v-for="message in aiMessages.filter((_, index) => index % 2 === 0)"
                :key="message.id"
                class="message"
                :data-id="message.id"
              >
                <div class="question">Q: {{ message.question }}</div>
                <div class="answer">A: {{ message.answer }}</div>
              </div>
            </div>
            <!-- 右侧对话 -->
            <div class="messages-column">
              <div
                v-for="message in aiMessages.filter((_, index) => index % 2 === 1)"
                :key="message.id"
                class="message"
                :data-id="message.id"
              >
                <div class="question">Q: {{ message.question }}</div>
                <div class="answer">A: {{ message.answer }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧：仿真推理区域 -->
    <div class="simulation-section">
      <h2>仿真推理控制台</h2>
      <div class="simulation-controls">
        <div class="request-controls">
          <el-button type="success" class="auto-request-btn" @click="handleAutoSimulationRequests"
            >自动模拟发送仿真请求</el-button
          >
          <el-input
            v-model="simulationRequestCount"
            type="number"
            placeholder="请求总数"
            class="count-input"
          />
        </div>
        <div class="messages-container">
          <div class="messages-list">
            <div
              v-for="message in simulationMessages"
              :key="message.id"
              class="message"
              :data-id="message.id"
            >
              <div class="question">Q: {{ message.question }}</div>
              <div class="answer">A: {{ message.answer }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped lang="scss">
.home-container {
  display: flex;
  justify-content: space-between;
  padding: 20px;
  height: 100vh;
  background-color: #f0f2f5;

  .render-section,
  .ai-section,
  .simulation-section {
    margin: 0 10px;
    padding: 20px;
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  }

  .render-section {
    flex: 0.7;
  }

  .ai-section {
    flex: 1.4;
  }

  .simulation-section {
    flex: 0.8;
  }

  h2 {
    margin-bottom: 20px;
    color: #303133;
    font-size: 18px;
  }

  .chat-input {
    margin-bottom: 20px;
  }

  .chat-output {
    background-color: #f8f9fa;
  }

  .render-controls,
  .ai-controls,
  .simulation-controls {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .render-controls {
    .button-group {
      display: flex;
      justify-content: space-between;
      gap: 15px;
      margin-bottom: 15px;

      .render-button {
        flex: 1;
        height: 40px;
        font-size: 16px;
      }
    }

    .image-container {
      width: 100%;
      height: 280px;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transition: transform 0.3s ease;

      &:hover {
        transform: translateY(-2px);
      }

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 8px;
        transition: transform 0.3s ease;

        &:hover {
          transform: scale(1.02);
        }
      }
    }
  }

  .ai-section {
    .ai-controls {
      .el-button {
        width: 100%;
        margin-bottom: 15px;
      }

      .messages-container {
        height: 76vh;
        overflow-y: auto;
        padding: 10px;
        background-color: #f8f9fa;
        border-radius: 4px;

        .messages-columns {
          display: flex;
          gap: 20px;
          height: 100%;

          .messages-column {
            flex: 1;
            overflow-y: auto;
            padding: 10px;
            border-radius: 4px;
            background-color: rgba(255, 255, 255, 0.5);
            scrollbar-width: none; /* Firefox */
            -ms-overflow-style: none; /* IE and Edge */
            &::-webkit-scrollbar {
              display: none; /* Chrome, Safari, Opera */
            }

            &:first-child {
              border-right: 1px solid #e4e7ed;
            }
          }
        }

        .message {
          margin-bottom: 15px;
          text-align: left;
          padding: 10px;
          background-color: white;
          border-radius: 4px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

          .question {
            color: #409eff;
            margin-bottom: 5px;
            font-weight: bold;
            font-size: 16px;
          }

          .answer {
            color: #538135;
            white-space: pre-wrap;
            word-break: break-word;
            font-size: 14px;
            font-weight: 550;
          }
        }
      }
    }
  }

  .simulation-section {
    .simulation-controls {
      .el-button {
        width: 100%;
        margin-bottom: 15px;
      }

      .messages-container {
        height: 76vh;
        overflow-y: auto;
        padding: 10px;
        background-color: #f8f9fa;
        border-radius: 4px;
        scrollbar-width: none;
        -ms-overflow-style: none;
        &::-webkit-scrollbar {
          display: none;
        }

        .messages-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
          padding: 10px;
        }

        .message {
          text-align: left;
          padding: 10px;
          background-color: white;
          border-radius: 4px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

          .question {
            color: #409eff;
            margin-bottom: 5px;
            font-weight: bold;
            font-size: 16px;
          }

          .answer {
            color: #538135;
            white-space: pre-wrap;
            word-break: break-word;
            font-size: 14px;
            font-weight: 550;
          }
        }
      }
    }
  }

  :deep(.auto-request-btn) {
    background-color: #2c5530;
    border-color: #2c5530;

    &:hover {
      background-color: #1e3c22;
      border-color: #1e3c22;
    }
  }

  .ai-controls,
  .simulation-controls {
    .request-controls {
      display: flex;
      gap: 15px;
      margin-bottom: 15px;
      align-items: center;
      margin-top: -15px;

      .auto-request-btn {
        flex: 2;
        height: 40px;
        padding: 12px 20px;
        font-size: 16px;
        margin-top: 13px;
      }

      .count-input {
        flex: 1;
        width: auto;
        height: 40px !important;

        :deep(.el-input__inner) {
          text-align: center;
          height: 40px !important;
          line-height: 40px;
          font-size: 16px;
          font-weight: bold;
          padding: 0 15px;
          color: #2c5530;
          border-radius: 4px;
          border: 1px solid #dcdfe6;
          box-sizing: border-box;

          &::placeholder {
            font-weight: normal;
            color: #909399;
          }
        }

        :deep(.el-input__wrapper) {
          padding: 0;
          height: 40px !important;
          box-shadow: none !important;

          &.is-focus {
            box-shadow: 0 0 0 1px #2c5530 !important;
          }
        }
      }
    }

    .messages-container {
      height: 76vh;
      overflow-y: auto;
      padding: 10px;
      background-color: #f8f9fa;
      border-radius: 4px;
    }
  }
}
</style>
