<template>
    <section class="QrCode">
        <QrcodeVue :value="src" :size="size" level="H" id="canvasDom" />
    </section>
</template>
<script setup>
import QrcodeVue from 'qrcode.vue'
import { showNotify } from 'vant'
const props = defineProps({
    src: {
        type: String,
    },
    size: {
        type: Number,
    },
    fileName: {
        type: String,
        default: '账号凭证.png',
    },
})
const downIMG = () => {
    const canvas = document.getElementById('canvasDom')
    const url = canvas.toDataURL('image/png') // 通过 toDataURL 返回一个包含图片展示的 data URI
    const aDom = document.createElement('a')
    aDom.download = props.fileName // 设置下载的文件名
    aDom.href = url
    document.body.appendChild(aDom)
    aDom.click()
    aDom.remove()
}
const showTips = () => {
    showNotify({ type: 'primary', message: '请手动截屏保存' })
}
defineExpose({ downIMG, showTips })
</script>
<style lang="scss" scoped>
.QrCode {
}
</style>
