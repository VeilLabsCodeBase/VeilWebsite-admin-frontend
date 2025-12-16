<template>
    <div class="batchUpload">
        <div class="filter">
            <el-form :inline="true" :model="formValue" class="demo-form-inline">
                <el-form-item label="用户id">
                    <el-input v-model="formValue.userId" placeholder="请输入用户id" clearable />
                </el-form-item>
                <el-form-item label="email">
                    <el-input v-model="formValue.email" placeholder="请输入email" clearable />
                </el-form-item>
                <el-form-item label="用户名">
                    <el-input v-model="formValue.username" placeholder="请输入用户名" clearable />
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
                    <span>用户管理列表</span>
                </div>
                <div class="list">
                    <el-table :data="tableData?.records" border style="width: 100%" height="100%" v-loading="tableLoading" element-loading-text="加载中...">
                        <el-table-column prop="userModelling.userId" label="用户id" min-width="110" show-overflow-tooltip />
                        <el-table-column prop="username" label="用户名" min-width="160" show-overflow-tooltip />
                        <el-table-column prop="role" label="用户角色" min-width="160" show-overflow-tooltip />
                        <el-table-column prop="referredUserId" label="推荐人Id" min-width="120" show-overflow-tooltip />
                        <el-table-column prop="email" label="email" min-width="200" show-overflow-tooltip />
                        <el-table-column prop="userModelling.realDepositAmount" label="用户真实充值金额" min-width="200" show-overflow-tooltip />
                        <el-table-column prop="stakingRewardUsdt" label="质押收益" min-width="220" show-overflow-tooltip>
                            <template #default="{ row }">
                                {{ formatUsdtAndToken(row.stakingRewardUsdt, row.stakingRewardToken) }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="communityShareRewardUsdt" label="社区分享奖励" min-width="220" show-overflow-tooltip>
                            <template #default="{ row }">
                                {{ formatUsdtAndToken(row.communityShareRewardUsdt, row.communityShareRewardToken) }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="communityRoleRewardUsdt" label="社区角色奖励" min-width="220" show-overflow-tooltip>
                            <template #default="{ row }">
                                {{ formatUsdtAndToken(row.communityRoleRewardUsdt, row.communityRoleRewardToken) }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="withdrawableUsdt" label="生态财库" min-width="220" show-overflow-tooltip>
                            <template #default="{ row }">
                                {{ formatUsdtAndToken(row.withdrawableUsdt, row.withdrawableToken) }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="subordinateReferrals" label="下级贡献者人数" min-width="140" show-overflow-tooltip />
                        <el-table-column prop="smallZonePerformance" label="小区业绩" min-width="160" show-overflow-tooltip>
                            <template #default="{ row }">
                                {{ formatUsdt(row.smallZonePerformance) }}
                            </template>
                        </el-table-column>
                        <el-table-column label="社区角色" min-width="150">
                            <template #default="{ row, $index }">
                                <el-button link type="primary" @click="showCommunityRoleDialog($index, row)" size="small">
                                    {{ row.communityRoleDisplayName || '无等级' }}
                                </el-button>
                            </template>
                        </el-table-column>
                        <el-table-column prop="isCollaboratorNode" label="是否共谋者节点" min-width="150" show-overflow-tooltip>
                            <template #default="{ row }">
                                <el-tag :type="row.isCollaboratorNode ? 'success' : 'info'">
                                    {{ row.isCollaboratorNode ? '是' : '否' }}
                                </el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column label="Z资产包额度" min-width="150">
                            <template #default="{ row, $index }">
                                <el-button link type="primary" @click="showZAssetPackageDialog($index, row)" size="small">
                                    {{ formatUsdt(row.userModelling?.zAssetPackageAmount) }}
                                </el-button>
                            </template>
                        </el-table-column>
                        <el-table-column label="资产包额度" min-width="150">
                            <template #default="{ row, $index }">
                                <el-button link type="primary" @click="showAssetPackageDialog($index, row)" size="small">
                                    {{ formatUsdt(row.userModelling?.assetPackageAmount) }}
                                </el-button>
                            </template>
                        </el-table-column>
                        <el-table-column prop="status" label="用户状态" min-width="160" show-overflow-tooltip />
                        <el-table-column prop="userModelling.updatedAt" label="更新时间" min-width="180" show-overflow-tooltip>
                            <template #default="{ row }">
                                {{ formatDateTime(row.userModelling?.updatedAt) }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="userModelling.createdAt" label="创建时间" min-width="180" show-overflow-tooltip>
                            <template #default="{ row }">
                                {{ formatDateTime(row.userModelling?.createdAt) }}
                            </template>
                        </el-table-column>
                        <el-table-column fixed="right" label="操作" min-width="260">
                            <template #default="scope">
                                <el-button link type="primary" @click="showDialog(scope.$index, scope.row)"
                                    size="small">查看经济模型树</el-button>
                                <el-button link type="primary" v-if="!scope.row.isCollaboratorNode"
                                    @click="showAddCollaboratorNodeDialog(scope.$index, scope.row)" size="small">添加共谋者节点</el-button>
                                <el-button link type="danger" v-if="scope.row.isCollaboratorNode"
                                    @click="showRemoveCollaboratorNodeDialog(scope.$index, scope.row)" size="small">解除共谋者节点</el-button>
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
        <div class="checktree">
            <el-dialog v-model="dialogVisible" title="查看经济模型树" top="0" width="100%" :before-close="beforeClose"
                destroy-on-close>
                <div class="diaContent" v-if="modelTreeData">
                    <vue3-org-chart :data="modelTreeData">
                        <template #node="{ item, children, open, toggleChildren }">
                            <div class="contentBox" :class="{ 'active': open, 'passive': !open }">
                                <div class="item">
                                    <div class="label">用户id：</div>
                                    <div class="value">{{ item.id }}</div>
                                </div>
                                <div class="item">
                                    <div class="label">用户名：</div>
                                    <div class="value">{{ item.username }}</div>
                                </div>
                                <div class="item" v-if="item.parentId">
                                    <div class="label">上级id：</div>
                                    <div class="value">{{ item.parentId }}</div>
                                </div>
                                <div class="item">
                                    <div class="label">推荐码：</div>
                                    <div class="value">{{ item.referralCode }}</div>
                                </div>
                                <div class="item">
                                    <div class="label">角色：</div>
                                    <div class="value">{{ item.teamRole }}</div>
                                </div>
                                <div class="item">
                                    <div class="label">用户等级：</div>
                                    <div class="value">{{ item.userLevel }}</div>
                                </div>
                                <div class="item">
                                    <div class="label">直推人数：</div>
                                    <div class="value">{{ item.directReferrals }}</div>
                                </div>
                                <div class="item">
                                    <div class="label">充值金额：</div>
                                    <div class="value">{{ item?.userModelling?.realDepositAmount }}</div>
                                </div>
                                <div class="item">
                                    <div class="label">可提现金额：</div>
                                    <div class="value">{{ item?.userModelling?.withdrawableUsdt }}</div>
                                </div>

                            </div>
                            <div class="btnBox">
                                <button v-if="children.length" @click="toggleChildren"> {{ open ? '-' : '+' }}</button>
                            </div>
                            <!-- Node Element / TEMPLATE END -->
                        </template>
                    </vue3-org-chart>
                </div>
            </el-dialog>
        </div>
        <!-- 资产包详情弹框 -->
        <el-dialog v-model="assetPackageDialog" title="资产包详情" width="600" :before-close="beforeCloseAssetPackage" destroy-on-close>
            <div class="asset-package-content" v-if="currentAssetPackageRow">
                <el-descriptions :column="1" border>
                    <el-descriptions-item label="用户ID">{{ currentAssetPackageRow.userModelling?.userId }}</el-descriptions-item>
                    <el-descriptions-item label="用户名">{{ currentAssetPackageRow.username }}</el-descriptions-item>
                    <el-descriptions-item label="资产包额度">
                        {{ formatUsdt(currentAssetPackageRow.userModelling?.assetPackageAmount) }} USDT
                    </el-descriptions-item>
                    <el-descriptions-item label="已使用额度">
                        {{ formatUsdt(currentAssetPackageRow.userModelling?.assetPackageUsed) }} USDT
                    </el-descriptions-item>
                    <el-descriptions-item label="可用额度">
                        <span style="color: #67C23A; font-weight: bold;">
                            {{ formatUsdt(
                                (currentAssetPackageRow.userModelling?.assetPackageAmount || 0) - 
                                (currentAssetPackageRow.userModelling?.assetPackageUsed || 0)
                            ) }} USDT
                        </span>
                    </el-descriptions-item>
                </el-descriptions>
                <el-divider content-position="left">更新额度</el-divider>
                <el-form :model="assetPackageForm" label-width="100px" class="asset-package-form">
                    <el-form-item label="新额度">
                        <el-input-number 
                            v-model="assetPackageForm.assetPackageAmount" 
                            :precision="2" 
                            :step="100" 
                            :min="0"
                            style="width: 300px"
                            placeholder="请输入新的资产包额度" />
                        <span style="margin-left: 10px; color: #909399; font-size: 14px;">USDT</span>
                    </el-form-item>
                </el-form>
            </div>
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="beforeCloseAssetPackage">取消</el-button>
                    <el-button type="primary" @click="updateAssetPackageConfirm">
                        更新额度
                    </el-button>
                </div>
            </template>
        </el-dialog>
        <!-- Z资产包详情弹框 -->
        <el-dialog v-model="zAssetPackageDialog" title="Z资产包详情" width="600" :before-close="beforeCloseZAssetPackage" destroy-on-close>
            <div class="z-asset-package-content" v-if="currentZAssetPackageRow">
                <el-descriptions :column="1" border>
                    <el-descriptions-item label="用户ID">{{ currentZAssetPackageRow.userModelling?.userId }}</el-descriptions-item>
                    <el-descriptions-item label="用户名">{{ currentZAssetPackageRow.username }}</el-descriptions-item>
                    <el-descriptions-item label="Z资产包额度">
                        {{ formatUsdt(currentZAssetPackageRow.userModelling?.zAssetPackageAmount) }} USDT
                    </el-descriptions-item>
                    <el-descriptions-item label="已释放额度">
                        {{ formatUsdt(currentZAssetPackageRow.userModelling?.zAssetPackageReleased) }} USDT
                    </el-descriptions-item>
                    <el-descriptions-item label="已使用额度">
                        {{ formatUsdt(currentZAssetPackageRow.userModelling?.zAssetPackageUsed) }} USDT
                    </el-descriptions-item>
                    <el-descriptions-item label="可用额度">
                        <span style="color: #67C23A; font-weight: bold;">
                            {{ formatUsdt(
                                (currentZAssetPackageRow.userModelling?.zAssetPackageReleased || 0) - 
                                (currentZAssetPackageRow.userModelling?.zAssetPackageUsed || 0)
                            ) }} USDT
                        </span>
                    </el-descriptions-item>
                </el-descriptions>
                <el-divider content-position="left">更新额度</el-divider>
                <el-form :model="zAssetPackageForm" label-width="100px" class="z-asset-package-form">
                    <el-form-item label="新额度">
                        <el-input-number 
                            v-model="zAssetPackageForm.zAssetPackageAmount" 
                            :precision="2" 
                            :step="100" 
                            :min="0"
                            style="width: 300px"
                            placeholder="请输入新的Z资产包额度" />
                        <span style="margin-left: 10px; color: #909399; font-size: 14px;">USDT</span>
                    </el-form-item>
                </el-form>
            </div>
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="beforeCloseZAssetPackage">取消</el-button>
                    <el-button type="primary" @click="updateZAssetPackageConfirm">
                        更新额度
                    </el-button>
                </div>
            </template>
        </el-dialog>
        
        <!-- 添加共谋者节点确认对话框 -->
        <el-dialog v-model="addCollaboratorNodeDialogVisible" title="添加共谋者节点" width="500" destroy-on-close>
            <div v-if="currentAddCollaboratorNodeRow" class="add-collaborator-node-content">
                <el-alert
                    title="确认操作"
                    type="warning"
                    :closable="false"
                    show-icon>
                    <template #default>
                        <p>确定要给用户 <strong>{{ currentAddCollaboratorNodeRow.username }}</strong> (ID: {{ currentAddCollaboratorNodeRow.userModelling?.userId }}) 添加"共谋者节点"角色吗？</p>
                    </template>
                </el-alert>
            </div>
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="cancelAddCollaboratorNode">取消</el-button>
                    <el-button type="primary" @click="confirmAddCollaboratorNode">确定</el-button>
                </div>
            </template>
        </el-dialog>

        <!-- 解除共谋者节点确认对话框 -->
        <el-dialog v-model="removeCollaboratorNodeDialogVisible" title="解除共谋者节点" width="500" destroy-on-close>
            <div v-if="currentRemoveCollaboratorNodeRow" class="remove-collaborator-node-content">
                <el-alert
                    title="确认操作"
                    type="warning"
                    :closable="false"
                    show-icon>
                    <template #default>
                        <p>确定要解除用户 <strong>{{ currentRemoveCollaboratorNodeRow.username }}</strong> (ID: {{ currentRemoveCollaboratorNodeRow.userModelling?.userId }}) 的"共谋者节点"角色吗？</p>
                    </template>
                </el-alert>
            </div>
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="cancelRemoveCollaboratorNode">取消</el-button>
                    <el-button type="danger" @click="confirmRemoveCollaboratorNode">确定解除</el-button>
                </div>
            </template>
        </el-dialog>

        <!-- 修改社区角色对话框 -->
        <el-dialog v-model="communityRoleDialogVisible" title="修改社区角色" width="600" :before-close="beforeCloseCommunityRole" destroy-on-close>
            <div class="community-role-content" v-if="currentCommunityRoleRow">
                <el-descriptions :column="1" border>
                    <el-descriptions-item label="用户ID">{{ currentCommunityRoleRow.userModelling?.userId }}</el-descriptions-item>
                    <el-descriptions-item label="用户名">{{ currentCommunityRoleRow.username }}</el-descriptions-item>
                    <el-descriptions-item label="当前社区角色">
                        {{ currentCommunityRoleRow.communityRoleDisplayName || '无等级' }}
                    </el-descriptions-item>
                </el-descriptions>
                <el-divider content-position="left">选择新角色</el-divider>
                <el-form :model="communityRoleForm" label-width="120px" class="community-role-form">
                    <el-form-item label="社区角色">
                        <el-select 
                            v-model="communityRoleForm.communityRoleLevel" 
                            placeholder="请选择社区角色"
                            style="width: 100%">
                            <el-option 
                                v-for="role in communityRoleOptions" 
                                :key="role.value" 
                                :label="role.label" 
                                :value="role.value" />
                        </el-select>
                    </el-form-item>
                </el-form>
            </div>
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="beforeCloseCommunityRole">取消</el-button>
                    <el-button type="primary" @click="updateCommunityRoleConfirm">
                        确定修改
                    </el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>
<script setup>
import { ElMessage } from 'element-plus'
import {
    _SessionCache
} from '@/utils/cache'
import { reactive, ref, inject } from 'vue'
import { useRouter } from 'vue-router'
import { _FormatDate } from '@/utils/commonFn'
import { formatCrypto } from '@/utils/format'
import { handleApiError } from '@/utils/request'
const router = useRouter()
const tableData = ref()
const tableLoading = ref(false)
const formValue = reactive({
    userId: "",
    email: "",
    username: ""
})
const statius = reactive({
    'NORMAL': "布道大使",
    'TEAM_LEADER': "布道公会长",
    'CITY_PARTNER': "节点共谋人",
    'REGIONAL_PARTNER': "区域共建者"
})
const _Api = inject('$api')
const pageSize = ref(8)
const currentPage = ref(1)
const getTableData = async (page) => {
    tableLoading.value = true
    try {
        const res = await _Api._userList({
            pageNo: page,
            pageSize: pageSize.value,
            ...formValue
        })
        if (res) {
            tableData.value = res
        }
    } catch (error) {
        handleApiError(error, '查询失败')
    } finally {
        tableLoading.value = false
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
    formValue.userId = ""
    formValue.email = ""
    formValue.username = ""
    currentPage.value = 1
    getTableData(currentPage.value)
}
const dialogVisible = ref(false)
const modelTreeData = ref(null)
//关闭前回调
const beforeClose = () => {
    dialogVisible.value = false
    modelTreeData.value = null
}
const handConfirm = async () => {
    // const res = await _Api._depositUpdate({
    //     depositId: rowData.value.id,
    //     status: radio1.value
    // })
    // if (res) {
    //     dialogVisible.value = false;
    //     ElMessage('修改成功')
    //     getTableData(currentPage.value)
    // }
}
const showDialog = (index, row) => {
    const userId = row?.userModelling?.userId
    if (!userId) {
        ElMessage.error('用户ID不存在')
        return
    }

    // 生成新标签页的URL
    const routeData = router.resolve({
        name: 'modelTree',
        params: { userId: userId }
    })
    
    // 直接打开新标签页，让新标签页自己去调用接口
    const newWindow = window.open(routeData.href, '_blank')
    
    // 如果新窗口被阻止，提示用户
    if (!newWindow) {
        ElMessage.warning('请允许弹出窗口以查看经济模型树')
    }
}
// 资产包相关
const assetPackageDialog = ref(false)
const currentAssetPackageRow = ref(null)
const assetPackageForm = reactive({
    assetPackageAmount: 0
})

const showAssetPackageDialog = (index, row) => {
    currentAssetPackageRow.value = row
    assetPackageForm.assetPackageAmount = row.userModelling?.assetPackageAmount || 0
    assetPackageDialog.value = true
}

const beforeCloseAssetPackage = () => {
    assetPackageDialog.value = false
    currentAssetPackageRow.value = null
    assetPackageForm.assetPackageAmount = 0
}

const updateAssetPackageConfirm = async () => {
    if (!currentAssetPackageRow.value) {
        return
    }
    if (assetPackageForm.assetPackageAmount < 0) {
        ElMessage.warning('资产包额度不能为负数')
        return
    }
    // 验证新额度不能低于已使用额度
    const usedAmount = currentAssetPackageRow.value.userModelling?.assetPackageUsed || 0
    if (assetPackageForm.assetPackageAmount < usedAmount) {
        ElMessage.warning(`资产包额度不能低于已使用额度，当前已使用: ${formatUsdt(usedAmount)} USDT`)
        return
    }
    try {
        const res = await _Api._updateAssetPackage({
            userId: currentAssetPackageRow.value.userModelling?.userId,
            assetPackageAmount: assetPackageForm.assetPackageAmount
        })
        if (res) {
            ElMessage.success('更新成功')
            beforeCloseAssetPackage()
            getTableData(currentPage.value)
        }
    } catch (error) {
        handleApiError(error, '更新失败')
    }
}

// Z资产包相关
const zAssetPackageDialog = ref(false)
const currentZAssetPackageRow = ref(null)
const zAssetPackageForm = reactive({
    zAssetPackageAmount: 0
})

const showZAssetPackageDialog = (index, row) => {
    currentZAssetPackageRow.value = row
    zAssetPackageForm.zAssetPackageAmount = row.userModelling?.zAssetPackageAmount || 0
    zAssetPackageDialog.value = true
}

const beforeCloseZAssetPackage = () => {
    zAssetPackageDialog.value = false
    currentZAssetPackageRow.value = null
    zAssetPackageForm.zAssetPackageAmount = 0
}

const updateZAssetPackageConfirm = async () => {
    if (!currentZAssetPackageRow.value) {
        return
    }
    try {
        const res = await _Api._updateZAssetPackage({
            userId: currentZAssetPackageRow.value.userModelling?.userId,
            zAssetPackageAmount: zAssetPackageForm.zAssetPackageAmount
        })
        if (res) {
            ElMessage.success('更新成功')
            beforeCloseZAssetPackage()
            getTableData(currentPage.value)
        }
    } catch (error) {
        handleApiError(error, '更新失败')
    }
}

// 添加共谋者节点相关
const addCollaboratorNodeDialogVisible = ref(false)
const currentAddCollaboratorNodeRow = ref(null)

const showAddCollaboratorNodeDialog = (index, row) => {
    currentAddCollaboratorNodeRow.value = row
    addCollaboratorNodeDialogVisible.value = true
}

const confirmAddCollaboratorNode = async () => {
    if (!currentAddCollaboratorNodeRow.value) {
        return
    }
    try {
        const res = await _Api._addCollaboratorNodeRole({
            userId: currentAddCollaboratorNodeRow.value.userModelling?.userId
        })
        if (res) {
            ElMessage.success('添加成功')
            addCollaboratorNodeDialogVisible.value = false
            currentAddCollaboratorNodeRow.value = null
            getTableData(currentPage.value)
        }
    } catch (error) {
        handleApiError(error, '添加失败')
    }
}

const cancelAddCollaboratorNode = () => {
    addCollaboratorNodeDialogVisible.value = false
    currentAddCollaboratorNodeRow.value = null
}

// 解除共谋者节点相关
const removeCollaboratorNodeDialogVisible = ref(false)
const currentRemoveCollaboratorNodeRow = ref(null)

const showRemoveCollaboratorNodeDialog = (index, row) => {
    currentRemoveCollaboratorNodeRow.value = row
    removeCollaboratorNodeDialogVisible.value = true
}

const confirmRemoveCollaboratorNode = async () => {
    if (!currentRemoveCollaboratorNodeRow.value) {
        return
    }
    try {
        const res = await _Api._removeCollaboratorNodeRole({
            userId: currentRemoveCollaboratorNodeRow.value.userModelling?.userId
        })
        if (res) {
            ElMessage.success('解除成功')
            removeCollaboratorNodeDialogVisible.value = false
            currentRemoveCollaboratorNodeRow.value = null
            getTableData(currentPage.value)
        }
    } catch (error) {
        handleApiError(error, '解除失败')
    }
}

const cancelRemoveCollaboratorNode = () => {
    removeCollaboratorNodeDialogVisible.value = false
    currentRemoveCollaboratorNodeRow.value = null
}

// 社区角色相关
const communityRoleDialogVisible = ref(false)
const currentCommunityRoleRow = ref(null)
const communityRoleForm = reactive({
    communityRoleLevel: ''
})

// 社区角色选项列表
const communityRoleOptions = [
    { label: '无等级', value: 'NONE' },
    { label: 'V1社区贡献者', value: 'V1_CONTRIBUTOR' },
    { label: 'V2社区贡献者', value: 'V2_CONTRIBUTOR' },
    { label: 'V3社区贡献者', value: 'V3_CONTRIBUTOR' },
    { label: '社区大使长', value: 'AMBASSADOR' },
    { label: '社区公会长', value: 'GUILD_LEADER' },
    { label: '节点共谋人', value: 'NODE_CONSPIRATOR' },
    { label: '社区运营中心', value: 'OPERATION_CENTER' },
    { label: '社区合伙人', value: 'PARTNER' }
]

const showCommunityRoleDialog = (index, row) => {
    currentCommunityRoleRow.value = row
    // 设置当前选中的角色（如果有）
    communityRoleForm.communityRoleLevel = row.communityRoleLevel || 'NONE'
    communityRoleDialogVisible.value = true
}

const beforeCloseCommunityRole = () => {
    communityRoleDialogVisible.value = false
    currentCommunityRoleRow.value = null
    communityRoleForm.communityRoleLevel = ''
}

const updateCommunityRoleConfirm = async () => {
    if (!currentCommunityRoleRow.value) {
        return
    }
    if (!communityRoleForm.communityRoleLevel) {
        ElMessage.warning('请选择社区角色')
        return
    }
    try {
        const res = await _Api._updateCommunityRoleLevel({
            userId: currentCommunityRoleRow.value.userModelling?.userId,
            communityRoleLevel: communityRoleForm.communityRoleLevel
        })
        if (res) {
            ElMessage.success('更新成功')
            beforeCloseCommunityRole()
            getTableData(currentPage.value)
        }
    } catch (error) {
        handleApiError(error, '更新失败')
    }
}

// 统一金额格式化（保留至少两位，最多八位，带千分位）
const formatUsdt = (value) => formatCrypto(value)

// 格式化USDT和VEILX显示（格式：xxx USDT + xxx VEILX）
const formatUsdtAndToken = (usdtValue, tokenValue) => {
    const usdt = formatCrypto(usdtValue)
    const token = formatCrypto(tokenValue)
    const parts = []
    if (usdt !== '0.00' || token === '0.00') {
        parts.push(`${usdt} USDT`)
    }
    if (token !== '0.00') {
        parts.push(`${token} VEILX`)
    }
    if (parts.length === 0) {
        return '0.00 USDT'
    }
    return parts.join(' + ')
}

// 格式化日期时间为 yyyy-MM-dd HH:mm:ss（使用已有的工具方法）
const formatDateTime = (dateStr) => {
    if (!dateStr) return '-'
    // _FormatDate 使用小写 h 表示小时，但输出格式为 24 小时制（0-23）
    const formatted = _FormatDate(dateStr, 'yyyy-MM-dd hh:mm:ss')
    return formatted || '-'
}
</script>
<style lang="scss" scoped>
.batchUpload {
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

    .checktree {
        :deep() {
            .el-dialog {
                width: 100%;
                height: 100%;
            }

            .el-dialog__body {
                height: 100%;
            }

            .el-dialog__headerbtn {
                font-size: 28px;
                font-weight: bold;
            }

            .vue3-org-chart {
                height: 100%;
            }

            .vue3-org-chart .vue3-org-chart-container {
                height: 100%;
            }

        }
    }

    .diaContent {
        height: 100%;

        .contentBox {
            display: flex;
            align-items: center;
            width: 500px;
            height: 200px;
            flex-wrap: wrap;
            padding: 20px;
            border-radius: 10px;
            border: 1px solid #e2e8f0;

            .item {
                display: flex;
                align-items: center;
                width: 33.33%;

                .label {
                    flex-shrink: 0;
                }

                .value {
                    flex-shrink: 0;
                }
            }
        }

        .btnBox {
            display: flex;
            justify-content: center;

            button {
                width: 30px;
                height: 30px;
                font-size: 36px;
                display: flex;
                justify-content: center;
                align-items: center;
                border: 1px solid #ccc;
                line-height: 28px;
                text-align: center;
            }
        }
    }

    .contentBox.active {
        border-color: rgb(165 180 252);
        background-color: rgb(224 231 255);
    }

    .contentBox.passive {
        background-color: rgb(248 250 252)
    }

    .z-asset-package-content {
        .z-asset-package-form {
            margin-top: 10px;
        }
    }

    .asset-package-content {
        .asset-package-form {
            margin-top: 10px;
        }
    }
}
</style>