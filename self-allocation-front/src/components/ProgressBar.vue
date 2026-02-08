<script setup>
import { computed } from 'vue'

const props = defineProps({
  color: {
    type: String,
    default: '#67C23A' // 默认绿色
  },
  percentage: {
    type: Number,
    default: 50,
    validator: (value) => value >= 0 && value <= 100
  },
  text: {
    type: String,
    default: ''
  }
})

const barWidth = computed(() => {
  return props.percentage < 5 ? `${props.percentage + 4}%` : `${props.percentage}%`
})
</script>

<template>
  <div class="progress-container">
    <div class="progress-text" v-if="text">{{ text }}</div>
    <div class="progress-bar">
      <div class="circle" :style="{ backgroundColor: color }"></div>
      <div class="line-container">
        <div class="line-bg"></div>
        <div
          class="line"
          :style="{
            width: barWidth,
            backgroundColor: color
          }"
        ></div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.progress-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.3vh;
  margin-top: 0.2vh;

  .progress-text {
    color: #fff;
    font-size: 0.9vh;
    font-family: 'D-DINExp';
    transform: scaleY(0.8);
    margin-left: 2.8vh;
    // margin-top: 0.2vh;
    margin-bottom: -0.2vh;
    height: 1.1vh;
  }

  .progress-bar {
    display: flex;
    align-items: center;
    gap: 0.3vh;
    height: 1.2vh;
    margin-left: 1.2vh;
    // margin-top: -0vh;

    .circle {
      width: 1.7vh;
      height: 1.7vh;
      border-radius: 50%;
      flex-shrink: 0;
      // margin-left: 0.2vh;
    }

    .line-container {
      flex: 1;
      height: 0.8vh;
      position: relative;
      margin-left: -0.5vh;

      .line-bg {
        position: absolute;
        width: 100%;
        height: 100%;
        background-color: #304567;
        // border-radius: 0.1vh;
      }

      .line {
        position: absolute;
        height: 100%;
        // border-radius: 0.6vh;
        transition: width 0.3s ease;
      }
    }
  }
}
</style>
