<template>
    <div class="batchUpload">
        <div class="filter">
            <el-form :inline="true" :model="formValue" class="demo-form-inline">
                <el-form-item label="用户id">
                    <el-input v-model="formValue.userId" placeholder="请输入用户id" clearable />
                </el-form-item>
                <el-form-item label="用户名">
                    <el-input v-model="formValue.username" placeholder="请输入用户名" clearable />
                </el-form-item>
                <el-form-item label="提现地址">
                    <el-input v-model="formValue.address" placeholder="请输入提现地址" clearable />
                </el-form-item>
                <el-form-item label="邮箱">
                    <el-input v-model="formValue.email" placeholder="请输入邮箱" clearable />
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="onSearch">搜索</el-button>
                </el-form-item>
            </el-form>
        </div>
        <div class="uploadList">
            <div class="taskUploadList">
                <div class="title">
                    <span>提现管理列表</span>
                </div>
                <div class="list">
                    <el-table :data="tableData?.records" border style="width: 100%" height="100%">
                        <el-table-column prop="id" label="id" width="50" />
                        <el-table-column prop="userId" label="用户id" width="80" />
                        <el-table-column prop="username" label="用户名" width="100" />
                        <el-table-column prop="email" label="邮箱" width="150" />
                        <el-table-column prop="createdAt" label="申请时间" width="200" />
                        <el-table-column prop="amount" label="提现金额" width="100" />
                        <el-table-column prop="balanceBefore" label="提现前余额" width="100" />
                        <el-table-column prop="balanceAfter" label="提现后余额" width="100" />
                        <el-table-column prop="address" label="提现地址" width="300" />
                        <el-table-column prop="network" label="提现网络" width="100" />
                        <el-table-column prop="fee" label="手续费" width="100" />
                        <el-table-column prop="actualAmount" label="到账金额" width="100" />
                        <el-table-column prop="status" label="提现状态" width="100">
                            <template #default="{ row }">
                                {{ status[row.status] }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="reason" label="备注" width="200" />
                        <el-table-column prop="approvedAt" label="审核通过时间" width="200" />
                        <el-table-column fixed="right" label="Operations" min-width="120">
                            <template #default="scope">
                                <el-button link type="primary" @click="showDialog(scope.$index, scope.row)"
                                    size="small">审核</el-button>
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
        <el-dialog v-model="dialogVisible" title="修改状态" width="800" :before-close="beforeClose" destroy-on-close>
            <div class="diaContent">
                <el-radio-group v-model="radio1">
                    <el-radio value="APPROVAL" size="large">{{ status.APPROVAL }}</el-radio>
                    <el-radio value="FAILED" size="large">{{ status.FAILED }}</el-radio>
                    <el-radio value="SUCCESSFULLY" size="large">{{ status.SUCCESSFULLY }}</el-radio>
                    <el-radio value="CANCELED" size="large">{{ status.CANCELED }}</el-radio>
                </el-radio-group>

                <el-form-item label="理由">
                    <el-input v-model="reason" style="width: 440px" :rows="2" type="textarea"
                        placeholder="Please input" />
                </el-form-item>
            </div>
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="beforeClose">取消</el-button>
                    <el-button type="primary" @click="handConfirm">
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
import { reactive } from 'vue'
const formValue = reactive({
    userId: "",
    address: "",
    username: "",
    email: "",
})
const dialogVisible = ref(false)
const tableData = ref()
const rowData = ref('')
const showDialog = (index, row) => {
    dialogVisible.value = true;
    rowData.value = row
    radio1.value = rowData.value?.status
}
const _Api = inject('$api')
const pageSize = ref(10)
const currentPage = ref(1)
const getTableData = async (page) => {
    const res = await _Api._WithdrawList({
        pageNo: page,
        pageSize: pageSize.value,
        ...formValue
    })
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

//关闭前回调
const beforeClose = () => {
    dialogVisible.value = false
}
const status = reactive({
    APPROVAL: '待审核',
    FAILED: '失败',
    SUCCESSFULLY: '成功',
    CANCELED: '已取消',
})
const radio1 = ref('')
const reason = ref('')
const handConfirm = async () => {
    const res = await _Api._WithdrawAudit({
        userWithdrawId: rowData.value.id,
        status: radio1.value,
        description: reason.value
    })
    if (res) {
        dialogVisible.value = false;
        ElMessage('修改成功')
        getTableData(currentPage.value)
    }
}
const onSearch = () => {
    currentPage.value = 1
    getTableData(currentPage.value)
}
</script>
<style lang="scss" scoped>
.batchUpload {
    display: flex;
    flex-direction: column;
    height: 100%;

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
}
</style>