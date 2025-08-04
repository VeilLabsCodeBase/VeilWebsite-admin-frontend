<template>
    <section
        class="picComponents"
        ref="_ImgRef"
        :style="{ paddingTop: ratio + '%', height: ratio ? 'auto' : height, width: ratio ? 'auto' : width }"
    >
        <div class="fixedSizePlacehoder" v-if="isShowFixedSize && !imgData">
            <!-- 固定大小占位图,当图片的高或者宽需要自适应时,用于图片懒加载,例如漫画,帖子等 -->
            <img :src="defaultIMG" alt="" />
        </div>
        <div class="imgBox" :class="[width || height ? '' : 'imgPos']" v-else>
            <div class="imgBg" v-if="isShowBg && fit == 'contain'">
                <van-image
                    :src="imgData"
                    :round="round"
                    fit="cover"
                    width="100%"
                    height="100%"
                    :radius="radius"
                    lazy-load
                    icon-prefix="currImg"
                >
                </van-image>
            </div>
            <van-image
                :src="imgData"
                :round="round"
                :fit="fit"
                width="100%"
                height="100%"
                :radius="radius"
                lazy-load
                icon-prefix="currImg"
                @load="overLoad"
            >
                <template v-slot:loading>
                    <div class="defaultBox">
                        <img :src="defaultIMG" alt="" />
                    </div>
                </template>
                <template v-slot:error>
                    <div class="defaultBox">
                        <img :src="defaultIMG" alt="" />
                    </div>
                </template>
            </van-image>
        </div>
    </section>
</template>
<script setup>
import { _GetImgData } from '@/utils/aes'
const props = defineProps({
    // src: { type: String, default: '' }, // 图片地址、头像编号
    src: {}, // 图片地址、头像编号
    realSrc: { type: String, default: '' }, // 不需要解密的图片地址
    width: { type: String }, // Y-Image 宽度
    height: { type: String }, // Y-Image 高度
    fit: { type: String, default: 'cover' }, // 图片填充模式
    round: { type: Boolean, default: false }, // 是否显示为圆形
    radius: { type: [String, Number], default: '0.08rem' }, // 圆角大小
    //图片比例
    ratio: {
        type: [String, Number],
        default: 0,
    },
    /**
     * 1: 正方形占位图  (显示头像时，设置 round 显示为圆形即可)
     * 2: 横图 + 头部banner
     * 3: 小banner  (广告位)
     * 4: 竖图
     */
    type: { type: [String, Number] }, // 占位图的类型
    //是否显示图片背景
    isShowBg: {
        type: Boolean,
        default: false,
    },
    //是否懒加载
    isLazyLoad: {
        type: Boolean,
        default: true,
    },
    //是否显示固定大小占位图,在宽高需要自适应的场景,用于懒加载
    isShowFixedSize: {
        type: Boolean,
        default: false,
    },
    //图片加载完成之后的事件回调
    loadedCallback: {
        type: Function,
    },
})
watch(
    () => [props.src, props.realSrc],
    () => {
        imgData.value = null
        getImgRelUrl()
    }
)
const placeholderName = computed(() => {
    if (props.type) {
        return `img-placeholder${props.type}`
    } else {
        if (props.ratio > 100) {
            return `img-placeholder4`
        } else if (props.ratio < 100) {
            return `img-placeholder2`
        } else if (props.ratio < 50) {
            return `img-placeholder3`
        } else {
            return `img-placeholder1`
        }
    }
})
const imgData = ref() // 图片显示的真实数据
// 占位图
const defaultIMG = ref('')
const appTitle = ref()
appTitle.value = document.getElementsByTagName('meta')['anm'].content
defaultIMG.value = new URL(
    `../assets/images/placeholder/${appTitle.value}/${placeholderName.value}.png`,
    import.meta.url
).href
// 获取本地头像资源
const getLocalAvatar = index => new URL(`../assets/images/avatar/icon_avatar_${index}.webp`, import.meta.url).href
// 通过传入的 src 获取图片数据
const getImgRelUrl = async () => {
    if (props.realSrc) {
        imgData.value = props.realSrc
    } else {
        if (props.src?.includes('.png') || props.src?.includes('.jpg') || props.src?.includes('.jpeg')) {
            imgData.value = props.src
        } else {
            const src = props.src
            try {
                if (!src) return console.log('无图片地址', src)
                imgData.value = src > 0 ? getLocalAvatar(src) : await _GetImgData(src)
            } catch (error) {
                console.log('图片加载失败：', src)
                console.log(error)
            }
        }
    }
}

//懒加载代码
import { useObserver } from '@/utils/lazyLoad'
const observer = useObserver()
const _ImgRef = ref()
if (props.isLazyLoad) {
    observer(_ImgRef, getImgRelUrl)
} else {
    getImgRelUrl()
}
//
const isOverLoad = ref(false)
//图片加载完成之后的事件处理
const overLoad = () => {
    isOverLoad.value = true
    if (props.loadedCallback) {
        props.loadedCallback()
    }
}
defineExpose({ isOverLoad })
</script>

<style lang="scss" scoped>
.picComponents {
    width: 100%;
    position: relative;

    .fixedSizePlacehoder {
        width: 100%;
        height: 20vh;
        img {
            width: 100%;
            height: 100%;
        }
    }
    .imgBox {
        width: 100%;
        height: 100%;
        overflow: hidden;
        object-fit: cover;
        .imgBg {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            filter: blur(20px);
        }
    }
    .imgPos {
        position: absolute;
        left: 0;
        top: 0;
    }
}
.defaultBox {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        overflow: hidden;
        opacity: 1;
    }
}
.picComponents .van-image {
    display: block;
}
.picComponents .van-image > div {
    background-color: rgba(0, 0, 0, 0.1) !important;
    overflow: hidden;
}
.picComponents .van-image--round {
    border-radius: 50% !important;
}
</style>
