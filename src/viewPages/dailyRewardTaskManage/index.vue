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
                    <el-button 
                        type="primary" 
                        size="large" 
                        @click="executeTask"
                        :loading="executing">
                        <el-icon v-if="!executing"><CaretRight /></el-icon>
                        {{ executing ? '执行中...' : '手动执行任务' }}
                    </el-button>
                </div>

                <div v-if="lastExecuteResult" class="executeResult">
                    <el-divider>执行结果</el-divider>
                    <el-descriptions :column="1" border>
                        <el-descriptions-item label="执行时间">
                            {{ lastExecuteResult.executeTime }}
                        </el-descriptions-item>
                        <el-descriptions-item label="执行状态">
                            <el-tag :type="lastExecuteResult.success ? 'success' : 'danger'">
                                {{ lastExecuteResult.success ? '成功' : '失败' }}
                            </el-tag>
                        </el-descriptions-item>
                        <el-descriptions-item label="处理记录数">
                            {{ lastExecuteResult.processedCount || 0 }}
                        </el-descriptions-item>
                        <el-descriptions-item label="成功数">
                            <span style="color: #67C23A;">{{ lastExecuteResult.successCount || 0 }}</span>
                        </el-descriptions-item>
                        <el-descriptions-item label="失败数">
                            <span style="color: #F56C6C;">{{ lastExecuteResult.failureCount || 0 }}</span>
                        </el-descriptions-item>
                        <el-descriptions-item label="消息" v-if="lastExecuteResult.message">
                            {{ lastExecuteResult.message }}
                        </el-descriptions-item>
                        <el-descriptions-item label="错误信息" v-if="lastExecuteResult.error">
                            <el-text type="danger">{{ lastExecuteResult.error }}</el-text>
                        </el-descriptions-item>
                    </el-descriptions>
                </div>
            </div>
        </div>
    </div>
</template>
<script setup>
import { ElMessage, ElMessageBox } from 'element-plus'
import { CaretRight } from '@element-plus/icons-vue'
import { ref, inject } from 'vue'

const _Api = inject('$api')
const executing = ref(false)
const lastExecuteResult = ref(null)

const executeTask = async () => {
    try {
        await ElMessageBox.confirm(
            '确定要手动执行每日收益计算任务吗？此操作会立即触发任务执行。',
            '确认执行',
            {
                confirmButtonText: '确定执行',
                cancelButtonText: '取消',
                type: 'warning',
            }
        )
        
        executing.value = true
        const res = await _Api._executeDailyRewardCalculation()
        
        if (res) {
            lastExecuteResult.value = {
                executeTime: new Date().toLocaleString('zh-CN'),
                success: true,
                processedCount: res.processedCount || 0,
                successCount: res.successCount || 0,
                failureCount: res.failureCount || 0,
                message: res.message || '任务执行成功'
            }
            ElMessage.success('任务执行成功')
        }
    } catch (error) {
        if (error !== 'cancel') {
            console.error('任务执行失败:', error)
            lastExecuteResult.value = {
                executeTime: new Date().toLocaleString('zh-CN'),
                success: false,
                error: error.message || '任务执行失败，请查看服务器日志'
            }
            ElMessage.error('任务执行失败：' + (error.message || '未知错误'))
        }
    } finally {
        executing.value = false
    }
}
</script>
<style lang="scss" scoped>
.taskManage {
    padding: 20px;
    height: 100%;
    
    .taskCard {
        background: #fff;
        border-radius: 8px;
        box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
        padding: 24px;
        
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
            
            .executeResult {
                margin-top: 32px;
                
                .el-divider {
                    margin: 24px 0;
                }
            }
        }
    }
}
</style>

