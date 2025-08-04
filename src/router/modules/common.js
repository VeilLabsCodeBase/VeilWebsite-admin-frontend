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
                name: 'longVideo',
                component: () => import('@/viewPages/rechargeManage/index.vue'),
            },
          
        ]
    },
    {
        path: '/login',
        component: () => import('@/viewPages/login.vue'),
    }


]