import { CACHE_PREFIX, AES_CACHE_KEY } from './constants'
import { _EncryptData, _DecryptData } from './aes'

// local storage
export const _LocalCache = {
    Get: key => {
        const data = window.localStorage.getItem(`${CACHE_PREFIX}${key}`)
        return data ? _DecryptData(data, AES_CACHE_KEY) : null
    },
    Set: (key, value) =>
        value ? window.localStorage.setItem(`${CACHE_PREFIX}${key}`, _EncryptData(value, AES_CACHE_KEY)) : null,
    Remove: key => window.localStorage.removeItem(`${CACHE_PREFIX}${key}`),
    Clear: () => window.localStorage.clear(),
}

// session storage
export const _SessionCache = {
    Get: key => {
        const data = window.sessionStorage.getItem(`${CACHE_PREFIX}${key}`)
        return data ? _DecryptData(data, AES_CACHE_KEY) : null
    },
    Set: (key, value) =>
        value ? window.sessionStorage.setItem(`${CACHE_PREFIX}${key}`, _EncryptData(value, AES_CACHE_KEY)) : null,
    Remove: key => window.sessionStorage.removeItem(`${CACHE_PREFIX}${key}`),
    Clear: () => window.sessionStorage.clear(),
}

//挂载vue,可全局调用
export const _SetupCache = app => {
    const _CacheList = { _LocalCache, _SessionCache }
    app.config.globalProperties.$caches = _CacheList
    app.provide('$caches', _CacheList)
}
