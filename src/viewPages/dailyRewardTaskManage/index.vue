<template>
    <div class="taskManage">
        <div class="taskCard">
            <div class="cardHeader">
                <h2>每日收益计算任务管理</h2>
            </div>
            <div class="cardContent">
                <el-alert
                    title="任务说明"
                    type="info"
                    :closable="false"
                    show-icon>
                    <template #default>
                        <p>每日收益计算任务会在每天自动执行，计算并发放用户的质押收益。</p>
                        <p>如果自动任务执行失败或需要手动触发，可以点击下方按钮手动执行。</p>
                        <p><strong>注意：</strong>手动执行会立即触发任务，请确保在合适的时间执行。</p>
                    </template>
                </el-alert>
                
                <div class="taskInfo">
                    <el-descriptions title="任务信息" :column="2" border>
                        <el-descriptions-item label="任务名称">每日收益计算与发放任务</el-descriptions-item>
                        <el-descriptions-item label="执行频率">每日自动执行</el-descriptions-item>
                        <el-descriptions-item label="任务功能">
                            计算所有活跃质押记录的每日收益，并发放到用户账户
                        </el-descriptions-item>
                        <el-descriptions-item label="幂等性保障">
                            使用Redis分布式锁，确保多实例环境下不会重复执行
                        </el-descriptions-item>
                    </el-descriptions>
                </div>

                <div class="actionArea">
                    <el-form :model="executeForm" label-width="120px" inline>
                        <el-form-item label="计算日期">
                            <el-date-picker
                                v-model="executeForm.targetDate"
                                type="date"
                                placeholder="选择日期"
                                format="YYYY-MM-DD"
                                value-format="YYYY-MM-DD"
                                :disabled-date="disabledDate"
                                style="width: 200px"
                            />
                            <el-text type="info" style="margin-left: 12px; font-size: 12px;">
                                不选择则使用T+1机制（计算昨天的收益），日期不能超过今天
                            </el-text>
                        </el-form-item>
                        <el-form-item>
                            <el-button 
                                type="primary" 
                                size="large" 
                                @click="executeTask"
                                :loading="executing">
                                <el-icon v-if="!executing"><CaretRight /></el-icon>
                                {{ executing ? '执行中...' : '手动执行任务' }}
                            </el-button>
                        </el-form-item>
                    </el-form>
                </div>

                <div class="taskLogsArea">
                    <div class="logsHeader">
                        <h3>执行历史记录</h3>
                        <el-button type="primary" :icon="Refresh" @click="refreshLogs" :loading="loadingLogs">
                            刷新
                        </el-button>
                    </div>
                    <el-table :data="taskLogs?.records" border style="width: 100%" v-loading="loadingLogs">
                        <el-table-column prop="id" label="ID" width="80" />
                        <el-table-column prop="executionType" label="执行类型" width="120">
                            <template #default="{ row }">
                                <el-tag :type="row.executionType === 'MANUAL' ? 'primary' : 'info'">
                                    {{ row.executionType === 'MANUAL' ? '手动执行' : '定时任务' }}
                                </el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column prop="targetDate" label="目标日期" width="120">
                            <template #default="{ row }">
                                {{ row.targetDate || 'T+1机制' }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="executionStatus" label="执行状态" width="100">
                            <template #default="{ row }">
                                <el-tag :type="getStatusType(row.executionStatus)">
                                    {{ getStatusText(row.executionStatus) }}
                                </el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column prop="startTime" label="开始时间" width="180">
                            <template #default="{ row }">
                                {{ formatDateTime(row.startTime) }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="endTime" label="结束时间" width="180">
                            <template #default="{ row }">
                                {{ row.endTime ? formatDateTime(row.endTime) : '-' }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="durationSeconds" label="耗时(秒)" width="100">
                            <template #default="{ row }">
                                {{ row.durationSeconds || '-' }}
                            </template>
                        </el-table-column>
                        <el-table-column label="计算收益" width="180">
                            <template #default="{ row }">
                                <div style="font-size: 12px;">
                                    <div>总数: {{ row.calculateTotal || 0 }}</div>
                                    <div style="color: #67C23A;">成功: {{ row.calculateSuccess || 0 }}</div>
                                    <div style="color: #909399;">跳过: {{ row.calculateSkip || 0 }}</div>
                                    <div style="color: #F56C6C;">失败: {{ row.calculateFail || 0 }}</div>
                                </div>
                            </template>
                        </el-table-column>
                        <el-table-column label="发放收益" width="180">
                            <template #default="{ row }">
                                <div style="font-size: 12px;">
                                    <div>总数: {{ row.distributeTotal || 0 }}</div>
                                    <div style="color: #67C23A;">成功: {{ row.distributeSuccess || 0 }}</div>
                                    <div style="color: #909399;">跳过: {{ row.distributeSkip || 0 }}</div>
                                    <div style="color: #F56C6C;">失败: {{ row.distributeFail || 0 }}</div>
                                </div>
                            </template>
                        </el-table-column>
                        <el-table-column label="到期处理" width="120">
                            <template #default="{ row }">
                                <div style="font-size: 12px;">
                                    <div>总数: {{ row.expiredTotal || 0 }}</div>
                                    <div style="color: #67C23A;">已处理: {{ row.expiredProcessed || 0 }}</div>
                                </div>
                            </template>
                        </el-table-column>
                        <el-table-column prop="executionMessage" label="执行消息" min-width="200" show-overflow-tooltip />
                        <el-table-column prop="errorMessage" label="错误信息" min-width="200" show-overflow-tooltip>
                            <template #default="{ row }">
                                <el-text v-if="row.errorMessage" type="danger">{{ row.errorMessage }}</el-text>
                                <span v-else>-</span>
                            </template>
                        </el-table-column>
                    </el-table>
                    <div class="page" style="margin-top: 20px;">
                        <el-pagination 
                            v-model:current-page="currentPage" 
                            v-model:page-size="pageSize" 
                            background
                            :total="taskLogs?.total || 0" 
                            @size-change="handleSizeChange"
                            @current-change="handleCurrentChange" />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<script setup>
import { ElMessage, ElMessageBox } from 'element-plus'
import { CaretRight, Refresh } from '@element-plus/icons-vue'
import { ref, inject, onMounted } from 'vue'

const _Api = inject('$api')
const executing = ref(false)
const taskLogs = ref(null)
const loadingLogs = ref(false)
const executeForm = ref({
    targetDate: null
})
const pageSize = ref(10)
const currentPage = ref(1)

// 禁用超过今天的日期
const disabledDate = (time) => {
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    return time.getTime() > today.getTime()
}

const executeTask = async () => {
    try {
        // 验证日期不能超过今天
        if (executeForm.value.targetDate) {
            const selectedDate = new Date(executeForm.value.targetDate)
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            selectedDate.setHours(0, 0, 0, 0)
            
            if (selectedDate > today) {
                ElMessage.warning('计算日期不能超过今天')
                return
            }
        }
        
        const dateText = executeForm.value.targetDate 
            ? `计算日期：${executeForm.value.targetDate}` 
            : '使用T+1机制（计算昨天的收益）'
        
        await ElMessageBox.confirm(
            `确定要手动执行每日收益计算任务吗？\n${dateText}\n此操作会立即触发任务执行（异步执行，可能需要较长时间）。`,
            '确认执行',
            {
                confirmButtonText: '确定执行',
                cancelButtonText: '取消',
                type: 'warning',
            }
        )
        
        executing.value = true
        
        // 创建超时Promise（12秒）
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error('TIMEOUT'))
            }, 12000) // 12秒超时
        })
        
        // 创建请求Promise
        const requestPromise = _Api._executeDailyRewardCalculation(executeForm.value.targetDate)
        
        try {
            // 使用Promise.race实现超时控制
            const res = await Promise.race([requestPromise, timeoutPromise])
            
            if (res) {
                ElMessage.success('任务已提交，正在后台执行中，请稍后刷新查看执行结果')
                // 延迟刷新日志列表，给后端一些时间创建日志记录
                setTimeout(async () => {
                    await refreshLogs()
                }, 2000)
            }
        } catch (error) {
            if (error === 'cancel') {
                return
            }
            
            if (error.message === 'TIMEOUT') {
                // 超时情况：任务可能仍在执行，提示用户刷新
                ElMessage.warning({
                    message: '任务已提交，正在后台执行中，可能需要较长时间。请稍后刷新页面查看执行结果。',
                    duration: 5000,
                    showClose: true
                })
                // 延迟刷新日志列表
                setTimeout(async () => {
                    await refreshLogs()
                }, 2000)
            } else {
                // 其他错误
                console.error('任务执行失败:', error)
                ElMessage.error('任务提交失败：' + (error.message || '未知错误'))
                // 刷新日志列表以查看是否有失败记录
                setTimeout(async () => {
                    await refreshLogs()
                }, 2000)
            }
        }
    } catch (error) {
        if (error !== 'cancel') {
            console.error('任务执行失败:', error)
            ElMessage.error('任务执行失败：' + (error.message || '未知错误'))
        }
    } finally {
        executing.value = false
    }
}

// 获取任务日志列表
const getTaskLogs = async (page) => {
    loadingLogs.value = true
    try {
        const params = {
            pageNo: page,
            pageSize: pageSize.value,
        }
        const res = await _Api._getTaskLogs(params)
        if (res) {
            taskLogs.value = res
        }
    } catch (error) {
        console.error('获取任务日志失败:', error)
        ElMessage.error('获取任务日志失败')
    } finally {
        loadingLogs.value = false
    }
}

// 刷新日志列表
const refreshLogs = async () => {
    await getTaskLogs(currentPage.value)
}

// 分页处理
const handleSizeChange = (val) => {
    pageSize.value = val
    getTaskLogs(currentPage.value)
}

const handleCurrentChange = (val) => {
    currentPage.value = val
    getTaskLogs(currentPage.value)
}

// 状态文本和类型
const getStatusText = (status) => {
    const statusMap = {
        'RUNNING': '执行中',
        'SUCCESS': '成功',
        'FAILED': '失败'
    }
    return statusMap[status] || status
}

const getStatusType = (status) => {
    const typeMap = {
        'RUNNING': 'warning',
        'SUCCESS': 'success',
        'FAILED': 'danger'
    }
    return typeMap[status] || ''
}

// 格式化日期时间
const formatDateTime = (dateStr) => {
    if (!dateStr) return '-'
    try {
        const date = new Date(dateStr)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        const seconds = String(date.getSeconds()).padStart(2, '0')
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    } catch (e) {
        return dateStr
    }
}

// 页面加载时获取日志列表
onMounted(() => {
    refreshLogs()
})
</script>
<style lang="scss" scoped>
.taskManage {
    padding: 20px;
    padding-bottom: 40px; // 确保底部有足够空间，避免内容被遮挡
    box-sizing: border-box;
    
    .taskCard {
        background: #fff;
        border-radius: 8px;
        box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
        padding: 24px;
        padding-bottom: 40px; // 确保卡片底部有足够空间
        
        .cardHeader {
            margin-bottom: 24px;
            
            h2 {
                margin: 0;
                font-size: 20px;
                font-weight: 600;
                color: #303133;
            }
        }
        
        .cardContent {
            .el-alert {
                margin-bottom: 24px;
                
                p {
                    margin: 8px 0;
                    line-height: 1.6;
                }
            }
            
            .taskInfo {
                margin-bottom: 32px;
            }
            
            .actionArea {
                display: flex;
                justify-content: center;
                margin: 32px 0;
                
                .el-button {
                    min-width: 200px;
                }
            }
            
            .taskLogsArea {
                margin-top: 32px;
                margin-bottom: 20px; // 确保日志区域底部有空间
                
                .logsHeader {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 16px;
                    
                    h3 {
                        margin: 0;
                        font-size: 16px;
                        font-weight: 600;
                        color: #303133;
                    }
                }
                
                .page {
                    margin-top: 20px;
                    margin-bottom: 20px; // 确保分页器下方有空间
                }
            }
        }
    }
}
</style>

