<template>
    <div class="batchUpload">
        <div class="filter">
            <el-form :inline="true" :model="formValue" class="demo-form-inline">
                <el-form-item label="节点id">
                    <el-input v-model="formValue.bizNodeId" placeholder="请输入节点id" clearable />
                </el-form-item>
                <el-form-item label="节点名称">
                    <el-input v-model="formValue.nodeName" placeholder="请输入节点名称" clearable />
                </el-form-item>
                <el-form-item label="节点类型">
                    <el-select v-model="formValue.type" placeholder="请选择节点类型" style="width: 240px">
                        <el-option v-for="item in levelList" :key="item.value" :label="item.displayName"
                            :value="item.level" />
                    </el-select>
                </el-form-item>
                <el-form-item label="节点编码">
                    <el-input v-model="formValue.nodeCode" placeholder="请输入节点编码" clearable />
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="onSearch">搜索</el-button>
                </el-form-item>
            </el-form>
        </div>
        <div class="uploadList">
            <div class="taskUploadList">
                <div class="title">
                    <span>节点管理列表</span>
                </div>
                <div class="list">
                    <el-table :data="tableData?.records" border style="width: 100%" height="100%">
                        <el-table-column prop="id" label="id" width="50" />
                        <el-table-column prop="nodeName" label="节点" width="160" />
                        <el-table-column prop="typeName" label="节点类型" width="150" />
                        <el-table-column prop="nodeCode" label="节点编码" width="150" />
                        <el-table-column prop="parentNodeName" label="上级节点" width="200" />
                        <el-table-column prop="leaderUserName" label="负责人" width="100" />
                        <el-table-column prop="leaderUserId" label="负责人id" width="100" />
                        <el-table-column prop="ratio" label="比例" width="60" >
                            <template #default="{ row }">
                                {{row.ratio}}%
                            </template>
                        </el-table-column>
                        <el-table-column prop="nodeAmount" label="节点总业绩" width="100" >
                            <template #default="{ row }">
                                {{row.nodeAmount}} U
                            </template>
                        </el-table-column>
                        <el-table-column prop="withdrawableUsdt"  label="可提激励基金" width="120" >
                            <template #default="{ row }">
                                {{row.withdrawableUsdt}} U
                            </template>
                        </el-table-column>
                        <el-table-column prop="freezeUsdt" label="冻结金额" width="90" >
                            <template #default="{ row }">
                                {{row.freezeUsdt}} U
                            </template>
                        </el-table-column>

<!--                        <el-table-column prop="statusName" label="状态" width="100" />-->
                        <el-table-column prop="createdAt" label="创建时间" width="200" />
                        <el-table-column prop="updatedAt"  label="更新时间" width="200" />
                        <el-table-column fixed="right" label="Operations" min-width="120">
                            <template #default="scope">
                                <el-button link type="primary" @click="removeNode(scope.$index, scope.row)"
                                    size="small">删除</el-button>
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
        <el-dialog v-model="dialogVisible" title="确定删除该节点吗" width="800" :before-close="beforeClose" destroy-on-close>
            <div class="diaContent">

            </div>
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="beforeClose">取消</el-button>
                    <el-button type="primary" @click="handConfirm">
                        确定删除
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
    bizNodeId: "",
    nodeName: "",
    type: "",
    nodeCode: "",
})
const creatFrom = reactive({
    nodeName: "",
    geoId: "",
    leaderUserId: "",
    parentNodeId: "",
})
const dialogVisible = ref(false)
const tableData = ref()
const rowData = ref('')
const showDialog = (index, row) => {
    dialogVisible.value = true;
}
const _Api = inject('$api')
const pageSize = ref(8)
const currentPage = ref(1)
const getTableData = async (page) => {
    const res = await _Api._NodePage({
        pageNo: page,
        pageSize: pageSize.value,
        isIncludeNodeModelling:true,
        ...formValue
    })
    if (res) {
        tableData.value = res
    }
}
getTableData(currentPage.value)
const levelList = ref([])
const getLevel = async () => {
    const res = await _Api._GeoRegionGeoType({
    })
    if (res) {
        levelList.value = res
    }
}
getLevel()
const selectRow=ref({})
const removeNode = async (index, row) => {
    dialogVisible.value = true
    selectRow.value=row
}
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


const handConfirm = async () => {
    const res = await _Api._NodeRemoveBizNode({
        bizNodeId: selectRow.value.id
    })
    if (res) {
        ElMessage('删除成功')
        beforeClose()
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