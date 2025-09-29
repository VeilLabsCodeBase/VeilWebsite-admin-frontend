import { steupVantPlugin } from './vant2'
import { steupElementPlugin } from './element'
import { steupOrgChartPlugin } from './orgChart'

export const steupPlugin = app => {
    steupVantPlugin(app)
    steupElementPlugin(app)
    steupOrgChartPlugin(app)
}
