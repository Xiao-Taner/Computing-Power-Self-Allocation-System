import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import SelfHome from '../views/SelfHome.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: SelfHome,  // 默认显示完整的监控系统
    },
    {
      path: '/test',
      name: 'test',
      component: HomeView,  // 测试页面移到 /test 路径
    },
    {
      path: '/selfhome',
      name: 'selfhome',
      component: SelfHome,
    },
    // 如果需要其他路由，可以在这里添加
    // {
    //   path: '/about',
    //   name: 'about',
    //   component: () => import('../views/AboutView.vue')
    // }
  ],
})

export default router
