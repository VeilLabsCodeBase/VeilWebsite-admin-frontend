import { API_PREFIX, IS_DEV, TOKEN } from '@/utils/constants'
import { _LocalCache } from '@/utils/cache.js'
export class WebSource {
    eventSource = null
    token = _LocalCache.Get(TOKEN)
    messages = []
    withdrawData = []
    despositData = []
    initWebSouce() {
        if (!this.token) {
            console.error('未登录，缺少 token')
            return
        } else {
            this.eventSource = new EventSource(
                API_PREFIX+`/admin/sse/userWithdrawNotice?token=${this.token}`
            )
            // 错误处理
            this.eventSource.onerror = err => {
                console.error('SSE 错误:', err)
                this.eventSource.close()
            }
            // this.getNewWithdraw()
            // this.getNewDesposit()
        }
    }
    getDefaultMessage() {
        this.eventSource.onmessage = e => {
            this.messages.push(`系统消息: ${e}`)
        }
    }
    getNewWithdraw(callback) {
        // 监听用户提现
        if (this.eventSource) {
            this.eventSource.addEventListener('new-withdraw', e => {
                // console.log('监听用户提现')
                // console.log(e.data)
                this.withdrawData.push(e.data)
                console.log('提现', this.withdrawData)
                callback(this.withdrawData)
            })
        }
    }
    getNewDesposit(callback) {
        // 监听用户充值
        if (this.eventSource) {
            this.eventSource.addEventListener('new-deposit', e => {
                // console.log('监听用户充值')
                this.despositData.push(e.data)
                console.log('充值', this.despositData)
                callback(this.despositData)
            })
        }
    }
    closeWebSource() {
        if (this.eventSource) {
            this.eventSource.close()
        }
    }
}
// var eventSource = null;
// export initWebSource=()=>{
//      let token = _LocalCache.Get(TOKEN)
//     console.log(token);
//     if (!token) {
//         console.error('未登录，缺少 token');
//         return;
//     }

//     // 连接后端 SSE

//     // 默认消息
//     eventSource.onmessage = (e) => {
//         messages.value.push(`系统消息: ${e}`);
//     };

//     // 监听用户提现
//     eventSource.addEventListener('new-withdraw', (e) => {
//         // messages.value.push(`订单更新: ${e.data}`);
//         // debugger
//         console.log("监听用户提现");
//         console.log(e.data);
//     });

//     // 监听用户充值
//     eventSource.addEventListener('new-deposit', (e) => {
//         // messages.value.push(`订单更新: ${e.data}`);
//         // debugger
//         console.log("监听用户充值");
//         console.log(e.data);
//     });

// }
// export closeWebSource=()=>{
//     if (eventSource) {
//         eventSource.close();
//     }
// }
