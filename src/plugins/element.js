import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn'

export const steupElementPlugin = app => {
    app.use(ElementPlus, { 
        zIndex: 3000,
        locale: zhCn
    })
}