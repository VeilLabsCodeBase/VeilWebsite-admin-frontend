<template>
    <div class="batchUpload">
        <div class="filter">
            <el-form :inline="true" :model="formValue" class="demo-form-inline filter-form">
                <el-form-item label="用户名">
                    <el-input v-model="formValue.username" placeholder="用户名" clearable style="width: 100px" />
                </el-form-item>
                <el-form-item label="用户ID">
                    <el-input v-model="formValue.userId" placeholder="用户ID" clearable style="width: 90px"
                              @input="handleUserIdInput" />
                </el-form-item>
                <el-form-item label="提现地址">
                    <el-input v-model="formValue.address" placeholder="提现地址" clearable style="width: 140px" />
                </el-form-item>
                <el-form-item label="交易Hash">
                    <el-input v-model="formValue.txHash" placeholder="交易Hash" clearable style="width: 120px" />
                </el-form-item>
                <el-form-item label="提现状态">
                    <el-select v-model="formValue.status" placeholder="提现状态" clearable style="width: 130px">
                        <el-option label="待审核" value="APPROVAL" />
                        <el-option label="审核不通过" value="FAILED" />
                        <el-option label="审核通过" value="SUCCESSFULLY" />
                        <el-option label="无效" value="CANCELED" />
                    </el-select>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="onSearch">搜索</el-button>
                    <el-button @click="onReset">重置</el-button>
                </el-form-item>
            </el-form>
        </div>
        <div class="auto-audit-panel" v-loading="autoAuditLoading">
            <div class="panel-top">
                <div class="panel-title-wrap">
                    <div class="panel-title">自动审核配置</div>
                    <div class="panel-subtitle">小额提现自动到账，提现记录照常保留</div>
                </div>
                <div class="panel-actions">
                    <el-tag :type="autoAuditForm.enabled ? 'success' : 'info'" effect="light" round>
                        {{ autoAuditForm.enabled ? '已开启' : '已关闭' }}
                    </el-tag>
                    <el-button
                        type="primary"
                        class="save-btn"
                        :loading="autoAuditSaving"
                        @click="saveAutoAuditConfig"
                    >
                        保存配置
                    </el-button>
                </div>
            </div>

            <div class="panel-content">
                <div class="compact-metric-card">
                    <span class="metric-label">当前阈值</span>
                    <div class="metric-inline">
                        <span class="metric-value">{{ formatCrypto(autoAuditForm.threshold || 0) }}</span>
                        <span class="metric-unit">USDT</span>
                    </div>
                </div>

                <div class="config-inline-item switch-item">
                    <span class="inline-label">自动审核</span>
                    <el-switch v-model="autoAuditForm.enabled" />
                    <span class="inline-desc">
                        {{ autoAuditForm.enabled ? '命中阈值自动到账' : '全部走人工审核' }}
                    </span>
                </div>

                <div class="config-inline-item threshold-item">
                    <span class="inline-label">阈值额度</span>
                    <el-input
                        v-model="autoAuditForm.threshold"
                        placeholder="请输入自动审核阈值"
                        clearable
                        style="width: 180px"
                    >
                        <template #append>USDT</template>
                    </el-input>
                    <el-button text type="primary" @click="resetAutoAuditThreshold">恢复默认 200</el-button>
                </div>

                <div class="config-inline-item summary-item">
                    <span class="inline-label">当前规则</span>
                    <div class="summary-rule">
                        <span class="status-dot" :class="{ enabled: autoAuditForm.enabled }"></span>
                        <span>{{ autoAuditForm.enabled ? `单笔 <= ${formatCrypto(autoAuditForm.threshold || 0)} USDT 自动审核` : '自动审核关闭' }}</span>
                    </div>
                </div>
            </div>
        </div>
        <div class="uploadList">
            <div class="taskUploadList">
                <div class="title">
                    <span>提现管理列表</span>
                    <div class="title-actions">
                        <el-button type="danger" @click="handleBatchAudit" :loading="batchSummaryLoading">
                            一键审核
                        </el-button>
                        <el-button type="primary" plain @click="openExportDialog" :loading="exportLoading">
                            <el-icon><Download /></el-icon>
                            导出
                        </el-button>
                    </div>
                </div>
                <div class="list">
                    <el-table :data="tableData?.records" border style="width: 100%" height="100%" v-loading="loading">
                        <el-table-column prop="id" label="id" min-width="70" fixed="left" show-overflow-tooltip />
                        <el-table-column prop="username" label="用户名" min-width="120" fixed="left" show-overflow-tooltip />
                        <el-table-column prop="createdAt" label="申请时间" min-width="180" fixed="left" show-overflow-tooltip>
                            <template #default="{ row }">
                                {{ formatDateTime(row.createdAt) }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="amount" label="提现金额USDT" min-width="140" fixed="left" show-overflow-tooltip>
                            <template #default="{ row }">
                                {{ formatCrypto(row.amount) }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="usdtBalanceBefore" label="提现前USDT" min-width="130" show-overflow-tooltip>
                            <template #default="{ row }">
                                {{ formatCrypto(row.usdtBalanceBefore) }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="usdtBalanceAfter" label="提现后USDT" min-width="130" show-overflow-tooltip>
                            <template #default="{ row }">
                                {{ formatCrypto(row.usdtBalanceAfter) }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="address" label="提现地址" min-width="350" show-overflow-tooltip />
                        <el-table-column prop="txHash" label="交易Hash" min-width="350" show-overflow-tooltip>
                            <template #default="{ row }">
                                <span v-if="row.txHash" style="font-family: monospace; color: #409EFF; cursor: pointer;" 
                                      @click="copyTxHash(row.txHash)" :title="row.txHash">
                                    {{ row.txHash }}
                                </span>
                                <span v-else style="color: #909399;">-</span>
                            </template>
                        </el-table-column>
                        <el-table-column prop="fee" label="手续费" min-width="110" show-overflow-tooltip>
                            <template #default="{ row }">
                                {{ formatCrypto(row.fee) }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="actualAmount" label="到账USDT" min-width="130" show-overflow-tooltip>
                            <template #default="{ row }">
                                {{ formatCrypto(row.actualAmount) }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="status" label="提现状态" min-width="125" show-overflow-tooltip>
                            <template #default="{ row }">
                                <el-tag :type="getStatusType(row.status)">
                                    {{ status[row.status] }}
                                </el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column prop="reason" label="备注" min-width="180" show-overflow-tooltip />
                        <el-table-column prop="approvedAt" label="审核通过时间" min-width="180" show-overflow-tooltip>
                            <template #default="{ row }">
                                {{ formatDateTime(row.approvedAt) }}
                            </template>
                        </el-table-column>
                        <el-table-column fixed="right" label="操作" min-width="120">
                            <template #default="scope">
                                <el-button link type="primary" @click="showDialog(scope.$index, scope.row)"
                                    size="small" :disabled="scope.row.status !== 'APPROVAL'">审核</el-button>
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
        <el-dialog v-model="dialogVisible" title="提现审核" width="520" :before-close="beforeClose" destroy-on-close align-center>
            <div class="audit-dialog-content" v-if="rowData">
                <!-- 用户信息展示 -->
                <el-descriptions :column="1" border class="user-info">
                    <el-descriptions-item label="用户名">
                        <span class="info-value">{{ rowData.username || '-' }}</span>
                    </el-descriptions-item>
                    <el-descriptions-item label="到账金额">
                        <div class="amount-info">
                            <span class="amount-usdt" v-if="rowData.actualAmount">
                                {{ formatCrypto(rowData.actualAmount) }} USDT
                            </span>
                            <span v-else class="no-amount">
                                -
                            </span>
                        </div>
                    </el-descriptions-item>
                    <el-descriptions-item label="提现地址">
                        <div class="address-container">
                            <span class="address-text">{{ rowData.address || '-' }}</span>
                        </div>
                    </el-descriptions-item>
                    <el-descriptions-item label="当前状态">
                        <el-tag :type="getStatusType(rowData.status)">
                            {{ status[rowData.status] || '-' }}
                        </el-tag>
                    </el-descriptions-item>
                </el-descriptions>

                <el-divider content-position="left">审核操作</el-divider>

                <!-- 状态选择 -->
                <el-form :model="auditForm" label-width="100px" class="audit-form">
                    <el-form-item label="审核状态" required>
                        <el-radio-group v-model="auditForm.status" class="status-radio-group">
                            <el-radio value="APPROVAL" size="large">
                                <span class="status-label">{{ status.APPROVAL }}</span>
                            </el-radio>
                            <el-radio value="FAILED" size="large">
                                <span class="status-label">{{ status.FAILED }}</span>
                            </el-radio>
                            <el-radio value="SUCCESSFULLY" size="large">
                                <span class="status-label">{{ status.SUCCESSFULLY }}</span>
                            </el-radio>
                            <el-radio value="CANCELED" size="large">
                                <span class="status-label">{{ status.CANCELED }}</span>
                            </el-radio>
                        </el-radio-group>
                    </el-form-item>

                    <el-form-item label="审核备注">
                        <el-input 
                            v-model="auditForm.reason" 
                            type="textarea" 
                            :rows="2"
                            placeholder="请输入审核备注（选填）"
                            maxlength="200"
                            show-word-limit />
                    </el-form-item>
                </el-form>
            </div>
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="beforeClose" :disabled="submitLoading">取消</el-button>
                    <el-button type="primary" @click="handleConfirmClick" :disabled="!auditForm.status || submitLoading" :loading="submitLoading">
                        确定审核
                    </el-button>
                </div>
            </template>
        </el-dialog>

        <!-- 二次确认弹框 -->
        <el-dialog v-model="confirmDialogVisible" title="确认审核" width="500" destroy-on-close>
            <div class="confirm-dialog-content">
                <el-alert
                    :title="getConfirmTitle()"
                    type="warning"
                    :closable="false"
                    show-icon>
                </el-alert>
                <div class="confirm-info" v-if="rowData">
                    <p><strong>用户名：</strong>{{ rowData.username }}</p>
                    <div class="confirm-amount-row">
                        <strong>到账金额：</strong>
                        <div class="confirm-amount-info">
                            <span class="confirm-amount-usdt" v-if="rowData.actualAmount">
                                {{ formatCrypto(rowData.actualAmount) }} USDT
                            </span>
                            <span v-else>
                                -
                            </span>
                        </div>
                    </div>
                    <p><strong>审核状态：</strong><el-tag :type="getStatusType(auditForm.status)">{{ status[auditForm.status] }}</el-tag></p>
                    <p v-if="auditForm.reason"><strong>审核备注：</strong>{{ auditForm.reason }}</p>
                </div>
            </div>
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="confirmDialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="handConfirm" :loading="confirmLoading">
                        确认提交
                    </el-button>
                </div>
            </template>
        </el-dialog>

        <!-- 批量审核确认弹框 -->
        <el-dialog
            v-model="batchConfirmVisible"
            width="520"
            destroy-on-close
            :close-on-click-modal="false"
            class="batch-confirm-dialog"
        >
            <template #header>
                <div class="batch-dialog-header">
                    <el-icon class="header-icon"><WarningFilled /></el-icon>
                    <span>批量审核确认</span>
                </div>
            </template>
            <div class="batch-confirm-content" v-if="batchSummary">
                <div class="batch-banner">
                    即将对待审核的提现记录执行「审核通过」操作
                </div>

                <div class="batch-stats-card">
                    <div class="stats-grid">
                        <div class="stats-item">
                            <span class="stats-num">{{ batchSummary.totalPendingCount }}</span>
                            <span class="stats-label">待审核总数</span>
                        </div>
                        <div class="stats-item active">
                            <span class="stats-num">{{ batchSummary.thisBatchCount }}</span>
                            <span class="stats-label">本次处理</span>
                        </div>
                        <div class="stats-item" v-if="batchSummary.remainingCount > 0">
                            <span class="stats-num warn">{{ batchSummary.remainingCount }}</span>
                            <span class="stats-label">剩余待处理</span>
                        </div>
                    </div>
                    <div class="stats-amount-row">
                        <span class="stats-amount-label">本次提现总金额</span>
                        <span class="stats-amount-value">{{ formatCrypto(batchSummary.thisBatchAmount) }} USDT</span>
                    </div>
                    <div class="stats-batch-hint" v-if="batchSummary.thisBatchCount < batchSummary.totalPendingCount">
                        每次最多处理 {{ batchSummary.batchSize }} 笔，剩余需再次触发
                    </div>
                </div>

                <div class="batch-large-section" v-if="batchSummary.largeItemCount > 0">
                    <div class="large-section-header">
                        <el-icon class="large-warn-icon"><WarningFilled /></el-icon>
                        <span>本次包含大额提现（>100U），共 <strong>{{ batchSummary.largeItemCount }}</strong> 条
                            <span class="large-show-hint" v-if="batchSummary.largeItemCount > 3">，仅展示前 3 条</span>
                        </span>
                    </div>
                    <div class="large-items-table">
                        <div class="large-tbl-header">
                            <span class="col-idx">#</span>
                            <span class="col-user">用户名</span>
                            <span class="col-amount">金额</span>
                            <span class="col-addr">提现地址</span>
                        </div>
                        <div class="large-tbl-row" v-for="(item, index) in batchSummary.largeItems" :key="index">
                            <span class="col-idx"><i class="idx-badge">{{ index + 1 }}</i></span>
                            <span class="col-user">{{ item.username }}</span>
                            <span class="col-amount">{{ formatCrypto(item.amount) }}</span>
                            <span class="col-addr">
                                <span class="addr-tag" :title="item.address" @click="copyAddress(item.address)">
                                    {{ truncateAddress(item.address) }}
                                </span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="batchConfirmVisible = false" size="default">取消</el-button>
                    <el-button type="danger" @click="handleBatchSubmit" :loading="batchSubmitLoading" size="default">
                        确认执行
                    </el-button>
                </div>
            </template>
        </el-dialog>

        <!-- 批量审核执行中 / 结果弹框 -->
        <el-dialog
            v-model="batchExecutingVisible"
            width="420"
            :close-on-click-modal="!!batchResult"
            :close-on-press-escape="!!batchResult"
            :show-close="!!batchResult"
            @close="closeBatchExecuting"
            align-center
        >
            <template #header>
                <div class="batch-dialog-header" :class="{ executing: !batchResult }">
                    <template v-if="!batchResult">
                        <el-icon class="is-loading header-icon"><Loading /></el-icon>
                        <span>批量审核执行中</span>
                    </template>
                    <template v-else-if="batchResult.status === 'COMPLETED'">
                        <el-icon class="header-icon success-icon"><SuccessFilled /></el-icon>
                        <span>批量审核完成</span>
                    </template>
                    <template v-else-if="batchResult.status === 'FAILED'">
                        <el-icon class="header-icon fail-icon"><CircleCloseFilled /></el-icon>
                        <span>批量审核失败</span>
                    </template>
                    <template v-else>
                        <el-icon class="header-icon fail-icon"><WarningFilled /></el-icon>
                        <span>执行超时</span>
                    </template>
                </div>
            </template>

            <!-- 执行中状态 -->
            <div class="batch-executing-content" v-if="!batchResult">
                <div class="executing-pulse">
                    <div class="pulse-ring"></div>
                    <div class="pulse-ring delay"></div>
                    <el-icon class="pulse-icon is-loading"><Loading /></el-icon>
                </div>
                <p class="executing-text">正在执行批量审核，请稍候...</p>

                <div class="executing-info" v-if="batchSummary">
                    <div class="info-item">
                        <span class="info-label">处理记录</span>
                        <span class="info-value">{{ batchSummary.thisBatchCount }} 笔</span>
                    </div>
                    <div class="info-divider"></div>
                    <div class="info-item">
                        <span class="info-label">提现总额</span>
                        <span class="info-value">{{ formatCrypto(batchSummary.thisBatchAmount) }} USDT</span>
                    </div>
                </div>

                <p class="executing-tip">请勿关闭页面，完成后将自动提示结果</p>
            </div>

            <!-- 成功结果 -->
            <div class="batch-result-content" v-else-if="batchResult.status === 'COMPLETED'">
                <div class="result-icon-wrap success">
                    <el-icon><SuccessFilled /></el-icon>
                </div>
                <p class="result-summary-text">本次批量审核已全部完成</p>
                <div class="result-stats">
                    <div class="result-row">
                        <span class="result-label">处理笔数</span>
                        <span class="result-value success">{{ batchResult.totalCount }} / {{ batchSummary?.totalPendingCount || batchResult.totalCount }} 笔</span>
                    </div>
                    <div class="result-row">
                        <span class="result-label">提现总额</span>
                        <span class="result-value">{{ formatCrypto(batchResult.totalAmount) }} USDT</span>
                    </div>
                    <div class="result-row" v-if="batchResult.txHash">
                        <span class="result-label">交易哈希</span>
                        <span class="result-value hash" :title="batchResult.txHash" @click="copyAddress(batchResult.txHash)">
                            {{ truncateAddress(batchResult.txHash) }}
                        </span>
                    </div>
                </div>
                <div class="result-remaining" v-if="batchResult.remainingCount > 0">
                    <el-icon><WarningFilled /></el-icon>
                    <span>仍有 <strong>{{ batchResult.remainingCount }}</strong> 笔待审核，请再次执行一键审核</span>
                </div>
            </div>

            <!-- 失败结果 -->
            <div class="batch-result-content" v-else-if="batchResult.status === 'FAILED'">
                <div class="result-icon-wrap fail">
                    <el-icon><CircleCloseFilled /></el-icon>
                </div>
                <p class="result-summary-text fail">本次批量审核执行失败，数据已回滚</p>
                <div class="result-stats">
                    <div class="result-row">
                        <span class="result-label">提交笔数</span>
                        <span class="result-value">{{ batchSummary?.thisBatchCount || '-' }} / {{ batchSummary?.totalPendingCount || '-' }} 笔</span>
                    </div>
                    <div class="result-row">
                        <span class="result-label">失败原因</span>
                        <span class="result-value fail-text">{{ batchResult.errorMessage || '未知错误' }}</span>
                    </div>
                </div>
            </div>

            <!-- 超时 -->
            <div class="batch-result-content" v-else>
                <div class="result-icon-wrap fail">
                    <el-icon><WarningFilled /></el-icon>
                </div>
                <p class="result-summary-text fail">执行超时</p>
                <div class="result-stats">
                    <div class="result-row">
                        <span class="result-label">提交笔数</span>
                        <span class="result-value">{{ batchSummary?.thisBatchCount || '-' }} / {{ batchSummary?.totalPendingCount || '-' }} 笔</span>
                    </div>
                    <div class="result-row">
                        <span class="result-label">提示</span>
                        <span class="result-value fail-text">请刷新页面查看最终结果</span>
                    </div>
                </div>
            </div>

            <template #footer v-if="batchResult">
                <el-button type="primary" @click="closeBatchExecuting">确 定</el-button>
            </template>
        </el-dialog>

        <el-dialog
            v-model="exportDialogVisible"
            width="460"
            destroy-on-close
            :close-on-click-modal="!exportLoading"
            :close-on-press-escape="!exportLoading"
            :show-close="!exportLoading"
            class="export-dialog"
        >
            <template #header>
                <div class="batch-dialog-header export-header">
                    <div class="export-header-icon">
                        <el-icon><Download /></el-icon>
                    </div>
                    <div class="export-header-copy">
                        <span>导出提现记录</span>
                        <small>默认导出最近 3 个月数据，可按状态进一步筛选</small>
                    </div>
                </div>
            </template>

            <div class="export-dialog-content" v-loading="exportLoading">
                <div class="export-banner">
                    <el-icon><Calendar /></el-icon>
                    <span>为避免导出数据过大，时间区间默认限制在最近 3 个月内。</span>
                </div>

                <div class="export-filter-card">
                    <div class="export-field">
                        <label>用户ID</label>
                        <el-input
                            v-model="exportForm.userIds"
                            placeholder="多个用户ID请用英文逗号分隔，如 1001,1002"
                            class="export-userids-input"
                            @input="handleExportUserIdsInput"
                        />
                        <p v-if="exportUserIdsError" class="field-tip is-error">{{ exportUserIdsError }}</p>
                        <p v-else class="field-tip">仅支持数字和英文逗号，多个用户ID用英文逗号分隔。</p>
                    </div>

                    <div class="export-field">
                        <label>提现时间区间</label>
                        <el-date-picker
                            v-model="exportForm.timeRange"
                            type="datetimerange"
                            range-separator="至"
                            start-placeholder="开始时间"
                            end-placeholder="结束时间"
                            format="YYYY-MM-DD HH:mm"
                            value-format="YYYY-MM-DD HH:mm:ss"
                            :clearable="false"
                            @change="handleExportRangeChange"
                            placement="top-start"
                            popper-class="export-date-range-popper"
                            class="export-date-picker"
                        />
                        <p class="field-tip">默认当前时间倒推 3 个月，手动调整时跨度不能超过 3 个月。</p>
                    </div>

                    <div class="export-field">
                        <label>提现状态</label>
                        <el-select
                            v-model="exportForm.status"
                            placeholder="全部状态"
                            clearable
                            class="export-status-select"
                        >
                            <el-option label="待审核" value="APPROVAL" />
                            <el-option label="审核通过" value="SUCCESSFULLY" />
                            <el-option label="审核失败" value="FAILED" />
                        </el-select>
                        <p class="field-tip">仅支持导出待审核、审核通过、审核失败三种状态。</p>
                    </div>
                </div>
            </div>

            <template #footer>
                <div class="dialog-footer export-footer">
                    <el-button @click="closeExportDialog" :disabled="exportLoading">取消</el-button>
                    <el-button type="primary" @click="submitExport" :loading="exportLoading">
                        {{ exportLoading ? '导出中...' : '确定导出' }}
                    </el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>
<script setup>
import { ElMessage, ElMessageBox } from 'element-plus'
import { Loading, WarningFilled, SuccessFilled, CircleCloseFilled, Download, Calendar } from '@element-plus/icons-vue'
import {
    _SessionCache
} from '@/utils/cache'
import { reactive, ref, inject, onUnmounted } from 'vue'
import { formatUsdt, formatToken, formatDateTime, formatCrypto } from '@/utils/format'
import { handleApiError } from '@/utils/request'
const formValue = reactive({
    userId: "",
    username: "",
    status: "",
    txHash: "",
    address: "",
})
const dialogVisible = ref(false)
const confirmDialogVisible = ref(false)
const confirmLoading = ref(false)
const submitLoading = ref(false)
const autoAuditLoading = ref(false)
const autoAuditSaving = ref(false)
const tableData = ref()
const rowData = ref(null)
const DEFAULT_AUTO_AUDIT_THRESHOLD = '200'
const autoAuditForm = reactive({
    enabled: false,
    threshold: DEFAULT_AUTO_AUDIT_THRESHOLD
})
const auditForm = reactive({
    status: '',
    reason: ''
})

const showDialog = (index, row) => {
    dialogVisible.value = true;
    rowData.value = row
    auditForm.status = row?.status || ''
    auditForm.reason = ''
}
const _Api = inject('$api')
const pageSize = ref(8)
const currentPage = ref(1)
const loading = ref(false)

const getTableData = async (page) => {
    loading.value = true
    try {
        const res = await _Api._WithdrawList({
            pageNo: page,
            pageSize: pageSize.value,
            ...formValue
        })
        if (res) {
            tableData.value = res
        }
    } catch (error) {
        console.error('获取数据失败:', error)
        handleApiError(error, '获取数据失败')
    } finally {
        loading.value = false
    }
}
getTableData(currentPage.value)

const normalizeThreshold = value => {
    const str = String(value ?? '').trim()
    if (!str) return ''
    if (!/^\d+(\.\d+)?$/.test(str)) return ''
    const num = Number(str)
    if (!Number.isFinite(num) || num <= 0) return ''
    return str
}

const fetchAutoAuditConfig = async () => {
    autoAuditLoading.value = true
    try {
        const res = await _Api._WithdrawAutoAuditConfig()
        if (res) {
            autoAuditForm.enabled = !!res.enabled
            autoAuditForm.threshold = String(res.threshold ?? DEFAULT_AUTO_AUDIT_THRESHOLD)
        }
    } catch (error) {
        handleApiError(error, '获取自动审核配置失败')
    } finally {
        autoAuditLoading.value = false
    }
}

fetchAutoAuditConfig()

const resetAutoAuditThreshold = () => {
    autoAuditForm.threshold = DEFAULT_AUTO_AUDIT_THRESHOLD
}

const saveAutoAuditConfig = async () => {
    const normalizedThreshold = normalizeThreshold(autoAuditForm.threshold)
    if (!normalizedThreshold) {
        ElMessage.warning('请输入大于0的自动审核阈值')
        return
    }

    autoAuditSaving.value = true
    try {
        const res = await _Api._WithdrawAutoAuditConfigUpdate({
            enabled: autoAuditForm.enabled,
            threshold: normalizedThreshold
        })
        if (res) {
            autoAuditForm.enabled = !!res.enabled
            autoAuditForm.threshold = String(res.threshold ?? normalizedThreshold)
            ElMessage.success('自动审核配置已保存')
        }
    } catch (error) {
        handleApiError(error, '保存自动审核配置失败')
    } finally {
        autoAuditSaving.value = false
    }
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
    rowData.value = null
    auditForm.status = ''
    auditForm.reason = ''
}

const status = reactive({
    APPROVAL: '待审核',
    FAILED: '审核不通过',
    SUCCESSFULLY: '审核通过',
    CANCELED: '无效',
})

// 获取状态标签类型
const getStatusType = (statusValue) => {
    const typeMap = {
        'APPROVAL': 'warning',
        'FAILED': 'danger',
        'SUCCESSFULLY': 'success',
        'CANCELED': 'info'
    }
    return typeMap[statusValue] || ''
}

// 点击确定按钮，显示二次确认
const handleConfirmClick = () => {
    if (!auditForm.status) {
        ElMessage.warning('请选择审核状态')
        return
    }
    confirmDialogVisible.value = true
}

// 最终确认提交
const handConfirm = async () => {
    if (!rowData.value) {
        return
    }
    
    submitLoading.value = true
    confirmLoading.value = true
    try {
        const res = await _Api._WithdrawAudit({
            userWithdrawId: rowData.value.id,
            status: auditForm.status,
            reason: auditForm.reason
        })
        if (res) {
            confirmDialogVisible.value = false
            dialogVisible.value = false
            ElMessage.success('审核成功')
            getTableData(currentPage.value)
            // 重置表单
            rowData.value = null
            auditForm.status = ''
            auditForm.reason = ''
        }
    } catch (error) {
        handleApiError(error, '审核失败: '+error?.response?.data?.message)
    } finally {
        submitLoading.value = false
        confirmLoading.value = false
    }
}

// 复制交易Hash
const copyTxHash = (txHash) => {
    if (!txHash) return
    navigator.clipboard.writeText(txHash).then(() => {
        ElMessage.success('交易Hash已复制到剪贴板')
    }).catch(() => {
        ElMessage.error('复制失败')
    })
}

// 复制提现地址
const copyAddress = (address) => {
    if (!address) return
    navigator.clipboard.writeText(address).then(() => {
        ElMessage.success('地址已复制到剪贴板')
    }).catch(() => {
        ElMessage.error('复制失败')
    })
}

// 截断地址展示（首12位 + ... + 尾10位）
const truncateAddress = (address) => {
    if (!address) return '-'
    if (address.length <= 24) return address
    return address.slice(0, 12) + '...' + address.slice(-10)
}

// 获取确认弹框标题
const getConfirmTitle = () => {
    const username = rowData.value?.username || ''
    const statusText = status[auditForm.status] || ''
    return `确定要将用户 ${username} 的提现审核状态修改为"${statusText}"吗？`
}
const onSearch = () => {
    currentPage.value = 1
    getTableData(currentPage.value)
}

const onReset = () => {
    formValue.userId = ""
    formValue.username = ""
    formValue.status = ""
    formValue.txHash = ""
    formValue.address = ""
    currentPage.value = 1
    getTableData(currentPage.value)
}

// 限制用户ID只能输入数字
const handleUserIdInput = (value) => {
    formValue.userId = value.replace(/\D/g, '')
}

// ========== 批量审核 ==========
const batchSummaryLoading = ref(false)
const batchConfirmVisible = ref(false)
const batchSubmitLoading = ref(false)
const batchExecutingVisible = ref(false)
const batchSummary = ref(null)
const batchResult = ref(null)
let batchPolling = false
let batchPollTimer = null
const MAX_EXPORT_RANGE_MONTHS = 3
const exportDialogVisible = ref(false)
const exportLoading = ref(false)
const exportForm = reactive({
    userIds: '',
    timeRange: [],
    status: ''
})
const lastValidExportRange = ref([])
const exportUserIdsError = ref('')

const padDateTime = value => String(value).padStart(2, '0')
const formatExportDateTime = date => `${date.getFullYear()}-${padDateTime(date.getMonth() + 1)}-${padDateTime(date.getDate())} ${padDateTime(date.getHours())}:${padDateTime(date.getMinutes())}:00`
const getDefaultExportRange = () => {
    const end = new Date()
    const start = new Date(end)
    start.setMonth(start.getMonth() - MAX_EXPORT_RANGE_MONTHS)
    return [formatExportDateTime(start), formatExportDateTime(end)]
}
const isExportRangeExceeded = (range) => {
    if (!range || range.length !== 2) return false
    const start = new Date(range[0])
    const end = new Date(range[1])
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false
    const maxEnd = new Date(start)
    maxEnd.setMonth(maxEnd.getMonth() + MAX_EXPORT_RANGE_MONTHS)
    return end.getTime() > maxEnd.getTime()
}

const handleBatchAudit = async () => {
    batchSummaryLoading.value = true
    try {
        const res = await _Api._BatchAuditPendingSummary()
        if (!res || res.totalPendingCount === 0) {
            ElMessage.info('暂无待审核的提现记录')
            return
        }
        batchSummary.value = res
        batchConfirmVisible.value = true
    } catch (error) {
        handleApiError(error, '获取待审核数据失败')
    } finally {
        batchSummaryLoading.value = false
    }
}

const openExportDialog = () => {
    const defaultRange = getDefaultExportRange()
    exportForm.userIds = ''
    exportForm.timeRange = [...defaultRange]
    exportForm.status = ''
    lastValidExportRange.value = [...defaultRange]
    exportUserIdsError.value = ''
    exportDialogVisible.value = true
}

const closeExportDialog = () => {
    if (exportLoading.value) return
    exportDialogVisible.value = false
}

const handleExportRangeChange = (value) => {
    if (!value || value.length !== 2) {
        const defaultRange = getDefaultExportRange()
        exportForm.timeRange = [...defaultRange]
        lastValidExportRange.value = [...defaultRange]
        return
    }
    if (isExportRangeExceeded(value)) {
        ElMessage.warning('提现时间区间最多只能选择 3 个月')
        exportForm.timeRange = [...lastValidExportRange.value]
        return
    }
    lastValidExportRange.value = [...value]
}

const normalizeExportUserIds = (value) => {
    const source = String(value ?? '')
    const normalizedSource = source
        .replace(/，/g, ',')
        .replace(/\s+/g, '')
    const sanitized = normalizedSource
        .replace(/[^\d,]/g, '')
        .replace(/,{2,}/g, ',')
        .replace(/^,+/g, '')
    return {
        sanitized,
        hadInvalid: sanitized !== normalizedSource
    }
}

const parseExportUserIds = (value) => {
    const normalized = String(value ?? '')
        .replace(/，/g, ',')
        .replace(/\s+/g, '')
        .trim()
    if (!normalized) {
        return []
    }
    if (!/^\d+(,\d+)*$/.test(normalized)) {
        return null
    }
    return normalized.split(',').map(item => item.trim()).filter(Boolean)
}

const handleExportUserIdsInput = (value) => {
    const { sanitized, hadInvalid } = normalizeExportUserIds(value)
    exportForm.userIds = sanitized
    exportUserIdsError.value = hadInvalid
        ? '仅支持数字和英文逗号，多个用户ID请用英文逗号分隔'
        : ''
}

const parseExportError = async (error) => {
    const blob = error?.response?.data
    if (!(blob instanceof Blob)) return null
    try {
        const text = await blob.text()
        const json = JSON.parse(text)
        return json?.message || null
    } catch (e) {
        return null
    }
}

const submitExport = async () => {
    const parsedUserIds = parseExportUserIds(exportForm.userIds)
    if (parsedUserIds === null) {
        exportUserIdsError.value = '仅支持数字和英文逗号，多个用户ID请用英文逗号分隔'
        ElMessage.warning('用户ID格式不正确，请使用英文逗号分隔多个数字ID')
        return
    }
    exportUserIdsError.value = ''
    if (!exportForm.timeRange || exportForm.timeRange.length !== 2) {
        const defaultRange = getDefaultExportRange()
        exportForm.timeRange = [...defaultRange]
        lastValidExportRange.value = [...defaultRange]
    }
    if (isExportRangeExceeded(exportForm.timeRange)) {
        ElMessage.warning('提现时间区间最多只能选择 3 个月')
        return
    }
    exportLoading.value = true
    try {
        const payload = {}
        if (parsedUserIds.length) {
            payload.userIds = parsedUserIds.join(',')
        }
        payload.startTime = exportForm.timeRange[0]
        payload.endTime = exportForm.timeRange[1]
        if (exportForm.status) {
            payload.status = exportForm.status
        }

        const blob = await _Api._WithdrawExport(payload)
        const downloadBlob = blob instanceof Blob
            ? blob
            : new Blob([blob], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            })
        const now = new Date()
        const pad = n => String(n).padStart(2, '0')
        const fileName = `withdraw-export-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}.xlsx`
        const url = window.URL.createObjectURL(downloadBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        exportDialogVisible.value = false
        ElMessage.success('提现记录导出成功')
    } catch (error) {
        const exportError = await parseExportError(error)
        if (exportError) {
            ElMessage.error(exportError)
        } else {
            handleApiError(error, '提现记录导出失败')
        }
    } finally {
        exportLoading.value = false
    }
}

const handleBatchSubmit = async () => {
    batchSubmitLoading.value = true
    try {
        const batchId = await _Api._BatchAuditSubmit()
        if (!batchId) {
            ElMessage.error('批量审核提交失败')
            return
        }
        batchConfirmVisible.value = false
        batchResult.value = null
        batchExecutingVisible.value = true
        pollBatchStatus(batchId)
    } catch (error) {
        handleApiError(error, error?.response?.data?.message || '批量审核提交失败')
    } finally {
        batchSubmitLoading.value = false
    }
}

const closeBatchExecuting = () => {
    batchExecutingVisible.value = false
    batchResult.value = null
}

const pollBatchStatus = (batchId) => {
    const POLL_INTERVAL = 3000
    const MAX_POLL_TIME = 300000
    const startTime = Date.now()

    clearBatchPollTimer()
    batchPolling = false

    batchPollTimer = setInterval(async () => {
        if (batchPolling) return
        if (Date.now() - startTime > MAX_POLL_TIME) {
            clearBatchPollTimer()
            batchResult.value = { status: 'TIMEOUT' }
            getTableData(currentPage.value)
            return
        }
        batchPolling = true
        try {
            const res = await _Api._BatchAuditStatus(batchId)
            if (!res) return

            if (res.status === 'COMPLETED') {
                clearBatchPollTimer()
                batchResult.value = res
                getTableData(1)
            } else if (res.status === 'FAILED') {
                clearBatchPollTimer()
                batchResult.value = res
                getTableData(currentPage.value)
            }
        } catch (e) {
            console.error('轮询异常:', e)
        } finally {
            batchPolling = false
        }
    }, POLL_INTERVAL)
}

const clearBatchPollTimer = () => {
    if (batchPollTimer) {
        clearInterval(batchPollTimer)
        batchPollTimer = null
    }
    batchPolling = false
}

onUnmounted(() => {
    clearBatchPollTimer()
})
</script>
<style lang="scss" scoped>
.batchUpload {
    padding-bottom: 40px;

    .filter {
        .filter-form {
            display: flex;
            flex-wrap: nowrap;
            align-items: flex-start;

            :deep(.el-form-item) {
                margin-bottom: 10px;
                margin-right: 18px;

                .el-form-item__label {
                    font-size: 13px;
                    padding-right: 8px;
                }
            }
        }
    }

    .auto-audit-panel {
        margin-top: 12px;
        padding: 10px 12px;
        border: 1px solid #e7edf5;
        border-radius: 12px;
        background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
        box-shadow: 0 6px 16px rgba(80, 116, 180, 0.05);

        .panel-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            margin-bottom: 8px;
        }

        .panel-title {
            font-size: 15px;
            font-weight: 700;
            color: #22304a;
            line-height: 1.2;
        }

        .panel-subtitle {
            margin-top: 2px;
            font-size: 11px;
            color: #7d8ca3;
            line-height: 1.35;
        }

        .panel-actions {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-shrink: 0;
        }

        .panel-content {
            display: grid;
            grid-template-columns: 170px minmax(180px, 0.95fr) minmax(220px, 1fr) minmax(220px, 1fr);
            gap: 8px;
            align-items: stretch;
        }

        .compact-metric-card,
        .config-inline-item {
            min-height: 56px;
            border-radius: 10px;
            border: 1px solid #e9eef5;
            background: #fff;
            padding: 8px 10px;
        }

        .compact-metric-card {
            display: flex;
            flex-direction: column;
            justify-content: center;
            background: linear-gradient(135deg, #2383ff 0%, #57b1ff 100%);
            color: #fff;

            .metric-label {
                font-size: 11px;
                opacity: 0.8;
            }

            .metric-inline {
                display: flex;
                align-items: baseline;
                gap: 5px;
                margin-top: 4px;
            }

            .metric-value {
                font-size: 20px;
                font-weight: 700;
                line-height: 1;
            }

            .metric-unit {
                font-size: 11px;
                opacity: 0.9;
            }
        }

        .config-inline-item {
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 5px;
        }

        .inline-label {
            font-size: 11px;
            font-weight: 600;
            color: #7d8ca3;
            line-height: 1.1;
        }

        .inline-desc {
            font-size: 11px;
            color: #5b6b82;
            line-height: 1.3;
        }

        .switch-item {
            align-items: flex-start;

            .inline-desc {
                margin-top: 0;
            }
        }

        .threshold-item {
            justify-content: space-between;
        }

        .summary-item {
            background: radial-gradient(circle at top right, rgba(64, 158, 255, 0.14), transparent 42%), #ffffff;
        }

        .summary-rule {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
            color: #405066;
            line-height: 1.35;
        }

        .status-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: #c0c4cc;
            box-shadow: 0 0 0 3px rgba(192, 196, 204, 0.18);
            flex-shrink: 0;

            &.enabled {
                background: #67c23a;
                box-shadow: 0 0 0 3px rgba(103, 194, 58, 0.14);
            }
        }

        .save-btn {
            min-width: 88px;
            height: 30px;
            border-radius: 8px;
        }

        @media (max-width: 1500px) {
            .panel-content {
                grid-template-columns: repeat(2, minmax(220px, 1fr));
            }
        }

        @media (max-width: 980px) {
            .panel-top {
                flex-direction: column;
                align-items: flex-start;
            }

            .panel-actions {
                width: 100%;
                justify-content: space-between;
            }

            .panel-content {
                grid-template-columns: 1fr;
            }
        }
    }

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
                align-items: center;
                justify-content: space-between;
                gap: 12px;

                .title-actions {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

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
                padding: 16px 0 22px;
                margin-top: 6px;
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

    .audit-dialog-content {
        .user-info {
            margin-bottom: 12px;

            :deep() {
                .el-descriptions__label {
                    font-weight: 600;
                    color: #606266;
                    width: 120px;
                }

                .el-descriptions__content {
                    color: #303133;
                }
            }

            .info-value {
                font-size: 14px;
                color: #303133;
            }

            .address-container {
                max-width: 100%;
                word-break: break-all;
                
                .address-text {
                    font-family: 'Courier New', monospace;
                    font-size: 12px;
                    color: #303133;
                    background: #f5f7fa;
                    padding: 6px 10px;
                    border-radius: 4px;
                    display: inline-block;
                    border: 1px solid #e4e7ed;
                    line-height: 1.5;
                }
            }

            .amount-info {
                display: flex;
                flex-direction: column;
                gap: 4px;

                .amount-usdt {
                    color: #409EFF;
                    font-weight: 600;
                    font-size: 14px;
                }

                .no-amount {
                    color: #909399;
                }
            }
        }

        :deep(.el-divider) {
            margin: 12px 0;
        }

        .audit-form {
            :deep(.el-form-item) {
                margin-bottom: 12px;
            }

            .status-radio-group {
                display: flex;
                flex-direction: column;
                align-items: flex-start;

                :deep() {
                    .el-radio {
                        margin-right: 0;
                        margin-bottom: 6px;
                        height: 28px;
                    }

                    .el-radio:last-child {
                        margin-bottom: 0;
                    }
                }
            }
        }
    }

    // 状态标签样式优化
    :deep(.el-tag) {
        font-weight: 500;
        padding: 4px 12px;
        border-radius: 4px;
        white-space: nowrap;
    }

    // 提现状态列样式，确保内容完整显示
    :deep(.el-table__body-wrapper) {
        .el-table__body {
            td:nth-child(10) {
                .cell {
                    overflow: visible !important;
                    white-space: nowrap !important;
                }
            }
        }
    }

    .confirm-dialog-content {
        .confirm-info {
            margin-top: 20px;
            padding: 15px;
            background: #f5f7fa;
            border-radius: 4px;

            p {
                margin: 10px 0;
                line-height: 1.8;
                color: #606266;

                strong {
                    color: #303133;
                    margin-right: 8px;
                }
            }

            .confirm-amount-row {
                margin: 10px 0;
                line-height: 1.8;
                color: #606266;
                display: flex;
                align-items: center;
                gap: 8px;

                strong {
                    color: #303133;
                    flex-shrink: 0;
                }
            }

            .confirm-amount-info {
                display: inline-block;

                .confirm-amount-usdt {
                    color: #67C23A;
                    font-weight: 600;
                    font-size: 16px;
                    padding: 4px 8px;
                    background: #f0f9ff;
                    border-radius: 4px;
                }
            }
        }
    }

    .batch-dialog-header {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 16px;
        font-weight: 600;
        color: #303133;

        .header-icon {
            font-size: 20px;
            color: #E6A23C;
        }

        &.executing .header-icon {
            color: #409EFF;
        }

        .success-icon { color: #67C23A !important; }
        .fail-icon { color: #F56C6C !important; }
    }

    .export-header {
        gap: 10px;
        align-items: flex-start;

        .export-header-icon {
            width: 34px;
            height: 34px;
            border-radius: 10px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #ecf5ff 0%, #d9ecff 100%);
            color: #409EFF;
            flex-shrink: 0;

            .el-icon {
                font-size: 16px;
            }
        }

        .export-header-copy {
            display: flex;
            flex-direction: column;
            gap: 4px;

            small {
                font-size: 11px;
                color: #8c9aad;
                font-weight: 400;
                line-height: 1.4;
            }
        }
    }

    .export-dialog-content {
        padding: 2px 0 0;

        .export-banner {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 9px 12px;
            margin-bottom: 12px;
            border-radius: 9px;
            background: linear-gradient(135deg, #eff8ff 0%, #f8fbff 100%);
            border: 1px solid #d9ecff;
            color: #4f647f;
            font-size: 11px;

            .el-icon {
                color: #409EFF;
                font-size: 14px;
                flex-shrink: 0;
            }
        }

        .export-filter-card {
            padding: 14px;
            border-radius: 12px;
            border: 1px solid #e8edf5;
            background: linear-gradient(180deg, #ffffff 0%, #fbfcff 100%);
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
        }

        .export-field + .export-field {
            margin-top: 14px;
        }

        .export-field {
            display: flex;
            flex-direction: column;
            gap: 6px;

            label {
                font-size: 12px;
                font-weight: 600;
                color: #24364d;
            }

            .field-tip {
                margin: 0;
                font-size: 10px;
                line-height: 1.45;
                color: #8b97aa;
            }
        }

        .export-date-picker,
        .export-status-select,
        .export-userids-input {
            width: 100%;
        }

        .field-tip.is-error {
            color: #f56c6c;
        }
    }

    .export-footer {
        padding-top: 4px;
    }

    .batch-confirm-content {
        .batch-banner {
            padding: 10px 14px;
            background: linear-gradient(135deg, #fdf6ec 0%, #fef0e0 100%);
            border: 1px solid #f5dab1;
            border-radius: 8px;
            margin-bottom: 16px;
            font-size: 13px;
            color: #865c22;
            font-weight: 500;
            line-height: 1.5;
        }

        .batch-stats-card {
            background: #f7f9fc;
            border: 1px solid #e8ecf1;
            border-radius: 10px;
            padding: 14px 16px 12px;
            margin-bottom: 16px;

            .stats-grid {
                display: flex;
                gap: 10px;
                margin-bottom: 12px;

                .stats-item {
                    flex: 1;
                    text-align: center;
                    padding: 10px 6px;
                    background: #fff;
                    border-radius: 8px;
                    border: 1px solid #ebeef5;

                    &.active {
                        background: linear-gradient(135deg, #ecf5ff 0%, #d9ecff 100%);
                        border-color: #b3d8ff;
                    }

                    .stats-num {
                        display: block;
                        font-size: 22px;
                        font-weight: 700;
                        color: #303133;
                        line-height: 1.2;
                        margin-bottom: 2px;

                        &.warn { color: #E6A23C; }
                    }

                    .stats-label {
                        font-size: 11px;
                        color: #909399;
                    }

                    &.active .stats-num { color: #409EFF; }
                }
            }

            .stats-amount-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px 14px;
                background: #fff;
                border-radius: 8px;
                border: 1px solid #e4e7ed;

                .stats-amount-label {
                    font-size: 13px;
                    color: #606266;
                }

                .stats-amount-value {
                    font-size: 18px;
                    font-weight: 700;
                    color: #67C23A;
                }
            }

            .stats-batch-hint {
                text-align: center;
                font-size: 11px;
                color: #909399;
                margin-top: 10px;
                padding-top: 8px;
                border-top: 1px dashed #e4e7ed;
            }
        }

        .batch-large-section {
            .large-section-header {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 8px 12px;
                background: #fdf6ec;
                border: 1px solid #f5dab1;
                border-bottom: none;
                border-radius: 8px 8px 0 0;
                font-size: 12px;
                color: #865c22;

                .large-warn-icon {
                    font-size: 15px;
                    color: #E6A23C;
                    flex-shrink: 0;
                }

                strong {
                    color: #c45e1a;
                    font-size: 14px;
                    padding: 0 1px;
                }

                .large-show-hint {
                    color: #b08d57;
                }
            }

            .large-items-table {
                border: 1px solid #f5dab1;
                border-top: none;
                border-radius: 0 0 8px 8px;
                overflow: hidden;
                display: grid;
                grid-template-columns: 32px auto 90px 1fr;

                .large-tbl-header, .large-tbl-row {
                    display: contents;
                }

                .large-tbl-header > span {
                    padding: 8px 6px;
                    background: #fef8ee;
                    border-bottom: 1px solid #f0dfc5;
                    font-size: 11px;
                    font-weight: 600;
                    color: #8c6d3f;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .large-tbl-row > span {
                    padding: 10px 6px;
                    background: #fff;
                    border-bottom: 1px dashed #f5e6cf;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: background 0.15s;
                }

                .large-tbl-row:last-child > span { border-bottom: none; }
                .large-tbl-row:hover > span { background: #fffdf8; }

                .col-idx { text-align: center; }
                .col-user { font-size: 13px; color: #303133; font-weight: 500; white-space: nowrap; }
                .col-amount { font-size: 13px; color: #e35d5d; font-weight: 700; }
                .col-addr { min-width: 0; }

                .idx-badge {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: #fdf0db;
                    color: #b88230;
                    font-size: 11px;
                    font-weight: 600;
                    font-style: normal;
                }

                .addr-tag {
                    font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
                    font-size: 11px;
                    color: #409EFF;
                    cursor: pointer;
                    padding: 2px 7px;
                    background: #f0f7ff;
                    border-radius: 4px;
                    border: 1px solid #d9ecff;
                    transition: all 0.15s;
                    display: inline-block;
                    white-space: nowrap;

                    &:hover {
                        background: #d9ecff;
                        border-color: #a0cfff;
                        color: #1a6dcc;
                    }
                    &:active { transform: scale(0.97); }
                }
            }
        }
    }

    .batch-executing-content {
        text-align: center;
        padding: 10px 0 6px;

        .executing-pulse {
            position: relative;
            width: 56px;
            height: 56px;
            margin: 0 auto 18px;

            .pulse-ring {
                position: absolute;
                inset: 0;
                border-radius: 50%;
                border: 2px solid #409EFF;
                opacity: 0;
                animation: pulseRing 2s ease-out infinite;

                &.delay { animation-delay: 1s; }
            }

            .pulse-icon {
                position: absolute;
                inset: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 28px;
                color: #409EFF;
            }
        }

        @keyframes pulseRing {
            0% { transform: scale(0.8); opacity: 0.6; }
            100% { transform: scale(1.6); opacity: 0; }
        }

        .executing-text {
            font-size: 15px;
            color: #303133;
            font-weight: 500;
            margin-bottom: 16px;
        }

        .executing-info {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0;
            background: #f7f9fc;
            border-radius: 8px;
            padding: 12px 20px;
            margin: 0 12px 14px;

            .info-item {
                flex: 1;
                text-align: center;

                .info-label {
                    display: block;
                    font-size: 11px;
                    color: #909399;
                    margin-bottom: 3px;
                }

                .info-value {
                    font-size: 14px;
                    font-weight: 600;
                    color: #303133;
                }
            }

            .info-divider {
                width: 1px;
                height: 28px;
                background: #dcdfe6;
                margin: 0 16px;
            }
        }

        .executing-tip {
            color: #b0b4bc;
            font-size: 11px;
        }
    }

    .batch-result-content {
        text-align: center;
        padding: 10px 0 4px;

        .result-icon-wrap {
            margin: 0 auto 10px;
            font-size: 48px;
            line-height: 1;

            &.success { color: #67C23A; }
            &.fail { color: #F56C6C; }
        }

        .result-summary-text {
            font-size: 15px;
            font-weight: 500;
            color: #303133;
            margin-bottom: 16px;

            &.fail { color: #F56C6C; }
        }

        .result-stats {
            background: #f7f9fc;
            border-radius: 10px;
            padding: 14px 20px;
            margin: 0 16px 14px;

            .result-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 6px 0;

                &:not(:last-child) {
                    border-bottom: 1px dashed #ebeef5;
                }

                .result-label {
                    font-size: 13px;
                    color: #909399;
                }

                .result-value {
                    font-size: 14px;
                    font-weight: 600;
                    color: #303133;

                    &.success { color: #67C23A; }

                    &.fail-text {
                        color: #F56C6C;
                        font-weight: 500;
                        font-size: 12px;
                        word-break: break-all;
                        text-align: right;
                        max-width: 220px;
                    }

                    &.hash {
                        font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
                        font-size: 12px;
                        color: #409EFF;
                        cursor: pointer;
                        padding: 2px 6px;
                        background: #f0f7ff;
                        border-radius: 4px;
                        border: 1px solid #d9ecff;

                        &:hover {
                            background: #d9ecff;
                            color: #1a6dcc;
                        }
                    }
                }
            }
        }

        .result-remaining {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            padding: 10px 16px;
            background: #fdf6ec;
            border: 1px solid #f5dab1;
            border-radius: 8px;
            margin: 0 16px;
            font-size: 12px;
            color: #865c22;

            .el-icon { color: #E6A23C; font-size: 15px; flex-shrink: 0; }
            strong { color: #c45e1a; font-size: 13px; }
        }

    }
}

:global(.export-date-range-popper) {
    .el-picker-panel {
        font-size: 12px;
    }

    .el-date-range-picker__content {
        width: 280px;
        padding: 8px 10px;
    }

    .el-date-range-picker__header {
        margin-bottom: 8px;

        div {
            font-size: 15px;
        }
    }

    .el-date-table th {
        padding: 4px 0;
        font-size: 12px;
    }

    .el-date-table td div {
        height: 28px;
        padding: 1px 0;
    }

    .el-date-table td span {
        width: 24px;
        height: 24px;
        line-height: 24px;
    }

    .el-time-panel {
        width: 108px;
    }

    .el-time-spinner__wrapper {
        max-height: 160px;
    }

    .el-picker-panel__footer {
        padding: 6px 10px;
    }
}
</style>