<template>
    <div class="batchUpload">
        <div class="filter">
            <el-form :inline="true" :model="formValue" class="demo-form-inline">
                <el-form-item label="运营中心">
                    <el-select v-model="formValue.opeValue" placeholder="请选择运营中心" style="width: 240px"
                        @change="changeNodeValue1">
                        <el-option v-for="item in levelList1" :key="item.value" :label="item.nodeName"
                            :value="item.id" />
                    </el-select>
                </el-form-item>
                <el-form-item label="节点工作室" v-if="formValue.opeValue">
                    <el-select v-model="formValue.workValue" placeholder="请选择节点工作室" style="width: 240px">
                        <el-option v-for="item in levelList2" :key="item.value" :label="item.nodeName"
                            :value="item.id" />
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
                    <span>节点绑定用户列表</span>
                </div>
                <div class="list">
                    <el-table :data="tableData?.records" border style="width: 100%" height="100%">
                        <el-table-column prop="id" label="节点id" />
                        <el-table-column prop="opCenterName" label="运营中心节点名称" />
                        <el-table-column prop="workshopName" label="节点工作室名称" />
                        <el-table-column prop="userId" label="用户ID" />

                        <el-table-column prop="lastChangeAt" label="变更时间" />
                        <el-table-column fixed="right" label="Operations">
                            <template #default="scope">
                                <el-button link type="primary" @click="removeBind(scope.$index, scope.row)"
                                    size="small">解除节点绑定</el-button>
                                <el-button link type="primary" @click="showChangeDialog(scope.$index, scope.row)"
                                    size="small">转移用户绑定节点</el-button>
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
        <el-dialog v-model="dialogVisible" title="转移用户绑定节点" width="800" :before-close="beforeClose" destroy-on-close>
            <div class="diaContent">
                <el-form :model="creatFrom" label-width="auto" style="max-width: 600px">
                    <el-form-item label="理由">
                        <el-input v-model="reason" type="textarea" placeholder="请输入理由" clearable />
                    </el-form-item>
                </el-form>
            </div>
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="beforeClose">取消</el-button>
                    <el-button type="primary" @click="handConfirm">
                        确定转移
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
    opeValue: "",
    workValue: "",
})

const dialogVisible = ref(false)
const tableData = ref()
const showDialog = (index, row) => {
    dialogVisible.value = true;
}
const _Api = inject('$api')
const pageSize = ref(8)
const currentPage = ref(1)
const getTableData = async (page) => {
    const res = await _Api._BindUserPage({
        pageNo: page,
        pageSize: pageSize.value,
        workShopId: formValue.workValue
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
const levelList1 = ref([])
const getLevel1 = async () => {
    const res = await _Api._NodePage({
        pageNo: 1,
        pageSize: 1000000,
        type: 'LEVEL_ONE_OP_CENTER'
    })
    if (res) {

        levelList1.value = res.records
        let obj = { nodeName: '全部', id: "" }
        levelList1.value.unshift(obj)
    }
}
getLevel1()
const levelList2 = ref([])
const getLevel2 = async () => {
    const res = await _Api._NodeList({
        pageNo: 1,
        pageSize: 10000,
        bizParentNodeId: formValue.opeValue
    })
    if (res) {
        levelList2.value = res
        let obj = { nodeName: '全部', id: "" }
        levelList2.value.unshift(obj)
    }
}
const changeNodeValue1 = () => {
    getLevel2()
}

const removeBind = async (index, row) => {
    const res = await _Api._UnBindUserNode({
        userId: row.userId
    })
    if (res) {
        ElMessage('解除绑定成功')
        currentPage.value = 1
        getTableData()
    }
}
const changeBindRowData = ref({})
const showChangeDialog = async (index, row) => {
    changeBindRowData.value = row
    dialogVisible.value = true
}

//关闭前回调
const beforeClose = () => {
    dialogVisible.value = false
}
const reason = ref('')
const handConfirm = async () => {
    const res = await _Api._BizNodeChangeApply({
        userId: changeBindRowData.value.userId,
        workshopId: changeBindRowData.value.workshopId,
        reason: reason.value,
    })
    if (res) {
        ElMessage('转移绑定成功')
        currentPage.value = 1
        getTableData()
        dialogVisible.value = false
        reason.value = ''
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