<template>
    <div class="login">
        <el-form :model="form" label-width="auto" style="max-width: 800px">
            <el-form-item label="账号">
                <el-input v-model="form.email" style="width: 300px" />
            </el-form-item>
            <el-form-item label="密码">
                <el-input v-model="form.password" type="password" style="width: 300px" />
            </el-form-item>
            <el-form-item>
                <el-button type="primary" @click="onSubmit" style="width: 340px">登陆</el-button>
            </el-form-item>
        </el-form>

    </div>
</template>
<script setup>
import { reactive } from 'vue'
import { TOKEN } from '@/utils/constants'
const form = reactive({
    email: "",
    password: ''
})
const _Cache = inject('$caches')
const _Api = inject('$api')
const router = useRouter()
const onSubmit = async () => {
    const res = await _Api._upLogin(form)
    if(res){
        _Cache._LocalCache.Set(TOKEN, res.token)
        _Cache._LocalCache.Set('nickname', res.user.username)
        
        router.push("/");
    }
}
</script>
<style lang="scss" scoped>
.login {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgb(216.8, 235.6, 255);

    :deep() {
        .el-form-item__label {
            font-size: 0.16rem;
        }
    }

}
</style>