<template>
    <div class="fee-dividend-pool-manage">
        <div class="pool-cards">
            <el-row :gutter="20">
                <el-col :span="8" v-for="pool in poolList" :key="pool.id">
                    <el-card class="pool-card" shadow="hover">
                        <template #header>
                            <div class="card-header">
                                <span class="pool-title">{{ pool.poolTypeDisplayName }}</span>
                                <el-tag v-if="pool.editable" type="info" size="small">可修改</el-tag>
                            </div>
                        </template>
                        <div class="pool-content">
                            <div class="balance-item">
                                <span class="label">当前余额：</span>
                                <span class="value balance">{{ formatCrypto(pool.balance) }} USDT</span>
                            </div>
                            <div class="balance-item">
                                <span class="label">累计注入：</span>
                                <span class="value">{{ formatCrypto(pool.totalInjected) }} USDT</span>
                            </div>
                            <div class="balance-item">
                                <span class="label">累计分红：</span>
                                <span class="value">{{ formatCrypto(pool.totalDistributed) }} USDT</span>
                            </div>
                            <div class="card-actions">
                                <el-button 
                                    type="primary" 
                                    @click="handleDistribute(pool.poolType)"
                                    :disabled="!pool.balance || pool.balance <= 0"
                                    :loading="distributeLoading[pool.poolType]">
                                    触发分红
                                </el-button>
                                <el-button 
                                    v-if="pool.editable"
                                    type="warning" 
                                    @click="showAdjustDialog(pool)">
                                    调整余额
                                </el-button>
                            </div>
                        </div>
                    </el-card>
                </el-col>
            </el-row>
        </div>

        <!-- 调整余额对话框 -->
        <el-dialog
            v-model="adjustDialogVisible"
            title="调整共谋者节点角色分红池余额"
            width="520px"
            :before-close="beforeCloseAdjust"
            align-center>
            <div class="dialog-content">
                <el-form :model="adjustForm" label-width="120px" class="adjust-form">
                    <el-form-item label="调整金额" required>
                        <el-input-number
                            v-model="adjustForm.amount"
                            :precision="8"
                            :step="1"
                            :min="-999999999"
                            :max="999999999"
                            placeholder="正数表示增加，负数表示减少"
                            style="width: 100%"
                            controls-position="right"
                        />
                        <div class="form-tip">正数表示增加，负数表示减少</div>
                    </el-form-item>
                    <el-form-item label="备注">
                        <el-input
                            v-model="adjustForm.remark"
                            type="textarea"
                            :rows="4"
                            placeholder="请输入备注信息"
                            maxlength="500"
                            show-word-limit
                        />
                    </el-form-item>
                </el-form>
            </div>
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="beforeCloseAdjust">取消</el-button>
                    <el-button type="primary" @click="handleAdjust" :loading="adjustLoading">
                        确认调整
                    </el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<div class="logs-section">
    <div class="section-header">
        <span class="title">分红池操作记录</span>
    </div>
    <el-table
        class="logs-table"
        :data="operationLogs"
        border
        style="width: 100%"
        v-loading="logsLoading">
        <el-table-column prop="createdAt" label="时间" min-width="160">
            <template #default="{ row }">
                {{ formatDateTime(row.createdAt) }}
            </template>
        </el-table-column>
        <el-table-column prop="poolTypeDisplayName" label="分红池" min-width="140" />
        <el-table-column prop="operationTypeDisplayName" label="操作类型" min-width="100" />
        <el-table-column prop="amount" label="操作金额(USDT)" min-width="150">
            <template #default="{ row }">
                {{ formatCrypto(row.amount) }}
            </template>
        </el-table-column>
        <el-table-column prop="balanceBefore" label="操作前余额" min-width="150">
            <template #default="{ row }">
                {{ formatCrypto(row.balanceBefore) }}
            </template>
        </el-table-column>
        <el-table-column prop="balanceAfter" label="操作后余额" min-width="150">
            <template #default="{ row }">
                {{ formatCrypto(row.balanceAfter) }}
            </template>
        </el-table-column>
        <el-table-column prop="userCount" label="分红人数" min-width="90" />
        <el-table-column prop="totalDistributed" label="分红总金额(USDT)" min-width="160">
            <template #default="{ row }">
                {{ formatCrypto(row.totalDistributed) }}
            </template>
        </el-table-column>
        <el-table-column prop="operatorUsername" label="操作人" min-width="120" />
        <el-table-column prop="remark" label="备注" min-width="200" show-overflow-tooltip />
    </el-table>
    <div class="logs-pagination">
        <el-pagination
            v-model:current-page="logsPageNo"
            v-model:page-size="logsPageSize"
            :total="operationLogsTotal"
            background
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleLogsSizeChange"
            @current-change="handleLogsCurrentChange"
        />
    </div>
</template>

<script setup>
import { ref, reactive, inject, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { formatCrypto, formatDate } from '@/utils/format'
import { handleApiError } from '@/utils/request'

const _Api = inject('$api')

const poolList = ref([])
const pageLoading = ref(false)
const distributeLoading = reactive({})
const adjustDialogVisible = ref(false)
const adjustLoading = ref(false)
const currentPool = ref(null)

// 操作记录相关
const operationLogs = ref([])
const operationLogsTotal = ref(0)
const logsPageNo = ref(1)
const logsPageSize = ref(10)
const logsLoading = ref(false)

const adjustForm = reactive({
    amount: null,
    remark: ''
})

// 获取分红池列表
const getPoolList = async () => {
    try {
        const res = await _Api._FeeDividendPoolList()
        if (res) {
            poolList.value = res
        }
    } catch (error) {
        handleApiError(error, '获取分红池列表失败')
    }
}

// 获取分红池操作记录
const getOperationLogs = async (page = logsPageNo.value) => {
    logsLoading.value = true
    try {
        const res = await _Api._FeeDividendPoolOperationLogs({
            pageNo: page,
            pageSize: logsPageSize.value,
        })
        if (res) {
            operationLogs.value = res.records || []
            operationLogsTotal.value = res.total || 0
            logsPageNo.value = page
        }
    } catch (error) {
        handleApiError(error, '获取分红池操作记录失败')
    } finally {
        logsLoading.value = false
    }
}

// 触发分红
const handleDistribute = async (poolType) => {
    try {
        await ElMessageBox.confirm(
            `确定要触发${getPoolTypeName(poolType)}的分红吗？分红后池子余额将被清空。`,
            '确认分红',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }
        )

        distributeLoading[poolType] = true
        try {
            const res = await _Api._FeeDividendPoolDistribute({ poolType })
            if (res) {
                ElMessage.success('分红成功')
                await Promise.all([getPoolList(), getOperationLogs(1)])
            }
        } finally {
            distributeLoading[poolType] = false
        }
    } catch (error) {
        if (error !== 'cancel') {
            handleApiError(error, '分红失败')
        }
    }
}

// 显示调整对话框
const showAdjustDialog = (pool) => {
    currentPool.value = pool
    adjustForm.amount = null
    adjustForm.remark = ''
    adjustDialogVisible.value = true
}

// 关闭调整对话框
const beforeCloseAdjust = () => {
    adjustDialogVisible.value = false
    currentPool.value = null
    adjustForm.amount = null
    adjustForm.remark = ''
}

// 确认调整
const handleAdjust = async () => {
    if (adjustForm.amount === null || adjustForm.amount === 0) {
        ElMessage.warning('请输入调整金额')
        return
    }

    try {
        adjustLoading.value = true
        const res = await _Api._FeeDividendPoolAdjust({
            amount: adjustForm.amount,
            remark: adjustForm.remark || ''
        })
        if (res) {
            ElMessage.success('调整成功')
            beforeCloseAdjust()
            await Promise.all([getPoolList(), getOperationLogs(1)])
        }
    } catch (error) {
        handleApiError(error, '调整失败')
    } finally {
        adjustLoading.value = false
    }
}

// 获取池子类型名称
const getPoolTypeName = (poolType) => {
    const pool = poolList.value.find(p => p.poolType === poolType)
    return pool ? pool.poolTypeDisplayName : poolType
}

// 格式化时间
const formatDateTime = (val) => formatDate(val, true)

// 分页变化
const handleLogsSizeChange = (val) => {
    logsPageSize.value = val
    getOperationLogs(1)
}

const handleLogsCurrentChange = (val) => {
    getOperationLogs(val)
}

onMounted(async () => {
    pageLoading.value = true
    try {
        await Promise.all([getPoolList(), getOperationLogs(1)])
    } finally {
        pageLoading.value = false
    }
})
</script>

<style scoped lang="scss">
.fee-dividend-pool-manage {
    padding: 20px;

    .pool-cards {
        margin-bottom: 24px;
    }

    .pool-card {
        margin-bottom: 20px;
        height: 100%;

        .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;

            .pool-title {
                font-size: 16px;
                font-weight: bold;
            }
        }

        .pool-content {
            .balance-item {
                margin-bottom: 15px;
                display: flex;
                justify-content: space-between;
                align-items: center;

                .label {
                    color: #606266;
                    font-size: 14px;
                }

                .value {
                    font-size: 16px;
                    font-weight: 500;

                    &.balance {
                        color: #409EFF;
                        font-size: 20px;
                        font-weight: bold;
                    }
                }
            }

            .card-actions {
                margin-top: 20px;
                display: flex;
                gap: 10px;
            }
        }
    }

    .form-tip {
        font-size: 12px;
        color: #909399;
        margin-top: 8px;
        line-height: 1.5;
    }

    .dialog-content {
        padding: 10px 0;
    }

    .adjust-form {
        .el-form-item {
            margin-bottom: 24px;
        }

        .el-form-item__label {
            font-weight: 500;
            color: #606266;
        }
    }

    /* 调整金额/备注输入框文本左对齐 */
    :deep(.el-input-number .el-input__inner) {
        text-align: left;
    }

    :deep(.el-textarea__inner) {
        text-align: left;
    }

    .dialog-footer {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        padding-top: 10px;
    }

    .logs-section {
        margin-top: 10px;

        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;

            .title {
                font-size: 16px;
                font-weight: 600;
                color: #303133;
            }
        }

        .logs-table {
            margin-bottom: 10px;
        }

        .logs-pagination {
            display: flex;
            justify-content: flex-end;
            margin-top: 10px;
        }
    }
}
</style>

