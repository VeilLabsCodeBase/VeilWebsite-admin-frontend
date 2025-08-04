import { useGlobalStore } from '@/store/global'
import { storeToRefs } from 'pinia'
const _GlobalStore = useGlobalStore()
const { scrollTop } = storeToRefs(_GlobalStore)
const _ScrollHeightList = ref([])
//一级tab时使用
const tabActive = ref(0)
//二级tab时使用
const tabActive2 = ref(null)
// 开始记录滚动条位置的开关
const flag = ref(true)
async function _SetTabScrollTop() {
    await nextTick()
    let scrollHeight = window.document.documentElement.scrollTop
    if (scrollHeight > 0 && flag.value) {
        if (tabActive2.value != null) {
            if (_ScrollHeightList.value[tabActive.value]) {
                _ScrollHeightList.value[tabActive.value][tabActive2.value] = scrollHeight
            } else {
                _ScrollHeightList.value[tabActive.value] = {}
                _ScrollHeightList.value[tabActive.value][tabActive2.value] = scrollHeight
            }
        } else {
            _ScrollHeightList.value[tabActive.value] = scrollHeight
        }
    }
}
export async function _GetTabScrollTop(index, index2 = null) {
    await nextTick()
    tabActive.value = index
    tabActive2.value = index2
    // console.log('_ScrollHeightList---+++++*****', _ScrollHeightList.value)
    if (index2 != null) {
        // console.log(111111)
        if (_ScrollHeightList.value[tabActive.value] && _ScrollHeightList.value[tabActive.value][tabActive2.value]) {
            flag.value = false
            setTimeout(() => {
                window.scrollTo(0, _ScrollHeightList.value[tabActive.value][tabActive2.value])
                flag.value = true
            }, 25)
        }
    } else {
        if (_ScrollHeightList.value[tabActive.value]) {
            flag.value = false
            setTimeout(() => {
                window.scrollTo(0, _ScrollHeightList.value[tabActive.value])
                flag.value = true
            }, 25)
        }
    }
}
export function _InitScroll(pageName, index, index2 = null) {
    if (scrollTop.value[pageName]) {
        _ScrollHeightList.value = scrollTop.value[pageName]
    }

    _GetTabScrollTop(index, index2)
    window.addEventListener('scroll', _SetTabScrollTop)
}
export function _RouteLeave(pageName) {
    _GlobalStore.addScrollTop(pageName, _ScrollHeightList.value)
    window.removeEventListener('scroll', _SetTabScrollTop)
}
