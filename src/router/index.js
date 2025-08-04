import { createRouter, createWebHistory,createWebHashHistory } from 'vue-router'
import Common from './modules/common'
const routes = [...Common]
const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior: (to, from, savedPosition) => (savedPosition ? savedPosition : { left: 0, top: 0 }),
})

export default router
export const setupRouter = app => app.use(router)
