<template>
    <div class="model-tree-page">
        <div class="header">
            <h2>经济模型树</h2>
            <el-button @click="closePage">关闭</el-button>
        </div>
        <div class="content" v-loading="loading" element-loading-text="加载中...">
            <div v-if="!loading && modelTreeData" class="tree-container">
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
                    </template>
                </vue3-org-chart>
            </div>
            <div v-else-if="!loading && !modelTreeData" class="empty-state">
                <p>暂无数据</p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { inject } from 'vue'
import { ElMessage } from 'element-plus'

const route = useRoute()
const _Api = inject('$api')
const loading = ref(true)
const modelTreeData = ref(null)

const loadModelTree = async () => {
    const userId = route.params.userId
    if (!userId) {
        ElMessage.error('用户ID不存在')
        loading.value = false
        return
    }

    loading.value = true
    try {
        const res = await _Api._UserModellingTree({
            userId: userId,
        })
        if (res) {
            modelTreeData.value = res
        }
    } catch (error) {
        ElMessage.error('获取经济模型树失败: ' + (error.message || '未知错误'))
    } finally {
        loading.value = false
    }
}

const closePage = () => {
    window.close()
}

onMounted(() => {
    loadModelTree()
})
</script>

<style lang="scss" scoped>
.model-tree-page {
    width: 100%;
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: #f5f5f5;

    .header {
        height: 60px;
        background: #409EFF;
        color: #fff;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 20px;
        flex-shrink: 0;

        h2 {
            margin: 0;
            font-size: 20px;
        }
    }

    .content {
        flex: 1;
        overflow: auto;
        padding: 20px;

        .tree-container {
            width: 100%;
            height: 100%;

            :deep() {
                .vue3-org-chart {
                    height: 100%;
                }

                .vue3-org-chart .vue3-org-chart-container {
                    height: 100%;
                }
            }
        }

        .empty-state {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100%;
            font-size: 16px;
            color: #909399;
        }
    }

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
            cursor: pointer;
            background: #fff;

            &:hover {
                background: #f0f0f0;
            }
        }
    }

    .contentBox.active {
        border-color: rgb(165 180 252);
        background-color: rgb(224 231 255);
    }

    .contentBox.passive {
        background-color: rgb(248 250 252);
    }
}
</style>

