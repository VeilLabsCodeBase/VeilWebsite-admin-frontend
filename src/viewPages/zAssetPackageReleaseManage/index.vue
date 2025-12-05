<template>
    <div class="z-asset-package-release-manage">
        <div class="filter">
            <el-form :inline="true" :model="formValue" class="demo-form-inline">
                <el-form-item label="用户ID">
                    <el-input v-model="formValue.userId" placeholder="请输入用户ID" clearable />
                </el-form-item>
                <el-form-item label="释放类型">
                    <el-select v-model="formValue.releaseType" placeholder="请选择" style="width: 240px" clearable>
                        <el-option label="全部" value="" />
                        <el-option label="个人质押充值" value="PERSONAL_STAKING" />
                        <el-option label="直接下级用户质押充值" value="DIRECT_SUBORDINATE_STAKING" />
                        <el-option label="小区用户质押充值" value="SMALL_ZONE_STAKING" />
                    </el-select>
                </el-form-item>
                <el-form-item label="来源用户ID">
                    <el-input v-model="formValue.sourceUserId" placeholder="请输入来源用户ID" clearable />
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="onSearch">搜索</el-button>
                    <el-button @click="resetSearch">重置</el-button>
                </el-form-item>
            </el-form>
        </div>
        <div class="uploadList">
            <div class="taskUploadList">
                <div class="title">
                    <span>Z资产包释放记录</span>
                </div>
                <div class="list">
                    <el-table :data="tableData?.records" border style="width: 100%" height="100%" fit v-loading="loading">
                        <el-table-column prop="id" label="ID" width="80" />
                        <el-table-column prop="userId" label="用户ID" width="120" />
                        <el-table-column prop="username" label="用户名" width="150" />
                        <el-table-column prop="releaseTypeDesc" label="释放类型" width="180" />
                        <el-table-column prop="stakingAmount" label="质押金额(USDT)" width="150">
                            <template #default="{ row }">
                                {{ formatUsdt(row.stakingAmount) }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="releaseAmount" label="释放金额(USDT)" width="150">
                            <template #default="{ row }">
                                <span style="color: #67C23A; font-weight: bold;">
                                    {{ formatUsdt(row.releaseAmount) }}
                                </span>
                            </template>
                        </el-table-column>
                        <el-table-column prop="sourceUserId" label="来源用户ID" width="120">
                            <template #default="{ row }">
                                {{ row.sourceUserId || '-' }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="sourceUsername" label="来源用户名" width="150">
                            <template #default="{ row }">
                                {{ row.sourceUsername || '-' }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="sourceStakingRecordId" label="来源质押记录ID" width="150">
                            <template #default="{ row }">
                                {{ row.sourceStakingRecordId || '-' }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="createdAt" label="创建时间" min-width="180">
                            <template #default="{ row }">
                                {{ formatDateTime(row.createdAt) }}
                            </template>
                        </el-table-column>
                    </el-table>
                </div>
                <div class="page">
                    <el-pagination 
                        v-model:current-page="currentPage" 
                        v-model:page-size="pageSize" 
                        background
                        :total="tableData?.total || 0" 
                        @size-change="handleSizeChange"
                        @current-change="handleCurrentChange" />
                </div>
            </div>
        </div>
    </div>
</template>
<script setup>
import { ElMessage } from 'element-plus'
import { reactive, ref, inject } from 'vue'

const tableData = ref()
const formValue = reactive({
    userId: "",
    releaseType: "",
    sourceUserId: "",
})
const _Api = inject('$api')
const pageSize = ref(10)
const currentPage = ref(1)
const loading = ref(false)

const getTableData = async (page) => {
    loading.value = true
    try {
        const params = {
            pageNo: page,
            pageSize: pageSize.value,
        }
        if (formValue.userId) {
            params.userId = Number(formValue.userId)
        }
        if (formValue.releaseType) {
            params.releaseType = formValue.releaseType
        }
        if (formValue.sourceUserId) {
            params.sourceUserId = Number(formValue.sourceUserId)
        }
        
        const res = await _Api._zAssetPackageReleaseRecords(params)
        if (res) {
            tableData.value = res
        }
    } catch (error) {
        console.error('获取数据失败:', error)
        ElMessage.error('获取数据失败: ' + (error.message || '未知错误'))
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

const resetSearch = () => {
    formValue.userId = ""
    formValue.releaseType = ""
    formValue.sourceUserId = ""
    currentPage.value = 1
    getTableData(currentPage.value)
}

// 格式化USDT金额（最低保留两位小数，最大8位）
const formatUsdt = (value) => {
    if (value == null || value === undefined || value === '') {
        return '0.00'
    }
    const num = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(num)) {
        return '0.00'
    }
    // 保留2-8位小数，但至少保留2位
    const str = num.toFixed(8)
    // 移除末尾的0，但至少保留2位小数
    const parts = str.split('.')
    if (parts.length === 2) {
        let decimals = parts[1].replace(/0+$/, '')
        if (decimals.length < 2) {
            decimals = decimals.padEnd(2, '0')
        }
        return parts[0] + '.' + decimals
    }
    return num.toFixed(2)
}

// 格式化日期时间
const formatDateTime = (value) => {
    if (!value) {
        return '-'
    }
    const date = new Date(value)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}
</script>
<style lang="scss" scoped>
.z-asset-package-release-manage {
    padding-bottom: 40px;

    .filter {
        padding: 20px;
        background: #fff;
        border-radius: 4px;
        margin-bottom: 20px;
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
            background: #fff;
            border-radius: 4px;
            padding: 20px;

            .title {
                font-size: 0.2rem;
                width: 100%;
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                font-weight: bold;
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
                margin-top: 20px;
            }
        }
    }
}
</style>

