import { createApp } from 'vue'
import App from './App.vue'
const app = createApp(App)
import { setupRouter } from '@/router'
import { setupStore } from '@/store'
import { steupPlugin } from '@/plugins'
import { _SetupUtilsFn } from '@/utils/commonFn'
import { _SetupApi } from '@/api'
import { _SetupCache } from '@/utils/cache'
import './init'

setupRouter(app) // router
setupStore(app) // store
steupPlugin(app) // plugin
_SetupUtilsFn(app) // filter
_SetupApi(app) // api
_SetupCache(app) // localStorage sessionstorage 存取

app.mount('#app')
