import axios from '@/utils/axios'
import { _GetUuid } from '@/utils/commonFn'
import { _LocalCache } from '@/utils/cache'
import { _EncryptData, _DecryptData } from '@/utils/aes'
import { TOKEN, IS_ENCRYPT, AES_API_KEY, API_COMMON_PREFIX } from '@/utils/constants'
import router from '@/router'
import { ElMessage } from 'element-plus'

export const _Request = async (url, param, method = 'post') => {
    // axios 的 baseURL 已经包含 /api，这里直接使用传入的 url
    const _AllUrl = url
    let token = _LocalCache.Get(TOKEN)
    let params = {
        // token: token || '',
        ...param,
    }
    let res;
    try {
        if (method == 'post') {
            res = await axios.post(_AllUrl, param)
        } else if (method == 'get') {
            res = await axios.get(_AllUrl, {
                params: param,
            })
        } else if (method == 'delete') {
            res = await axios.delete(_AllUrl, {
                params: param,
            })
        } else if (method == 'put') {
            res = await axios.put(_AllUrl, param)
        }
        if (res?.code == 200) {
            let data
            data = res.data
            return data || true
        } else if (res?.code == 401) {
            router.push('/login')
        } else {
            _ErrorMethod(res?.message)
        }
    } catch (error) {
        console.log(error);
        // 如果是 500|400 错误，拦截器已经准备了消息，这里不再显示
        // 不标记 _handledByBusiness，让业务层决定是否处理
        if (error?.response?.status === 500 || error?.response?.status === 400) {
            return Promise.reject(error)
        }
        // 其他错误，如果有 message 则显示，并标记已处理（因为 _Request 已经处理了）
        const errorMessage = error?.response?.data?.message
        if (errorMessage) {
            error._handledByBusiness = true
            _ErrorMethod(errorMessage)
        }
        return Promise.reject(error)
    }
}

// 刷新Token
const _RefreshTOKEN = async (url, param, method) => {
    sessionStorage.setItem('axiosFlag', 1)
    let params = {
        deviceId: _LocalCache.Get('deviceId') ? _LocalCache.Get('deviceId') : _GetUuid(),
        token: 'null_null',
        data: {
            app_code: 'ios',
            device_info: '',
            clipboard_text: '',
            channel_code: '',
        },
    }
    if (IS_ENCRYPT) {
        params = _EncryptData(params, AES_API_KEY)
    }
    const res = await axios.post('/system/info', params)
    if (res && !res.error) {
        let data
        if (IS_ENCRYPT) {
            data = _DecryptData(res, AES_API_KEY)
        } else {
            data = res
        }
        if (data.status == 'y') {
            data = data.data
            if (data.token) {
                _LocalCache.Set(TOKEN, data.token.token + '_' + data.token.user_id)
            }
            sessionStorage.setItem('axiosFlag', 0)
            return _Request(url, param, method)
        }
    } else {
        _ErrorMethod(res.error)
        // showToast('数据加载失败，请退出重进')
    }
}

const _ErrorMethod = res => {
    // 只有当错误消息存在且不为空时才显示
    if (res && typeof res === 'string' && res.trim() !== '') {
        ElMessage.error(res)
    }
}

/**
 * 处理 API 错误，避免与拦截器重复显示
 * 优先使用业务自定义消息，如果没有则使用拦截器的消息作为兜底
 * @param {Error} error - 错误对象
 * @param {string} defaultMessage - 业务自定义错误消息（可选）
 */
export const handleApiError = (error, defaultMessage = null) => {
    // 标记业务层已经处理了这个错误，拦截器将不再显示
    error._handledByBusiness = true
    
    // 优先使用业务自定义消息
    if (defaultMessage && typeof defaultMessage === 'string' && defaultMessage.trim() !== '') {
        ElMessage.error(defaultMessage)
        return
    }
    
    // 如果没有业务自定义消息，使用拦截器准备的消息（如 500 错误的友好提示）
    if (error._interceptorMessage) {
        ElMessage.error(error._interceptorMessage)
        return
    }
    
    // 最后使用错误对象中的消息
    const errorMessage = error?.response?.data?.message || 
                       error?.message || 
                       '操作失败，请稍后重试'
    
    if (errorMessage && typeof errorMessage === 'string' && errorMessage.trim() !== '') {
        ElMessage.error(errorMessage)
    }
}
