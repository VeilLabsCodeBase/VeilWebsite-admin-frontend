<template>
    <div class="batchUpload">
        <div class="uploadList">
            <div class="taskUploadList">
                <div class="title">
                    <span>用户管理列表</span>
                </div>
                <div class="list">
                    <el-table :data="tableData?.records" border style="width: 100%" height="100%">
                        <el-table-column prop="userModelling.id" label="id"  />
                        <el-table-column prop="userModelling.userId" label="用户id" />
                        <el-table-column prop="username" label="用户名" width="180"/>
                        <el-table-column prop="role" label="用户角色" width="180"/>
                        <el-table-column prop="email" label="email" width="180"/>
                        <el-table-column prop="status" label="用户状态" width="180"/>
                        <el-table-column prop="userModelling.rebateUsdtBalance" label="推荐返利-USDT释放余额"  width="200"/>
                        <el-table-column prop="userModelling.rebateReleasedUsdtAmount" label="推荐返利-USDT已释放数量(保存已经释放全部的推荐返利-USDT数)"  width="400"/>
                        <el-table-column prop="userModelling.rebateDirectEarned" label="累计推荐直推返利" width="200"/>
                        <el-table-column prop="userModelling.rebateGapEarned" label="累计推荐级差返利" width="200"/>
                        <el-table-column prop="userModelling.bonusUsdtBalance" label="团队分红-USDT余额" width="200"/>
                        <el-table-column prop="userModelling.bonusReleasedUsdtAmount" label="团队分红-USDT已释放额度" width="200"/>
                        <el-table-column prop="userModelling.bonusEarned" label="累计团队推广分红" width="200"/>
                        <el-table-column prop="userModelling.realDepositAmount" label="用户真实充值金额" width="200"/>
                        <el-table-column prop="userModelling.tokenReleaseBalance" label="token释放余额/空投token基数" width="200"/>
                        <el-table-column prop="userModelling.tokenReleasedAmount" label="已发放token数量" width="200"/>
                        <el-table-column prop="userModelling.directReferralCount" label="直推人数" width="200"/>
                        <el-table-column prop="userModelling.teamRole" label="团队角色" width="200"/>
                        <el-table-column prop="userModelling.tokenReleaseRate" label="Token日释放比例(%)" width="200"/>
                        <el-table-column prop="userModelling.maxTokenLimit" label="Token释放上限" width="200"/>
                        <el-table-column prop="userModelling.lastReleaseTime" label="上次释放时间" width="200"/>
                        <el-table-column prop="userModelling.lastDepositTime" label="最近真实充值时间" width="200"/>
                        <el-table-column prop="userModelling.userLevel" label="用户等级" width="200"/>
                        <el-table-column prop="userModelling.updatedAt" label="更新时间" width="200"/>
                        <el-table-column prop="userModelling.createdAt" label="创建时间" width="200"/>
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
const showFileList = ref(true)
const fileName = ref("")
const video_file = ref("")
const tableData = ref()
const showDialog = () => {
    dialogVisible.value = true;
}
const formValue = reactive({
    name: "",
    video: "",
    img: "",
    tag_ids: "",
    img_ext: "",
})
//添加视频
const handChange = (file) => {
    if (file.status == 'ready') {
        fileName.value = file.name
        video_file.value = file
        showFileList.value = false
        if (!formValue.name) {
            formValue.name = file.name.replace('.mp4', '')
        }
    }
}
const _Api = inject('$api')
const pageSize = ref(15)
const currentPage = ref(1)
//获取视频标签列表
const getTableData = async (page) => {
    const res = await _Api._userList({
        pageNo:page,
        pageSize:pageSize.value
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
            .page{
                display:flex;
                justify-content: center;
                width:100%;
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