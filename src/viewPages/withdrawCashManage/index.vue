<template>
    <div class="batchUpload">
        <div class="filter">
            <el-form :inline="true" :model="formValue" class="demo-form-inline filter-form">
                <el-form-item label="用户名">
                    <el-input v-model="formValue.username" placeholder="用户名" clearable style="width: 100px" />
                </el-form-item>
                <el-form-item label="用户ID">
                    <el-input v-model="formValue.userId" placeholder="用户ID" clearable style="width: 90px"
                              @input="handleUserIdInput" />
                </el-form-item>
                <el-form-item label="提现地址">
                    <el-input v-model="formValue.address" placeholder="提现地址" clearable style="width: 140px" />
                </el-form-item>
                <el-form-item label="交易Hash">
                    <el-input v-model="formValue.txHash" placeholder="交易Hash" clearable style="width: 120px" />
                </el-form-item>
                <el-form-item label="提现状态">
                    <el-select v-model="formValue.status" placeholder="提现状态" clearable style="width: 130px">
                        <el-option label="待审核" value="APPROVAL" />
                        <el-option label="审核不通过" value="FAILED" />
                        <el-option label="审核通过" value="SUCCESSFULLY" />
                        <el-option label="无效" value="CANCELED" />
                    </el-select>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="onSearch">搜索</el-button>
                    <el-button @click="onReset">重置</el-button>
                </el-form-item>
            </el-form>
        </div>
        <div class="uploadList">
            <div class="taskUploadList">
                <div class="title">
                    <span>提现管理列表</span>
                    <el-button type="danger" @click="handleBatchAudit" :loading="batchSummaryLoading">
                        一键审核
                    </el-button>
                </div>
                <div class="list">
                    <el-table :data="tableData?.records" border style="width: 100%" height="100%" v-loading="loading">
                        <el-table-column prop="id" label="id" min-width="70" fixed="left" show-overflow-tooltip />
                        <el-table-column prop="username" label="用户名" min-width="120" fixed="left" show-overflow-tooltip />
                        <el-table-column prop="createdAt" label="申请时间" min-width="180" fixed="left" show-overflow-tooltip>
                            <template #default="{ row }">
                                {{ formatDateTime(row.createdAt) }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="amount" label="提现金额USDT" min-width="140" fixed="left" show-overflow-tooltip>
                            <template #default="{ row }">
                                {{ formatCrypto(row.amount) }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="usdtBalanceBefore" label="提现前USDT" min-width="130" show-overflow-tooltip>
                            <template #default="{ row }">
                                {{ formatCrypto(row.usdtBalanceBefore) }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="usdtBalanceAfter" label="提现后USDT" min-width="130" show-overflow-tooltip>
                            <template #default="{ row }">
                                {{ formatCrypto(row.usdtBalanceAfter) }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="address" label="提现地址" min-width="350" show-overflow-tooltip />
                        <el-table-column prop="txHash" label="交易Hash" min-width="350" show-overflow-tooltip>
                            <template #default="{ row }">
                                <span v-if="row.txHash" style="font-family: monospace; color: #409EFF; cursor: pointer;" 
                                      @click="copyTxHash(row.txHash)" :title="row.txHash">
                                    {{ row.txHash }}
                                </span>
                                <span v-else style="color: #909399;">-</span>
                            </template>
                        </el-table-column>
                        <el-table-column prop="fee" label="手续费" min-width="110" show-overflow-tooltip>
                            <template #default="{ row }">
                                {{ formatCrypto(row.fee) }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="actualTokenAmount" label="到账VEILX" min-width="130" show-overflow-tooltip>
                            <template #default="{ row }">
                                {{ formatCrypto(row.actualTokenAmount) }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="status" label="提现状态" min-width="125" show-overflow-tooltip>
                            <template #default="{ row }">
                                <el-tag :type="getStatusType(row.status)">
                                    {{ status[row.status] }}
                                </el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column prop="reason" label="备注" min-width="180" show-overflow-tooltip />
                        <el-table-column prop="approvedAt" label="审核通过时间" min-width="180" show-overflow-tooltip>
                            <template #default="{ row }">
                                {{ formatDateTime(row.approvedAt) }}
                            </template>
                        </el-table-column>
                        <el-table-column fixed="right" label="操作" min-width="120">
                            <template #default="scope">
                                <el-button link type="primary" @click="showDialog(scope.$index, scope.row)"
                                    size="small" :disabled="scope.row.status !== 'APPROVAL'">审核</el-button>
                            </template>
                        </el-table-column>
                    </el-table>
                </div>
                <div class="page">
                    <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" background
                        :total="tableData?.total" @size-change="handleSizeChange"
                        @current-change="handleCurrentChange" />
                </div>
            </div>
        </div>
        <el-dialog v-model="dialogVisible" title="提现审核" width="520" :before-close="beforeClose" destroy-on-close align-center>
            <div class="audit-dialog-content" v-if="rowData">
                <!-- 用户信息展示 -->
                <el-descriptions :column="1" border class="user-info">
                    <el-descriptions-item label="用户名">
                        <span class="info-value">{{ rowData.username || '-' }}</span>
                    </el-descriptions-item>
                    <el-descriptions-item label="到账金额">
                        <div class="amount-info">
                            <span class="amount-token" v-if="rowData.actualTokenAmount">
                                {{ formatCrypto(rowData.actualTokenAmount) }} VEILX
                            </span>
                            <span v-else class="no-amount">
                                {{ formatCrypto(rowData.actualAmount) || '-' }}
                            </span>
                        </div>
                    </el-descriptions-item>
                    <el-descriptions-item label="提现地址">
                        <div class="address-container">
                            <span class="address-text">{{ rowData.address || '-' }}</span>
                        </div>
                    </el-descriptions-item>
                    <el-descriptions-item label="当前状态">
                        <el-tag :type="getStatusType(rowData.status)">
                            {{ status[rowData.status] || '-' }}
                        </el-tag>
                    </el-descriptions-item>
                </el-descriptions>

                <el-divider content-position="left">审核操作</el-divider>

                <!-- 状态选择 -->
                <el-form :model="auditForm" label-width="100px" class="audit-form">
                    <el-form-item label="审核状态" required>
                        <el-radio-group v-model="auditForm.status" class="status-radio-group">
                            <el-radio value="APPROVAL" size="large">
                                <span class="status-label">{{ status.APPROVAL }}</span>
                            </el-radio>
                            <el-radio value="FAILED" size="large">
                                <span class="status-label">{{ status.FAILED }}</span>
                            </el-radio>
                            <el-radio value="SUCCESSFULLY" size="large">
                                <span class="status-label">{{ status.SUCCESSFULLY }}</span>
                            </el-radio>
                            <el-radio value="CANCELED" size="large">
                                <span class="status-label">{{ status.CANCELED }}</span>
                            </el-radio>
                        </el-radio-group>
                    </el-form-item>

                    <el-form-item label="审核备注">
                        <el-input 
                            v-model="auditForm.reason" 
                            type="textarea" 
                            :rows="2"
                            placeholder="请输入审核备注（选填）"
                            maxlength="200"
                            show-word-limit />
                    </el-form-item>
                </el-form>
            </div>
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="beforeClose" :disabled="submitLoading">取消</el-button>
                    <el-button type="primary" @click="handleConfirmClick" :disabled="!auditForm.status || submitLoading" :loading="submitLoading">
                        确定审核
                    </el-button>
                </div>
            </template>
        </el-dialog>

        <!-- 二次确认弹框 -->
        <el-dialog v-model="confirmDialogVisible" title="确认审核" width="500" destroy-on-close>
            <div class="confirm-dialog-content">
                <el-alert
                    :title="getConfirmTitle()"
                    type="warning"
                    :closable="false"
                    show-icon>
                </el-alert>
                <div class="confirm-info" v-if="rowData">
                    <p><strong>用户名：</strong>{{ rowData.username }}</p>
                    <div class="confirm-amount-row">
                        <strong>到账金额：</strong>
                        <div class="confirm-amount-info">
                            <span class="confirm-amount-token" v-if="rowData.actualTokenAmount">
                                {{ formatCrypto(rowData.actualTokenAmount) }} VEILX
                            </span>
                            <span v-else>
                                {{ formatCrypto(rowData.actualAmount) || '0.00' }}
                            </span>
                        </div>
                    </div>
                    <p><strong>审核状态：</strong><el-tag :type="getStatusType(auditForm.status)">{{ status[auditForm.status] }}</el-tag></p>
                    <p v-if="auditForm.reason"><strong>审核备注：</strong>{{ auditForm.reason }}</p>
                </div>
            </div>
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="confirmDialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="handConfirm" :loading="confirmLoading">
                        确认提交
                    </el-button>
                </div>
            </template>
        </el-dialog>

        <!-- 批量审核确认弹框 -->
        <el-dialog
            v-model="batchConfirmVisible"
            width="520"
            destroy-on-close
            :close-on-click-modal="false"
            class="batch-confirm-dialog"
        >
            <template #header>
                <div class="batch-dialog-header">
                    <el-icon class="header-icon"><WarningFilled /></el-icon>
                    <span>批量审核确认</span>
                </div>
            </template>
            <div class="batch-confirm-content" v-if="batchSummary">
                <div class="batch-banner">
                    即将对待审核的提现记录执行「审核通过」操作
                </div>

                <div class="batch-stats-card">
                    <div class="stats-grid">
                        <div class="stats-item">
                            <span class="stats-num">{{ batchSummary.totalPendingCount }}</span>
                            <span class="stats-label">待审核总数</span>
                        </div>
                        <div class="stats-item active">
                            <span class="stats-num">{{ batchSummary.thisBatchCount }}</span>
                            <span class="stats-label">本次处理</span>
                        </div>
                        <div class="stats-item" v-if="batchSummary.remainingCount > 0">
                            <span class="stats-num warn">{{ batchSummary.remainingCount }}</span>
                            <span class="stats-label">剩余待处理</span>
                        </div>
                    </div>
                    <div class="stats-amount-row">
                        <span class="stats-amount-label">本次提现总金额</span>
                        <span class="stats-amount-value">{{ formatCrypto(batchSummary.thisBatchAmount) }} USDT</span>
                    </div>
                    <div class="stats-batch-hint" v-if="batchSummary.thisBatchCount < batchSummary.totalPendingCount">
                        每次最多处理 {{ batchSummary.batchSize }} 笔，剩余需再次触发
                    </div>
                </div>

                <div class="batch-large-section" v-if="batchSummary.largeItemCount > 0">
                    <div class="large-section-header">
                        <el-icon class="large-warn-icon"><WarningFilled /></el-icon>
                        <span>本次包含大额提现（>100U），共 <strong>{{ batchSummary.largeItemCount }}</strong> 条
                            <span class="large-show-hint" v-if="batchSummary.largeItemCount > 3">，仅展示前 3 条</span>
                        </span>
                    </div>
                    <div class="large-items-table">
                        <div class="large-tbl-header">
                            <span class="col-idx">#</span>
                            <span class="col-user">用户名</span>
                            <span class="col-amount">金额</span>
                            <span class="col-addr">提现地址</span>
                        </div>
                        <div class="large-tbl-row" v-for="(item, index) in batchSummary.largeItems" :key="index">
                            <span class="col-idx"><i class="idx-badge">{{ index + 1 }}</i></span>
                            <span class="col-user">{{ item.username }}</span>
                            <span class="col-amount">{{ formatCrypto(item.amount) }}</span>
                            <span class="col-addr">
                                <span class="addr-tag" :title="item.address" @click="copyAddress(item.address)">
                                    {{ truncateAddress(item.address) }}
                                </span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="batchConfirmVisible = false" size="default">取消</el-button>
                    <el-button type="danger" @click="handleBatchSubmit" :loading="batchSubmitLoading" size="default">
                        确认执行
                    </el-button>
                </div>
            </template>
        </el-dialog>

        <!-- 批量审核执行中 / 结果弹框 -->
        <el-dialog
            v-model="batchExecutingVisible"
            width="420"
            :close-on-click-modal="!!batchResult"
            :close-on-press-escape="!!batchResult"
            :show-close="!!batchResult"
            @close="closeBatchExecuting"
            align-center
        >
            <template #header>
                <div class="batch-dialog-header" :class="{ executing: !batchResult }">
                    <template v-if="!batchResult">
                        <el-icon class="is-loading header-icon"><Loading /></el-icon>
                        <span>批量审核执行中</span>
                    </template>
                    <template v-else-if="batchResult.status === 'COMPLETED'">
                        <el-icon class="header-icon success-icon"><SuccessFilled /></el-icon>
                        <span>批量审核完成</span>
                    </template>
                    <template v-else-if="batchResult.status === 'FAILED'">
                        <el-icon class="header-icon fail-icon"><CircleCloseFilled /></el-icon>
                        <span>批量审核失败</span>
                    </template>
                    <template v-else>
                        <el-icon class="header-icon fail-icon"><WarningFilled /></el-icon>
                        <span>执行超时</span>
                    </template>
                </div>
            </template>

            <!-- 执行中状态 -->
            <div class="batch-executing-content" v-if="!batchResult">
                <div class="executing-pulse">
                    <div class="pulse-ring"></div>
                    <div class="pulse-ring delay"></div>
                    <el-icon class="pulse-icon is-loading"><Loading /></el-icon>
                </div>
                <p class="executing-text">正在执行批量审核，请稍候...</p>

                <div class="executing-info" v-if="batchSummary">
                    <div class="info-item">
                        <span class="info-label">处理记录</span>
                        <span class="info-value">{{ batchSummary.thisBatchCount }} 笔</span>
                    </div>
                    <div class="info-divider"></div>
                    <div class="info-item">
                        <span class="info-label">提现总额</span>
                        <span class="info-value">{{ formatCrypto(batchSummary.thisBatchAmount) }} USDT</span>
                    </div>
                </div>

                <p class="executing-tip">请勿关闭页面，完成后将自动提示结果</p>
            </div>

            <!-- 成功结果 -->
            <div class="batch-result-content" v-else-if="batchResult.status === 'COMPLETED'">
                <div class="result-icon-wrap success">
                    <el-icon><SuccessFilled /></el-icon>
                </div>
                <p class="result-summary-text">本次批量审核已全部完成</p>
                <div class="result-stats">
                    <div class="result-row">
                        <span class="result-label">处理笔数</span>
                        <span class="result-value success">{{ batchResult.totalCount }} / {{ batchSummary?.totalPendingCount || batchResult.totalCount }} 笔</span>
                    </div>
                    <div class="result-row">
                        <span class="result-label">提现总额</span>
                        <span class="result-value">{{ formatCrypto(batchResult.totalAmount) }} USDT</span>
                    </div>
                    <div class="result-row" v-if="batchResult.txHash">
                        <span class="result-label">交易哈希</span>
                        <span class="result-value hash" :title="batchResult.txHash" @click="copyAddress(batchResult.txHash)">
                            {{ truncateAddress(batchResult.txHash) }}
                        </span>
                    </div>
                </div>
                <div class="result-remaining" v-if="batchResult.remainingCount > 0">
                    <el-icon><WarningFilled /></el-icon>
                    <span>仍有 <strong>{{ batchResult.remainingCount }}</strong> 笔待审核，请再次执行一键审核</span>
                </div>
            </div>

            <!-- 失败结果 -->
            <div class="batch-result-content" v-else-if="batchResult.status === 'FAILED'">
                <div class="result-icon-wrap fail">
                    <el-icon><CircleCloseFilled /></el-icon>
                </div>
                <p class="result-summary-text fail">本次批量审核执行失败，数据已回滚</p>
                <div class="result-stats">
                    <div class="result-row">
                        <span class="result-label">提交笔数</span>
                        <span class="result-value">{{ batchSummary?.thisBatchCount || '-' }} / {{ batchSummary?.totalPendingCount || '-' }} 笔</span>
                    </div>
                    <div class="result-row">
                        <span class="result-label">失败原因</span>
                        <span class="result-value fail-text">{{ batchResult.errorMessage || '未知错误' }}</span>
                    </div>
                </div>
            </div>

            <!-- 超时 -->
            <div class="batch-result-content" v-else>
                <div class="result-icon-wrap fail">
                    <el-icon><WarningFilled /></el-icon>
                </div>
                <p class="result-summary-text fail">执行超时</p>
                <div class="result-stats">
                    <div class="result-row">
                        <span class="result-label">提交笔数</span>
                        <span class="result-value">{{ batchSummary?.thisBatchCount || '-' }} / {{ batchSummary?.totalPendingCount || '-' }} 笔</span>
                    </div>
                    <div class="result-row">
                        <span class="result-label">提示</span>
                        <span class="result-value fail-text">请刷新页面查看最终结果</span>
                    </div>
                </div>
            </div>

            <template #footer v-if="batchResult">
                <el-button type="primary" @click="closeBatchExecuting">确 定</el-button>
            </template>
        </el-dialog>
    </div>
</template>
<script setup>
import { ElMessage, ElMessageBox } from 'element-plus'
import { Loading, WarningFilled, SuccessFilled, CircleCloseFilled } from '@element-plus/icons-vue'
import {
    _SessionCache
} from '@/utils/cache'
import { reactive, ref, inject, onUnmounted } from 'vue'
import { formatUsdt, formatToken, formatDateTime, formatCrypto } from '@/utils/format'
import { handleApiError } from '@/utils/request'
const formValue = reactive({
    userId: "",
    username: "",
    status: "",
    txHash: "",
    address: "",
})
const dialogVisible = ref(false)
const confirmDialogVisible = ref(false)
const confirmLoading = ref(false)
const submitLoading = ref(false)
const tableData = ref()
const rowData = ref(null)
const auditForm = reactive({
    status: '',
    reason: ''
})

const showDialog = (index, row) => {
    dialogVisible.value = true;
    rowData.value = row
    auditForm.status = row?.status || ''
    auditForm.reason = ''
}
const _Api = inject('$api')
const pageSize = ref(8)
const currentPage = ref(1)
const loading = ref(false)

const getTableData = async (page) => {
    loading.value = true
    try {
        const res = await _Api._WithdrawList({
            pageNo: page,
            pageSize: pageSize.value,
            ...formValue
        })
        if (res) {
            tableData.value = res
        }
    } catch (error) {
        console.error('获取数据失败:', error)
        handleApiError(error, '获取数据失败')
    } finally {
        loading.value = false
    }
}
getTableData(currentPage.value)
const handleSizeChange = (val) => {
    pageSize.value = val;
    getTableData(currentPage.value)
}
const handleCurrentChange = (val) => {
    currentPage.value = val
    getTableData(currentPage.value)
}

//关闭前回调
const beforeClose = () => {
    dialogVisible.value = false
    rowData.value = null
    auditForm.status = ''
    auditForm.reason = ''
}

const status = reactive({
    APPROVAL: '待审核',
    FAILED: '审核不通过',
    SUCCESSFULLY: '审核通过',
    CANCELED: '无效',
})

// 获取状态标签类型
const getStatusType = (statusValue) => {
    const typeMap = {
        'APPROVAL': 'warning',
        'FAILED': 'danger',
        'SUCCESSFULLY': 'success',
        'CANCELED': 'info'
    }
    return typeMap[statusValue] || ''
}

// 点击确定按钮，显示二次确认
const handleConfirmClick = () => {
    if (!auditForm.status) {
        ElMessage.warning('请选择审核状态')
        return
    }
    confirmDialogVisible.value = true
}

// 最终确认提交
const handConfirm = async () => {
    if (!rowData.value) {
        return
    }
    
    submitLoading.value = true
    confirmLoading.value = true
    try {
        const res = await _Api._WithdrawAudit({
            userWithdrawId: rowData.value.id,
            status: auditForm.status,
            reason: auditForm.reason
        })
        if (res) {
            confirmDialogVisible.value = false
            dialogVisible.value = false
            ElMessage.success('审核成功')
            getTableData(currentPage.value)
            // 重置表单
            rowData.value = null
            auditForm.status = ''
            auditForm.reason = ''
        }
    } catch (error) {
        handleApiError(error, '审核失败: '+error?.response?.data?.message)
    } finally {
        submitLoading.value = false
        confirmLoading.value = false
    }
}

// 复制交易Hash
const copyTxHash = (txHash) => {
    if (!txHash) return
    navigator.clipboard.writeText(txHash).then(() => {
        ElMessage.success('交易Hash已复制到剪贴板')
    }).catch(() => {
        ElMessage.error('复制失败')
    })
}

// 复制提现地址
const copyAddress = (address) => {
    if (!address) return
    navigator.clipboard.writeText(address).then(() => {
        ElMessage.success('地址已复制到剪贴板')
    }).catch(() => {
        ElMessage.error('复制失败')
    })
}

// 截断地址展示（首12位 + ... + 尾10位）
const truncateAddress = (address) => {
    if (!address) return '-'
    if (address.length <= 24) return address
    return address.slice(0, 12) + '...' + address.slice(-10)
}

// 获取确认弹框标题
const getConfirmTitle = () => {
    const username = rowData.value?.username || ''
    const statusText = status[auditForm.status] || ''
    return `确定要将用户 ${username} 的提现审核状态修改为"${statusText}"吗？`
}
const onSearch = () => {
    currentPage.value = 1
    getTableData(currentPage.value)
}

const onReset = () => {
    formValue.userId = ""
    formValue.username = ""
    formValue.status = ""
    formValue.txHash = ""
    formValue.address = ""
    currentPage.value = 1
    getTableData(currentPage.value)
}

// 限制用户ID只能输入数字
const handleUserIdInput = (value) => {
    formValue.userId = value.replace(/\D/g, '')
}

// ========== 批量审核 ==========
const batchSummaryLoading = ref(false)
const batchConfirmVisible = ref(false)
const batchSubmitLoading = ref(false)
const batchExecutingVisible = ref(false)
const batchSummary = ref(null)
const batchResult = ref(null)
let batchPolling = false
let batchPollTimer = null

const handleBatchAudit = async () => {
    batchSummaryLoading.value = true
    try {
        const res = await _Api._BatchAuditPendingSummary()
        if (!res || res.totalPendingCount === 0) {
            ElMessage.info('暂无待审核的提现记录')
            return
        }
        batchSummary.value = res
        batchConfirmVisible.value = true
    } catch (error) {
        handleApiError(error, '获取待审核数据失败')
    } finally {
        batchSummaryLoading.value = false
    }
}

const handleBatchSubmit = async () => {
    batchSubmitLoading.value = true
    try {
        const batchId = await _Api._BatchAuditSubmit()
        if (!batchId) {
            ElMessage.error('批量审核提交失败')
            return
        }
        batchConfirmVisible.value = false
        batchResult.value = null
        batchExecutingVisible.value = true
        pollBatchStatus(batchId)
    } catch (error) {
        handleApiError(error, error?.response?.data?.message || '批量审核提交失败')
    } finally {
        batchSubmitLoading.value = false
    }
}

const closeBatchExecuting = () => {
    batchExecutingVisible.value = false
    batchResult.value = null
}

const pollBatchStatus = (batchId) => {
    const POLL_INTERVAL = 3000
    const MAX_POLL_TIME = 300000
    const startTime = Date.now()

    clearBatchPollTimer()
    batchPolling = false

    batchPollTimer = setInterval(async () => {
        if (batchPolling) return
        if (Date.now() - startTime > MAX_POLL_TIME) {
            clearBatchPollTimer()
            batchResult.value = { status: 'TIMEOUT' }
            getTableData(currentPage.value)
            return
        }
        batchPolling = true
        try {
            const res = await _Api._BatchAuditStatus(batchId)
            if (!res) return

            if (res.status === 'COMPLETED') {
                clearBatchPollTimer()
                batchResult.value = res
                getTableData(1)
            } else if (res.status === 'FAILED') {
                clearBatchPollTimer()
                batchResult.value = res
                getTableData(currentPage.value)
            }
        } catch (e) {
            console.error('轮询异常:', e)
        } finally {
            batchPolling = false
        }
    }, POLL_INTERVAL)
}

const clearBatchPollTimer = () => {
    if (batchPollTimer) {
        clearInterval(batchPollTimer)
        batchPollTimer = null
    }
    batchPolling = false
}

onUnmounted(() => {
    clearBatchPollTimer()
})
</script>
<style lang="scss" scoped>
.batchUpload {
    padding-bottom: 40px;

    .filter {
        .filter-form {
            display: flex;
            flex-wrap: nowrap;
            align-items: flex-start;

            :deep(.el-form-item) {
                margin-bottom: 10px;
                margin-right: 18px;

                .el-form-item__label {
                    font-size: 13px;
                    padding-right: 8px;
                }
            }
        }
    }

    .add {
        height: 0.32rem;
    }

    .uploadList {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: 0.2rem;
        height: calc(100% - 0.32rem);

        .taskUploadList {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;

            .title {
                font-size: 0.2rem;
                width: 100%;
                display: flex;
                align-items: center;
                gap: 12px;

                p {
                    color: red;
                }
            }

            .list {
                margin-top: 0.2rem;
                flex: 1;
                overflow-y: auto;
                padding-bottom: 0.4rem;

                .cover {
                    width: 1rem;
                    height: 1rem;

                    img {
                        width: 100%;
                        height: 100%;
                        object-fit: contain;
                    }
                }
            }

            .page {
                display: flex;
                justify-content: center;
                width: 100%;
            }
        }
    }

    :deep() {
        .upload-demo {
            border: 1px dashed #dcdfe6;
            border-radius: 6px;
            cursor: pointer;
            position: relative;
            overflow: hidden;
        }

        .upload-demo:hover {
            border-color: #409eff;
        }

        .el-icon.avatar-uploader-icon {
            font-size: 28px;
            color: #8c939d;
            width: 178px;
            height: 178px;
            text-align: center;
        }

        .el-check-tag {
            margin-right: 0.1rem;
            font-weight: 400;
        }
    }

    .previewImg {
        width: 100%;
    }

    .group {
        .title {
            font-size: 0.16rem;
            color: #67C23A;
        }
    }

    .audit-dialog-content {
        .user-info {
            margin-bottom: 12px;

            :deep() {
                .el-descriptions__label {
                    font-weight: 600;
                    color: #606266;
                    width: 120px;
                }

                .el-descriptions__content {
                    color: #303133;
                }
            }

            .info-value {
                font-size: 14px;
                color: #303133;
            }

            .address-container {
                max-width: 100%;
                word-break: break-all;
                
                .address-text {
                    font-family: 'Courier New', monospace;
                    font-size: 12px;
                    color: #303133;
                    background: #f5f7fa;
                    padding: 6px 10px;
                    border-radius: 4px;
                    display: inline-block;
                    border: 1px solid #e4e7ed;
                    line-height: 1.5;
                }
            }

            .amount-info {
                display: flex;
                flex-direction: column;
                gap: 4px;

                .amount-usdt {
                    color: #409EFF;
                    font-weight: 600;
                    font-size: 14px;
                }

                .amount-token {
                    color: #67C23A;
                    font-weight: 600;
                    font-size: 14px;
                }

                .no-amount {
                    color: #909399;
                }
            }
        }

        :deep(.el-divider) {
            margin: 12px 0;
        }

        .audit-form {
            :deep(.el-form-item) {
                margin-bottom: 12px;
            }

            .status-radio-group {
                display: flex;
                flex-direction: column;
                align-items: flex-start;

                :deep() {
                    .el-radio {
                        margin-right: 0;
                        margin-bottom: 6px;
                        height: 28px;
                    }

                    .el-radio:last-child {
                        margin-bottom: 0;
                    }
                }
            }
        }
    }

    // 状态标签样式优化
    :deep(.el-tag) {
        font-weight: 500;
        padding: 4px 12px;
        border-radius: 4px;
        white-space: nowrap;
    }

    // 提现状态列样式，确保内容完整显示
    :deep(.el-table__body-wrapper) {
        .el-table__body {
            td:nth-child(9) {
                .cell {
                    overflow: visible !important;
                    white-space: nowrap !important;
                }
            }
        }
    }

    .confirm-dialog-content {
        .confirm-info {
            margin-top: 20px;
            padding: 15px;
            background: #f5f7fa;
            border-radius: 4px;

            p {
                margin: 10px 0;
                line-height: 1.8;
                color: #606266;

                strong {
                    color: #303133;
                    margin-right: 8px;
                }
            }

            .confirm-amount-row {
                margin: 10px 0;
                line-height: 1.8;
                color: #606266;
                display: flex;
                align-items: center;
                gap: 8px;

                strong {
                    color: #303133;
                    flex-shrink: 0;
                }
            }

            .confirm-amount-info {
                display: inline-block;

                .confirm-amount-token {
                    color: #67C23A;
                    font-weight: 600;
                    font-size: 16px;
                    padding: 4px 8px;
                    background: #f0f9ff;
                    border-radius: 4px;
                }
            }
        }
    }

    .batch-dialog-header {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 16px;
        font-weight: 600;
        color: #303133;

        .header-icon {
            font-size: 20px;
            color: #E6A23C;
        }

        &.executing .header-icon {
            color: #409EFF;
        }

        .success-icon { color: #67C23A !important; }
        .fail-icon { color: #F56C6C !important; }
    }

    .batch-confirm-content {
        .batch-banner {
            padding: 10px 14px;
            background: linear-gradient(135deg, #fdf6ec 0%, #fef0e0 100%);
            border: 1px solid #f5dab1;
            border-radius: 8px;
            margin-bottom: 16px;
            font-size: 13px;
            color: #865c22;
            font-weight: 500;
            line-height: 1.5;
        }

        .batch-stats-card {
            background: #f7f9fc;
            border: 1px solid #e8ecf1;
            border-radius: 10px;
            padding: 14px 16px 12px;
            margin-bottom: 16px;

            .stats-grid {
                display: flex;
                gap: 10px;
                margin-bottom: 12px;

                .stats-item {
                    flex: 1;
                    text-align: center;
                    padding: 10px 6px;
                    background: #fff;
                    border-radius: 8px;
                    border: 1px solid #ebeef5;

                    &.active {
                        background: linear-gradient(135deg, #ecf5ff 0%, #d9ecff 100%);
                        border-color: #b3d8ff;
                    }

                    .stats-num {
                        display: block;
                        font-size: 22px;
                        font-weight: 700;
                        color: #303133;
                        line-height: 1.2;
                        margin-bottom: 2px;

                        &.warn { color: #E6A23C; }
                    }

                    .stats-label {
                        font-size: 11px;
                        color: #909399;
                    }

                    &.active .stats-num { color: #409EFF; }
                }
            }

            .stats-amount-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px 14px;
                background: #fff;
                border-radius: 8px;
                border: 1px solid #e4e7ed;

                .stats-amount-label {
                    font-size: 13px;
                    color: #606266;
                }

                .stats-amount-value {
                    font-size: 18px;
                    font-weight: 700;
                    color: #67C23A;
                }
            }

            .stats-batch-hint {
                text-align: center;
                font-size: 11px;
                color: #909399;
                margin-top: 10px;
                padding-top: 8px;
                border-top: 1px dashed #e4e7ed;
            }
        }

        .batch-large-section {
            .large-section-header {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 8px 12px;
                background: #fdf6ec;
                border: 1px solid #f5dab1;
                border-bottom: none;
                border-radius: 8px 8px 0 0;
                font-size: 12px;
                color: #865c22;

                .large-warn-icon {
                    font-size: 15px;
                    color: #E6A23C;
                    flex-shrink: 0;
                }

                strong {
                    color: #c45e1a;
                    font-size: 14px;
                    padding: 0 1px;
                }

                .large-show-hint {
                    color: #b08d57;
                }
            }

            .large-items-table {
                border: 1px solid #f5dab1;
                border-top: none;
                border-radius: 0 0 8px 8px;
                overflow: hidden;
                display: grid;
                grid-template-columns: 32px auto 90px 1fr;

                .large-tbl-header, .large-tbl-row {
                    display: contents;
                }

                .large-tbl-header > span {
                    padding: 8px 6px;
                    background: #fef8ee;
                    border-bottom: 1px solid #f0dfc5;
                    font-size: 11px;
                    font-weight: 600;
                    color: #8c6d3f;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .large-tbl-row > span {
                    padding: 10px 6px;
                    background: #fff;
                    border-bottom: 1px dashed #f5e6cf;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: background 0.15s;
                }

                .large-tbl-row:last-child > span { border-bottom: none; }
                .large-tbl-row:hover > span { background: #fffdf8; }

                .col-idx { text-align: center; }
                .col-user { font-size: 13px; color: #303133; font-weight: 500; white-space: nowrap; }
                .col-amount { font-size: 13px; color: #e35d5d; font-weight: 700; }
                .col-addr { min-width: 0; }

                .idx-badge {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: #fdf0db;
                    color: #b88230;
                    font-size: 11px;
                    font-weight: 600;
                    font-style: normal;
                }

                .addr-tag {
                    font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
                    font-size: 11px;
                    color: #409EFF;
                    cursor: pointer;
                    padding: 2px 7px;
                    background: #f0f7ff;
                    border-radius: 4px;
                    border: 1px solid #d9ecff;
                    transition: all 0.15s;
                    display: inline-block;
                    white-space: nowrap;

                    &:hover {
                        background: #d9ecff;
                        border-color: #a0cfff;
                        color: #1a6dcc;
                    }
                    &:active { transform: scale(0.97); }
                }
            }
        }
    }

    .batch-executing-content {
        text-align: center;
        padding: 10px 0 6px;

        .executing-pulse {
            position: relative;
            width: 56px;
            height: 56px;
            margin: 0 auto 18px;

            .pulse-ring {
                position: absolute;
                inset: 0;
                border-radius: 50%;
                border: 2px solid #409EFF;
                opacity: 0;
                animation: pulseRing 2s ease-out infinite;

                &.delay { animation-delay: 1s; }
            }

            .pulse-icon {
                position: absolute;
                inset: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 28px;
                color: #409EFF;
            }
        }

        @keyframes pulseRing {
            0% { transform: scale(0.8); opacity: 0.6; }
            100% { transform: scale(1.6); opacity: 0; }
        }

        .executing-text {
            font-size: 15px;
            color: #303133;
            font-weight: 500;
            margin-bottom: 16px;
        }

        .executing-info {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0;
            background: #f7f9fc;
            border-radius: 8px;
            padding: 12px 20px;
            margin: 0 12px 14px;

            .info-item {
                flex: 1;
                text-align: center;

                .info-label {
                    display: block;
                    font-size: 11px;
                    color: #909399;
                    margin-bottom: 3px;
                }

                .info-value {
                    font-size: 14px;
                    font-weight: 600;
                    color: #303133;
                }
            }

            .info-divider {
                width: 1px;
                height: 28px;
                background: #dcdfe6;
                margin: 0 16px;
            }
        }

        .executing-tip {
            color: #b0b4bc;
            font-size: 11px;
        }
    }

    .batch-result-content {
        text-align: center;
        padding: 10px 0 4px;

        .result-icon-wrap {
            margin: 0 auto 10px;
            font-size: 48px;
            line-height: 1;

            &.success { color: #67C23A; }
            &.fail { color: #F56C6C; }
        }

        .result-summary-text {
            font-size: 15px;
            font-weight: 500;
            color: #303133;
            margin-bottom: 16px;

            &.fail { color: #F56C6C; }
        }

        .result-stats {
            background: #f7f9fc;
            border-radius: 10px;
            padding: 14px 20px;
            margin: 0 16px 14px;

            .result-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 6px 0;

                &:not(:last-child) {
                    border-bottom: 1px dashed #ebeef5;
                }

                .result-label {
                    font-size: 13px;
                    color: #909399;
                }

                .result-value {
                    font-size: 14px;
                    font-weight: 600;
                    color: #303133;

                    &.success { color: #67C23A; }

                    &.fail-text {
                        color: #F56C6C;
                        font-weight: 500;
                        font-size: 12px;
                        word-break: break-all;
                        text-align: right;
                        max-width: 220px;
                    }

                    &.hash {
                        font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
                        font-size: 12px;
                        color: #409EFF;
                        cursor: pointer;
                        padding: 2px 6px;
                        background: #f0f7ff;
                        border-radius: 4px;
                        border: 1px solid #d9ecff;

                        &:hover {
                            background: #d9ecff;
                            color: #1a6dcc;
                        }
                    }
                }
            }
        }

        .result-remaining {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            padding: 10px 16px;
            background: #fdf6ec;
            border: 1px solid #f5dab1;
            border-radius: 8px;
            margin: 0 16px;
            font-size: 12px;
            color: #865c22;

            .el-icon { color: #E6A23C; font-size: 15px; flex-shrink: 0; }
            strong { color: #c45e1a; font-size: 13px; }
        }

    }
}
</style>