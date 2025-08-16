import { Vue3OrgChartPlugin } from 'vue3-org-chart'
import 'vue3-org-chart/dist/style.css'

export const steupOrgChartPlugin = app => {
    app.use(Vue3OrgChartPlugin)
}