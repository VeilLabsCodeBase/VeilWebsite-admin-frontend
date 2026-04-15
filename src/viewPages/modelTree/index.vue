<template>
    <div class="model-tree-page">
        <div class="header">
            <h2>经济模型树</h2>
            <el-button @click="closePage">关闭</el-button>
        </div>

        <div class="content">
            <div v-if="loading" class="loading-state">
                <el-skeleton :rows="6" animated />
            </div>
            <div v-else-if="modelTreeData.length" class="tree-container">
                <vue3-org-chart :data="modelTreeData">
                    <template #node="{ item, children, open, toggleChildren }">
                        <div class="content-box" :class="{ active: open, passive: !open }">
                            <div class="info-grid">
                                <div class="info-item">
                                    <span class="label">用户ID：</span>
                                    <span class="value">{{ item.id }}</span>
                                </div>
                                <div class="info-item">
                                    <span class="label">钱包地址：</span>
                                    <el-tooltip :content="item.walletAddress" placement="top">
                                        <el-button link type="primary" class="wallet-button" @click="copyWalletAddress(item.walletAddress)">
                                            {{ shortenAddress(item.walletAddress) }}
                                        </el-button>
                                    </el-tooltip>
                                </div>
                                <div class="info-item">
                                    <span class="label">上级用户：</span>
                                    <span class="value">{{ item.parentId ?? '-' }}</span>
                                </div>
                                <div class="info-item">
                                    <span class="label">根用户：</span>
                                    <span class="value">{{ item.rootUserId ?? '-' }}</span>
                                </div>
                                <div class="info-item">
                                    <span class="label">层级深度：</span>
                                    <span class="value">{{ item.depth ?? 0 }}</span>
                                </div>
                                <div class="info-item">
                                    <span class="label">下级人数：</span>
                                    <span class="value">{{ item.directChildrenCount ?? 0 }}</span>
                                </div>
                                <div class="info-item">
                                    <span class="label">社区角色：</span>
                                    <span class="value">{{ item.communityRoleDisplayName || '无等级' }}</span>
                                </div>
                                <div class="info-item">
                                    <span class="label">共谋者节点：</span>
                                    <span class="value">{{ item.isCollaboratorNode ? '是' : '否' }}</span>
                                </div>
                                <div class="info-item">
                                    <span class="label">累计充值：</span>
                                    <span class="value">{{ formatAmount(item.totalDepositUsdt) }} U</span>
                                </div>
                                <div class="info-item">
                                    <span class="label">小区业绩：</span>
                                    <span class="value">{{ formatAmount(item.smallZonePerformance) }} U</span>
                                </div>
                            </div>

                            <div class="withdraw-row">
                                <span class="label">可提现金额：</span>
                                <span class="value">{{ formatAmount(item.withdrawableUsdt) }} U</span>
                                <span class="status-tag" :class="{ frozen: item.isFrozen }">
                                    {{ item.isFrozen ? '提现已冻结' : '提现正常' }}
                                </span>
                            </div>
                        </div>
                        <div class="toggle-box">
                            <button v-if="children.length" @click="toggleChildren">
                                {{ open ? '-' : '+' }}
                            </button>
                        </div>
                    </template>
                </vue3-org-chart>
            </div>

            <div v-else class="empty-state">
                <el-empty description="暂无数据" :image-size="100" />
            </div>
        </div>
    </div>
</template>

<script setup>
import { ElMessage } from 'element-plus'
import { inject, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { formatCrypto } from '@/utils/format'
import { handleApiError } from '@/utils/request'
import { copyText, shortenAddress } from '@/utils/address'

const route = useRoute()
const _Api = inject('$api')
const loading = ref(true)
const modelTreeData = ref([])

const formatAmount = (value) => formatCrypto(value)

const flattenTree = (node, result = [], parentIdOverride = null) => {
    if (!node) {
        return result
    }

    const current = {
        ...node,
        id: String(node.id),
        parentId: parentIdOverride == null ? '' : String(parentIdOverride)
    }
    result.push(current)

    const children = Array.isArray(node.children) ? node.children : []
    children.forEach((child) => flattenTree(child, result, node.id))

    return result
}

const loadModelTree = async () => {
    const userId = route.params.userId
    if (!userId) {
        ElMessage.error('用户ID不存在')
        loading.value = false
        return
    }

    loading.value = true
    try {
        const res = await _Api._userModelTreeV2({ userId })
        const payload = res?.data ?? res ?? null
        const rootNode = Array.isArray(payload) ? (payload[0] || null) : payload
        modelTreeData.value = flattenTree(rootNode)
    } catch (error) {
        handleApiError(error, '获取经济模型树失败')
    } finally {
        loading.value = false
    }
}

const copyWalletAddress = async (walletAddress) => {
    try {
        await copyText(walletAddress)
        ElMessage.success('钱包地址已复制')
    } catch (error) {
        handleApiError(error, '复制失败')
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
    display: flex;
    flex-direction: column;
    height: 100vh;
    min-height: 100vh;
    background: #f5f7fa;
    overflow: auto;

    .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 20px;
        height: 60px;
        background: #409eff;
        color: #fff;

        h2 {
            margin: 0;
            font-size: 20px;
        }
    }

    .content {
        flex: 1;
        overflow: auto;
        min-height: 0;
        padding: 20px 20px 140px;
    }

    .loading-state {
        padding: 12px;
        background: #fff;
        border-radius: 10px;
    }

    .tree-container {
        display: block;
        width: max-content;
        min-width: max-content;
        margin: 0 auto;
        padding: 0 24px 140px 0;
    }

    :deep(.vue3-org-chart) {
        --vue3-org-chart-container-height: auto !important;
    }

    :deep(.vue3-org-chart .vue3-org-chart-container) {
        height: max-content !important;
        min-height: max-content !important;
        overflow: visible !important;
        padding-bottom: 140px !important;
    }

    :deep(.vue3-org-chart .vue3-org-chart-scene) {
        align-items: flex-start !important;
        padding-top: 8px;
        padding-bottom: 80px;
    }

    :deep(.vue3-org-chart .vue3-org-chart-node-container) {
        align-items: flex-start;
    }

    .content-box {
        width: 500px;
        min-height: 210px;
        padding: 18px 20px;
        border-radius: 10px;
        border: 1px solid #dfe6f1;
        background: #fff;
        transition: all 0.2s ease;

        &.active {
            border-color: rgb(165 180 252);
            background-color: rgb(224 231 255);
        }

        &.passive {
            background-color: rgb(248 250 252);
        }
    }

    .info-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px 18px;
    }

    .info-item {
        display: flex;
        align-items: center;
        min-width: 0;
        gap: 6px;
    }

    .label {
        flex-shrink: 0;
        color: #606266;
        font-size: 13px;
        font-weight: 500;
    }

    .value {
        min-width: 0;
        color: #303133;
        font-size: 13px;
        font-weight: 600;
        word-break: break-all;
    }

    .wallet-button {
        padding: 0;
    }

    .withdraw-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 14px;
        padding-top: 14px;
        border-top: 1px solid #ebeef5;

        .value {
            color: #409eff;
            font-size: 15px;
        }
    }

    .status-tag {
        padding: 2px 8px;
        border-radius: 999px;
        background: #f0f9eb;
        color: #67c23a;
        font-size: 12px;

        &.frozen {
            background: #fef0f0;
            color: #f56c6c;
        }
    }

    .toggle-box {
        display: flex;
        justify-content: center;

        button {
            width: 30px;
            height: 30px;
            border: 1px solid #dcdfe6;
            background: #fff;
            cursor: pointer;
            font-size: 18px;
            line-height: 1;
        }
    }

    .empty-state {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
    }
}
</style>
