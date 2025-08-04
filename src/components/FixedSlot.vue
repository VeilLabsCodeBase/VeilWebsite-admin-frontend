<template>
    <!-- 此组件用于固定定位,不丢失文档流 -->
    <section class="fixedSlot">
        <div class="placehoder" ref="placehoder" :style="{ height: placehoderHeight }"></div>
        <div class="fixedContent" ref="fixedContent" :class="position == 'top' ? 'fixedTop' : 'fixedBottom'">
            <slot></slot>
        </div>
    </section>
</template>
<script setup>
import { computed, nextTick, onActivated, onMounted, onUpdated } from 'vue'
import colors from '@/assets/scss/config/color.module.scss'
const props = defineProps({
    position: {
        type: String,
        default: 'top',
    },
    top: {
        type: String,
        default: '0',
    },
    bottom: {
        type: String,
        default: '0',
    },
    bgColor: {
        type: String,
        default: colors.bgColor,
    },
    height: {
        type: String,
    },
})
const fixedTop = computed(() => {
    return props.top
})
const fixedBottom = computed(() => {
    return props.bottom
})
const fixedBgColor = computed(() => {
    return props.bgColor
})
const placehoderHeight = computed(() => {
    return props.height ? props.height : fixedHeight.value
})
const fixedContent = ref(null)
const fixedHeight = ref('')

onMounted(() => {
    getFixHeight()
})
onActivated(() => {
    getFixHeight()
})
onUpdated(() => {
    getFixHeight()
})
const placehoder = ref()
const getFixHeight = async () => {
    await nextTick()
    setTimeout(() => {
        fixedHeight.value = fixedContent.value.getBoundingClientRect().height + 'px'
    }, 25)
}

defineExpose({ fixedHeight, getFixHeight })
</script>
<style lang="scss" scoped>
.fixedSlot {
    .placehoder {
        width: 100%;
        // background: v-bind(fixedBgColor);
    }
    .fixedTop {
        top: v-bind(fixedTop);
    }
    .fixedBottom {
        bottom: v-bind(fixedBottom);
    }
    .fixedContent {
        width: 100%;
        min-width: $minWidth;
        max-width: $maxWidth;
        position: fixed;
        left: 50%;
        transform: translateX(-50%);
        z-index: 10;
        // background: v-bind(fixedBgColor);
    }
}
</style>
