<template>
    <div class="batchUpload">
        <div class="filter">
            <el-form :inline="true" :model="formValue" class="demo-form-inline">
                <el-form-item label="收益记录ID">
                    <el-input v-model="formValue.rewardId" placeholder="请输入收益记录ID" clearable 
                              @input="handleRewardIdInput" />
                </el-form-item>
                <el-form-item label="质押记录ID">
                    <el-input v-model="formValue.stakingRecordId" placeholder="请输入质押记录ID" clearable 
                              @input="handleStakingRecordIdInput" />
                </el-form-item>
                <el-form-item label="用户ID">
                    <el-input v-model="formValue.userId" placeholder="请输入用户ID" clearable 
                              @input="handleUserIdInput" />
                </el-form-item>
                <el-form-item label="用户名">
                    <el-input v-model="formValue.username" placeholder="请输入用户名" clearable />
                </el-form-item>
                <el-form-item label="发放日期">
                    <el-date-picker
                        v-model="formValue.rewardDate"
                        type="date"
                        placeholder="选择日期"
                        format="YYYY-MM-DD"
                        value-format="YYYY-MM-DD"
                        clearable
                    />
                </el-form-item>
                <el-form-item label="发放日期起">
                    <el-date-picker
                        v-model="formValue.rewardDateFrom"
                        type="date"
                        placeholder="选择开始日期"
                        format="YYYY-MM-DD"
                        value-format="YYYY-MM-DD"
                        clearable
                    />
                </el-form-item>
                <el-form-item label="发放日期止">
                    <el-date-picker
                        v-model="formValue.rewardDateTo"
                        type="date"
                        placeholder="选择结束日期"
                        format="YYYY-MM-DD"
                        value-format="YYYY-MM-DD"
                        clearable
                    />
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
                    <span>每日收益管理列表</span>
                </div>
                <div class="list">
                    <el-table :data="tableData?.records" border style="width: 100%" height="100%" v-loading="loading">
                        <el-table-column prop="id" label="ID" width="80" />
                        <el-table-column prop="stakingRecordId" label="质押记录ID" width="120" />
                        <el-table-column prop="userId" label="用户ID" width="100" />
                        <el-table-column prop="username" label="用户名" width="120" show-overflow-tooltip />
                        <el-table-column prop="rewardDate" label="收益日期" width="120" />
                        <el-table-column prop="dailyRewardUsdt" label="USDT收益" min-width="140" show-overflow-tooltip>
                            <template #default="{ row }">
                                {{ formatCrypto(row.dailyRewardUsdt) }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="status" label="发放状态" width="120">
                            <template #default="{ row }">
                                <el-tag :type="getDistributionStatusType(row.status)">
                                    {{ getDistributionStatusText(row.status) }}
                                </el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column prop="paidAt" label="发放时间" width="180">
                            <template #default="{ row }">
                                {{ row.paidAt ? formatDateTime(row.paidAt) : '-' }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="createdAt" label="创建时间" width="180">
                            <template #default="{ row }">
                                {{ formatDateTime(row.createdAt) }}
                            </template>
                        </el-table-column>
                        <el-table-column fixed="right" label="操作" min-width="200">
                            <template #default="scope">
                                <el-button 
                                    link type="primary" 
                                    @click="viewDetail(scope.row)" 
                                    size="small">
                                    查看详情
                                </el-button>
                                <el-button 
                                    link type="primary" 
                                    @click="viewTeamRewards(scope.row)" 
                                    size="small">
                                    团队收益详情
                                </el-button>
                                <el-button 
                                    v-if="scope.row.status === 'FAILED'"
                                    link type="danger" 
                                    @click="retryDistribution(scope.row)" 
                                    size="small">
                                    重试发放
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
        <el-dialog v-model="detailDialogVisible" title="每日收益详情" width="800" destroy-on-close>
            <div v-if="detailData" class="detail-content">
                <el-descriptions :column="2" border>
                    <el-descriptions-item label="收益记录ID">{{ detailData.id }}</el-descriptions-item>
                    <el-descriptions-item label="质押记录ID">{{ detailData.stakingRecordId }}</el-descriptions-item>
                    <el-descriptions-item label="用户ID">{{ detailData.userId }}</el-descriptions-item>
                    <el-descriptions-item label="用户名">{{ detailData.username }}</el-descriptions-item>
                    <el-descriptions-item label="收益日期">{{ detailData.rewardDate }}</el-descriptions-item>
                    <el-descriptions-item label="USDT收益">{{ formatCrypto(detailData.dailyRewardUsdt) }}</el-descriptions-item>
                    <el-descriptions-item label="发放状态">
                        <el-tag :type="getDistributionStatusType(detailData.status)">
                            {{ getDistributionStatusText(detailData.status) }}
                        </el-tag>
                    </el-descriptions-item>
                    <el-descriptions-item label="发放时间">{{ detailData.paidAt ? formatDateTime(detailData.paidAt) : '-' }}</el-descriptions-item>
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
        
        <!-- 团队收益详情对话框 -->
        <el-dialog v-model="teamRewardDialogVisible" title="团队收益详情" width="900" destroy-on-close>
            <div v-if="teamRewardData && teamRewardData.length > 0" class="team-reward-content">
                <el-table :data="teamRewardData" border style="width: 100%">
                    <el-table-column prop="rewardTime" label="收益时间" width="180">
                        <template #default="{ row }">
                            {{ formatDateTime(row.rewardTime) }}
                        </template>
                    </el-table-column>
                    <el-table-column prop="username" label="收益用户" width="150" />
                    <el-table-column prop="rewardTypeDisplayName" label="收益类型" width="180" />
                    <el-table-column label="金额" min-width="200">
                        <template #default="{ row }">
                            <span v-if="row.usdtAmount && row.usdtAmount > 0" style="color: #67c23a;">
                                {{ formatCrypto(row.usdtAmount) }} USDT
                            </span>
                            <span v-else>
                                -
                            </span>
                        </template>
                    </el-table-column>
                </el-table>
            </div>
            <div v-else class="empty-content">
                <el-empty description="暂无团队收益数据" />
            </div>
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="teamRewardDialogVisible = false">关闭</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>
<script setup>
import { ElMessage, ElMessageBox } from 'element-plus'
import { reactive, ref, inject } from 'vue'
import { formatUsdt, formatToken, formatDateTime, formatCrypto } from '@/utils/format'
import { handleApiError } from '@/utils/request'

const formValue = reactive({
    rewardId: "",
    stakingRecordId: "",
    userId: "",
    username: "",
    rewardDate: "",
    rewardDateFrom: "",
    rewardDateTo: "",
    status: "",
})
const tableData = ref()
const _Api = inject('$api')
const pageSize = ref(8)
const currentPage = ref(1)
const loading = ref(false)

const getTableData = async (page) => {
    loading.value = true
    try {
        const params = {
            pageNo: page,
            pageSize: pageSize.value,
        }
        if (formValue.rewardId) params.rewardId = formValue.rewardId
        if (formValue.stakingRecordId) params.stakingRecordId = formValue.stakingRecordId
        if (formValue.userId) params.userId = formValue.userId
        if (formValue.username) params.username = formValue.username
        if (formValue.rewardDate) params.rewardDate = formValue.rewardDate
        if (formValue.rewardDateFrom) params.rewardDateFrom = formValue.rewardDateFrom
        if (formValue.rewardDateTo) params.rewardDateTo = formValue.rewardDateTo
        if (formValue.status) params.status = formValue.status
        
        const res = await _Api._dailyRewardsList(params)
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
    formValue.rewardId = ""
    formValue.stakingRecordId = ""
    formValue.userId = ""
    formValue.username = ""
    formValue.rewardDate = ""
    formValue.rewardDateFrom = ""
    formValue.rewardDateTo = ""
    formValue.status = ""
    currentPage.value = 1
    getTableData(currentPage.value)
}

// 限制收益记录ID只能输入数字
const handleRewardIdInput = (value) => {
    // 只保留数字字符
    formValue.rewardId = value.replace(/\D/g, '')
}

// 限制质押记录ID只能输入数字
const handleStakingRecordIdInput = (value) => {
    // 只保留数字字符
    formValue.stakingRecordId = value.replace(/\D/g, '')
}

// 限制用户ID只能输入数字
const handleUserIdInput = (value) => {
    // 只保留数字字符
    formValue.userId = value.replace(/\D/g, '')
}

const getDistributionStatusText = (status) => {
    const statusMap = {
        'PENDING': '待发放',
        'PAID': '已发放',
        'CANCELLED': '已取消',
        'FAILED': '发放失败'
    }
    return statusMap[status] || status
}

const getDistributionStatusType = (status) => {
    const typeMap = {
        'PENDING': 'warning',
        'PAID': 'success',
        'CANCELLED': 'info',
        'FAILED': 'danger'
    }
    return typeMap[status] || ''
}

const detailDialogVisible = ref(false)
const detailData = ref(null)

const viewDetail = async (row) => {
    detailData.value = row
    detailDialogVisible.value = true
}

const teamRewardDialogVisible = ref(false)
const teamRewardData = ref([])

const viewTeamRewards = async (row) => {
    try {
        teamRewardDialogVisible.value = true
        teamRewardData.value = []
        const res = await _Api._getTeamRewardDetails(row.id)
        if (res && Array.isArray(res)) {
            teamRewardData.value = res
        } else {
            ElMessage.warning('暂无团队收益数据')
        }
    } catch (error) {
        console.error('查询团队收益详情失败:', error)
        handleApiError(error, '查询团队收益详情失败')
    }
}

const retryDistribution = async (row) => {
    try {
        await ElMessageBox.confirm(
            `确定要重试发放收益记录ID ${row.id} 的收益吗？`,
            '确认重试',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning',
            }
        )
        
        const res = await _Api._retryFailedDistribution(row.id)
        if (res) {
            ElMessage.success('重试成功')
            getTableData(currentPage.value)
        }
    } catch (error) {
        if (error !== 'cancel') {
            console.error('重试失败:', error)
            handleApiError(error, '重试失败')
        }
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

    .team-reward-content {
        padding: 20px 0;
    }

    .empty-content {
        padding: 40px 0;
        text-align: center;
    }
}
</style>

