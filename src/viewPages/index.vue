<template>
    <div class="home">
        <div class="header">
            <div class="left">管理后台</div>
            <div class="center"></div>
            <div class="right" v-if="token">
                <div class="loginOut" @click="handLoginOut">退出</div>
                <div class="text" v-if="nickname">您好！ {{ nickname }},欢迎登录</div>
                <div class="text" v-else>您好！ 欢迎登录</div>
            </div>
            <div class="right" v-else>
                <div class="loginIn" @click="loginIn">登陆</div>
            </div>
        </div>
        <div class="container">
            <div class="aside">
                <el-menu background-color="rgb(121.3, 187.1, 255)" text-color="#000" active-text-color="#ffd04b"
                    unique-opened  router  class="el-menu-vertical-demo">
                    <el-menu-item index="1" route="/">用户管理</el-menu-item>
                    <el-menu-item index="2" route="/rechargeManage">充值管理</el-menu-item>
                    <el-menu-item index="3" route="/withdrawCashManage">提现管理</el-menu-item>
                    <el-menu-item index="8" route="/stakingManage">质押记录管理</el-menu-item>
                    <el-menu-item index="9" route="/dailyRewardManage">每日收益管理</el-menu-item>
                    <el-menu-item index="10" route="/distributionFailureManage">收益发放失败管理</el-menu-item>
                    <el-menu-item index="11" route="/dailyRewardTaskManage">每日收益任务管理</el-menu-item>
                    <el-menu-item index="12" route="/zAssetPackageReleaseManage">Z资产包释放管理</el-menu-item>
                    <el-menu-item index="4" route="/geoManage">区域管理</el-menu-item>
                    <el-menu-item index="5" route="/bizNodeManage">节点管理</el-menu-item>
                    <el-menu-item index="6" route="/nodeBindManage">节点绑定管理</el-menu-item>
                    <el-menu-item index="7" route="/nodeChangeManage">节点转移申请管理</el-menu-item>
                </el-menu>
            </div>
            <div class="main"><router-view></router-view></div>
        </div>
        <el-dialog v-model="loginOutDialog" width="400">
            <div class="diaContent">
                是否退出登陆？
            </div>

            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="loginOutDialog = false">取消</el-button>
                    <el-button type="primary" @click="handConfirm">
                        确认
                    </el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>
<script setup>
import { TOKEN } from '@/utils/constants'
const _Cache = inject('$caches')
const router = useRouter()
const loginOutDialog = ref(false)
const handLoginOut = () => {
    loginOutDialog.value = true
}
const token = ref(_Cache._LocalCache.Get(TOKEN))
let nickname = _Cache._LocalCache.Get('nickname')
const handConfirm = () => {
    loginOutDialog.value = false
    _Cache._LocalCache.Remove(TOKEN)
    router.push("/login");
}
const loginIn = () => {
    router.push("/login");
}
</script>
<style lang="scss" scoped>
.home {
    width: 100%;
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;

    .header {
        height: 10%;
        background: #409EFF;
        padding: 0 0.4rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;

        .left {
            font-size: 0.3rem;
            color: #fff;
        }

        .center {
            font-size: 0.3rem;
            color: #F56C6C;
        }

        .right {
            font-size: 0.18rem;
            color: #fff;
            display: flex;
            align-items: center;

            .loginOut {
                margin-right: 0.2rem;
                cursor: pointer;
            }

            .loginOut:hover {
                color: green;
            }

            .loginIn {
                cursor: pointer;
            }

            .loginIn:hover {
                color: green;
            }
        }
    }

    .container {
        width: 100%;
        flex: 1;
        height: 100%;
        display: flex;
        justify-content: space-between;

        .aside {
            width: 16%;
            height: 100%;
            background: rgb(51.2, 126.4, 204);
        }

        .main {
            width: 90%;
            height: 100%;
            padding: 0.2rem 0.15rem;
            overflow-y: auto;
        }
    }
}
</style>