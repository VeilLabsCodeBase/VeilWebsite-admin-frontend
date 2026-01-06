<template>
    <div class="batchUpload">
        <div class="filter">
            <el-form :inline="true" :model="formValue" class="demo-form-inline">
                <el-form-item label="用户名">
                    <el-input v-model="formValue.username" placeholder="请输入用户名" clearable />
                </el-form-item>
                <el-form-item label="用户id">
                    <el-input v-model="formValue.userId" placeholder="请输入用户id" clearable 
                              @input="handleUserIdInput" />
                </el-form-item>
                <el-form-item label="交易Hash">
                    <el-input v-model="formValue.txHash" placeholder="请输入交易Hash" clearable />
                </el-form-item>
                <el-form-item label="提现状态">
                    <el-select v-model="formValue.status" placeholder="请选择提现状态" clearable style="width: 200px">
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
                                    size="small">审核</el-button>
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
        <el-dialog v-model="dialogVisible" title="提现审核" width="600" :before-close="beforeClose" destroy-on-close>
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
                            :rows="4"
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
    </div>
</template>
<script setup>
import { ElMessage, ElMessageBox } from 'element-plus'
import {
    _SessionCache
} from '@/utils/cache'
import { reactive, ref, inject } from 'vue'
import { formatUsdt, formatToken, formatDateTime, formatCrypto } from '@/utils/format'
import { handleApiError } from '@/utils/request'
const formValue = reactive({
    userId: "",
    username: "",
    status: "",
    txHash: "",
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
    currentPage.value = 1
    getTableData(currentPage.value)
}

// 限制用户ID只能输入数字
const handleUserIdInput = (value) => {
    // 只保留数字字符
    formValue.userId = value.replace(/\D/g, '')
}
</script>
<style lang="scss" scoped>
.batchUpload {
    // display: flex;
    // flex-direction: column;
    padding-bottom: 40px;

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
                justify-content: space-between;
                align-items: center;

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
            margin-bottom: 20px;

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
                    font-size: 13px;
                    color: #303133;
                    background: #f5f7fa;
                    padding: 8px 12px;
                    border-radius: 4px;
                    display: inline-block;
                    border: 1px solid #e4e7ed;
                    line-height: 1.6;
                }
            }

            .amount-info {
                display: flex;
                flex-direction: column;
                gap: 4px;

                .amount-usdt {
                    color: #409EFF;
                    font-weight: 600;
                    font-size: 16px;
                }

                .amount-token {
                    color: #67C23A;
                    font-weight: 600;
                    font-size: 16px;
                }

                .no-amount {
                    color: #909399;
                }
            }
        }

        .audit-form {
            .status-radio-group {
                display: flex;
                flex-direction: column;
                align-items: flex-start;

                :deep() {
                    .el-radio {
                        margin-right: 0;
                        margin-bottom: 12px;
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
}
</style>