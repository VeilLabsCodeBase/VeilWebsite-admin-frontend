<template>
    <section class="waterfall">
        <!-- v-slot="{ listData }" -->
        <UpPull :requestList="requestList" :page_size="page_size" :getResData="success" ref="_UpPull_Child">
            <div class="waterfall-container">
                <div class="waterfallItem" v-for="(item, index) in listData" :key="index" ref="itemREF">
                    <slot :itemData="item"></slot>
                </div>
            </div>
        </UpPull>
    </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
    bottom: { type: Number, default: 13 }, // Item的底部margin 单位px
    columnGap: { type: String, default: '0.08rem' }, // 每列之间的间距
    page_size: {
        type: Number,
        default: 10,
    },
    //请求列表分页数据的方法
    requestList: {
        type: Function,
    },
    //获取最终列表的所有数据,当所有数据需要处理的时候,可以使用,如果不需要处理也可以使用slot传值
    getResData: {
        type: Function,
    },
    //当列表有初始数据的时候使用
    initList: {
        type: Array,
        default: [],
    },
})
const itemWidth = computed(() => {
    return `calc((100% - ${props.columnGap}) / 2)`
})
const itemREF = ref([])
const heightDict = reactive({ left: 0, right: 0 })
const alreadyLoad = ref(0)
const WaterfallHeight = computed(() => {
    const { left, right } = heightDict
    const wth = left > right ? left : right
    return wth - props.bottom + 'px'
})

const _UpPull_Child = ref(null)
const listData = ref(null)
const success = list => {
    listData.value = [...props.initList, ...list]
}
const onRefresh = () => {
    if (_UpPull_Child.value) {
        _UpPull_Child.value.onRefresh()
    }
}
watch(
    itemREF,
    async () => {
        if (alreadyLoad.value && itemREF.value.length === 0) {
            alreadyLoad.value = 0
            heightDict.left = heightDict.right = 0
        }
        const domList = toValue(itemREF)
        for (let i = alreadyLoad.value; i < itemREF.value.length; i++) {
            const dom = domList[i]
            const domHeight = dom.clientHeight
            const { left, right } = heightDict
            if (left <= right) {
                dom.style.left = 0
                dom.style.top = left + 'px'
                heightDict.left = left + domHeight + props.bottom
            } else {
                dom.style.right = 0
                dom.style.top = right + 'px'
                heightDict.right = right + domHeight + props.bottom
            }
            alreadyLoad.value++
        }
    },
    { immediate: true, deep: true }
)
defineExpose({
    listData,
    onRefresh,
})
</script>

<style lang="scss" scoped>
.waterfall-container {
    position: relative;
    height: v-bind(WaterfallHeight);
    .waterfallItem {
        width: v-bind(itemWidth);
        position: absolute;
    }
}
</style>
