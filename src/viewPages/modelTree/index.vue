<template>
    <div class="model-tree-page">
        <div class="header">
            <h2>经济模型树</h2>
            <el-button @click="closePage">关闭</el-button>
        </div>
        <div class="content" v-loading="loading" element-loading-text="加载中..." 
             @mousedown="handleMouseDown"
             @dragstart="handleDragStart">
            <div v-if="!loading && modelTreeData" class="tree-container">
                <vue3-org-chart :data="modelTreeData">
                    <template #node="{ item, children, open, toggleChildren }">
                        <div class="contentBox" :class="{ 'active': open, 'passive': !open }"
                             @mousedown.stop
                             @dragstart.prevent
                             @selectstart.stop>
                            <div class="info-grid">
                                <div class="info-item">
                                    <span class="label">用户id：</span>
                                    <span class="value selectable">{{ item.id }}</span>
                                </div>
                                <div class="info-item">
                                    <span class="label">用户名：</span>
                                    <span class="value selectable">{{ item.username }}</span>
                                </div>
                                <div class="info-item" v-if="item.parentId">
                                    <span class="label">上级id：</span>
                                    <span class="value selectable">{{ item.parentId }}</span>
                                </div>
                                <div class="info-item">
                                    <span class="label">推荐码：</span>
                                    <span class="value selectable">{{ item.referralCode }}</span>
                                </div>
                                <div class="info-item">
                                    <span class="label">社区等级角色：</span>
                                    <span class="value selectable">{{ item.communityRoleLevelDesc || '-' }}</span>
                                </div>
                                <div class="info-item">
                                    <span class="label">小区业绩：</span>
                                    <span class="value selectable">{{ item?.userModelling?.smallZonePerformance || '0' }}</span>
                                </div>
                                <div class="info-item">
                                    <span class="label">直推人数：</span>
                                    <span class="value selectable">{{ item.directReferrals || '0' }}</span>
                                </div>
                                <div class="info-item">
                                    <span class="label">质押金额：</span>
                                    <span class="value selectable">{{ item?.userModelling?.realDepositAmount || '0' }}</span>
                                </div>
                            </div>
                            <div class="withdraw-row">
                                <div class="withdraw-item">
                                    <span class="label">可提现USDT：</span>
                                    <span class="value selectable">{{ formatCrypto(item?.userModelling?.withdrawableUsdt) }}</span>
                                </div>
                                <div class="withdraw-item">
                                    <span class="label">可提现VEILX：</span>
                                    <span class="value selectable">{{ formatCrypto(item?.userModelling?.maxTokenLimit) }}</span>
                                </div>
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
import { formatCrypto } from '@/utils/format'
import { handleApiError } from '@/utils/request'

const route = useRoute()
const _Api = inject('$api')
const loading = ref(true)
const modelTreeData = ref(null)

const loadModelTree = async () => {
    const userId = route.params.userId
    if (!userId) {
        handleApiError(null, '用户ID不存在')
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
        handleApiError(error, '获取经济模型树失败')
    } finally {
        loading.value = false
    }
}

const closePage = () => {
    window.close()
}

// 阻止拖拽，允许文本选择
const handleMouseDown = (e) => {
    // 如果是在文本上点击，允许选择
    const target = e.target
    if (target.tagName === 'SPAN' || target.tagName === 'DIV' || target.classList.contains('value') || target.classList.contains('label')) {
        e.stopPropagation()
    }
}

const handleDragStart = (e) => {
    // 阻止拖拽
    e.preventDefault()
    return false
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
                    user-select: text !important;
                    -webkit-user-select: text !important;
                    -moz-user-select: text !important;
                    -ms-user-select: text !important;
                }

                .vue3-org-chart .vue3-org-chart-container {
                    height: 100%;
                    user-select: text !important;
                    -webkit-user-select: text !important;
                    -moz-user-select: text !important;
                    -ms-user-select: text !important;
                }

                // 禁用拖拽功能，允许文本选择
                .vue3-org-chart-container * {
                    user-select: text !important;
                    -webkit-user-select: text !important;
                    -moz-user-select: text !important;
                    -ms-user-select: text !important;
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
        width: 520px;
        min-height: 240px;
        padding: 16px;
        border-radius: 12px;
        border: 2px solid #e2e8f0;
        background: #fff;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        transition: all 0.3s ease;
        user-select: text !important; // 允许选择文本
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        -ms-user-select: text !important;
        // 禁用拖拽
        -webkit-user-drag: none;
        -khtml-user-drag: none;
        -moz-user-drag: none;
        -o-user-drag: none;
        // 允许文本选择
        cursor: default;
        
        // 阻止拖拽事件
        * {
            user-select: text !important;
            -webkit-user-select: text !important;
            -moz-user-select: text !important;
            -ms-user-select: text !important;
            -webkit-user-drag: none;
            -khtml-user-drag: none;
            -moz-user-drag: none;
            -o-user-drag: none;
        }

        .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px 16px;
            margin-bottom: 12px;

            .info-item {
                display: flex;
                align-items: center;
                gap: 8px;
                min-height: 28px;
                padding: 4px 0;

                .label {
                    flex-shrink: 0;
                    font-size: 13px;
                    color: #606266;
                    font-weight: 500;
                    white-space: nowrap;
                }

                .value {
                    flex: 1;
                    font-size: 13px;
                    color: #303133;
                    font-weight: 600;
                    word-break: break-all;
                    min-width: 0;
                    overflow: hidden;
                    text-overflow: ellipsis;

                    &.selectable {
                        user-select: text;
                        -webkit-user-select: text;
                        -moz-user-select: text;
                        -ms-user-select: text;
                        cursor: text;
                    }
                }
            }
        }

        .withdraw-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 16px;
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px solid #e4e7ed;

            .withdraw-item {
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 4px;
                padding: 8px 12px;
                background: #f5f7fa;
                border-radius: 6px;
                min-width: 0;

                .label {
                    font-size: 12px;
                    color: #909399;
                    font-weight: 500;
                    white-space: nowrap;
                }

                .value {
                    font-size: 14px;
                    color: #409EFF;
                    font-weight: 700;
                    word-break: break-all;
                    min-width: 0;
                    overflow: hidden;
                    text-overflow: ellipsis;

                    &.selectable {
                        user-select: text;
                        -webkit-user-select: text;
                        -moz-user-select: text;
                        -ms-user-select: text;
                        cursor: text;
                    }
                }
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
        border-color: #409EFF;
        background: linear-gradient(135deg, #ecf5ff 0%, #e1f3ff 100%);
        box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
        transform: translateY(-2px);
    }

    .contentBox.passive {
        background-color: #fff;
    }

    .contentBox:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
        transform: translateY(-1px);
    }
}
</style>
