import axios from 'axios'
import { IS_DEV, API_BASE_URL,API_PREFIX } from '@/utils/constants'
import { _AdjustP8, _FormatDate } from '@/utils/commonFn'
import router from '@/router'
import { _LocalCache } from "@/utils/cache";
import { TOKEN } from '@/utils/constants'

// 开发环境使用 /api 让 Vite proxy 处理
// 生产环境使用完整的API地址
const baseURL = IS_DEV ? '/api' : (API_BASE_URL || API_PREFIX)

const service = axios.create({
    baseURL: baseURL,
    timeout: 30 * 1000,
    headers: { 'Content-Type': 'application/json' },
})
// 请求拦截器
service.interceptors.request.use(
    request => {
        if (request.data && request.headers['Content-Type'] === 'application/x-www-form-urlencoded') {
            request.data = qs.stringify(request.data)
        }
        request.headers['Authorization']=`Bearer ${_LocalCache.Get(TOKEN)}`;
        
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
        if (error.status === 401) router.push('/login')
        return Promise.reject(error)
    }
)

export default service
