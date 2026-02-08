<script setup></script>

<template>
  <div class="titleheader">
    <div class="titlebox"></div>
    <div class="box2">
      <div class="title">云边端算力自调配系统</div>
    </div>
  </div>
</template>

<style scoped lang="scss">
body {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
.titleheader {
  background-color: transparent;
  position: relative;
  perspective: 1000px;
  width: 100vw;
  height: 8vh;
  margin: 0 auto;
  .titlebox {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    height: 14vh;
    width: 90vw;
    margin: 0 auto;
    margin-top: -3.3vh;

    background-color: #264171;
    transform: rotateX(-60deg);
    transform-origin: center;
  }
  .box2 {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: row;
    justify-content: center; // 改为居中对齐
    align-items: center;
    width: 100%; // 设置宽度为100%
    .title {
      font-family: '方正粗黑宋简体';
      font-size: 5.55vh;
      color: #fff;
      transform: scaleY(0.75);
      display: inline-block;
      text-align: center; // 文字居中
      margin-top: -0.7vh;
      font-weight: 500;
    }
  }
}
</style>
