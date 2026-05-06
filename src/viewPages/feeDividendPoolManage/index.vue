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
                                    @click="showDistributeDialog(pool)"
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

        <el-dialog
            v-model="distributeDialogVisible"
            title="设置分红金额"
            width="520px"
            :before-close="beforeCloseDistribute"
            align-center>
            <div class="dialog-content">
                <el-form :model="distributeForm" label-width="120px" class="adjust-form distribute-form">
                    <el-form-item label="分红池">
                        <span>{{ currentDistributePool?.poolTypeDisplayName || '--' }}</span>
                    </el-form-item>
                    <el-form-item label="当前余额">
                        <span class="balance-highlight">{{ formatCrypto(currentDistributePool?.balance || 0) }} USDT</span>
                    </el-form-item>
                </el-form>
                <div class="distribute-field">
                    <div class="distribute-field-label is-required">分红金额</div>
                    <div class="distribute-field-content">
                        <div class="amount-entry" :class="{ invalid: !!distributeAmountError }">
                            <el-input
                                v-model="distributeForm.amount"
                                placeholder="请输入本次分红金额"
                                inputmode="decimal"
                                @input="handleDistributeAmountInput"
                            >
                                <template #suffix>USDT</template>
                            </el-input>
                            <el-button text type="primary" @click="fillMaxDistributeAmount">
                                全部分红
                            </el-button>
                        </div>
                    </div>
                    <div class="distribute-meta">
                        <div class="meta-chip">
                            <span class="chip-label">本次输入</span>
                            <span class="chip-value">{{ formatCrypto(distributeParsedAmount || 0) }} USDT</span>
                        </div>
                        <div class="meta-chip" :class="{ warning: !!distributeAmountError }">
                            <span class="chip-label">分红后余额</span>
                            <span class="chip-value">{{ formatCrypto(distributeBalanceAfter) }} USDT</span>
                        </div>
                    </div>
                    <div v-if="distributeAmountError" class="field-tip is-error">{{ distributeAmountError }}</div>
                    <div v-else class="field-tip">请输入本次实际要发放的金额，不能超过当前分红池余额。</div>
                </div>
            </div>
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="beforeCloseDistribute">取消</el-button>
                    <el-button
                        type="primary"
                        @click="handleDistribute"
                        :loading="getCurrentDistributeLoading()"
                        :disabled="isDistributeAmountInvalid">
                        下一步
                    </el-button>
                </div>
            </template>
        </el-dialog>

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

        <div class="logs-section">
            <div class="section-header">
                <span class="title">分红池操作记录</span>
            </div>
            <div class="table-wrapper">
                <el-table
                    class="logs-table"
                    :data="operationLogs"
                    border
                    style="width: 100%"
                    height="280"
                    v-loading="logsLoading">
                <el-table-column prop="createdAt" label="时间" min-width="200" show-overflow-tooltip>
                    <template #default="{ row }">
                        <span class="time-cell">{{ formatDateTime(row.createdAt) }}</span>
                    </template>
                </el-table-column>
                <el-table-column prop="poolTypeDisplayName" label="分红池" min-width="200" />
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
            </div>
            <div class="logs-pagination">
                <el-pagination
                    v-model:current-page="logsPageNo"
                    v-model:page-size="logsPageSize"
                    :total="operationLogsTotal"
                    :page-sizes="[10, 20, 50, 100]"
                    background
                    layout="total, sizes, prev, pager, next, jumper"
                    @size-change="handleLogsSizeChange"
                    @current-change="handleLogsCurrentChange">
                    <template #total="{ total }">
                        <span class="pagination-total">共 {{ total }} 条</span>
                    </template>
                </el-pagination>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, inject, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { formatCrypto, formatDateTime } from '@/utils/format'
import { handleApiError } from '@/utils/request'

const _Api = inject('$api')

const poolList = ref([])
const pageLoading = ref(false)
const distributeLoading = reactive({})
const distributeDialogVisible = ref(false)
const adjustDialogVisible = ref(false)
const adjustLoading = ref(false)
const currentPool = ref(null)
const currentDistributePool = ref(null)

const sanitizeDistributeAmount = (value) => {
    if (value === null || value === undefined) {
        return ''
    }

    let normalized = String(value).replace(/[^\d.]/g, '')
    if (!normalized) {
        return ''
    }

    const firstDotIndex = normalized.indexOf('.')
    if (firstDotIndex !== -1) {
        normalized = normalized.slice(0, firstDotIndex + 1) + normalized.slice(firstDotIndex + 1).replace(/\./g, '')
    }

    if (normalized.startsWith('.')) {
        normalized = `0${normalized}`
    }

    const hasDecimalPoint = normalized.includes('.')
    const parts = normalized.split('.')
    let integerPart = parts[0] || '0'
    integerPart = integerPart.replace(/^0+(\d)/, '$1')
    const decimalPart = hasDecimalPoint ? (parts[1] || '').slice(0, 8) : ''

    return hasDecimalPoint ? `${integerPart}.${decimalPart}` : integerPart
}

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

const distributeForm = reactive({
    amount: ''
})

const currentDistributePoolBalance = computed(() => Number(currentDistributePool.value?.balance || 0))
const distributeParsedAmount = computed(() => {
    if (distributeForm.amount === null || distributeForm.amount === undefined || distributeForm.amount === '') {
        return null
    }

    const amount = Number(distributeForm.amount)
    return Number.isNaN(amount) ? null : amount
})

const distributeAmountError = computed(() => {
    if (distributeForm.amount === null || distributeForm.amount === undefined || distributeForm.amount === '') {
        return ''
    }

    if (distributeParsedAmount.value === null || distributeParsedAmount.value <= 0) {
        return '分红金额必须大于 0'
    }

    if (distributeParsedAmount.value > currentDistributePoolBalance.value) {
        return '分红金额不能超过当前分红池余额'
    }

    return ''
})

const distributeBalanceAfter = computed(() => {
    if (distributeForm.amount === null || distributeForm.amount === undefined || distributeForm.amount === '') {
        return currentDistributePoolBalance.value
    }

    if (distributeParsedAmount.value === null || distributeParsedAmount.value < 0) {
        return currentDistributePoolBalance.value
    }

    return Math.max(currentDistributePoolBalance.value - distributeParsedAmount.value, 0)
})

const isDistributeAmountInvalid = computed(() => {
    if (distributeForm.amount === null || distributeForm.amount === undefined || distributeForm.amount === '') {
        return true
    }

    return !!distributeAmountError.value
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

// 显示分红对话框
const showDistributeDialog = (pool) => {
    currentDistributePool.value = pool
    distributeForm.amount = ''
    distributeDialogVisible.value = true
}

const handleDistributeAmountInput = (value) => {
    distributeForm.amount = sanitizeDistributeAmount(value)
}

const fillMaxDistributeAmount = () => {
    if (!currentDistributePool.value) {
        return
    }
    distributeForm.amount = String(currentDistributePool.value.balance || 0)
}

// 关闭分红对话框
const beforeCloseDistribute = () => {
    distributeDialogVisible.value = false
    currentDistributePool.value = null
    distributeForm.amount = ''
}

const getCurrentDistributeLoading = () => {
    const poolType = currentDistributePool.value?.poolType
    return poolType ? !!distributeLoading[poolType] : false
}

// 触发分红
const handleDistribute = async () => {
    if (!currentDistributePool.value) {
        return
    }

    if (distributeParsedAmount.value === null || distributeParsedAmount.value <= 0) {
        ElMessage.warning('请输入大于 0 的分红金额')
        return
    }

    if (distributeParsedAmount.value > Number(currentDistributePool.value.balance || 0)) {
        ElMessage.warning('分红金额不能超过当前分红池余额')
        return
    }

    const poolType = currentDistributePool.value.poolType
    const poolName = currentDistributePool.value.poolTypeDisplayName
    const amount = distributeParsedAmount.value

    try {
        await ElMessageBox.confirm(
            `确认对${poolName}执行分红吗？本次将发放 ${formatCrypto(amount)} USDT，执行后不可撤销。`,
            '二次确认',
            {
                confirmButtonText: '确认分红',
                cancelButtonText: '取消',
                type: 'warning'
            }
        )

        distributeLoading[poolType] = true
        beforeCloseDistribute()
        try {
            const res = await _Api._FeeDividendPoolDistribute({ poolType, amount })
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
        margin-bottom: 16px;
    }

    .pool-card {
        margin-bottom: 12px;
        height: auto;

        :deep(.el-card__body) {
            padding: 12px;
        }

        .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;

            .pool-title {
                font-size: 14px;
                font-weight: bold;
            }
        }

        .pool-content {
            .balance-item {
                margin-bottom: 10px;
                display: flex;
                justify-content: space-between;
                align-items: center;

                .label {
                    color: #606266;
                    font-size: 13px;
                }

                .value {
                    font-size: 14px;
                    font-weight: 500;

                    &.balance {
                        color: #409EFF;
                        font-size: 18px;
                        font-weight: bold;
                    }
                }
            }

            .card-actions {
                margin-top: 12px;
                display: flex;
                gap: 8px;

                .el-button {
                    padding: 8px 15px;
                    font-size: 13px;
                }
            }
        }
    }

    .form-tip {
        font-size: 12px;
        color: #909399;
        margin-top: 8px;
        line-height: 1.5;
    }

    .balance-highlight {
        color: #409EFF;
        font-weight: 600;
    }

    .dialog-content {
        padding: 10px 0;
    }

    .distribute-field {
        display: grid;
        grid-template-columns: 120px 1fr;
        row-gap: 10px;
        margin-bottom: 24px;
    }

    .distribute-field-label {
        width: 120px;
        min-width: 120px;
        padding: 9px 12px 0 0;
        line-height: 1.4;
        font-weight: 500;
        color: #606266;
        text-align: right;
        box-sizing: border-box;

        &.is-required::before {
            content: '*';
            color: #f56c6c;
            margin-right: 4px;
        }
    }

    .distribute-field-content {
        display: flex;
        justify-content: flex-start;
        box-sizing: border-box;
    }

    .amount-entry {
        width: 330px;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 4px 8px;
        border: 1px solid #dcdfe6;
        border-radius: 10px;
        background: linear-gradient(180deg, #fbfdff 0%, #f5f9ff 100%);
        transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;

        &.invalid {
            border-color: #f56c6c;
            box-shadow: 0 0 0 3px rgba(245, 108, 108, 0.08);
            background: #fff8f8;
        }
    }

    .distribute-meta {
        grid-column: 1 / -1;
        width: 420px;
        display: flex;
        justify-content: center;
        align-items: stretch;
        gap: 16px;
        margin: 0 auto;
    }

    .meta-chip {
        flex: 1;
        padding: 10px 12px;
        border-radius: 10px;
        background: #f7f8fa;
        border: 1px solid #ebeef5;

        &.warning {
            background: #fff6f6;
            border-color: rgba(245, 108, 108, 0.35);

            .chip-value {
                color: #f56c6c;
            }
        }
    }

    .chip-label {
        display: block;
        font-size: 12px;
        color: #909399;
        margin-bottom: 4px;
    }

    .chip-value {
        font-size: 14px;
        font-weight: 600;
        color: #303133;
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

    .amount-entry :deep(.el-input) {
        flex: 1;
    }

    .amount-entry :deep(.el-input__wrapper) {
        box-shadow: none;
        background: transparent;
        min-height: 30px;
        padding: 0 4px;
    }

    .amount-entry :deep(.el-input__inner) {
        text-align: left;
        font-size: 14px;
    }

    .amount-entry :deep(.el-input__suffix-inner) {
        color: #909399;
        font-size: 12px;
        font-weight: 500;
    }

    .amount-entry .el-button {
        padding: 4px 8px;
        font-size: 13px;
    }

    .field-tip {
        grid-column: 1 / -1;
        width: 420px;
        margin: 0 auto;
        font-size: 12px;
        line-height: 1.5;
        text-align: center;

        &.is-error {
            color: #f56c6c;
        }
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
        display: flex;
        flex-direction: column;

        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
            flex-shrink: 0;

            .title {
                font-size: 16px;
                font-weight: 600;
                color: #303133;
            }
        }

        .table-wrapper {
            width: 100%;
            overflow-x: auto;
            margin-bottom: 10px;
            flex-shrink: 0;

            .logs-table {
                min-width: 1200px;

                .time-cell {
                    white-space: nowrap;
                }
            }
        }

        .logs-pagination {
            display: flex;
            justify-content: flex-end;
            margin-top: 10px;
            flex-shrink: 0;
            padding-top: 10px;
            width: 100%;

            .pagination-total {
                margin-right: 8px;
            }
        }
    }
}
</style>

