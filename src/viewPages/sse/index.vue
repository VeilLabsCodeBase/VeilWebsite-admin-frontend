<template>
    <div>
        <h2>管理员 SSE 推送</h2>
        <ul>
            <li v-for="(msg, i) in messages" :key="i">{{ msg }}</li>
        </ul>
    </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { _LocalCache } from '@/utils/cache.js'
import { TOKEN } from '@/utils/constants.js'

const messages = ref([]);
let eventSource = null;

onMounted(() => {
    // const token = localStorage.getItem('jwtToken'); // 假设已登录存了 JWT
    let token = _LocalCache.Get(TOKEN)
    console.log(token);
    if (!token) {
        console.error('未登录，缺少 token');
        return;
    }

    // 连接后端 SSE
    eventSource = new EventSource(`http://localhost:8084/api/admin/sse/userWithdrawNotice?token=${token}`);

    // 默认消息
    eventSource.onmessage = (e) => {
        messages.value.push(`系统消息: ${e}`);
    };

    // 监听指定事件
    eventSource.addEventListener('new-withdraw', (e) => {
        // messages.value.push(`订单更新: ${e.data}`);
        // debugger
        console.log("fsafsafsafsafsafsa");
        console.log(e.data);
    });

    // 错误处理
    eventSource.onerror = (err) => {
        console.error('SSE 错误:', err);
        eventSource.close();
    };
});

onBeforeUnmount(() => {
    if (eventSource) {
        eventSource.close();
    }
});
</script>