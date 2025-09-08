<template>
    <div class="batchUpload">
        <div class="filter">
            <el-form :inline="true" :model="formValue" class="demo-form-inline">
                <el-form-item label="区域id">
                    <el-input v-model="formValue.geoId" placeholder="请输入区域id" clearable />
                </el-form-item>
                <el-form-item label="区域名称">
                    <el-input v-model="formValue.geoName" placeholder="请输入区域名称" clearable />
                </el-form-item>
                <el-form-item label="层级">
                    <el-select v-model="formValue.level" placeholder="请选择层级" style="width: 240px">
                        <el-option v-for="item in levelList" :key="item.value" :label="item.displayName"
                            :value="item.level" />
                    </el-select>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="onSearch">搜索</el-button>
                </el-form-item>
            </el-form>
        </div>
        <div class="creat">
            <el-button type="primary" @click="showDialog">创建区域</el-button>
        </div>
        <div class="uploadList">
            <div class="taskUploadList">
                <div class="title">
                    <span>区域管理列表</span>
                </div>
                <div class="list">
                    <el-table :data="tableData?.records" border style="width: 100%" height="100%">
                        <el-table-column prop="id" label="区域id" />
                        <el-table-column prop="name" label="区域名称" />
                        <el-table-column prop="parentName" label="父区域名称" />
                        <el-table-column prop="levelName" label="层级" />

                        <el-table-column prop="createdAt" label="创建时间" />
                        <el-table-column prop="updatedAt" label="更新时间" />
                        <el-table-column fixed="right" label="Operations">
                            <template #default="scope">
                                <el-button link type="primary" @click="removeGeo(scope.$index, scope.row)"
                                    size="small">删除</el-button>
                                <el-button link type="primary" @click="creatNode(scope.$index, scope.row)"
                                    size="small">创建节点</el-button>
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
        <el-dialog v-model="dialogVisible" title="创建区域" width="800" :before-close="beforeClose" destroy-on-close>
            <div class="diaContent">
                <el-form :model="creatFrom" label-width="auto" style="max-width: 600px">
                    <el-form-item label="区域名称">
                        <el-input v-model="creatFrom.geoName" placeholder="请输入区域名称" clearable />
                    </el-form-item>
                    <el-form-item label="选择层级">
                        <el-select v-model="creatFrom.level" placeholder="请选择层级" style="width: 240px">
                            <el-option v-for="item in levelList" :key="item.value" :label="item.displayName"
                                :value="item.level" />
                        </el-select>
                    </el-form-item>
                    <el-form-item label="父区域id" v-if="creatFrom.level == 'LEVEL_TWO_WORKSHOP'">
                        <el-input v-model="creatFrom.parentId" placeholder="请输入父区域id" clearable />
                    </el-form-item>
                </el-form>
            </div>
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="beforeClose">取消</el-button>
                    <el-button type="primary" @click="handConfirm">
                        确定创建
                    </el-button>
                </div>
            </template>
        </el-dialog>
        <el-dialog v-model="creatNodeDialog" title="创建节点" width="800" :before-close="beforeClose" destroy-on-close>
            <div class="diaContent">
                <el-form :model="creatNodeFrom" label-width="auto" style="max-width: 600px">
                    <el-form-item label="节点名称">
                        <el-input v-model="creatNodeFrom.nodeName" placeholder="请输入节点名称" clearable />
                    </el-form-item>
                    <el-form-item label="区域名称">
                        <!-- <el-input v-model="creatNodeFrom.geoId" placeholder="请输入区域id" clearable /> -->
                        {{ creatNodeFrom.geoName }}
                    </el-form-item>
                    <el-form-item label="负责人id">
                        <el-input v-model="creatNodeFrom.leaderUserId" placeholder="请输入负责人id" clearable />
                    </el-form-item>
                    <el-form-item label="父节点名称" v-if="creatNodeFrom.level == 'LEVEL_TWO_WORKSHOP'">
                        <el-select v-model="creatNodeFrom.parentNodeId" placeholder="请选择父节点id" style="width: 240px">
                            <el-option v-for="item in parentIdList" :key="item.value" :label="item.nodeName"
                                :value="item.id" />
                        </el-select>
                    </el-form-item>
                </el-form>
            </div>
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="beforeClose">取消</el-button>
                    <el-button type="primary" @click="creatNodeConfirm">
                        确定创建
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
    geoId: "",
    geoName: "",
    level: "",
})
const creatFrom = reactive({
    geoName: "",
    level: "",
    parentId: "",
})
const creatNodeFrom = reactive({
    nodeName: "",
    geoId: "",
    geoName: "",
    level:"",
    leaderUserId: "",
    parentNodeId: "",
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
    const res = await _Api._GeoRegion({
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
const levelList = ref([])
const getLevel = async () => {
    const res = await _Api._GeoRegionGeoType({
    })
    if (res) {
        levelList.value = res
    }
}
getLevel()
const removeGeo = async (index, row) => {
    const res = await _Api._GeoRegionRemoveGeo({
        geoId: row.id
    })
    if (res) {
        ElMessage('删除成功')
        currentPage.value = 1
        getTableData()
    }
}
const creatNodeDialog = ref(false)
const parentIdList = ref([])
const creatNode = async (index, row) => {
    const res = await _Api._NodePage({
        pageNo: 1,
        pageSize: 1000000,
        type: 'LEVEL_ONE_OP_CENTER'

    })
    if (res) {
        creatNodeDialog.value = true
        creatNodeFrom.geoId = row.id
        creatNodeFrom.geoName = row.name
        creatNodeFrom.level = row.level
        parentIdList.value = res.records
    }
}
const creatNodeConfirm = async () => {
    const res = await _Api._NodeCreateBizNode({
        ...creatNodeFrom
    })
    if (res) {
        ElMessage('创建成功')
        beforeClose()
        creatNodeFrom.nodeName = ''
        creatNodeFrom.geoId = ''
        creatNodeFrom.geoName = ''
        creatNodeFrom.leaderUserId = ''
        creatNodeFrom.parentNodeId = ''
        creatNodeFrom.value = 1
    }
}

//关闭前回调
const beforeClose = () => {
    dialogVisible.value = false
    creatNodeDialog.value = false
}

const handConfirm = async () => {
    if (!creatFrom.geoName) {
        ElMessage('请输入区域名称')
        return
    }
    if (!creatFrom.level) {
        ElMessage('请选择层级')
        return
    }
    console.log(creatFrom.level);
    if (creatFrom.level == 'LEVEL_TWO_WORKSHOP' && !creatFrom.parentId) {
        ElMessage('请输入父区域id')
        return
    }
    const res = await _Api._GeoRegionCreateGeo({ ...creatFrom })
    if (res) {
        ElMessage('创建成功')
        beforeClose()
        creatFrom.geoName = ''
        creatFrom.level = ''
        creatFrom.parentId = ''
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