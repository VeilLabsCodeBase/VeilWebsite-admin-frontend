import { _GlobalApi } from './global'

//挂载vue,可全局调用
export const _SetupApi = app => {
    const _ApiList = {
        ..._GlobalApi,
     
    }
    app.config.globalProperties.$api = _ApiList
    app.provide('$api', _ApiList)
}
