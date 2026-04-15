<template>
    <div class="user-manage-page">
        <div class="filter-panel">
            <el-form :inline="true" :model="filters" class="filter-form">
                <el-form-item label="钱包地址">
                    <el-input
                        v-model="filters.walletAddress"
                        placeholder="请输入钱包地址"
                        clearable
                        style="width: 160px" />
                </el-form-item>
                <el-form-item label="用户ID">
                    <el-input
                        v-model="filters.userId"
                        placeholder="请输入用户ID"
                        clearable
                        style="width: 120px"
                        @input="handleUserIdInput" />
                </el-form-item>
                <el-form-item label="社区角色">
                    <el-select v-model="filters.communityRoleLevel" clearable placeholder="请选择" style="width: 150px">
                        <el-option
                            v-for="role in communityRoleOptions"
                            :key="role.value"
                            :label="role.label"
                            :value="role.value" />
                    </el-select>
                </el-form-item>
                <el-form-item label="共谋者节点">
                    <el-select v-model="filters.isCollaboratorNode" clearable placeholder="请选择" style="width: 120px">
                        <el-option label="是" :value="true" />
                        <el-option label="否" :value="false" />
                    </el-select>
                </el-form-item>
                <el-form-item label="提现状态">
                    <el-select v-model="filters.isFrozen" clearable placeholder="请选择" style="width: 120px">
                        <el-option label="已冻结" :value="true" />
                        <el-option label="正常" :value="false" />
                    </el-select>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="handleSearch">搜索</el-button>
                    <el-button @click="handleReset">重置</el-button>
                </el-form-item>
            </el-form>
        </div>

        <div class="table-panel">
            <div class="panel-title">
                <span>用户管理列表</span>
                <span class="panel-count">共 {{ tableData.total || 0 }} 条</span>
            </div>

            <div class="table-wrapper">
                <el-table
                    :data="tableData.records"
                    border
                    height="100%"
                    v-loading="tableLoading"
                    element-loading-text="加载中..."
                    class="user-table">
                    <el-table-column prop="userId" label="用户ID" min-width="80" />
                    <el-table-column label="钱包地址" min-width="135">
                        <template #default="{ row }">
                            <el-tooltip :content="row.walletAddress" placement="top">
                                <el-button link type="primary" class="wallet-link" @click="copyWalletAddress(row.walletAddress)">
                                    {{ shortenAddress(row.walletAddress) }}
                                </el-button>
                            </el-tooltip>
                        </template>
                    </el-table-column>
                    <el-table-column label="上级用户ID" min-width="90">
                        <template #default="{ row }">
                            {{ displayValue(row.parentId) }}
                        </template>
                    </el-table-column>
                    <el-table-column prop="directChildrenCount" label="下级总人数" min-width="90" />
                    <el-table-column label="社区角色" min-width="110">
                        <template #default="{ row }">
                            <el-button link type="primary" @click="openCommunityRoleDialog(row)">
                                {{ row.communityRoleDisplayName || '无等级' }}
                            </el-button>
                        </template>
                    </el-table-column>
                    <el-table-column label="共谋者节点" min-width="88">
                        <template #default="{ row }">
                            <el-tag size="small" :type="row.isCollaboratorNode ? 'success' : 'info'">
                                {{ row.isCollaboratorNode ? '是' : '否' }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column label="累计充值(U)" min-width="136">
                        <template #default="{ row }">
                            <span class="amount-text">{{ formatAmount(row.totalDepositUsdt) }}</span>
                        </template>
                    </el-table-column>
                    <el-table-column label="可提现(U)" min-width="136">
                        <template #default="{ row }">
                            <span class="amount-text">{{ formatAmount(row.withdrawableUsdt) }}</span>
                        </template>
                    </el-table-column>
                    <el-table-column label="质押收益(U)" min-width="136">
                        <template #default="{ row }">
                            <span class="amount-text">{{ formatAmount(row.stakingRewardUsdt) }}</span>
                        </template>
                    </el-table-column>
                    <el-table-column label="社区分享收益(U)" min-width="150">
                        <template #default="{ row }">
                            <span class="amount-text">{{ formatAmount(row.communityShareRewardUsdt) }}</span>
                        </template>
                    </el-table-column>
                    <el-table-column label="社区角色收益(U)" min-width="150">
                        <template #default="{ row }">
                            <span class="amount-text">{{ formatAmount(row.communityRoleRewardUsdt) }}</span>
                        </template>
                    </el-table-column>
                    <el-table-column label="小区业绩(U)" min-width="136">
                        <template #default="{ row }">
                            <span class="amount-text">{{ formatAmount(row.smallZonePerformance) }}</span>
                        </template>
                    </el-table-column>
                    <el-table-column label="资产包额度(U)" min-width="140">
                        <template #default="{ row }">
                            <el-button link type="primary" class="package-btn" @click="openAssetPackageDialog(row)">
                                {{ formatAmount(row.assetPackageAmount) }}
                            </el-button>
                        </template>
                    </el-table-column>
                    <el-table-column label="提现状态" min-width="86">
                        <template #default="{ row }">
                            <el-tag size="small" :type="row.isFrozen ? 'danger' : 'success'">
                                {{ row.isFrozen ? '已冻结' : '正常' }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column label="用户状态" min-width="78">
                        <template #default="{ row }">
                            {{ row.statusDisplayName || row.status || '-' }}
                        </template>
                    </el-table-column>
                    <el-table-column label="创建时间" min-width="150">
                        <template #default="{ row }">
                            {{ formatDateTime(row.createdAt) }}
                        </template>
                    </el-table-column>
                    <el-table-column
                        fixed="right"
                        label="操作"
                        :width="actionColumnExpanded ? 430 : 56"
                        :class-name="actionColumnExpanded ? 'action-column' : 'action-column collapsed'">
                        <template #header>
                            <div class="action-header" :class="{ collapsed: !actionColumnExpanded }">
                                <span v-if="actionColumnExpanded">操作</span>
                                <el-button link type="primary" class="toggle-action-btn" @click.stop="toggleActionColumn">
                                    <el-icon v-if="actionColumnExpanded"><ArrowLeft /></el-icon>
                                    <el-icon v-else><ArrowRight /></el-icon>
                                </el-button>
                            </div>
                        </template>
                        <template #default="{ row }">
                            <div v-show="actionColumnExpanded" class="action-buttons">
                                <el-button link type="primary" @click="openModelTree(row)">查看经济模型树</el-button>
                                <el-button
                                    v-if="!row.isCollaboratorNode"
                                    link
                                    type="primary"
                                    @click="openActionDialog('addCollaborator', row)">
                                    添加共谋者节点
                                </el-button>
                                <el-button
                                    v-else
                                    link
                                    type="danger"
                                    @click="openActionDialog('removeCollaborator', row)">
                                    解除共谋者节点
                                </el-button>
                                <el-button
                                    v-if="!row.isFrozen"
                                    link
                                    type="warning"
                                    @click="openActionDialog('freeze', row)">
                                    冻结提现
                                </el-button>
                                <el-button
                                    v-else
                                    link
                                    type="success"
                                    @click="openActionDialog('unfreeze', row)">
                                    解冻提现
                                </el-button>
                                <el-button link type="success" @click="openTeamDialog(row)">团队质押提现详情</el-button>
                            </div>
                        </template>
                    </el-table-column>
                </el-table>
            </div>

            <div class="pagination-wrapper">
                <el-pagination
                    v-model:current-page="pagination.pageNo"
                    v-model:page-size="pagination.pageSize"
                    background
                    layout="total, sizes, prev, pager, next, jumper"
                    :page-sizes="[10, 20, 50, 100]"
                    :total="tableData.total"
                    @current-change="fetchTableData"
                    @size-change="handleSizeChange" />
            </div>
        </div>

        <el-dialog v-model="communityRoleDialogVisible" title="修改社区角色" width="620px" destroy-on-close>
            <div v-if="currentRow" class="dialog-card">
                <div class="dialog-info">
                    <div class="dialog-title">用户信息</div>
                    <div class="dialog-top-row">
                        <div class="dialog-item">
                            <span class="dialog-label">用户ID</span>
                            <span class="dialog-value">{{ currentRow.userId }}</span>
                        </div>
                        <div class="dialog-item wallet-section">
                            <span class="dialog-label centered">钱包地址</span>
                            <span class="dialog-value wallet full-wallet">{{ currentRow.walletAddress }}</span>
                        </div>
                    </div>
                    <div class="dialog-grid metrics-grid single-metric-grid">
                        <div class="dialog-item">
                            <span class="dialog-label">当前社区角色</span>
                            <span
                                class="dialog-value role-badge"
                                :class="getRoleBadgeClass(currentRow.communityRoleLevel)">
                                {{ currentRow.communityRoleDisplayName || '无等级' }}
                            </span>
                        </div>
                    </div>
                </div>

                <el-divider content-position="left">角色设置</el-divider>
                <el-form class="dialog-form" label-width="88px">
                    <el-form-item label="社区角色">
                        <el-select v-model="communityRoleForm.communityRoleLevel" style="width: 100%" placeholder="请选择社区角色">
                            <el-option
                                v-for="role in communityRoleOptions"
                                :key="role.value"
                                :label="role.label"
                                :value="role.value">
                                <span class="role-option" :class="getRoleBadgeClass(role.value)">{{ role.label }}</span>
                            </el-option>
                        </el-select>
                    </el-form-item>
                </el-form>
            </div>
            <template #footer>
                <el-button @click="communityRoleDialogVisible = false">取消</el-button>
                <el-button type="primary" @click="submitCommunityRole">确定</el-button>
            </template>
        </el-dialog>

        <el-dialog v-model="assetPackageDialogVisible" title="资产包额度" width="660px" destroy-on-close>
            <div v-if="currentRow" class="dialog-card">
                <div class="dialog-info">
                    <div class="dialog-title">额度详情</div>
                    <div class="dialog-top-row">
                        <div class="dialog-item">
                            <span class="dialog-label">用户ID</span>
                            <span class="dialog-value">{{ currentRow.userId }}</span>
                        </div>
                        <div class="dialog-item wallet-section">
                            <span class="dialog-label centered">钱包地址</span>
                            <span class="dialog-value wallet full-wallet">{{ currentRow.walletAddress }}</span>
                        </div>
                    </div>
                    <div class="dialog-grid metrics-grid">
                        <div class="dialog-item">
                            <span class="dialog-label">当前额度</span>
                            <span class="dialog-value amount">{{ formatAmount(currentRow.assetPackageAmount) }} USDT</span>
                        </div>
                        <div class="dialog-item">
                            <span class="dialog-label">已使用额度</span>
                            <span class="dialog-value danger">{{ formatAmount(currentRow.assetPackageUsed) }} USDT</span>
                        </div>
                        <div class="dialog-item">
                            <span class="dialog-label">可用额度</span>
                            <span class="dialog-value success">{{ formatAmount(currentRow.assetPackageAvailable) }} USDT</span>
                        </div>
                    </div>
                </div>

                <el-divider content-position="left">更新额度</el-divider>
                <el-form class="dialog-form" label-width="88px">
                    <el-form-item label="新额度">
                        <el-input-number
                            v-model="assetPackageForm.assetPackageAmount"
                            :min="0"
                            :precision="2"
                            :step="100"
                            style="width: 240px" />
                        <span class="suffix-text">USDT</span>
                    </el-form-item>
                </el-form>
            </div>
            <template #footer>
                <el-button @click="assetPackageDialogVisible = false">取消</el-button>
                <el-button type="primary" @click="submitAssetPackage">确定</el-button>
            </template>
        </el-dialog>

        <el-dialog v-model="actionDialogVisible" :title="actionDialogTitle" width="460px" destroy-on-close>
            <div v-if="currentRow" class="action-confirm-card">
                确认对用户 {{ currentRow.userId }}（{{ shortenAddress(currentRow.walletAddress) }}）执行“{{ actionDialogTitle }}”操作？
            </div>
            <template #footer>
                <el-button @click="closeActionDialog">取消</el-button>
                <el-button :type="actionConfirmType" @click="submitActionDialog">确定</el-button>
            </template>
        </el-dialog>

        <el-dialog v-model="teamDialogVisible" title="团队质押提现详情" width="760px" destroy-on-close>
            <div v-if="currentRow" class="dialog-card">
                <div class="dialog-info compact">
                    <div class="team-user-row">
                        <div class="dialog-item">
                            <span class="dialog-label">用户ID</span>
                            <span class="dialog-value">{{ currentRow.userId }}</span>
                        </div>
                        <div class="dialog-item right wallet-section">
                            <span class="dialog-label centered">钱包地址</span>
                            <span class="dialog-value wallet full-wallet team-wallet">{{ currentRow.walletAddress }}</span>
                        </div>
                    </div>
                </div>

                <el-divider content-position="left">查询条件</el-divider>
                <el-form :inline="true" class="dialog-form team-form">
                    <el-form-item label="开始日期">
                        <el-date-picker
                            v-model="teamForm.startDate"
                            type="date"
                            value-format="YYYY-MM-DD"
                            format="YYYY-MM-DD"
                            placeholder="开始日期" />
                    </el-form-item>
                    <el-form-item label="结束日期">
                        <el-date-picker
                            v-model="teamForm.endDate"
                            type="date"
                            value-format="YYYY-MM-DD"
                            format="YYYY-MM-DD"
                            placeholder="结束日期" />
                    </el-form-item>
                    <el-form-item>
                        <el-button type="primary" @click="queryTeamDetails">查询</el-button>
                        <el-button @click="resetTeamDateRange">重置为最近30天</el-button>
                    </el-form-item>
                </el-form>

                <div v-loading="teamLoading" element-loading-text="查询中...">
                    <el-empty v-if="!teamData" description="请选择时间范围并查询" :image-size="88" />
                    <div v-else class="team-result">
                        <div class="team-stat-grid">
                            <div class="team-stat-card staking">
                                <div class="team-stat-title">质押详情</div>
                                <div class="team-stat-body">
                                    <div class="team-stat-row">
                                        <span class="stat-label">团队质押总金额</span>
                                        <span class="stat-value">{{ formatAmount(teamData.totalStakingAmount) }} U</span>
                                    </div>
                                    <div class="team-stat-row">
                                        <span class="stat-label">参与用户数</span>
                                        <span class="stat-value">{{ teamData.userCount || 0 }} 人</span>
                                    </div>
                                </div>
                            </div>
                            <div class="team-stat-card withdraw">
                                <div class="team-stat-title">提现详情</div>
                                <div class="team-stat-body">
                                    <div class="team-stat-row">
                                        <span class="stat-label">团队提现总金额</span>
                                        <span class="stat-value">{{ formatAmount(teamData.totalWithdrawAmount) }} U</span>
                                    </div>
                                    <div class="team-stat-row">
                                        <span class="stat-label">参与用户数</span>
                                        <span class="stat-value">{{ teamData.withdrawUserCount || 0 }} 人</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="team-range-card">
                            <span class="range-label">查询时间范围</span>
                            <span class="range-value">{{ teamData.startDate || '-' }} 至 {{ teamData.endDate || '-' }}</span>
                        </div>
                    </div>
                </div>
            </div>
            <template #footer>
                <el-button @click="closeTeamDialog">关闭</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { computed, inject, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { formatCrypto, formatDateTime } from '@/utils/format'
import { handleApiError } from '@/utils/request'
import { copyText, shortenAddress } from '@/utils/address'

const router = useRouter()
const _Api = inject('$api')

const communityRoleOptions = [
    { label: '无等级', value: 'NONE' },
    { label: 'V1社区贡献者', value: 'V1_CONTRIBUTOR' },
    { label: 'V2社区贡献者', value: 'V2_CONTRIBUTOR' },
    { label: 'V3社区贡献者', value: 'V3_CONTRIBUTOR' },
    { label: '社区大使长', value: 'AMBASSADOR' },
    { label: '社区公会长', value: 'GUILD_LEADER' },
    { label: '节点共谋人', value: 'NODE_CONSPIRATOR' },
    { label: '社区运营中心', value: 'OPERATION_CENTER' }
]

const roleBadgeClassMap = {
    NONE: 'role-none',
    V1_CONTRIBUTOR: 'role-v1',
    V2_CONTRIBUTOR: 'role-v2',
    V3_CONTRIBUTOR: 'role-v3',
    AMBASSADOR: 'role-ambassador',
    GUILD_LEADER: 'role-guild',
    NODE_CONSPIRATOR: 'role-conspirator',
    OPERATION_CENTER: 'role-center'
}

const getRoleBadgeClass = (roleLevel) => roleBadgeClassMap[roleLevel] || 'role-none'

const filters = reactive({
    walletAddress: '',
    userId: '',
    communityRoleLevel: '',
    isCollaboratorNode: null,
    isFrozen: null
})

const pagination = reactive({
    pageNo: 1,
    pageSize: 10
})

const actionColumnExpanded = ref(true)
const tableLoading = ref(false)
const tableData = reactive({
    records: [],
    total: 0
})

const currentRow = ref(null)

const communityRoleDialogVisible = ref(false)
const communityRoleForm = reactive({
    communityRoleLevel: 'NONE'
})

const assetPackageDialogVisible = ref(false)
const assetPackageForm = reactive({
    assetPackageAmount: 0
})

const actionDialogVisible = ref(false)
const actionDialogType = ref('')

const teamDialogVisible = ref(false)
const teamLoading = ref(false)
const teamData = ref(null)
const teamForm = reactive({
    startDate: '',
    endDate: ''
})

const actionDialogTitleMap = {
    addCollaborator: '添加共谋者节点',
    removeCollaborator: '解除共谋者节点',
    freeze: '冻结提现',
    unfreeze: '解冻提现'
}

const actionConfirmTypeMap = {
    addCollaborator: 'primary',
    removeCollaborator: 'danger',
    freeze: 'warning',
    unfreeze: 'success'
}

const actionApiMap = {
    addCollaborator: '_addCollaboratorNodeV2',
    removeCollaborator: '_removeCollaboratorNodeV2',
    freeze: '_freezeUserWithdrawV2',
    unfreeze: '_unfreezeUserWithdrawV2'
}

const actionDialogTitle = computed(() => actionDialogTitleMap[actionDialogType.value] || '确认操作')
const actionConfirmType = computed(() => actionConfirmTypeMap[actionDialogType.value] || 'primary')

const formatAmount = (value) => formatCrypto(value)
const displayValue = (value) => value ?? '-'

const toggleActionColumn = () => {
    actionColumnExpanded.value = !actionColumnExpanded.value
}

const handleUserIdInput = (value) => {
    filters.userId = value.replace(/\D/g, '')
}

const buildQuery = () => {
    const query = {
        pageNo: pagination.pageNo,
        pageSize: pagination.pageSize
    }

    if (filters.walletAddress?.trim()) {
        query.walletAddress = filters.walletAddress.trim()
    }
    if (filters.userId) {
        query.userId = Number(filters.userId)
    }
    if (filters.communityRoleLevel) {
        query.communityRoleLevel = filters.communityRoleLevel
    }
    if (typeof filters.isCollaboratorNode === 'boolean') {
        query.isCollaboratorNode = filters.isCollaboratorNode
    }
    if (typeof filters.isFrozen === 'boolean') {
        query.isFrozen = filters.isFrozen
    }

    return query
}

const fetchTableData = async () => {
    tableLoading.value = true
    try {
        const res = await _Api._userListV2(buildQuery())
        const payload = res?.data ?? res ?? {}
        tableData.records = payload.records || []
        tableData.total = payload.total || 0
    } catch (error) {
        handleApiError(error, '查询用户列表失败')
    } finally {
        tableLoading.value = false
    }
}

const handleSearch = () => {
    pagination.pageNo = 1
    fetchTableData()
}

const handleReset = () => {
    filters.walletAddress = ''
    filters.userId = ''
    filters.communityRoleLevel = ''
    filters.isCollaboratorNode = null
    filters.isFrozen = null
    pagination.pageNo = 1
    pagination.pageSize = 10
    fetchTableData()
}

const handleSizeChange = () => {
    pagination.pageNo = 1
    fetchTableData()
}

const copyWalletAddress = async (walletAddress) => {
    try {
        await copyText(walletAddress)
        ElMessage.success('钱包地址已复制')
    } catch (error) {
        handleApiError(error, '复制失败')
    }
}

const openModelTree = (row) => {
    const routeData = router.resolve({
        name: 'modelTree',
        params: { userId: row.userId }
    })
    const newWindow = window.open(routeData.href, '_blank')
    if (!newWindow) {
        ElMessage.warning('请允许弹出窗口以查看经济模型树')
    }
}

const openCommunityRoleDialog = (row) => {
    currentRow.value = row
    communityRoleForm.communityRoleLevel = row.communityRoleLevel || 'NONE'
    communityRoleDialogVisible.value = true
}

const submitCommunityRole = async () => {
    if (!currentRow.value) {
        return
    }
    try {
        await _Api._updateCommunityRoleLevelV2({
            userId: currentRow.value.userId,
            communityRoleLevel: communityRoleForm.communityRoleLevel
        })
        ElMessage.success('社区角色更新成功')
        communityRoleDialogVisible.value = false
        fetchTableData()
    } catch (error) {
        handleApiError(error, '更新社区角色失败')
    }
}

const openAssetPackageDialog = (row) => {
    currentRow.value = row
    assetPackageForm.assetPackageAmount = Number(row.assetPackageAmount || 0)
    assetPackageDialogVisible.value = true
}

const submitAssetPackage = async () => {
    if (!currentRow.value) {
        return
    }
    if (assetPackageForm.assetPackageAmount < Number(currentRow.value.assetPackageUsed || 0)) {
        ElMessage.warning('资产包额度不能低于已使用额度')
        return
    }
    try {
        await _Api._updateAssetPackageV2({
            userId: currentRow.value.userId,
            assetPackageAmount: assetPackageForm.assetPackageAmount
        })
        ElMessage.success('资产包额度更新成功')
        assetPackageDialogVisible.value = false
        fetchTableData()
    } catch (error) {
        handleApiError(error, '更新资产包额度失败')
    }
}

const openActionDialog = (type, row) => {
    actionDialogType.value = type
    currentRow.value = row
    actionDialogVisible.value = true
}

const closeActionDialog = () => {
    actionDialogVisible.value = false
    actionDialogType.value = ''
}

const submitActionDialog = async () => {
    if (!currentRow.value || !actionDialogType.value) {
        return
    }
    try {
        await _Api[actionApiMap[actionDialogType.value]]({
            userId: currentRow.value.userId
        })
        ElMessage.success(`${actionDialogTitleMap[actionDialogType.value]}成功`)
        closeActionDialog()
        fetchTableData()
    } catch (error) {
        handleApiError(error, `${actionDialogTitleMap[actionDialogType.value]}失败`)
    }
}

const formatDateForPicker = (date) => {
    const year = date.getFullYear()
    const month = `${date.getMonth() + 1}`.padStart(2, '0')
    const day = `${date.getDate()}`.padStart(2, '0')
    return `${year}-${month}-${day}`
}

const resetTeamDateRange = () => {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)
    teamForm.startDate = formatDateForPicker(startDate)
    teamForm.endDate = formatDateForPicker(endDate)
}

const openTeamDialog = (row) => {
    currentRow.value = row
    teamData.value = null
    resetTeamDateRange()
    teamDialogVisible.value = true
}

const closeTeamDialog = () => {
    teamDialogVisible.value = false
    teamData.value = null
}

const queryTeamDetails = async () => {
    if (!currentRow.value) {
        return
    }
    if (!teamForm.startDate || !teamForm.endDate) {
        ElMessage.warning('请选择开始日期和结束日期')
        return
    }
    if (teamForm.startDate > teamForm.endDate) {
        ElMessage.warning('开始日期不能大于结束日期')
        return
    }
    teamLoading.value = true
    try {
        const res = await _Api._getTeamStakingWithdrawDetailsV2({
            userId: currentRow.value.userId,
            startDate: teamForm.startDate,
            endDate: teamForm.endDate
        })
        teamData.value = res?.data ?? res ?? null
    } catch (error) {
        handleApiError(error, '查询团队质押提现详情失败')
    } finally {
        teamLoading.value = false
    }
}

fetchTableData()
</script>

<style lang="scss" scoped>
.user-manage-page {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding-bottom: 28px;
}

.filter-panel,
.table-panel {
    background: #fff;
    border: 1px solid #ebeef5;
    border-radius: 10px;
}

.filter-panel {
    padding: 14px 16px 6px;
}

.filter-form {
    display: flex;
    flex-wrap: wrap;
    align-items: center;

    :deep(.el-form-item) {
        margin-right: 16px;
        margin-bottom: 8px;
    }

    :deep(.el-form-item__label) {
        padding-right: 8px;
        font-size: 13px;
    }
}

.table-panel {
    padding: 14px 16px 16px;
}

.panel-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14px;
    font-size: 18px;
    font-weight: 600;
}

.panel-count {
    font-size: 14px;
    color: #606266;
}

.table-wrapper {
    height: calc(100vh - 290px);
    min-height: 420px;
}

.wallet-link,
.package-btn {
    padding: 0;
}

.amount-text {
    color: #67c23a;
}

.action-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;

    &.collapsed {
        justify-content: center;
    }
}

.toggle-action-btn {
    padding: 0;
}

.action-buttons {
    display: flex;
    align-items: center;
    gap: 8px;
    white-space: nowrap;

    .el-button {
        padding: 0;
        min-height: auto;
        font-size: 13px;
        flex-shrink: 0;
    }
}

.pagination-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 14px;
}

.dialog-card {
    padding: 4px 2px;
}

.dialog-info {
    padding: 16px 18px;
    border: 1px solid #ebeef5;
    border-radius: 10px;
    background: #f8fafc;

    &.compact {
        padding-bottom: 8px;
    }
}

.dialog-title {
    margin-bottom: 12px;
    font-size: 15px;
    font-weight: 600;
    color: #303133;
}

.dialog-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px 18px;
}

.dialog-top-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 24px;
}

.dialog-item {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;

    &.full {
        grid-column: 1 / -1;
    }
}

.dialog-label {
    font-size: 12px;
    color: #909399;
}

.dialog-label.centered {
    text-align: center;
}

.dialog-value {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
    word-break: break-all;

    &.wallet {
        color: #409eff;
    }

    &.amount,
    &.success {
        color: #67c23a;
    }

    &.danger {
        color: #f56c6c;
    }
}

.dialog-value.full-wallet {
    display: block;
    width: 100%;
    font-size: 12px;
    line-height: 1.5;
    white-space: nowrap;
    word-break: normal;
    overflow: visible;
    text-align: right;
}

.wallet-section {
    flex: 0 1 470px;
    min-width: 0;

    .dialog-label.centered {
        display: block;
        width: 100%;
        text-align: center;
    }
}

.metrics-grid {
    margin-top: 14px;
}

.single-metric-grid {
    grid-template-columns: minmax(0, 1fr);
}

.dialog-form {
    margin-top: 14px;
}

.team-form {
    margin-bottom: 14px;
}

.team-result {
    margin-top: 12px;
}

.team-user-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 18px;

    .dialog-item {
        flex: 1;
    }

    .dialog-item.right {
        text-align: right;
        align-items: stretch;
        flex: 0 1 420px;
        max-width: 420px;
    }
}

.team-wallet {
    text-align: right;
}

.role-badge,
.role-option {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 5px 12px;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 700;
    line-height: 1;
    border: 1px solid transparent;
}

.role-badge {
    align-self: flex-start;
    width: fit-content;
}

.role-option {
    min-width: 112px;
}

.role-none {
    color: #909399;
    background: #f4f4f5;
    border-color: #e4e7ed;
}

.role-v1 {
    color: #b88230;
    background: #fff4df;
    border-color: #f3d19e;
}

.role-v2 {
    color: #409eff;
    background: #ecf5ff;
    border-color: #b3d8ff;
}

.role-v3 {
    color: #7c4dff;
    background: #f3edff;
    border-color: #d8c5ff;
}

.role-ambassador {
    color: #e67e22;
    background: #fff2e8;
    border-color: #f8c9a4;
}

.role-guild {
    color: #0f9d7a;
    background: #e8fbf5;
    border-color: #9fe3cd;
}

.role-conspirator {
    color: #e53935;
    background: #fdecec;
    border-color: #f5b7b1;
}

.role-center {
    color: #8e44ad;
    background: #f5ecfb;
    border-color: #d6b8ea;
}

.suffix-text {
    margin-left: 8px;
    color: #909399;
}

.action-confirm-card {
    padding: 18px;
    border-radius: 10px;
    background: #fff7e6;
    border: 1px solid #f5dab1;
    color: #8c6a2f;
    line-height: 1.7;
}

:deep(.user-table .cell) {
    line-height: 1.5;
    padding: 4px 8px;
    white-space: nowrap;
}

:deep(.user-table td) {
    padding: 6px 0;
}

:deep(.user-table th) {
    padding: 8px 0;
}

.team-stat-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px;
}

.team-stat-card {
    border: 1px solid #ebeef5;
    border-radius: 10px;
    overflow: hidden;
    background: #fff;

    &.staking .team-stat-title {
        color: #67c23a;
    }

    &.withdraw .team-stat-title {
        color: #409eff;
    }
}

.team-stat-title {
    padding: 14px 16px;
    font-size: 16px;
    font-weight: 700;
    background: #f8fafc;
}

.team-stat-body {
    padding: 6px 0;
}

.team-stat-row {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    padding: 14px 16px;
    border-top: 1px solid #f0f2f5;
}

.stat-label {
    color: #606266;
}

.stat-value {
    font-size: 16px;
    font-weight: 700;
    color: #303133;
    white-space: nowrap;
}

.staking .stat-value {
    color: #67c23a;
}

.withdraw .stat-value {
    color: #409eff;
}

.team-range-card {
    display: flex;
    align-items: center;
    gap: 18px;
    margin-top: 18px;
    padding: 16px;
    border-radius: 10px;
    background: #f8fafc;
    border: 1px solid #ebeef5;
}

.range-label {
    color: #606266;
    font-weight: 600;
}

.range-value {
    color: #303133;
    font-weight: 600;
}

:deep(.action-column .cell) {
    padding: 6px 8px !important;
}

:deep(.action-column.collapsed .cell) {
    justify-content: center;
}
</style>
