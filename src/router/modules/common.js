export default [
    // 启动页
    {
        path: '/',
        component: () => import('@/viewPages/index.vue'),
        children: [
            {
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
                path: '/geoManage',
                name: 'geoManage',
                component: () => import('@/viewPages/geoManage/index.vue'),
            },
            {
                path: '/bizNodeManage',
                name: 'bizNodeManage',
                component: () => import('@/viewPages/bizNodeManage/index.vue'),
            },
            {
                path: '/nodeBindManage',
                name: 'nodeBindManage',
                component: () => import('@/viewPages/nodeBindManage/index.vue'),
            },
            {
                path: '/nodeChangeManage',
                name: 'nodeChangeManage',
                component: () => import('@/viewPages/nodeChangeManage/index.vue'),
            },
        ],
    },
    {
        path: '/login',
        component: () => import('@/viewPages/login.vue'),
    },
]
