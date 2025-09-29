<template>
    <RouterView v-slot="{ Component }">
        <Component :is="Component"></Component>
    </RouterView>
    <el-dialog v-model="dialogVisible" title="您有新的订单" width="800" :before-close="beforeClose" destroy-on-close
        :modal="false">
        <div class="diaContent">
            <p>充值订单：{{ despositDataNum }}个</p>
            <p>提现订单：{{ withdrawCashDataNum }}个</p>
        </div>
        <template #footer>
            <div class="dialog-footer">
                <el-button @click="beforeClose">取消</el-button>
                <el-button type="primary" @click="handConfirm">
                    确定
                </el-button>
            </div>
        </template>
    </el-dialog>
</template>

<script setup>
import { WebSource } from '@/utils/webSource'
import { computed, watch } from 'vue'
import { ElNotification } from 'element-plus'
const dialogVisible = ref(false)
//充值订单
const despositDataNum = ref(0)
//提现订单
const withdrawCashDataNum = ref(0)
const isShowDespositNotice = ref(false)
const isShowWithdrodNotice = ref(false)
const webSource = new WebSource()
if (webSource) {
    webSource.initWebSouce()
    webSource.getNewDesposit((data) => {
        despositDataNum.value = data.length
    })
    webSource.getNewWithdraw((data) => {
        withdrawCashDataNum.value = data.length
    })
}



watch(() => [despositDataNum.value, withdrawCashDataNum.value], () => {
    if (despositDataNum.value > 0) {
        if (!isShowDespositNotice.value) {
            ElNotification({
                title: '您有新的充值订单',
                message: `充值订单`,
                type: 'success',
                duration: 0,
                onClose: () => {
                    isShowDespositNotice.value = false

                }
            })
            isShowDespositNotice.value = true
        }
    }
    if (withdrawCashDataNum.value > 0) {
        if (!isShowWithdrodNotice.value) {
            ElNotification({
                title: '您有新的提现订单',
                message: `提现订单`,
                type: 'warning',
                duration: 0,
                onClose: () => {
                    isShowWithdrodNotice.value = false
                }
            })
            isShowWithdrodNotice.value = true
        }
    }
})

//关闭前回调
const beforeClose = () => {
    dialogVisible.value = false
}
const handConfirm = async () => {

}
</script>

<style lang="scss"></style>
