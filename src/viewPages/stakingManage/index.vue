<template>
    <div class="batchUpload">
        <div class="filter">
            <el-form :inline="true" :model="formValue" class="demo-form-inline">
                <el-form-item label="质押记录ID">
                    <el-input v-model="formValue.stakingId" placeholder="请输入质押记录ID" clearable />
                </el-form-item>
                <el-form-item label="用户ID">
                    <el-input v-model="formValue.userId" placeholder="请输入用户ID" clearable />
                </el-form-item>
                <el-form-item label="用户名">
                    <el-input v-model="formValue.username" placeholder="请输入用户名" clearable />
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
                </el-form-item>
            </el-form>
        </div>
        <div class="uploadList">
            <div class="taskUploadList">
                <div class="title">
                    <span>质押记录管理列表</span>
                </div>
                <div class="list">
                    <el-table :data="tableData?.records" border style="width: 100%" height="100%">
                        <el-table-column prop="id" label="ID" width="80" />
                        <el-table-column prop="userId" label="用户ID" width="100" />
                        <el-table-column prop="username" label="用户名" width="120" />
                        <el-table-column prop="depositId" label="充值ID" width="100" />
                        <el-table-column prop="totalAmount" label="质押金额(USDT)" width="140">
                            <template #default="{ row }">
                                {{ row.totalAmount?.toFixed(2) }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="amountUsdt" label="USDT金额" width="120">
                            <template #default="{ row }">
                                {{ row.amountUsdt?.toFixed(2) }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="amountToken" label="Token金额" width="120">
                            <template #default="{ row }">
                                {{ row.amountToken?.toFixed(2) }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="periodDays" label="质押周期(天)" width="120" />
                        <el-table-column prop="dailyRate" label="日算力倍率(%)" width="130">
                            <template #default="{ row }">
                                {{ row.dailyRate }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="rewardMultiple" label="收益倍数" width="100" />
                        <el-table-column prop="withdrawRule" label="提现规则" width="150">
                            <template #default="{ row }">
                                {{ getWithdrawRuleDesc(row.withdrawRule) }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="startDate" label="开始日期" width="120">
                            <template #default="{ row }">
                                {{ formatDate(row.startDate) }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="endDate" label="到期日期" width="120">
                            <template #default="{ row }">
                                {{ formatDate(row.endDate) }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="status" label="状态" width="100">
                            <template #default="{ row }">
                                <el-tag :type="getStatusType(row.status)">
                                    {{ getStatusText(row.status) }}
                                </el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column prop="totalRewardUsdt" label="累计USDT收益" width="130">
                            <template #default="{ row }">
                                {{ formatUsdt(row.totalRewardUsdt) }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="totalRewardToken" label="累计Token收益" width="130">
                            <template #default="{ row }">
                                {{ formatToken(row.totalRewardToken) }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="principalWithdrawn" label="本金是否已提取" width="130">
                            <template #default="{ row }">
                                <el-tag :type="row.principalWithdrawn ? 'success' : 'info'">
                                    {{ row.principalWithdrawn ? '是' : '否' }}
                                </el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column prop="isRewardCapped" label="是否已达到收益倍数封顶" width="180">
                            <template #default="{ row }">
                                <el-tag :type="row.isRewardCapped ? 'warning' : 'success'">
                                    {{ row.isRewardCapped ? '是' : '否' }}
                                </el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column prop="createdAt" label="创建时间" width="180">
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
            <div v-if="detailData" class="detail-content">
                <el-descriptions :column="2" border>
                    <el-descriptions-item label="质押记录ID">{{ detailData.id }}</el-descriptions-item>
                    <el-descriptions-item label="用户ID">{{ detailData.userId }}</el-descriptions-item>
                    <el-descriptions-item label="用户名">{{ detailData.username }}</el-descriptions-item>
                    <el-descriptions-item label="充值ID">{{ detailData.depositId }}</el-descriptions-item>
                    <el-descriptions-item label="质押金额(USDT)">{{ detailData.totalAmount?.toFixed(2)
                        }}</el-descriptions-item>
                    <el-descriptions-item label="USDT金额">{{ detailData.amountUsdt?.toFixed(2) }}</el-descriptions-item>
                    <el-descriptions-item label="Token金额">{{ detailData.amountToken?.toFixed(2)
                        }}</el-descriptions-item>
                    <el-descriptions-item label="质押周期(天)">{{ detailData.periodDays }}</el-descriptions-item>
                    <el-descriptions-item label="日算力倍率(%)">{{ detailData.dailyRate }}</el-descriptions-item>
                    <el-descriptions-item label="收益倍数">{{ detailData.rewardMultiple }}</el-descriptions-item>
                    <el-descriptions-item label="收益封顶金额(USDT)" :span="2">
                        <span style="color: #409eff; font-weight: bold; font-size: 16px;">
                            {{ formatUsdt(detailData.rewardCapacity) }}
                        </span>
                    </el-descriptions-item>
                    <el-descriptions-item label="提现规则">{{ getWithdrawRuleDesc(detailData.withdrawRule)
                        }}</el-descriptions-item>
                    <el-descriptions-item label="开始日期">{{ formatDate(detailData.startDate) }}</el-descriptions-item>
                    <el-descriptions-item label="到期日期">{{ formatDate(detailData.endDate) }}</el-descriptions-item>
                    <el-descriptions-item label="状态">
                        <el-tag :type="getStatusType(detailData.status)">
                            {{ getStatusText(detailData.status) }}
                        </el-tag>
                    </el-descriptions-item>
                    <el-descriptions-item label="累计USDT收益">{{ formatUsdt(detailData.totalRewardUsdt)
                    }}</el-descriptions-item>
                    <el-descriptions-item label="累计Token收益">{{ formatToken(detailData.totalRewardToken)
                    }}</el-descriptions-item>
                    <el-descriptions-item label="本金是否已提取">
                        <el-tag :type="detailData.principalWithdrawn ? 'success' : 'info'">
                            {{ detailData.principalWithdrawn ? '是' : '否' }}
                        </el-tag>
                    </el-descriptions-item>
                    <el-descriptions-item label="是否已达到收益倍数封顶">
                        <el-tag :type="detailData.isRewardCapped ? 'warning' : 'success'">
                            {{ detailData.isRewardCapped ? '是' : '否' }}
                        </el-tag>
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
            <el-form :model="editForm" label-width="120px" :rules="editRules" ref="editFormRef">
                <el-form-item label="质押记录ID">
                    <el-input v-model="editForm.id" disabled />
                </el-form-item>
                <el-form-item label="开始日期" prop="startDate">
                    <el-date-picker
                        v-model="editForm.startDate"
                        type="datetime"
                        placeholder="选择开始日期"
                        format="YYYY-MM-DD HH:mm:ss"
                        value-format="YYYY-MM-DDTHH:mm:ss"
                        style="width: 100%" />
                </el-form-item>
                <el-form-item label="到期日期" prop="endDate">
                    <el-date-picker
                        v-model="editForm.endDate"
                        type="datetime"
                        placeholder="选择到期日期"
                        format="YYYY-MM-DD HH:mm:ss"
                        value-format="YYYY-MM-DDTHH:mm:ss"
                        style="width: 100%" />
                </el-form-item>
            </el-form>
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
import { ElMessage } from 'element-plus'
import { reactive, ref, inject } from 'vue'
import { formatUsdt, formatToken } from '@/utils/format'

const formValue = reactive({
    stakingId: "",
    userId: "",
    username: "",
    status: "",
})
const detailDialogVisible = ref(false)
const detailData = ref(null)
const editDialogVisible = ref(false)
const editForm = ref({
    id: null,
    startDate: null,
    endDate: null
})
const editFormRef = ref(null)
const updateLoading = ref(false)
const tableData = ref()
const _Api = inject('$api')
const pageSize = ref(10)
const currentPage = ref(1)

// 表单验证规则
const editRules = {
    startDate: [
        { required: true, message: '请选择开始日期', trigger: 'change' }
    ],
    endDate: [
        { required: true, message: '请选择到期日期', trigger: 'change' },
        {
            validator: (rule, value, callback) => {
                if (editForm.value.startDate && value) {
                    const start = new Date(editForm.value.startDate)
                    const end = new Date(value)
                    if (end <= start) {
                        callback(new Error('到期日期必须晚于开始日期'))
                    } else {
                        callback()
                    }
                } else {
                    callback()
                }
            },
            trigger: 'change'
        }
    ]
}

const getTableData = async (page) => {
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

const getWithdrawRuleDesc = (rule) => {
    const ruleMap = {
        'MATURITY_SETTLEMENT': '到期本利结算',
        'DAILY_REWARD_PRINCIPAL_RETURN': '每日收益；本金到期退回',
        'DAILY_REWARD_NO_PRINCIPAL': '每日收益；本金锁定'
    }
    return ruleMap[rule] || rule
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
    try {
        // 调用接口获取详情（包含收益封顶金额）
        const res = await _Api._stakingRecordDetail(row.id)
        if (res) {
            detailData.value = res
            detailDialogVisible.value = true
        }
    } catch (error) {
        ElMessage.error('获取详情失败: ' + (error.message || '未知错误'))
    }
}

const showEditDialog = (row) => {
    editForm.value = {
        id: row.id,
        startDate: row.startDate ? new Date(row.startDate).toISOString().slice(0, 19) : null,
        endDate: row.endDate ? new Date(row.endDate).toISOString().slice(0, 19) : null
    }
    editDialogVisible.value = true
}

const handleUpdate = async () => {
    if (!editFormRef.value) return
    
    try {
        await editFormRef.value.validate()
        updateLoading.value = true
        
        const res = await _Api._stakingRecordUpdate({
            id: editForm.value.id,
            startDate: editForm.value.startDate,
            endDate: editForm.value.endDate
        })
        
        if (res) {
            ElMessage.success('修改成功')
            editDialogVisible.value = false
            // 刷新列表
            getTableData(currentPage.value)
        }
    } catch (error) {
        if (error !== false) { // 表单验证失败会返回false，不需要显示错误
            ElMessage.error('修改失败: ' + (error.message || '未知错误'))
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

// 格式化日期时间为 yyyy-MM-dd HH:mm:ss
const formatDateTime = (dateStr) => {
    if (!dateStr) return '-'
    try {
        const date = new Date(dateStr)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        const seconds = String(date.getSeconds()).padStart(2, '0')
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    } catch (e) {
        // 如果已经是日期时间格式，尝试解析
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
}
</style>
