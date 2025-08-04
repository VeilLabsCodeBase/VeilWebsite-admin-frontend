import { steupVantPlugin } from './vant2'
import { steupElementPlugin } from './element'

export const steupPlugin = app => {
    steupVantPlugin(app)
    steupElementPlugin(app)
}
