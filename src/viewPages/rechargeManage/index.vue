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
                <el-form-item label="交易哈希">
                    <el-input v-model="formValue.fromAddr" placeholder="请输入交易哈希" clearable />
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="onSearch">搜索</el-button>
                </el-form-item>
            </el-form>
        </div>
        <div class="uploadList">
            <div class="taskUploadList">
                <div class="title">
                    <span>充值管理列表</span>
                </div>
                <div class="list">
                    <el-table :data="tableData?.records" border style="width: 100%" height="100%">
                        <el-table-column prop="id" label="id" width="50" />
                        <el-table-column prop="userId" label="用户id" width="80" />
                        <el-table-column prop="username" label="用户名" width="100" />
                        <el-table-column prop="role" label="角色" width="100" />
                        <el-table-column prop="userStatus" label="用户状态" width="100" />
                        <el-table-column prop="email" label="邮箱" width="150" />
                        <el-table-column prop="amount" label="充值金额" width="100" />
                        <el-table-column prop="currency" label="充值币种" width="100" />
                        <el-table-column prop="periodDays" label="质押周期" width="100">
                            <template #default="{ row }">
                                {{ row.periodDays ? row.periodDays + '天' : '-' }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="fromAddr" label="交易哈希" width="300" />
                        <el-table-column prop="status" label="状态" width="100">
                            <template #default="{ row }">
                                {{ statius[row.status] }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="createdAt" label="创建时间" width="200" />
                        <el-table-column prop="updatedAt" label="更新时间" width="200" />
                        <el-table-column fixed="right" label="Operations" min-width="120">
                            <template #default="scope">
                                <el-button link type="primary" @click="showDialog(scope.$index, scope.row)"
                                    size="small">修改充值状态</el-button>
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
                <el-form :model="dialogForm" label-width="120px">
                    <el-form-item label="状态">
                        <el-radio-group v-model="radio1">
                            <el-radio value="PENDING" size="large">待处理</el-radio>
                            <el-radio value="COMPLETED" size="large">已完成</el-radio>
                            <el-radio value="FAILED" size="large">失败</el-radio>
                        </el-radio-group>
                    </el-form-item>
                </el-form>
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
    fromAddr: "",
    username: "",
})
const dialogVisible = ref(false)
const tableData = ref()
const rowData = ref('')
const dialogForm = reactive({})
const showDialog = (index, row) => {
    dialogVisible.value = true;
    rowData.value = row
    radio1.value = rowData.value?.status
}
const _Api = inject('$api')
const pageSize = ref(8)
const currentPage = ref(1)
const getTableData = async (page) => {
    const res = await _Api._depositList({
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
const statius = reactive({
    'PENDING': "待处理",
    'COMPLETED': "已完成",
    'FAILED': "失败",
})
const radio1 = ref('')
const handConfirm = async () => {
    const updateData = {
        depositId: rowData.value.id,
        status: radio1.value
    }
    // 不再传递 periodDays，后端会从 user_deposits 表中读取已保存的周期
    const res = await _Api._depositUpdate(updateData)
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
}
</style>