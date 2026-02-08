<script setup>
defineProps({
  color: {
    type: String,
    default: '#4472c4' // 默认蓝色
  },
  width: {
    type: String,
    default: '15vw' // 默认宽度
  }
})
</script>

<template>
  <div class="connect-line" :style="{ width: width }">
    <div class="circle left" :style="{ backgroundColor: color }"></div>
    <div class="line" :style="{ backgroundColor: color }"></div>
    <div class="circle right" :style="{ backgroundColor: color }"></div>
  </div>
</template>

<style scoped lang="scss">
.connect-line {
  height: 0.4vh;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;

  .circle {
    width: 1.2vh;
    height: 1.2vh;
    border-radius: 50%;
    position: absolute;
    top: 50%;
    transform: translateY(-50%);

    &.left {
      left: -0.4vh;
    }

    &.right {
      right: -0.4vh;
    }
  }

  .line {
    width: 100%;
    height: 100%;
  }
}
</style>
