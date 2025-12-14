<template>
    <div class="login-container">
        <div class="login-background">
            <div class="background-decoration"></div>
        </div>
        <div class="login-content">
            <div class="login-box">
                <div class="login-header">
                    <h1 class="system-title">创世贡献者DAO治理系统</h1>
                    <p class="system-subtitle">管理后台</p>
                </div>
                <el-form :model="form" :rules="rules" ref="formRef" class="login-form">
                    <el-form-item prop="username">
                        <el-input 
                            v-model="form.username" 
                            placeholder="请输入用户名"
                            size="large"
                            :prefix-icon="User"
                            clearable
                        />
                    </el-form-item>
                    <el-form-item prop="password">
                        <el-input 
                            v-model="form.password" 
                            type="password" 
                            placeholder="请输入密码"
                            size="large"
                            :prefix-icon="Lock"
                            show-password
                            @keyup.enter="onSubmit"
                        />
                    </el-form-item>
                    <el-form-item>
                        <el-button 
                            type="primary" 
                            @click="onSubmit" 
                            :loading="loading"
                            size="large"
                            class="login-button"
                        >
                            {{ loading ? '登录中...' : '登录' }}
                        </el-button>
                    </el-form-item>
                </el-form>
            </div>
        </div>
    </div>
</template>
<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { inject } from 'vue'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { TOKEN } from '@/utils/constants'

const form = reactive({
    username: "",
    password: ''
})

const formRef = ref(null)
const loading = ref(false)
const _Cache = inject('$caches')
const _Api = inject('$api')
const router = useRouter()

const rules = {
    username: [
        { required: true, message: '请输入用户名', trigger: 'blur' },
        { min: 3, max: 50, message: '用户名长度需在3-50位之间', trigger: 'blur' }
    ],
    password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
    ]
}

const onSubmit = async () => {
    if (!formRef.value) return
    
    try {
        await formRef.value.validate()
        loading.value = true
        
        const res = await _Api._upLogin(form)
        if (res) {
            _Cache._LocalCache.Set(TOKEN, res.token)
            _Cache._LocalCache.Set('nickname', res.user.username)
            
            ElMessage.success('登录成功')
            
            // 添加跳转动画延迟
            setTimeout(() => {
                router.push("/")
            }, 300)
        }
    } catch (error) {
        if (error !== false) { // 表单验证失败会返回false，不需要显示错误
            console.error('登录失败:', error)
            ElMessage.error('登录失败: ' + (error.message || '用户名或密码错误'))
        }
    } finally {
        loading.value = false
    }
}
</script>
<style lang="scss" scoped>
.login-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
}

.login-background {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #79bbff 0%, #409EFF 50%, #337ecc 100%);
    z-index: 0;
    
    .background-decoration {
        position: absolute;
        width: 100%;
        height: 100%;
        background: 
            radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.12) 0%, transparent 50%),
            radial-gradient(circle at 40% 20%, rgba(255, 255, 255, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 60% 40%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
        animation: backgroundMove 20s ease-in-out infinite;
    }
}

@keyframes backgroundMove {
    0%, 100% {
        transform: translate(0, 0) scale(1);
    }
    50% {
        transform: translate(-20px, -20px) scale(1.05);
    }
}

.login-content {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 450px;
    padding: 20px;
}

.login-box {
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(12px);
    border-radius: 20px;
    padding: 50px 40px;
    box-shadow: 
        0 20px 60px rgba(64, 158, 255, 0.25),
        0 0 0 1px rgba(255, 255, 255, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.3);
    animation: slideIn 0.5s ease-out;
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(-30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.login-header {
    text-align: center;
    margin-bottom: 40px;
    
    .system-title {
        font-size: 28px;
        font-weight: 700;
        color: #303133;
        margin: 0 0 10px 0;
        background: linear-gradient(135deg, #409EFF 0%, #66b1ff 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        letter-spacing: 1px;
    }
    
    .system-subtitle {
        font-size: 16px;
        color: #909399;
        margin: 0;
        font-weight: 400;
    }
}

.login-form {
    :deep(.el-form-item) {
        margin-bottom: 24px;
    }
    
    :deep(.el-input__wrapper) {
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        transition: all 0.3s ease;
        border: 1px solid rgba(64, 158, 255, 0.1);
        
        &:hover {
            border-color: rgba(64, 158, 255, 0.3);
            box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
        }
        
        &.is-focus {
            border-color: #409EFF;
            box-shadow: 0 4px 12px rgba(64, 158, 255, 0.25);
        }
    }
    
    :deep(.el-input__inner) {
        height: 48px;
        line-height: 48px;
    }
}

.login-button {
    width: 100%;
    height: 48px;
    font-size: 16px;
    font-weight: 500;
    border-radius: 8px;
    background: linear-gradient(135deg, #66b1ff 0%, #409EFF 100%);
    border: none;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(64, 158, 255, 0.35);
    
    &:hover {
        background: linear-gradient(135deg, #79bbff 0%, #66b1ff 100%);
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(64, 158, 255, 0.45);
    }
    
    &:active {
        transform: translateY(0);
        box-shadow: 0 2px 10px rgba(64, 158, 255, 0.3);
    }
    
    &.is-loading {
        background: linear-gradient(135deg, #66b1ff 0%, #409EFF 100%);
    }
}

// 响应式设计
@media (max-width: 768px) {
    .login-content {
        max-width: 90%;
        padding: 15px;
    }
    
    .login-box {
        padding: 40px 30px;
    }
    
    .login-header {
        .system-title {
            font-size: 24px;
        }
        
        .system-subtitle {
            font-size: 14px;
        }
    }
}
</style>