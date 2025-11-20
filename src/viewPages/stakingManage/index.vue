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
                    <el-select v-model="formValue.status" placeholder="请选择状态" clearable>
                        <el-option label="进行中" value="ACTIVE" />
                        <el-option label="已到期" value="EXPIRED" />
                        <el-option label="已封顶" value="CAPPED" />
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
                        <el-table-column prop="stakingAmount" label="质押金额(USDT)" width="140">
                            <template #default="{ row }">
                                {{ row.stakingAmount?.toFixed(2) }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="usdtAmount" label="USDT金额" width="120">
                            <template #default="{ row }">
                                {{ row.usdtAmount?.toFixed(2) }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="tokenAmount" label="Token金额" width="120">
                            <template #default="{ row }">
                                {{ row.tokenAmount?.toFixed(2) }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="periodDays" label="质押周期(天)" width="120" />
                        <el-table-column prop="dailyRate" label="日算力倍率(‰)" width="130">
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
                        <el-table-column prop="startDate" label="开始日期" width="120" />
                        <el-table-column prop="endDate" label="到期日期" width="120" />
                        <el-table-column prop="status" label="状态" width="100">
                            <template #default="{ row }">
                                <el-tag :type="getStatusType(row.status)">
                                    {{ getStatusText(row.status) }}
                                </el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column prop="totalRewardUsdt" label="累计USDT收益" width="130">
                            <template #default="{ row }">
                                {{ row.totalRewardUsdt?.toFixed(4) || '0.0000' }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="totalRewardToken" label="累计Token收益" width="130">
                            <template #default="{ row }">
                                {{ row.totalRewardToken?.toFixed(4) || '0.0000' }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="createdAt" label="创建时间" width="180" />
                        <el-table-column fixed="right" label="操作" min-width="120">
                            <template #default="scope">
                                <el-button link type="primary" @click="viewDetail(scope.row)" size="small">
                                    查看详情
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
                    <el-descriptions-item label="质押金额(USDT)">{{ detailData.stakingAmount?.toFixed(2) }}</el-descriptions-item>
                    <el-descriptions-item label="USDT金额">{{ detailData.usdtAmount?.toFixed(2) }}</el-descriptions-item>
                    <el-descriptions-item label="Token金额">{{ detailData.tokenAmount?.toFixed(2) }}</el-descriptions-item>
                    <el-descriptions-item label="质押周期(天)">{{ detailData.periodDays }}</el-descriptions-item>
                    <el-descriptions-item label="日算力倍率(‰)">{{ detailData.dailyRate }}</el-descriptions-item>
                    <el-descriptions-item label="收益倍数">{{ detailData.rewardMultiple }}</el-descriptions-item>
                    <el-descriptions-item label="提现规则">{{ getWithdrawRuleDesc(detailData.withdrawRule) }}</el-descriptions-item>
                    <el-descriptions-item label="开始日期">{{ detailData.startDate }}</el-descriptions-item>
                    <el-descriptions-item label="到期日期">{{ detailData.endDate }}</el-descriptions-item>
                    <el-descriptions-item label="状态">
                        <el-tag :type="getStatusType(detailData.status)">
                            {{ getStatusText(detailData.status) }}
                        </el-tag>
                    </el-descriptions-item>
                    <el-descriptions-item label="累计USDT收益">{{ detailData.totalRewardUsdt?.toFixed(4) || '0.0000' }}</el-descriptions-item>
                    <el-descriptions-item label="累计Token收益">{{ detailData.totalRewardToken?.toFixed(4) || '0.0000' }}</el-descriptions-item>
                    <el-descriptions-item label="创建时间">{{ detailData.createdAt }}</el-descriptions-item>
                    <el-descriptions-item label="更新时间">{{ detailData.updatedAt }}</el-descriptions-item>
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
import { ElMessage } from 'element-plus'
import { reactive, ref, inject } from 'vue'

const formValue = reactive({
    stakingId: "",
    userId: "",
    username: "",
    status: "",
})
const detailDialogVisible = ref(false)
const detailData = ref(null)
const tableData = ref()
const _Api = inject('$api')
const pageSize = ref(10)
const currentPage = ref(1)

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
        'EXPIRED': '已到期',
        'CAPPED': '已封顶'
    }
    return statusMap[status] || status
}

const getStatusType = (status) => {
    const typeMap = {
        'ACTIVE': 'success',
        'EXPIRED': 'info',
        'CAPPED': 'warning'
    }
    return typeMap[status] || ''
}

const viewDetail = async (row) => {
    detailData.value = row
    detailDialogVisible.value = true
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

