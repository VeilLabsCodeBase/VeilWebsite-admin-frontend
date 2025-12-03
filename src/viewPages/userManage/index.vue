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
                <el-form-item label="手机号码">
                    <el-input v-model="formValue.phoneNumber" placeholder="请输入手机号码" clearable />
                </el-form-item>
                <el-form-item label="是否已绑定">
                    <el-select v-model="formValue.isBindNode" placeholder="请选择" style="width: 240px">
                        <el-option v-for="item in isBindNodeList" :key="item.value" :label="item.label"
                            :value="item.value" />
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
                    <span>用户管理列表</span>
                </div>
                <div class="list">
                    <el-table :data="tableData?.records" border style="width: 100%" height="100%" v-loading="tableLoading" element-loading-text="加载中...">
                        <el-table-column prop="userModelling.id" label="id" />
                        <el-table-column prop="userModelling.userId" label="用户id" />
                        <el-table-column prop="username" label="用户名" width="180" />
                        <el-table-column prop="role" label="用户角色" width="180" />
                        <el-table-column prop="referredUserId" label="推荐人Id" />
                        <el-table-column prop="email" label="email" width="180" />
                        <el-table-column label="手机号码" width="180">
                            <template #default="{ row }">
                                {{ row.countryCode ? row.countryCode + ' ' + row.phoneNumber : row.phoneNumber || '-' }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="opCenterName" label="运营中心" width="200" />
                        <el-table-column prop="workshopName" label="节点" width="180" />
                        <el-table-column prop="userModelling.realDepositAmount" label="用户真实充值金额" width="200" />
                        <el-table-column prop="stakingRewardUsdt" label="质押收益" width="250">
                            <template #default="{ row }">
                                {{ formatUsdtAndToken(row.stakingRewardUsdt, row.stakingRewardToken) }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="communityShareRewardUsdt" label="社区分享奖励" width="250">
                            <template #default="{ row }">
                                {{ formatUsdtAndToken(row.communityShareRewardUsdt, row.communityShareRewardToken) }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="communityRoleRewardUsdt" label="社区角色奖励" width="250">
                            <template #default="{ row }">
                                {{ formatUsdtAndToken(row.communityRoleRewardUsdt, row.communityRoleRewardToken) }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="withdrawableUsdt" label="生态财库" width="250">
                            <template #default="{ row }">
                                {{ formatUsdtAndToken(row.withdrawableUsdt, row.withdrawableToken) }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="subordinateReferrals" label="下级贡献者人数" width="150" />
                        <el-table-column prop="smallZonePerformance" label="小区业绩" width="150">
                            <template #default="{ row }">
                                {{ formatUsdt(row.smallZonePerformance) }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="communityRoleDisplayName" label="社区角色" width="150" />
                        <el-table-column label="Z资产包额度" width="150">
                            <template #default="{ row, $index }">
                                <el-button link type="primary" @click="showZAssetPackageDialog($index, row)" size="small">
                                    {{ formatUsdt(row.userModelling?.zAssetPackageAmount) }}
                                </el-button>
                            </template>
                        </el-table-column>
                        <el-table-column prop="status" label="用户状态" width="180" />
                        <el-table-column prop="userModelling.updatedAt" label="更新时间" width="200">
                            <template #default="{ row }">
                                {{ formatDateTime(row.userModelling?.updatedAt) }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="userModelling.createdAt" label="创建时间" width="200">
                            <template #default="{ row }">
                                {{ formatDateTime(row.userModelling?.createdAt) }}
                            </template>
                        </el-table-column>
                        <el-table-column fixed="right" label="操作" min-width="250">
                            <template #default="scope">
                                <el-button link type="primary" v-if="!scope.row.isBindNode"
                                    @click="showBindDialog(scope.$index, scope.row)" size="small">绑定节点</el-button>
                                <el-button link type="primary" @click="showDialog(scope.$index, scope.row)"
                                    size="small">查看经济模型树</el-button>
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
        <el-dialog v-model="bindNodeDialog" title="绑定节点" width="800" :before-close="beforeClose" destroy-on-close>
            <div class="diaContent">
                <el-form-item label="运营中心">
                    <el-select v-model="nodeValue1" placeholder="请选择" @change="changeNodeValue1">
                        <el-option v-for="item in nodeList" :key="item.value" :label="item.nodeName" :value="item.id" />
                    </el-select>
                </el-form-item>
                <el-form-item label="工作室" v-if="nodeValue1">
                    <el-select v-model="nodeValue2" placeholder="请选择">
                        <el-option v-for="item in nodeTwoList" :key="item.value" :label="item.nodeName"
                            :value="item.id" />
                    </el-select>
                </el-form-item>
            </div>
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="beforeClose">取消</el-button>
                    <el-button type="primary" @click="bindNodeConfirm">
                        确定绑定
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
    </div>
</template>
<script setup>
import { ElMessage } from 'element-plus'
import {
    _SessionCache
} from '@/utils/cache'
import { reactive, ref, inject } from 'vue'
import { _FormatDate } from '@/utils/commonFn'
const tableData = ref()
const tableLoading = ref(false)
const formValue = reactive({
    userId: "",
    email: "",
    username: "",
    isBindNode: "",
    phoneNumber: "",
})
const statius = reactive({
    'NORMAL': "布道大使",
    'TEAM_LEADER': "布道公会长",
    'CITY_PARTNER': "节点共谋人",
    'REGIONAL_PARTNER': "区域共建者"
})
const isBindNodeList=reactive([{label:'全部',value:''},{label:'是',value:true},{label:'否',value:false},])
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
        ElMessage.error('查询失败: ' + (error.message || '未知错误'))
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
const dialogVisible = ref(false)
const bindNodeDialog = ref(false)
//关闭前回调
const beforeClose = () => {
    dialogVisible.value = false
    bindNodeDialog.value = false
    modelTreeData.value = ''
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
    dialogVisible.value = true;
    // rowData.value = row
    // radio1.value = rowData.value?.status
    getUserModellingTree(row?.userModelling?.userId)
}

const modelTreeData = ref('')
const getUserModellingTree = async (userId) => {
    const res = await _Api._UserModellingTree({
        userId: userId,
    })
    if (res) {
        modelTreeData.value = res

    }
}
const selectUserId = ref('')

const showBindDialog = (index, row) => {
    bindNodeDialog.value = true
    selectUserId.value = row.userModelling.userId
}
const nodeValue1 = ref('')
const nodeValue2 = ref('')
//获取节点列表
const nodeList = ref([])
const getNodeList = async () => {
    const response = await _Api._NodePage({
        pageNo: 1,
        pageSize: 1000000,
        type: 'LEVEL_ONE_OP_CENTER'
    });
    nodeList.value = response.records

}
getNodeList()
//获取二级节点列表
const nodeTwoList = ref([])
const getNodeTwoList = async (id) => {
    const response = await _Api._NodeList({
        pageNo: 1,
        pageSize: 10000,
        bizParentNodeId: nodeValue1.value
    });
    nodeTwoList.value = response

}
//第一级节点选择狂改变时
const changeNodeValue1 = () => {
    nodeValue2.value = ''
    getNodeTwoList()
}
const bindNodeConfirm = async () => {
    const response = await _Api._BindBizUserNode({
        userId: selectUserId.value,
        bizNodeId: nodeValue2.value,
    });
    ElMessage('绑定成功')
    bindNodeDialog.value = false
    currentPage.value = 1
    getTableData(currentPage.value)
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
        ElMessage.error('更新失败: ' + (error.message || '未知错误'))
    }
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

// 格式化USDT和VEILX显示（格式：xxx USDT + xxx VEILX）
const formatUsdtAndToken = (usdtValue, tokenValue) => {
    const usdt = formatUsdt(usdtValue)
    const token = formatUsdt(tokenValue) // 复用formatUsdt格式化token
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
}
</style>