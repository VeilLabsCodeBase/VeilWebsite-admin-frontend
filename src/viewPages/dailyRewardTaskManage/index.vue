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
                        <p>每日收益计算任务采用24小时制，每1分钟自动执行一次，计算并发放用户的质押收益。</p>
                        <p>如果需要手动触发单条质押记录的收益计算，可以点击下方按钮选择质押记录并执行。</p>
                        <p><strong>注意：</strong>手动执行会立即触发任务，请确保在合适的时间执行。执行次数表示对该质押记录执行多少次收益计算。</p>
                    </template>
                </el-alert>
                
                <div class="taskInfo">
                    <el-descriptions title="任务信息" :column="2" border>
                        <el-descriptions-item label="任务名称">每日收益计算与发放任务（24小时制）</el-descriptions-item>
                        <el-descriptions-item label="执行频率">每1分钟自动执行一次</el-descriptions-item>
                        <el-descriptions-item label="任务功能">
                            计算所有活跃质押记录的每日收益（基于next_reward_time），并发放到用户账户
                        </el-descriptions-item>
                        <el-descriptions-item label="并发控制">
                            使用SELECT ... FOR UPDATE SKIP LOCKED，确保多实例环境下不会重复处理同一条记录
                        </el-descriptions-item>
                    </el-descriptions>
                </div>

                <div class="actionArea">
                            <el-button 
                                type="primary" 
                                size="large" 
                        @click="showStakingRecordDialog"
                                :loading="executing">
                                <el-icon v-if="!executing"><CaretRight /></el-icon>
                                {{ executing ? '执行中...' : '手动执行任务' }}
                            </el-button>
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
                                {{ row.targetDate || '单条触发' }}
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
        
        <!-- 质押记录选择对话框 -->
        <el-dialog v-model="stakingRecordDialogVisible" title="选择质押记录" width="1200" destroy-on-close>
            <div class="staking-record-dialog">
                <el-table 
                    :data="stakingRecords?.records" 
                    border 
                    style="width: 100%" 
                    v-loading="loadingStakingRecords"
                    :row-key="row => row.id"
                    :scrollable="true"
                    @row-click="handleRowClick"
                    highlight-current-row>
                    <el-table-column width="60" label="选择" fixed="left" align="center">
                        <template #default="{ row }">
                            <el-radio 
                                :label="row.id" 
                                v-model="selectedStakingRecordId"
                                @change="handleStakingRecordRadioChange(row)"
                                @click.stop
                                class="staking-record-radio">
                            </el-radio>
                        </template>
                    </el-table-column>
                    <el-table-column prop="id" label="ID" width="80" fixed="left" />
                    <el-table-column prop="userId" label="用户ID" width="100" fixed="left" />
                    <el-table-column prop="username" label="用户名" width="120" fixed="left" />
                    <el-table-column prop="depositId" label="充值ID" width="100" fixed="left" />
                    <el-table-column prop="totalAmount" label="质押金额(USDT)" width="140" fixed="left">
                        <template #default="{ row }">
                            {{ row.totalAmount?.toFixed(2) }}
                        </template>
                    </el-table-column>
                    <el-table-column prop="amountUsdt" label="USDT金额" width="120">
                        <template #default="{ row }">
                            {{ row.amountUsdt?.toFixed(2) }}
                        </template>
                    </el-table-column>
                    <el-table-column prop="amountToken" label="Token金额" width="120">
                        <template #default="{ row }">
                            {{ row.amountToken?.toFixed(2) }}
                        </template>
                    </el-table-column>
                    <el-table-column prop="periodDays" label="质押周期(天)" width="120" />
                    <el-table-column prop="dailyRate" label="日算力倍率(%)" width="130">
                        <template #default="{ row }">
                            {{ row.dailyRate }}
                        </template>
                    </el-table-column>
                    <el-table-column prop="rewardMultiple" label="收益倍数" width="100" />
                    <el-table-column prop="withdrawRule" label="提现规则" width="150">
                        <template #default="{ row }">
                            {{ getWithdrawRuleDesc(row.withdrawRule) }}
                        </template>
                    </el-table-column>
                    <el-table-column prop="startDate" label="开始日期" width="120">
                        <template #default="{ row }">
                            {{ formatDate(row.startDate) }}
                        </template>
                    </el-table-column>
                    <el-table-column prop="endDate" label="到期日期" width="120">
                        <template #default="{ row }">
                            {{ formatDate(row.endDate) }}
                        </template>
                    </el-table-column>
                    <el-table-column prop="status" label="状态" width="100">
                        <template #default="{ row }">
                            <el-tag :type="getStatusType(row.status)">
                                {{ getStatusText(row.status) }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column prop="nextRewardTime" label="下次收益产生时间" width="180">
                        <template #default="{ row }">
                            {{ row.nextRewardTime ? formatDateTime(row.nextRewardTime) : '-' }}
                        </template>
                    </el-table-column>
                    <el-table-column prop="rewardSequence" label="已产生收益笔数" width="130">
                        <template #default="{ row }">
                            {{ row.rewardSequence || 0 }}
                        </template>
                    </el-table-column>
                    <el-table-column prop="createdAt" label="创建时间" width="180">
                        <template #default="{ row }">
                            {{ formatDateTime(row.createdAt) }}
                        </template>
                    </el-table-column>
                </el-table>
                <div class="page" style="margin-top: 20px;">
                    <el-pagination 
                        v-model:current-page="stakingRecordPage" 
                        v-model:page-size="stakingRecordPageSize" 
                        background
                        :total="stakingRecords?.total || 0" 
                        @size-change="handleStakingRecordSizeChange"
                        @current-change="handleStakingRecordPageChange" />
                </div>
            </div>
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="stakingRecordDialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="handleConfirmStakingRecord" :disabled="selectedStakingRecord === null">
                        确定
                    </el-button>
                </div>
            </template>
        </el-dialog>
        
        <!-- 执行次数选择对话框 -->
        <el-dialog v-model="executionCountDialogVisible" title="选择执行次数" width="500" destroy-on-close>
            <div class="execution-count-dialog">
                <el-alert
                    title="提示"
                    type="info"
                    :closable="false"
                    show-icon
                    style="margin-bottom: 20px;">
                    <template #default>
                        <p>质押记录ID: {{ selectedStakingRecord?.id }}</p>
                        <p>质押周期: {{ selectedStakingRecord?.periodDays }} 天</p>
                        <p>已产生收益笔数: {{ selectedStakingRecord?.rewardSequence || 0 }} 笔</p>
                        <p>剩余可执行次数: {{ (selectedStakingRecord?.periodDays || 0) - (selectedStakingRecord?.rewardSequence || 0) }} 次</p>
                        <p>请选择执行次数（表示对该质押记录执行多少次收益计算）</p>
                    </template>
                </el-alert>
                <el-form :model="executionCountForm" label-width="120px">
                    <el-form-item label="执行次数" required>
                        <el-select v-model="executionCountForm.executionCount" placeholder="请选择执行次数" style="width: 100%">
                            <el-option 
                                v-for="count in executionCountOptions" 
                                :key="count" 
                                :label="`${count} 次`" 
                                :value="count" />
                        </el-select>
                    </el-form-item>
                </el-form>
            </div>
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="executionCountDialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="handleExecuteTask" :loading="executing">
                        确定执行
                    </el-button>
                </div>
            </template>
        </el-dialog>
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
const pageSize = ref(5)
const currentPage = ref(1)

// 质押记录相关
const stakingRecordDialogVisible = ref(false)
const stakingRecords = ref(null)
const loadingStakingRecords = ref(false)
const stakingRecordPage = ref(1)
const stakingRecordPageSize = ref(10)
const selectedStakingRecord = ref(null)
const selectedStakingRecordId = ref(null)

// 执行次数相关
const executionCountDialogVisible = ref(false)
const executionCountForm = ref({
    executionCount: null
})
const executionCountOptions = ref([])

// 显示质押记录选择对话框
const showStakingRecordDialog = async () => {
    // 重置选择状态
    selectedStakingRecord.value = null
    selectedStakingRecordId.value = null
    stakingRecordDialogVisible.value = true
    await getStakingRecords(1)
}

// 获取质押记录列表
const getStakingRecords = async (page) => {
    loadingStakingRecords.value = true
    try {
        const params = {
            pageNo: page,
            pageSize: stakingRecordPageSize.value
        }
        const res = await _Api._stakingRecordsList(params)
        if (res) {
            stakingRecords.value = res
        }
    } catch (error) {
        console.error('获取质押记录失败:', error)
        ElMessage.error('获取质押记录失败')
    } finally {
        loadingStakingRecords.value = false
    }
}

// 质押记录分页处理
const handleStakingRecordSizeChange = (val) => {
    stakingRecordPageSize.value = val
    getStakingRecords(stakingRecordPage.value)
}

const handleStakingRecordPageChange = (val) => {
    stakingRecordPage.value = val
    getStakingRecords(stakingRecordPage.value)
}

// 处理行点击事件（点击整行选择）
const handleRowClick = (row) => {
    // 检查状态是否为"进行中"
    if (row.status !== 'ACTIVE') {
        ElMessage.warning('只能选择状态为"进行中"的质押记录')
        selectedStakingRecordId.value = null
        selectedStakingRecord.value = null
        return
    }
    
    // 检查下次收益产生时间
    if (row.nextRewardTime) {
        const nextRewardTime = new Date(row.nextRewardTime)
        const now = new Date()
        if (nextRewardTime > now) {
            ElMessage.warning('下次收益产生时间未到，无法选择')
            selectedStakingRecordId.value = null
            selectedStakingRecord.value = null
            return
        }
    }
    
    // 设置选中的记录
    selectedStakingRecordId.value = row.id
    selectedStakingRecord.value = row
}

// 处理质押记录选择（单选框）
const handleStakingRecordRadioChange = (row) => {
    // 检查状态是否为"进行中"
    if (row.status !== 'ACTIVE') {
        ElMessage.warning('只能选择状态为"进行中"的质押记录')
        selectedStakingRecordId.value = null
        selectedStakingRecord.value = null
        return
    }
    
    // 检查下次收益产生时间
    if (row.nextRewardTime) {
        const nextRewardTime = new Date(row.nextRewardTime)
        const now = new Date()
        if (nextRewardTime > now) {
            ElMessage.warning('下次收益产生时间未到，无法选择')
            selectedStakingRecordId.value = null
            selectedStakingRecord.value = null
            return
        }
    }
    
    selectedStakingRecord.value = row
}

// 确认选择质押记录
const handleConfirmStakingRecord = () => {
    if (!selectedStakingRecord.value) {
        ElMessage.warning('请选择一条质押记录')
        return
    }
    
    // 再次检查状态
    if (selectedStakingRecord.value.status !== 'ACTIVE') {
        ElMessage.warning('只能选择状态为"进行中"的质押记录')
        return
    }
    
    // 再次检查下次收益产生时间
    if (selectedStakingRecord.value.nextRewardTime) {
        const nextRewardTime = new Date(selectedStakingRecord.value.nextRewardTime)
        const now = new Date()
        if (nextRewardTime > now) {
            ElMessage.warning('下次收益产生时间未到，无法选择')
            return
        }
    }
    
    // 生成执行次数选项（根据质押周期和已产生的收益笔数）
    const periodDays = selectedStakingRecord.value.periodDays
    const rewardSequence = selectedStakingRecord.value.rewardSequence || 0
    generateExecutionCountOptions(periodDays, rewardSequence)
    
    // 如果生成选项失败（已产生所有收益），不打开对话框
    if (executionCountOptions.value.length === 0) {
        return
    }
    
    // 关闭质押记录对话框，打开执行次数对话框
    stakingRecordDialogVisible.value = false
    executionCountDialogVisible.value = true
}

// 生成执行次数选项（根据质押周期和已产生的收益笔数）
const generateExecutionCountOptions = (periodDays, rewardSequence) => {
    const options = []
    
    // 计算剩余可执行次数：质押周期 - 已产生的收益笔数
    const remainingCount = periodDays - (rewardSequence || 0)
    
    if (remainingCount <= 0) {
        ElMessage.warning('该质押记录已产生所有收益，无法继续执行')
        executionCountOptions.value = []
        executionCountForm.value.executionCount = null
        return
    }
    
    // 至少包含1次和剩余次数
    options.push(1)
    if (remainingCount > 1) {
        options.push(remainingCount)
    }
    
    // 如果剩余次数大于1，均匀分布其他选项
    if (remainingCount > 1) {
        // 计算需要多少个选项（最多15个）
        const maxOptions = Math.min(15, remainingCount)
        const step = Math.max(1, Math.floor((remainingCount - 1) / (maxOptions - 2)))
        
        // 从2开始，每隔step添加一个选项，直到remainingCount-1
        for (let i = 2; i < remainingCount; i += step) {
            if (options.length >= maxOptions) break
            if (!options.includes(i)) {
                options.push(i)
            }
        }
        
        // 确保包含remainingCount
        if (!options.includes(remainingCount)) {
            options.push(remainingCount)
        }
    }
    
    // 排序并去重
    executionCountOptions.value = [...new Set(options)].sort((a, b) => a - b)
    
    // 默认选择1次
    executionCountForm.value.executionCount = 1
}

// 提现规则描述
const getWithdrawRuleDesc = (rule) => {
    const ruleMap = {
        'MATURITY_SETTLEMENT': '到期本利结算',
        'DAILY_REWARD_PRINCIPAL_RETURN': '每日收益；本金到期退回',
        'DAILY_REWARD_NO_PRINCIPAL': '每日收益；本金锁定'
    }
    return ruleMap[rule] || rule
}

// 状态文本和类型（质押记录）
const getStatusText = (status) => {
    const statusMap = {
        'ACTIVE': '进行中',
        'COMPLETED': '已完成',
        'CANCELLED': '已取消'
    }
    return statusMap[status] || status
}

const getStatusType = (status) => {
    const typeMap = {
        'ACTIVE': 'success',
        'COMPLETED': 'info',
        'CANCELLED': 'warning',
        'RUNNING': 'warning',
        'SUCCESS': 'success',
        'FAILED': 'danger'
    }
    return typeMap[status] || ''
}

// 格式化日期
const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    try {
        const date = new Date(dateStr)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
    } catch (e) {
        if (typeof dateStr === 'string' && dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
            return dateStr.substring(0, 10)
        }
        return dateStr
    }
}

// 执行任务
const handleExecuteTask = async () => {
    if (!selectedStakingRecord.value) {
        ElMessage.warning('请选择质押记录')
        return
    }
    
    if (!executionCountForm.value.executionCount) {
        ElMessage.warning('请选择执行次数')
        return
    }
    
    try {
        await ElMessageBox.confirm(
            `确定要手动执行该质押记录的收益计算任务吗？\n质押记录ID: ${selectedStakingRecord.value.id}\n执行次数: ${executionCountForm.value.executionCount} 次\n此操作会立即触发任务执行（异步执行，可能需要较长时间）。`,
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
        const requestPromise = _Api._executeDailyRewardCalculation({
            stakingRecordId: selectedStakingRecord.value.id,
            executionCount: executionCountForm.value.executionCount
        })
        
        try {
            // 使用Promise.race实现超时控制
            const res = await Promise.race([requestPromise, timeoutPromise])
            
            if (res) {
                ElMessage.success('任务已提交，正在后台执行中，请稍后刷新查看执行结果')
                // 关闭对话框
                executionCountDialogVisible.value = false
                selectedStakingRecord.value = null
                executionCountForm.value.executionCount = null
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
                // 关闭对话框
                executionCountDialogVisible.value = false
                selectedStakingRecord.value = null
                executionCountForm.value.executionCount = null
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
    
    .staking-record-dialog {
        .page {
            margin-top: 20px;
            display: flex;
            justify-content: center;
        }
        
        // 美化单选框样式
        :deep(.staking-record-radio) {
            .el-radio__input {
                .el-radio__inner {
                    width: 18px;
                    height: 18px;
                    border: 2px solid #dcdfe6;
                    transition: all 0.3s;
                    
                    &::after {
                        width: 8px;
                        height: 8px;
                        background-color: #409eff;
                    }
                }
                
                &.is-checked .el-radio__inner {
                    border-color: #409eff;
                    background-color: #409eff;
                }
            }
            
            .el-radio__label {
                display: none;
            }
        }
        
        // 表格样式优化
        :deep(.el-table) {
            .el-table__fixed-left {
                box-shadow: 2px 0 6px rgba(0, 0, 0, 0.1);
            }
            
            .el-table__fixed-right {
                box-shadow: -2px 0 6px rgba(0, 0, 0, 0.1);
            }
            
            // 行点击样式
            tbody tr {
                cursor: pointer;
                transition: background-color 0.2s;
                
                &:hover {
                    background-color: #f5f7fa;
                }
                
                &.current-row {
                    background-color: #ecf5ff;
                }
            }
        }
    }
    
    .execution-count-dialog {
        padding: 10px 0;
    }
}
</style>

