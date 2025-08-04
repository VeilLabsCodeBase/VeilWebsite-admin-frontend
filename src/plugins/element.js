import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

export const steupElementPlugin = app => {
    app.use(ElementPlus, { zIndex: 3000 })
}