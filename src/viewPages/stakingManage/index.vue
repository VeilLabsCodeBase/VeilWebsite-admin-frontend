<template>
    <div class="batchUpload">
        <div class="filter">
            <el-form :inline="true" :model="formValue" class="demo-form-inline">
                <el-form-item label="质押记录ID">
                    <el-input v-model="formValue.stakingId" placeholder="请输入质押记录ID" clearable 
                              @input="handleStakingIdInput" />
                </el-form-item>
                <el-form-item label="用户名">
                    <el-input v-model="formValue.username" placeholder="请输入用户名" clearable />
                </el-form-item>
                <el-form-item label="用户ID">
                    <el-input v-model="formValue.userId" placeholder="请输入用户ID" clearable 
                              @input="handleUserIdInput" />
                </el-form-item>
                <el-form-item label="状态">
                    <el-select v-model="formValue.status" placeholder="请选择状态" clearable style="width: 200px">
                        <el-option label="进行中" value="ACTIVE" />
                        <el-option label="已完成" value="COMPLETED" />
                        <el-option label="已取消" value="CANCELLED" />
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
                    <span>质押记录管理列表</span>
                </div>
                <div class="list">
                    <el-table :data="tableData?.records" border style="width: 100%" height="100%" v-loading="loading">
                        <el-table-column prop="id" label="ID" min-width="80" show-overflow-tooltip />
                        <el-table-column prop="userId" label="用户ID" min-width="100" show-overflow-tooltip />
                        <el-table-column prop="username" label="用户名" min-width="120" show-overflow-tooltip />
                        <el-table-column prop="depositId" label="充值ID" min-width="100" show-overflow-tooltip />
                        <el-table-column prop="totalAmount" label="质押金额(USDT)" min-width="140" show-overflow-tooltip>
                            <template #default="{ row }">
                                {{ formatCrypto(row.totalAmount) }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="amountUsdt" label="USDT金额" min-width="120" show-overflow-tooltip>
                            <template #default="{ row }">
                                {{ formatCrypto(row.amountUsdt) }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="amountToken" label="VEILX金额" min-width="120" show-overflow-tooltip>
                            <template #default="{ row }">
                                {{ formatCrypto(row.amountToken) }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="stakingType" label="质押类型" min-width="150" show-overflow-tooltip>
                            <template #default="{ row }">
                                {{ getStakingTypeDesc(row.stakingType, row.stakingTypeDesc) }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="dailyRate" label="日算力倍率(%)" min-width="130" show-overflow-tooltip>
                            <template #default="{ row }">
                                {{ row.dailyRate }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="rewardMultiple" label="收益倍数" min-width="100" show-overflow-tooltip />
                        <el-table-column prop="withdrawRule" label="提现规则" min-width="150" show-overflow-tooltip>
                            <template #default="{ row }">
                                {{ getWithdrawRuleDesc(row.withdrawRule) }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="startDate" label="开始日期" min-width="120" show-overflow-tooltip>
                            <template #default="{ row }">
                                {{ formatDate(row.startDate) }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="status" label="状态" min-width="100" show-overflow-tooltip>
                            <template #default="{ row }">
                                <el-tag :type="getStatusType(row.status)">
                                    {{ getStatusText(row.status) }}
                                </el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column prop="totalRewardUsdt" label="累计USDT收益" min-width="130" show-overflow-tooltip>
                            <template #default="{ row }">
                                {{ formatCrypto(row.totalRewardUsdt) }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="principalWithdrawn" label="本金是否已返还" min-width="130" show-overflow-tooltip>
                            <template #default="{ row }">
                                <el-tag :type="row.principalWithdrawn ? 'success' : 'info'">
                                    {{ row.principalWithdrawn ? '是' : '否' }}
                                </el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column prop="isRewardCapped" label="是否已达到收益倍数封顶" min-width="180" show-overflow-tooltip>
                            <template #default="{ row }">
                                <el-tag :type="row.isRewardCapped ? 'warning' : 'success'">
                                    {{ row.isRewardCapped ? '是' : '否' }}
                                </el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column prop="nextRewardTime" label="下次收益产生时间" min-width="180" show-overflow-tooltip>
                            <template #default="{ row }">
                                {{ row.nextRewardTime ? formatDateTime(row.nextRewardTime) : '-' }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="rewardSequence" label="已产生收益笔数" min-width="130" show-overflow-tooltip>
                            <template #default="{ row }">
                                {{ row.rewardSequence || 0 }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="createdAt" label="创建时间" min-width="180" show-overflow-tooltip>
                            <template #default="{ row }">
                                {{ formatDateTime(row.createdAt) }}
                            </template>
                        </el-table-column>
                        <el-table-column fixed="right" label="操作" min-width="200">
                            <template #default="scope">
                                <el-button link type="primary" @click="viewDetail(scope.row)" size="small">
                                    查看详情
                                </el-button>
                                <el-button link type="primary" @click="showEditDialog(scope.row)" size="small">
                                    修改
                                </el-button>
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
        <!-- 详情对话框 -->
        <el-dialog v-model="detailDialogVisible" title="质押记录详情" width="800" destroy-on-close>
            <div class="detail-content" v-loading="loadingDetail">
                <el-descriptions v-if="detailData" :column="2" border>
                    <el-descriptions-item label="质押记录ID">{{ detailData.id }}</el-descriptions-item>
                    <el-descriptions-item label="用户ID">{{ detailData.userId }}</el-descriptions-item>
                    <el-descriptions-item label="用户名">{{ detailData.username }}</el-descriptions-item>
                    <el-descriptions-item label="充值ID">{{ detailData.depositId }}</el-descriptions-item>
                    <el-descriptions-item label="质押金额(USDT)">{{ formatCrypto(detailData.totalAmount) }}</el-descriptions-item>
                    <el-descriptions-item label="USDT金额">{{ formatCrypto(detailData.amountUsdt) }}</el-descriptions-item>
                    <el-descriptions-item label="VEILX金额">{{ formatCrypto(detailData.amountToken) }}</el-descriptions-item>
                    <el-descriptions-item label="质押类型">{{ getStakingTypeDesc(detailData.stakingType, detailData.stakingTypeDesc) }}</el-descriptions-item>
                    <el-descriptions-item label="日算力倍率(%)">{{ detailData.dailyRate }}</el-descriptions-item>
                    <el-descriptions-item label="收益倍数">{{ detailData.rewardMultiple }}</el-descriptions-item>
                    <el-descriptions-item label="收益封顶金额(USDT)" :span="2">
                        <span style="color: #409eff; font-weight: bold; font-size: 16px;">
                            {{ formatCrypto(detailData.rewardCapacity) }}
                        </span>
                    </el-descriptions-item>
                    <el-descriptions-item label="提现规则">{{ getWithdrawRuleDesc(detailData.withdrawRule) }}</el-descriptions-item>
                    <el-descriptions-item label="开始日期">{{ formatDate(detailData.startDate) }}</el-descriptions-item>
                    <el-descriptions-item label="状态">
                        <el-tag :type="getStatusType(detailData.status)">
                            {{ getStatusText(detailData.status) }}
                        </el-tag>
                    </el-descriptions-item>
                    <el-descriptions-item label="累计USDT收益">{{ formatCrypto(detailData.totalRewardUsdt) }}</el-descriptions-item>
                    <el-descriptions-item label="是否已达到收益倍数封顶">
                        <el-tag :type="detailData.isRewardCapped ? 'warning' : 'success'">
                            {{ detailData.isRewardCapped ? '是' : '否' }}
                        </el-tag>
                    </el-descriptions-item>
                    <el-descriptions-item label="下次收益产生时间">
                        {{ detailData.nextRewardTime ? formatDateTime(detailData.nextRewardTime) : '-' }}
                    </el-descriptions-item>
                    <el-descriptions-item label="已产生收益笔数">
                        {{ detailData.rewardSequence || 0 }}
                    </el-descriptions-item>
                    <el-descriptions-item label="创建时间">{{ formatDateTime(detailData.createdAt) }}</el-descriptions-item>
                    <el-descriptions-item label="更新时间">{{ formatDateTime(detailData.updatedAt) }}</el-descriptions-item>
                </el-descriptions>
            </div>
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="detailDialogVisible = false">关闭</el-button>
                </div>
            </template>
        </el-dialog>
        
        <!-- 修改对话框 -->
        <el-dialog v-model="editDialogVisible" title="修改质押记录" width="600" destroy-on-close>
            <el-config-provider :locale="zhCn">
                <el-form :model="editForm" label-width="140px" :rules="editRules" ref="editFormRef" class="edit-form">
                <el-form-item label="质押记录ID">
                    <el-input v-model="editForm.id" disabled />
                </el-form-item>
                <el-form-item label="开始日期" prop="startDate">
                    <el-date-picker
                        v-model="editForm.startDate"
                        type="datetime"
                        placeholder="选择开始日期"
                        format="YYYY年MM月DD日 HH:mm:ss"
                        value-format="YYYY-MM-DDTHH:mm:ss"
                        style="width: 100%"
                        @change="handleStartDateChange" />
                </el-form-item>
                <el-form-item label="下次收益产生时间">
                    <el-input :value="editForm.nextRewardTime ? formatDateTime(editForm.nextRewardTime) : '-'" disabled>
                        <template #prefix>
                            <el-icon style="margin-right: 8px;"><Calendar /></el-icon>
                        </template>
                    </el-input>
                    <el-text type="info" style="margin-left: 12px; font-size: 12px;">
                        自动计算：开始日期 + 24小时
                    </el-text>
                </el-form-item>
                <el-form-item label="状态" prop="status">
                    <el-select v-model="editForm.status" placeholder="请选择状态" style="width: 100%">
                        <el-option label="进行中" value="ACTIVE" />
                        <el-option label="已完成" value="COMPLETED" />
                        <el-option label="已取消" value="CANCELLED" />
                    </el-select>
                </el-form-item>
            </el-form>
            </el-config-provider>
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="editDialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="handleUpdate" :loading="updateLoading">确定</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>
<script setup>
import { ElMessage, ElConfigProvider } from 'element-plus'
import { reactive, ref, inject, watch } from 'vue'
import { Calendar } from '@element-plus/icons-vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import dayjs from 'dayjs'
import { formatUsdt, formatToken, formatCrypto } from '@/utils/format'
import { handleApiError } from '@/utils/request'

const formValue = reactive({
    stakingId: "",
    userId: "",
    username: "",
    status: "",
})
const detailDialogVisible = ref(false)
const detailData = ref(null)
const loadingDetail = ref(false)
const editDialogVisible = ref(false)
const editForm = ref({
    id: null,
    startDate: null,
    nextRewardTime: null,
    status: null
})
const editFormRef = ref(null)
const updateLoading = ref(false)
const tableData = ref()
const _Api = inject('$api')
const pageSize = ref(8)
const currentPage = ref(1)
const loading = ref(false)

// 表单验证规则
const editRules = {
    startDate: [
        { required: true, message: '请选择开始日期', trigger: 'change' }
    ],
    status: [
        { required: true, message: '请选择状态', trigger: 'change' }
    ]
}

// 处理开始日期变化，自动计算下次收益产生时间（开始日期+24小时）
const handleStartDateChange = (value) => {
    if (value) {
        // 使用dayjs解析开始日期，保持原始时间不变（不进行时区转换）
        const startDate = dayjs(value)
        // 计算下次收益产生时间：开始日期 + 24小时
        const nextRewardTime = startDate.add(24, 'hour')
        // 格式化为 YYYY-MM-DDTHH:mm:ss 格式
        editForm.value.nextRewardTime = nextRewardTime.format('YYYY-MM-DDTHH:mm:ss')
    } else {
        editForm.value.nextRewardTime = null
    }
}

const getTableData = async (page) => {
    loading.value = true
    try {
        const params = {
            pageNo: page,
            pageSize: pageSize.value,
        }
        if (formValue.stakingId) params.stakingId = formValue.stakingId
        if (formValue.userId) params.userId = formValue.userId
        if (formValue.username) params.username = formValue.username
        if (formValue.status) params.status = formValue.status

        const res = await _Api._stakingRecordsList(params)
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

const onSearch = () => {
    currentPage.value = 1
    getTableData(currentPage.value)
}

const onReset = () => {
    formValue.stakingId = ""
    formValue.userId = ""
    formValue.username = ""
    formValue.status = ""
    currentPage.value = 1
    getTableData(currentPage.value)
}

// 限制质押记录ID只能输入数字
const handleStakingIdInput = (value) => {
    // 只保留数字字符
    formValue.stakingId = value.replace(/\D/g, '')
}

// 限制用户ID只能输入数字
const handleUserIdInput = (value) => {
    // 只保留数字字符
    formValue.userId = value.replace(/\D/g, '')
}

const getWithdrawRuleDesc = (rule) => {
    const ruleMap = {
        'MATURITY_SETTLEMENT': '到期本利结算',
        'DAILY_REWARD_PRINCIPAL_RETURN': '每日收益；本金到期退回',
        'DAILY_REWARD_NO_PRINCIPAL': '每日收益；本金锁定'
    }
    return ruleMap[rule] || rule
}

const getStakingTypeDesc = (stakingType, stakingTypeDesc) => {
    // 如果后端返回了stakingTypeDesc，直接使用
    if (stakingTypeDesc) {
        return stakingTypeDesc
    }
    // 否则根据枚举值转换
    if (!stakingType) return '-'
    const typeMap = {
        'DIRECT_DEPOSIT': '直接充值',
        'Z_ASSET_PACKAGE': '资产包质押'
    }
    return typeMap[stakingType] || stakingType
}

const getStatusText = (status) => {
    const statusMap = {
        'ACTIVE': '进行中',
        'COMPLETED': '已完成',
        'CANCELLED': '已取消'
    }
    return statusMap[status] || status
}

const getStatusType = (status) => {
    const typeMap = {
        'ACTIVE': 'success',
        'COMPLETED': 'info',
        'CANCELLED': 'warning'
    }
    return typeMap[status] || ''
}

const viewDetail = async (row) => {
    // 先打开对话框并显示loading
    detailDialogVisible.value = true
    loadingDetail.value = true
    // 清空之前的数据，避免显示旧数据
    detailData.value = null
    
    try {
        // 调用接口获取详情（包含收益封顶金额）
        const res = await _Api._stakingRecordDetail(row.id)
        if (res) {
            detailData.value = res
        }
    } catch (error) {
        handleApiError(error, '获取详情失败')
        detailDialogVisible.value = false
    } finally {
        loadingDetail.value = false
    }
}

const showEditDialog = (row) => {
    // 直接使用后端返回的时间字符串，避免时区转换问题
    // 如果后端返回的是 ISO 格式（如 "2025-12-15T17:43:02"），直接使用
    // 使用 dayjs 解析并格式化为 el-date-picker 需要的格式
    let startDate = null
    if (row.startDate) {
        // 使用 dayjs 解析，保持原始时间不变（不进行时区转换）
        const date = dayjs(row.startDate)
        startDate = date.format('YYYY-MM-DDTHH:mm:ss')
    }
    
    // 直接使用列表数据中的 nextRewardTime，不重新计算
    let nextRewardTime = null
    if (row.nextRewardTime) {
        // 使用 dayjs 解析，保持原始时间不变
        const date = dayjs(row.nextRewardTime)
        nextRewardTime = date.format('YYYY-MM-DDTHH:mm:ss')
    }
    
    editForm.value = {
        id: row.id,
        startDate: startDate,
        nextRewardTime: nextRewardTime,
        status: row.status || null
    }
    editDialogVisible.value = true
}

const handleUpdate = async () => {
    if (!editFormRef.value) return
    
    try {
        await editFormRef.value.validate()
        updateLoading.value = true
        
        // 只传startDate和status，后端会自动根据startDate+24小时计算nextRewardTime
        const res = await _Api._stakingRecordUpdate({
            id: editForm.value.id,
            startDate: editForm.value.startDate,
            status: editForm.value.status
        })
        
        if (res) {
            ElMessage.success('修改成功')
            editDialogVisible.value = false
            // 刷新列表
            getTableData(currentPage.value)
        }
    } catch (error) {
        if (error !== false) { // 表单验证失败会返回false，不需要显示错误
            handleApiError(error, '修改失败')
        }
    } finally {
        updateLoading.value = false
    }
}

// 格式化日期为 yyyy-MM-dd
const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    try {
        const date = new Date(dateStr)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
    } catch (e) {
        // 如果已经是 yyyy-MM-dd 格式，直接返回
        if (typeof dateStr === 'string' && dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
            return dateStr.substring(0, 10)
        }
        return dateStr
    }
}

// 格式化日期时间为 yyyy-MM-dd HH:mm:ss（使用 dayjs 避免时区问题）
const formatDateTime = (dateStr) => {
    if (!dateStr) return '-'
    try {
        // 使用 dayjs 解析，保持原始时间不变（不进行时区转换）
        const date = dayjs(dateStr)
        if (!date.isValid()) {
            return '-'
        }
        return date.format('YYYY-MM-DD HH:mm:ss')
    } catch (e) {
        // 如果解析失败，尝试直接匹配格式
        if (typeof dateStr === 'string') {
            // 尝试匹配 yyyy-MM-dd HH:mm:ss 或类似格式
            const match = dateStr.match(/(\d{4}-\d{2}-\d{2})[\sT](\d{2}):(\d{2}):(\d{2})/)
            if (match) {
                return `${match[1]} ${match[2]}:${match[3]}:${match[4]}`
            }
            // 如果只有日期部分，返回日期
            if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
                return dateStr.substring(0, 10) + ' 00:00:00'
            }
        }
        return dateStr
    }
}
</script>
<style lang="scss" scoped>
.batchUpload {
    padding-bottom: 40px;

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
            }

            .list {
                margin-top: 0.2rem;
                flex: 1;
                overflow-y: auto;
                padding-bottom: 0.4rem;
            }

            .page {
                display: flex;
                justify-content: center;
                width: 100%;
            }
        }
    }

    .detail-content {
        padding: 20px 0;
    }

    // 修改对话框样式优化
    .edit-form {
        :deep(.el-form-item__label) {
            white-space: nowrap;
            word-break: keep-all;
            overflow: visible;
            text-overflow: clip;
        }
    }
}
</style>
