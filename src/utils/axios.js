import axios from 'axios'
import { IS_DEV, API_BASE_URL, API_PREFIX } from '@/utils/constants'
import { _AdjustP8, _FormatDate } from '@/utils/commonFn'
import router from '@/router'
import { _LocalCache } from "@/utils/cache";
import { TOKEN } from '@/utils/constants'
import { ElMessage } from 'element-plus'
// 统一使用环境变量中的API_PREFIX作为baseURL
const service = axios.create({
    baseURL: API_PREFIX,
    timeout: 30 * 1000,
    headers: { 'Content-Type': 'application/json' },
})
// 请求拦截器
service.interceptors.request.use(
    request => {
        if (request.data && request.headers['Content-Type'] === 'application/x-www-form-urlencoded') {
            request.data = qs.stringify(request.data)
        }
        request.headers['Authorization'] = `Bearer ${_LocalCache.Get(TOKEN)}`;

        return request
    },
    error => Promise.reject(error)
)

// 响应拦截器
service.interceptors.response.use(
    response => {

        // // 接口返回的三个字段
        // let { code, data, message } = response

        // if (code === 200) {
        //     if (ENCRYPT) data = DecryptData(data, AES_API_KEY) // 解密
        //     return Promise.resolve(data)
        // }

        // // 401 未登录 跳转到登录页
        // if (code === 401) router.replace('/login')

        // return Promise.reject({ code, message })
        // return response.data
        return Promise.resolve(response.data)
    },
    error => {
        // 处理 401 未登录，跳转到登录页
        if (error.response?.status === 401) {
            router.push('/login')
            return Promise.reject(error)
        }

        // 处理 500|400 服务器错误
        if (error.response?.status === 500 || error.response?.status === 400) {
            // 在错误对象上添加标记，表示拦截器准备处理这个错误
            error._interceptorMessage = '服务异常，请联系运维人员'
            // 延迟显示，给业务层机会先处理
            // 如果业务层已经处理了（设置了 _handledByBusiness），就不显示
            setTimeout(() => {
                // 检查业务层是否已经处理了这个错误
                if (!error._handledByBusiness && error._interceptorMessage) {
                    ElMessage.error(error._interceptorMessage)
                }
            }, 0)
            return Promise.reject(error)
        }

        // 其他错误继续抛出
        return Promise.reject(error)
    }
)

export default service
