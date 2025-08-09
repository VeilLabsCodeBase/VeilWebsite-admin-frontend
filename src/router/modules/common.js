export default [
    // 启动页
    {
        path: '/',
        component: () => import('@/viewPages/index.vue'),
        children: [{
                path: '',
                component: () => import('@/viewPages/userManage/index.vue'),
            },
            {
                path: '/rechargeManage',
                name: 'rechargeManage',
                component: () => import('@/viewPages/rechargeManage/index.vue'),
            },
             {
                path: '/withdrawCashManage',
                name: 'withdrawCashManage',
                component: () => import('@/viewPages/withdrawCashManage/index.vue'),
            },
            {
                path: '/sse',
                name: 'sse',
                component: () => import('@/viewPages/sse/index.vue'),
            },
        ]
    },
    {
        path: '/login',
        component: () => import('@/viewPages/login.vue'),
    }


]