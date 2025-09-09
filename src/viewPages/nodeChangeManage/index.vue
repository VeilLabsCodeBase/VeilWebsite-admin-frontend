<template>
    <div class="batchUpload">
        <div class="filter">
            <el-form :inline="true" :model="formValue" class="demo-form-inline">
                <el-form-item label="申请id">
                    <el-input v-model="formValue.requestId" placeholder="请输入申请id" clearable />
                </el-form-item>
                <el-form-item label="用户id">
                    <el-input v-model="formValue.userId" placeholder="请输入用户id" clearable />
                </el-form-item>
                <el-form-item label="状态">
                    <el-select v-model="formValue.status" placeholder="请选择状态" style="width: 240px">
                        <el-option v-for="item in statusList" :key="item.value" :label="item.label"
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
                    <span>节点转移申请列表</span>
                </div>
                <div class="list">
                    <el-table :data="tableData?.records" border style="width: 100%" height="100%">
                        <el-table-column prop="id" label="申请id" width="80"/>
                        <el-table-column prop="fromOpName" label="来源节点工作室" width="150"/>
                        <el-table-column prop="toOpName" label="转移运营中心" width="150"/>
                        <el-table-column prop="toWsName" label="转移节点工作室" width="150"/>

                        <el-table-column prop="statusName" label="状态" width="150" />
                        <el-table-column prop="userName" label="用户名" width="150"/>
                        <el-table-column prop="approveName" label="审批员用户名" width="150"/>
                        <el-table-column prop="reason" label="原因" width="200"/>
                        <el-table-column prop="approveId" label="审批人id" width="100"/>
                        <el-table-column prop="approvedAt" label="审批时间" width="200"/>
                        <el-table-column prop="createdAt" label="创建时间" width="200" />
                        <el-table-column fixed="right" label="Operations" width="200">
                            <template #default="scope">
                                <el-button link type="primary" @click="changeBind(scope.$index, scope.row)"
                                    size="small">更改申请转移用户绑定节点</el-button>
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
import { ElMessage } from 'element-plus'
import {
    _SessionCache
} from '@/utils/cache'
import { reactive } from 'vue'
const formValue = reactive({
    requestId: "",
    userId: "",
    status: "",
})
const statusList = reactive([{ label: '待审', value: 0 }, { label: '通过', value: 1 }, { label: '拒绝', value: 2 },])
const tableData = ref()
const _Api = inject('$api')
const pageSize = ref(8)
const currentPage = ref(1)
const getTableData = async (page) => {
    const res = await _Api._RequestPage({
        pageNo: page,
        pageSize: pageSize.value,
        ...formValue
    })
    if (res) {
        tableData.value = res
        console.log(tableData.value);
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

const changeBind = async (index, row) => {
    const res = await _Api._ChangeBizUserNode({
        requestId: row.id,
        status: row.status,
    })
    if (res) {
        ElMessage('更改成功')
        currentPage.value = 1
        getTableData()
    }
}


const onSearch = () => {
    currentPage.value = 1
    getTableData(currentPage.value)
}
</script>
<style lang="scss" scoped>
.batchUpload {
    // display: flex;
    // flex-direction: column;
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