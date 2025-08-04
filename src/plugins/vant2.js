import { Lazyload, ConfigProvider } from 'vant'

export const steupVantPlugin = app => {
    app.use(Lazyload, { lazyComponent: true })
    app.use(ConfigProvider)
}
