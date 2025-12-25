export default [
    // 启动页
    {
        path: '/',
        component: () => import('@/viewPages/index.vue'),
        children: [
            {
                path: '',
                component: () => import('@/viewPages/userManage/index.vue'),
                meta: {
                    title: '用户管理'
                }
            },
            {
                path: '/rechargeManage',
                name: 'rechargeManage',
                component: () => import('@/viewPages/rechargeManage/index.vue'),
                meta: {
                    title: '充值管理'
                }
            },
            {
                path: '/withdrawCashManage',
                name: 'withdrawCashManage',
                component: () => import('@/viewPages/withdrawCashManage/index.vue'),
                meta: {
                    title: '提现管理'
                }
            },
            {
                path: '/geoManage',
                name: 'geoManage',
                component: () => import('@/viewPages/geoManage/index.vue'),
                meta: {
                    title: '区域管理'
                }
            },
            {
                path: '/bizNodeManage',
                name: 'bizNodeManage',
                component: () => import('@/viewPages/bizNodeManage/index.vue'),
                meta: {
                    title: '节点管理'
                }
            },
            {
                path: '/nodeBindManage',
                name: 'nodeBindManage',
                component: () => import('@/viewPages/nodeBindManage/index.vue'),
                meta: {
                    title: '节点绑定管理'
                }
            },
            {
                path: '/nodeChangeManage',
                name: 'nodeChangeManage',
                component: () => import('@/viewPages/nodeChangeManage/index.vue'),
                meta: {
                    title: '节点转移申请管理'
                }
            },
            {
                path: '/stakingManage',
                name: 'stakingManage',
                component: () => import('@/viewPages/stakingManage/index.vue'),
                meta: {
                    title: '质押记录管理'
                }
            },
            {
                path: '/dailyRewardManage',
                name: 'dailyRewardManage',
                component: () => import('@/viewPages/dailyRewardManage/index.vue'),
                meta: {
                    title: '每日收益管理'
                }
            },
            {
                path: '/distributionFailureManage',
                name: 'distributionFailureManage',
                component: () => import('@/viewPages/distributionFailureManage/index.vue'),
                meta: {
                    title: '收益发放失败管理'
                }
            },
            {
                path: '/dailyRewardTaskManage',
                name: 'dailyRewardTaskManage',
                component: () => import('@/viewPages/dailyRewardTaskManage/index.vue'),
                meta: {
                    title: '每日收益任务管理'
                }
            },
            {
                path: '/zAssetPackageReleaseManage',
                name: 'zAssetPackageReleaseManage',
                component: () => import('@/viewPages/zAssetPackageReleaseManage/index.vue'),
                meta: {
                    title: 'Z资产包释放管理'
                }
            },
        ],
    },
    {
        path: '/modelTree/:userId',
        name: 'modelTree',
        component: () => import('@/viewPages/modelTree/index.vue'),
        meta: {
            title: '经济模型树'
        }
    },
    {
        path: '/login',
        component: () => import('@/viewPages/login.vue'),
        meta: {
            title: '登录'
        }
    },
]
