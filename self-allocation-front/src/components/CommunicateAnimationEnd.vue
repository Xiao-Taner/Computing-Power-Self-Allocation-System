<script setup>
defineProps({
  speed: {
    type: Number,
    default: 1,
    validator: (value) => value >= 0 && value <= 1
  }
})

// 定义圆形的配置
const circles = [
  { size: '1.8vh', color: '#ffd966', delay: '0s' },
  { size: '1.2vh', color: '#f4b183', delay: '.4s' },
  { size: '1.5vh', color: '#d9f36d', delay: '.2s' },
  { size: '1vh', color: '#ffd966', delay: '.8s' },
  { size: '1.6vh', color: '#f4b183', delay: '.3s' },
  { size: '1.3vh', color: '#d9f36d', delay: '.5s' },
  { size: '1.1vh', color: '#ffd966', delay: '.1s' },
  { size: '1.4vh', color: '#f4b183', delay: '.6s' },
  { size: '1.7vh', color: '#d9f36d', delay: '.5s' }
]
</script>

<template>
  <div class="animation-container">
    <div
      v-for="(circle, index) in circles"
      :key="index"
      class="circle"
      :style="{
        width: circle.size,
        height: circle.size,
        backgroundColor: circle.color,
        animationDelay: circle.delay,
        animationDuration: `${1 / speed}s`
      }"
    ></div>
  </div>
</template>

<style scoped lang="scss">
.animation-container {
  width: 20vw;
  height: 10vh;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 2vh;
  margin-left: 3.2vh;
  margin-top: 1vh;

  .circle {
    border-radius: 50%;
    animation: float infinite ease-in-out;
    opacity: 0.8;

    @for $i from 1 through 9 {
      &:nth-child(#{$i}) {
        animation-direction: if($i % 2 == 0, alternate-reverse, alternate);
      }
    }
  }
}

@keyframes float {
  0% {
    transform: translateY(-1.5vh);
  }
  50% {
    transform: translateY(1vh);
  }
  100% {
    transform: translateY(-1.5vh);
  }
}
</style>
