<template>
    <div class="batchUpload">
        <div class="filter">
            <el-form :inline="true" :model="formValue" class="demo-form-inline filter-form">
                <el-form-item label="用户ID">
                    <el-input v-model="formValue.userId" placeholder="用户ID" clearable style="width: 90px"
                        @input="handleUserIdInput" />
                </el-form-item>
                <el-form-item label="用户名">
                    <el-input v-model="formValue.username" placeholder="用户名" clearable style="width: 110px" />
                </el-form-item>
                <el-form-item label="转账地址">
                    <el-input v-model="formValue.fromAddr" placeholder="转账地址" clearable style="width: 160px" />
                </el-form-item>
                <el-form-item label="交易Hash">
                    <el-input v-model="formValue.transactionHash" placeholder="交易Hash" clearable style="width: 160px" />
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
                    <span>充值管理列表</span>
                    <div class="title-actions">
                        <el-button type="primary" plain @click="openExportDialog" :loading="exportLoading">
                            <el-icon>
                                <Download />
                            </el-icon>
                            导出
                        </el-button>
                    </div>
                </div>
                <div class="list">
                    <el-table :data="tableData?.records" border style="width: 100%" height="100%" v-loading="loading">
                        <el-table-column prop="id" label="id" min-width="70" show-overflow-tooltip />
                        <el-table-column prop="userId" label="用户ID" min-width="90" show-overflow-tooltip />
                        <el-table-column prop="username" label="用户名" min-width="120" show-overflow-tooltip />
                        <el-table-column prop="role" label="角色" min-width="110" show-overflow-tooltip />
                        <el-table-column prop="userStatus" label="用户状态" min-width="120" show-overflow-tooltip />
                        <el-table-column prop="email" label="邮箱" min-width="200" show-overflow-tooltip />
                        <el-table-column prop="amount" label="充值金额" min-width="120" show-overflow-tooltip>
                            <template #default="{ row }">
                                {{ formatCrypto(row.amount) }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="currency" label="充值币种" min-width="110" show-overflow-tooltip />
                        <el-table-column prop="fromAddr" label="转账地址" min-width="260" show-overflow-tooltip />
                        <el-table-column prop="transactionHash" label="交易Hash" min-width="350" show-overflow-tooltip>
                            <template #default="{ row }">
                                <span v-if="row.transactionHash"
                                    style="font-family: monospace; color: #409EFF; cursor: pointer;"
                                    @click="copyTxHash(row.transactionHash)" :title="row.transactionHash">
                                    {{ row.transactionHash }}
                                </span>
                                <span v-else style="color: #909399;">-</span>
                            </template>
                        </el-table-column>
                        <el-table-column prop="status" label="状态" min-width="110" show-overflow-tooltip>
                            <template #default="{ row }">
                                {{ statius[row.status] }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="createdAt" label="创建时间" min-width="180" show-overflow-tooltip>
                            <template #default="{ row }">
                                {{ formatDateTime(row.createdAt) }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="updatedAt" label="更新时间" min-width="180" show-overflow-tooltip>
                            <template #default="{ row }">
                                {{ formatDateTime(row.updatedAt) }}
                            </template>
                        </el-table-column>
                        <el-table-column fixed="right" label="操作" min-width="140">
                            <template #default="scope">
                                <el-button link type="primary" @click="showDialog(scope.$index, scope.row)"
                                    size="small">修改充值状态</el-button>
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
        <el-dialog v-model="dialogVisible" title="修改状态" width="800" :before-close="beforeClose" destroy-on-close>
            <div class="diaContent">
                <el-form :model="dialogForm" label-width="120px">
                    <el-form-item label="状态">
                        <el-radio-group v-model="radio1">
                            <el-radio value="PENDING" size="large">待处理</el-radio>
                            <el-radio value="COMPLETED" size="large">已完成</el-radio>
                            <el-radio value="FAILED" size="large">失败</el-radio>
                        </el-radio-group>
                    </el-form-item>
                </el-form>
            </div>
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="beforeClose">取消</el-button>
                    <el-button type="primary" @click="handConfirm">
                        确定修改
                    </el-button>
                </div>
            </template>
        </el-dialog>

        <el-dialog v-model="exportDialogVisible" width="460" destroy-on-close :close-on-click-modal="!exportLoading"
            :close-on-press-escape="!exportLoading" :show-close="!exportLoading" class="export-dialog">
            <template #header>
                <div class="export-header">
                    <div class="export-header-icon">
                        <el-icon>
                            <Download />
                        </el-icon>
                    </div>
                    <div class="export-header-copy">
                        <span>导出充值记录</span>
                        <small>默认导出最近 3 个月已完成充值，可按充值类型筛选</small>
                    </div>
                </div>
            </template>

            <div class="export-dialog-content" v-loading="exportLoading">
                <div class="export-banner">
                    <el-icon>
                        <Calendar />
                    </el-icon>
                    <span>仅导出状态为已完成的充值记录，时间区间最多支持 3 个月。</span>
                </div>

                <div class="export-filter-card">
                    <div class="export-field">
                        <label>用户ID</label>
                        <el-input v-model="exportForm.userIds" placeholder="多个用户ID请用英文逗号分隔，如 1001,1002"
                            class="export-userids-input" @input="handleExportUserIdsInput" />
                        <p v-if="exportUserIdsError" class="field-tip is-error">{{ exportUserIdsError }}</p>
                        <p v-else class="field-tip">仅支持数字和英文逗号，多个用户ID用英文逗号分隔。</p>
                    </div>

                    <div class="export-field">
                        <label>充值时间区间</label>
                        <el-date-picker v-model="exportForm.timeRange" type="datetimerange" range-separator="至"
                            start-placeholder="开始时间" end-placeholder="结束时间" format="YYYY-MM-DD HH:mm"
                            value-format="YYYY-MM-DD HH:mm:ss" :clearable="false" @change="handleExportRangeChange"
                            class="export-date-picker" />
                        <p class="field-tip">默认当前时间倒推 3 个月，手动调整时跨度不能超过 3 个月。</p>
                    </div>

                    <div class="export-field">
                        <label>充值类型</label>
                        <el-select v-model="exportForm.depositType" placeholder="全部类型" clearable
                            class="export-type-select">
                            <el-option label="钱包充值" value="WALLET" />
                            <el-option label="资产包充值" value="ASSET_PACKAGE" />
                        </el-select>
                    </div>
                </div>
            </div>

            <template #footer>
                <div class="dialog-footer export-footer">
                    <el-button @click="closeExportDialog" :disabled="exportLoading">取消</el-button>
                    <el-button type="primary" @click="submitExport" :loading="exportLoading">
                        {{ exportLoading ? '导出中...' : '确定导出' }}
                    </el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>
<script setup>
import { ElMessage } from 'element-plus'
import { Download, Calendar } from '@element-plus/icons-vue'
import {
    _SessionCache
} from '@/utils/cache'
import { reactive, ref, inject } from 'vue'
import { formatDateTime, formatCrypto } from '@/utils/format'
import { handleApiError } from '@/utils/request'
const formValue = reactive({
    userId: "",
    transactionHash: "",
    username: "",
    fromAddr: "",
})
const dialogVisible = ref(false)
const tableData = ref()
const rowData = ref('')
const dialogForm = reactive({})
const MAX_EXPORT_RANGE_MONTHS = 3
const exportDialogVisible = ref(false)
const exportLoading = ref(false)
const exportForm = reactive({
    userIds: '',
    timeRange: [],
    depositType: ''
})
const lastValidExportRange = ref([])
const exportUserIdsError = ref('')
const showDialog = (index, row) => {
    dialogVisible.value = true;
    rowData.value = row
    radio1.value = rowData.value?.status
}
const _Api = inject('$api')
const pageSize = ref(8)
const currentPage = ref(1)
const loading = ref(false)

const padDateTime = value => String(value).padStart(2, '0')
const formatExportDateTime = date => `${date.getFullYear()}-${padDateTime(date.getMonth() + 1)}-${padDateTime(date.getDate())} ${padDateTime(date.getHours())}:${padDateTime(date.getMinutes())}:00`
const getDefaultExportRange = () => {
    const end = new Date()
    const start = new Date(end)
    start.setMonth(start.getMonth() - MAX_EXPORT_RANGE_MONTHS)
    return [formatExportDateTime(start), formatExportDateTime(end)]
}
const isExportRangeExceeded = (range) => {
    if (!range || range.length !== 2) return false
    const start = new Date(range[0])
    const end = new Date(range[1])
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false
    const maxEnd = new Date(start)
    maxEnd.setMonth(maxEnd.getMonth() + MAX_EXPORT_RANGE_MONTHS)
    return end.getTime() > maxEnd.getTime()
}

const getTableData = async (page) => {
    loading.value = true
    try {
        const res = await _Api._depositList({
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
}
const statius = reactive({
    'PENDING': "待处理",
    'COMPLETED': "已完成",
    'FAILED': "失败",
})
const radio1 = ref('')
const handConfirm = async () => {
    const updateData = {
        depositId: rowData.value.id,
        status: radio1.value
    }
    // 不再传递 periodDays，后端会从 user_deposits 表中读取已保存的周期
    try {
        const res = await _Api._depositUpdate(updateData)
        if (res) {
            dialogVisible.value = false;
            ElMessage.success('修改成功')
            getTableData(currentPage.value)
        }
    } catch (error) {
        console.error('修改失败:', error)
        handleApiError(error, '修改失败')
    }
}
const onSearch = () => {
    currentPage.value = 1
    getTableData(currentPage.value)
}

const onReset = () => {
    formValue.userId = ""
    formValue.transactionHash = ""
    formValue.username = ""
    formValue.fromAddr = ""
    currentPage.value = 1
    getTableData(currentPage.value)
}

// 限制用户ID只能输入数字
const handleUserIdInput = (value) => {
    // 只保留数字字符
    formValue.userId = value.replace(/\D/g, '')
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

const openExportDialog = () => {
    const defaultRange = getDefaultExportRange()
    exportForm.userIds = ''
    exportForm.timeRange = [...defaultRange]
    exportForm.depositType = ''
    lastValidExportRange.value = [...defaultRange]
    exportUserIdsError.value = ''
    exportDialogVisible.value = true
}

const closeExportDialog = () => {
    if (exportLoading.value) return
    exportDialogVisible.value = false
}

const handleExportRangeChange = (value) => {
    if (!value || value.length !== 2) {
        const defaultRange = getDefaultExportRange()
        exportForm.timeRange = [...defaultRange]
        lastValidExportRange.value = [...defaultRange]
        return
    }
    if (isExportRangeExceeded(value)) {
        ElMessage.warning('充值时间区间最多只能选择 3 个月')
        exportForm.timeRange = [...lastValidExportRange.value]
        return
    }
    lastValidExportRange.value = [...value]
}

const normalizeExportUserIds = (value) => {
    const source = String(value ?? '')
    const normalizedSource = source
        .replace(/，/g, ',')
        .replace(/\s+/g, '')
    const sanitized = normalizedSource
        .replace(/[^\d,]/g, '')
        .replace(/,{2,}/g, ',')
        .replace(/^,+/g, '')
    return {
        sanitized,
        hadInvalid: sanitized !== normalizedSource
    }
}

const parseExportUserIds = (value) => {
    const normalized = String(value ?? '')
        .replace(/，/g, ',')
        .replace(/\s+/g, '')
        .trim()
    if (!normalized) {
        return []
    }
    if (!/^\d+(,\d+)*$/.test(normalized)) {
        return null
    }
    return normalized.split(',').map(item => item.trim()).filter(Boolean)
}

const handleExportUserIdsInput = (value) => {
    const { sanitized, hadInvalid } = normalizeExportUserIds(value)
    exportForm.userIds = sanitized
    exportUserIdsError.value = hadInvalid
        ? '仅支持数字和英文逗号，多个用户ID请用英文逗号分隔'
        : ''
}

const parseExportError = async (error) => {
    const blob = error?.response?.data
    if (!(blob instanceof Blob)) return null
    try {
        const text = await blob.text()
        const json = JSON.parse(text)
        return json?.message || null
    } catch (e) {
        return null
    }
}

const submitExport = async () => {
    const parsedUserIds = parseExportUserIds(exportForm.userIds)
    if (parsedUserIds === null) {
        exportUserIdsError.value = '仅支持数字和英文逗号，多个用户ID请用英文逗号分隔'
        ElMessage.warning('用户ID格式不正确，请使用英文逗号分隔多个数字ID')
        return
    }
    exportUserIdsError.value = ''
    if (!exportForm.timeRange || exportForm.timeRange.length !== 2) {
        const defaultRange = getDefaultExportRange()
        exportForm.timeRange = [...defaultRange]
        lastValidExportRange.value = [...defaultRange]
    }
    if (isExportRangeExceeded(exportForm.timeRange)) {
        ElMessage.warning('充值时间区间最多只能选择 3 个月')
        return
    }
    exportLoading.value = true
    try {
        const payload = {
            startTime: exportForm.timeRange[0],
            endTime: exportForm.timeRange[1]
        }
        if (parsedUserIds.length) {
            payload.userIds = parsedUserIds.join(',')
        }
        if (exportForm.depositType) {
            payload.depositType = exportForm.depositType
        }
        const blob = await _Api._depositExport(payload)
        const downloadBlob = blob instanceof Blob
            ? blob
            : new Blob([blob], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            })
        const now = new Date()
        const pad = n => String(n).padStart(2, '0')
        const fileName = `deposit-export-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}.xlsx`
        const url = window.URL.createObjectURL(downloadBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        exportDialogVisible.value = false
        ElMessage.success('充值记录导出成功')
    } catch (error) {
        const exportError = await parseExportError(error)
        if (exportError) {
            ElMessage.error(exportError)
        } else {
            handleApiError(error, '充值记录导出失败')
        }
    } finally {
        exportLoading.value = false
    }
}
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
                justify-content: space-between;
                align-items: center;

                .title-actions {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

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

    .export-header {
        display: flex;
        align-items: flex-start;
        gap: 10px;

        .export-header-icon {
            width: 34px;
            height: 34px;
            border-radius: 10px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #ecf5ff 0%, #d9ecff 100%);
            color: #409EFF;
            flex-shrink: 0;

            .el-icon {
                font-size: 16px;
            }
        }

        .export-header-copy {
            display: flex;
            flex-direction: column;
            gap: 4px;
            font-size: 16px;
            font-weight: 600;
            color: #303133;

            small {
                font-size: 11px;
                color: #8c9aad;
                font-weight: 400;
                line-height: 1.4;
            }
        }
    }

    .export-dialog-content {
        padding: 2px 0 0;

        .export-banner {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 9px 12px;
            margin-bottom: 12px;
            border-radius: 9px;
            background: linear-gradient(135deg, #eff8ff 0%, #f8fbff 100%);
            border: 1px solid #d9ecff;
            color: #4f647f;
            font-size: 11px;

            .el-icon {
                color: #409EFF;
                font-size: 14px;
                flex-shrink: 0;
            }
        }

        .export-filter-card {
            padding: 14px;
            border-radius: 12px;
            border: 1px solid #e8edf5;
            background: linear-gradient(180deg, #ffffff 0%, #fbfcff 100%);
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
        }

        .export-field+.export-field {
            margin-top: 14px;
        }

        .export-field {
            display: flex;
            flex-direction: column;
            gap: 6px;

            label {
                font-size: 12px;
                font-weight: 600;
                color: #24364d;
            }

            .field-tip {
                margin: 0;
                font-size: 10px;
                line-height: 1.45;
                color: #8b97aa;
            }
        }

        .export-date-picker,
        .export-type-select,
        .export-userids-input {
            width: 100%;
        }

        .field-tip.is-error {
            color: #f56c6c;
        }
    }

    .export-footer {
        padding-top: 4px;
    }
}
</style>