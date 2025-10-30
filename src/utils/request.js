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
        _ErrorMethod(error?.response?.data?.message)
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
    ElMessage.error(res)
}
