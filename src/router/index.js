import { createRouter, createWebHistory,createWebHashHistory } from 'vue-router'
import Common from './modules/common'
const routes = [...Common]
const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior: (to, from, savedPosition) => (savedPosition ? savedPosition : { left: 0, top: 0 }),
})

// 设置页面标题
router.beforeEach((to, from, next) => {
    // 获取路由的meta.title，如果没有则使用默认标题
    const title = to.meta?.title || 'VEILX-管理后台'
    // 设置浏览器标签栏标题
    document.title = `VEILX-${title}`
    next()
})

export default router
export const setupRouter = app => app.use(router)
