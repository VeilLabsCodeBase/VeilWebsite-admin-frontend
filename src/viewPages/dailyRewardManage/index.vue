<template>
    <div class="batchUpload">
        <div class="filter">
            <el-form :inline="true" :model="formValue" class="demo-form-inline">
                <el-form-item label="收益记录ID">
                    <el-input v-model="formValue.rewardId" placeholder="请输入收益记录ID" clearable />
                </el-form-item>
                <el-form-item label="质押记录ID">
                    <el-input v-model="formValue.stakingRecordId" placeholder="请输入质押记录ID" clearable />
                </el-form-item>
                <el-form-item label="用户ID">
                    <el-input v-model="formValue.userId" placeholder="请输入用户ID" clearable />
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
                <el-form-item label="发放状态">
                    <el-select v-model="formValue.status" placeholder="请选择状态" clearable style="width: 200px">
                        <el-option label="待发放" value="PENDING" />
                        <el-option label="已发放" value="PAID" />
                        <el-option label="已取消" value="CANCELLED" />
                        <el-option label="发放失败" value="FAILED" />
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
                    <span>每日收益管理列表</span>
                </div>
                <div class="list">
                    <el-table :data="tableData?.records" border style="width: 100%" height="100%">
                        <el-table-column prop="id" label="ID" width="80" />
                        <el-table-column prop="stakingRecordId" label="质押记录ID" width="120" />
                        <el-table-column prop="userId" label="用户ID" width="100" />
                        <el-table-column prop="username" label="用户名" width="120" />
                        <el-table-column prop="rewardDate" label="收益日期" width="120" />
                        <el-table-column prop="dailyRewardUsdt" label="USDT收益" width="120">
                            <template #default="{ row }">
                                {{ row.dailyRewardUsdt?.toFixed(4) || '0.0000' }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="dailyRewardToken" label="Token收益" width="120">
                            <template #default="{ row }">
                                {{ row.dailyRewardToken?.toFixed(4) || '0.0000' }}
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
                        <el-table-column fixed="right" label="操作" min-width="120">
                            <template #default="scope">
                                <el-button 
                                    link type="primary" 
                                    @click="viewDetail(scope.row)" 
                                    size="small">
                                    查看详情
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
                    <el-descriptions-item label="USDT收益">{{ detailData.dailyRewardUsdt?.toFixed(4) || '0.0000' }}</el-descriptions-item>
                    <el-descriptions-item label="Token收益">{{ detailData.dailyRewardToken?.toFixed(4) || '0.0000' }}</el-descriptions-item>
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
    </div>
</template>
<script setup>
import { ElMessage, ElMessageBox } from 'element-plus'
import { reactive, ref, inject } from 'vue'

const formValue = reactive({
    rewardId: "",
    stakingRecordId: "",
    userId: "",
    username: "",
    rewardDate: "",
    status: "",
})
const tableData = ref()
const _Api = inject('$api')
const pageSize = ref(10)
const currentPage = ref(1)

const getTableData = async (page) => {
    const params = {
        pageNo: page,
        pageSize: pageSize.value,
    }
    if (formValue.rewardId) params.rewardId = formValue.rewardId
    if (formValue.stakingRecordId) params.stakingRecordId = formValue.stakingRecordId
    if (formValue.userId) params.userId = formValue.userId
    if (formValue.username) params.username = formValue.username
    if (formValue.rewardDate) params.rewardDate = formValue.rewardDate
    if (formValue.status) params.status = formValue.status
    
    const res = await _Api._dailyRewardsList(params)
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
        }
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

