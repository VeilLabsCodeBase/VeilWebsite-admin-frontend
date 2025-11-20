<template>
    <div class="batchUpload">
        <div class="filter">
            <el-form :inline="true" :model="formValue" class="demo-form-inline">
                <el-form-item label="失败记录ID">
                    <el-input v-model="formValue.failureId" placeholder="请输入失败记录ID" clearable />
                </el-form-item>
                <el-form-item label="收益记录ID">
                    <el-input v-model="formValue.rewardId" placeholder="请输入收益记录ID" clearable />
                </el-form-item>
                <el-form-item label="质押记录ID">
                    <el-input v-model="formValue.stakingId" placeholder="请输入质押记录ID" clearable />
                </el-form-item>
                <el-form-item label="用户ID">
                    <el-input v-model="formValue.userId" placeholder="请输入用户ID" clearable />
                </el-form-item>
                <el-form-item label="重试状态">
                    <el-select v-model="formValue.retryStatus" placeholder="请选择状态" clearable style="width: 200px">
                        <el-option label="待处理" value="PENDING" />
                        <el-option label="重试中" value="RETRYING" />
                        <el-option label="已成功" value="SUCCESS" />
                        <el-option label="最终失败" value="FAILED" />
                    </el-select>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="onSearch">搜索</el-button>
                    <el-button type="danger" @click="batchRetry" :disabled="selectedRows.length === 0">
                        批量重试 ({{ selectedRows.length }})
                    </el-button>
                </el-form-item>
            </el-form>
        </div>
        <div class="uploadList">
            <div class="taskUploadList">
                <div class="title">
                    <span>收益发放失败记录管理</span>
                </div>
                <div class="list">
                    <el-table 
                        :data="tableData?.records" 
                        border 
                        style="width: 100%" 
                        height="100%"
                        @selection-change="handleSelectionChange">
                        <el-table-column type="selection" width="55" />
                        <el-table-column prop="id" label="ID" width="80" />
                        <el-table-column prop="rewardId" label="收益记录ID" width="120" />
                        <el-table-column prop="stakingId" label="质押记录ID" width="120" />
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
                        <el-table-column prop="failureReason" label="失败原因" width="250" show-overflow-tooltip />
                        <el-table-column prop="retryCount" label="重试次数" width="100" />
                        <el-table-column prop="retryStatus" label="重试状态" width="120">
                            <template #default="{ row }">
                                <el-tag :type="getRetryStatusType(row.retryStatus)">
                                    {{ getRetryStatusText(row.retryStatus) }}
                                </el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column prop="lastRetryTime" label="最后重试时间" width="180" />
                        <el-table-column prop="createdAt" label="创建时间" width="180" />
                        <el-table-column fixed="right" label="操作" min-width="120">
                            <template #default="scope">
                                <el-button 
                                    link type="primary" 
                                    @click="retryDistribution(scope.row)" 
                                    size="small">
                                    重试
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
    </div>
</template>
<script setup>
import { ElMessage, ElMessageBox } from 'element-plus'
import { reactive, ref, inject } from 'vue'

const formValue = reactive({
    failureId: "",
    rewardId: "",
    stakingId: "",
    userId: "",
    retryStatus: "",
})
const tableData = ref()
const selectedRows = ref([])
const _Api = inject('$api')
const pageSize = ref(10)
const currentPage = ref(1)

const getTableData = async (page) => {
    const params = {
        pageNo: page,
        pageSize: pageSize.value,
    }
    if (formValue.failureId) params.failureId = formValue.failureId
    if (formValue.rewardId) params.rewardId = formValue.rewardId
    if (formValue.stakingId) params.stakingId = formValue.stakingId
    if (formValue.userId) params.userId = formValue.userId
    if (formValue.retryStatus) params.retryStatus = formValue.retryStatus
    
    const res = await _Api._distributionFailuresList(params)
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

const handleSelectionChange = (selection) => {
    selectedRows.value = selection
}

const getRetryStatusText = (status) => {
    const statusMap = {
        'PENDING': '待处理',
        'RETRYING': '重试中',
        'SUCCESS': '已成功',
        'FAILED': '最终失败'
    }
    return statusMap[status] || status
}

const getRetryStatusType = (status) => {
    const typeMap = {
        'PENDING': 'warning',
        'RETRYING': 'info',
        'SUCCESS': 'success',
        'FAILED': 'danger'
    }
    return typeMap[status] || ''
}

const retryDistribution = async (row) => {
    try {
        await ElMessageBox.confirm(
            `确定要重试发放失败记录ID ${row.id} 的收益吗？`,
            '确认重试',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning',
            }
        )
        
        const res = await _Api._retryFailedDistribution(row.rewardId)
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

const batchRetry = async () => {
    if (selectedRows.value.length === 0) {
        ElMessage.warning('请选择要重试的记录')
        return
    }
    
    try {
        await ElMessageBox.confirm(
            `确定要批量重试 ${selectedRows.value.length} 条失败记录吗？`,
            '确认批量重试',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning',
            }
        )
        
        const rewardIds = selectedRows.value.map(row => row.rewardId)
        const res = await _Api._batchRetryFailedDistributions({ rewardIds })
        if (res) {
            ElMessage.success('批量重试成功')
            selectedRows.value = []
            getTableData(currentPage.value)
        }
    } catch (error) {
        if (error !== 'cancel') {
            console.error('批量重试失败:', error)
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
}
</style>

