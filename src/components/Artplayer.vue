<template>
    <section class="player">
        <div ref="artRef" class="artplayer"></div>
    </section>
</template>
<script setup>
import Artplayer from 'artplayer'
import Hls from 'hls.js'
const props = defineProps({
    // 播放地址
    src: {
        type: String,
    },
    // 封面
    cover: {
        type: String,
    },
    isAutoplay: {
        type: Boolean,
        default: true,
    },
    //播放结束后的回调
    playEnded: {
        type: Function,
    },
    //上报播放记录
    upHistory: {
        type: Function,
    },
    //开始播放时间
    playTime: {
        type: [Number, String],
        default: 0,
    },
    //是短视频模式还是长视频模式
    isShortPlay: {
        type: Boolean,
        default: false,
    },
    //音频播放时使用
    getProgressValue: {
        type: Function,
    },
    maxPreviewTime: {
        type: [Number, String],
    },
})
import { API_PREFIX } from '@/utils/constants.js'
import { computed } from 'vue'
const source = computed(() => {
    if (props.src) {
        return props.src?.includes('http') ? props.src : API_PREFIX + props.src
    } else {
        return ''
    }
})
//封面解密
const cover = computed(async () => {
    let cover = await _GetImgData(props.cover)
    return cover
})
const artRef = ref()
var player
const isLoading = ref(false)
const isPause = ref(false)
const isPlay = ref(false)
//当前播放时间
const currentTime = ref(0)
const initPlayer = () => {
    player = new Artplayer({
        container: artRef.value,
        url: source.value,
        type: 'm3u8',
        customType: {
            m3u8: playM3u8,
        },
        volume: 1,
        autoplay: props.isAutoplay,
        autoMini: true, //当播放器滚动到浏览器视口以外时，自动进入 迷你播放 模式
        loop: false,
        playbackRate: true, // 是否显示视频播放速度功能
        setting: props.isShortPlay ? false : true, //是否在底部控制栏里显示 设置面板 的开关按钮
        hotkey: true, //是否使用快捷键
        pip: false, //是否在底部控制栏里显示 画中画 的开关按钮
        mutex: true, //假如页面里同时存在多个播放器，是否只能让一个播放器播放
        screenshot: false, //是否在底部控制栏里显示 视频截图 功能
        fullscreen: props.isShortPlay ? false : true, //是否在底部控制栏里显示播放器 窗口全屏 按钮
        fullscreenWeb: false, //是否在底部控制栏里显示播放器 网页全屏 按钮
        miniProgressBar: true, //迷你进度条，只在播放器失去焦点后且正在播放时出现
        playsInline: true, //在移动端是否使用 playsInline 模式
        fastForward: true, //是否在移动端添加长按视频快进功能
        autoOrientation: true, //是否在移动端的网页全屏时，根据视频尺寸和视口尺寸，旋转播放器
    })
    player.on('loading', state => {
        if (state) {
            isPlay.value = false
        } else {
            isPlay.value = true
        }
        isLoading.value = state
    })
    player.on('pause', () => {
        isPause.value = true
        isPlay.value = false
    })
    player.on('play', () => {
        isPlay.value = true
        isPause.value = false
    })
    player.on('ready', () => {
        player.setting.show = false
        player.contextmenu.show = false
        if (props.playTime) {
            player.currentTime = props.playTime
        }
    })
    //播放结束
    player.on('video:ended', () => {
        if (props.playEnded) {
            props.playEnded()
        }
        if (props.upHistory) {
            props.upHistory()
        }
    })
    //播放时间改变-上传播放记录
    player.on('video:timeupdate', () => {
        currentTime.value = player.currentTime
        playTimeUpdate()
        if (props.getProgressValue) {
            props.getProgressValue(currentTime.value, player.duration)
        }
        if (
            props.maxPreviewTime &&
            props.maxPreviewTime < player.duration &&
            currentTime.value >= props.maxPreviewTime
        ) {
            player.pause()
            player.seek = 0
            if (props.playEnded) {
                props.playEnded()
            }
        }
    })

    //播放失败,切换线路
    player.on('error', (error, reconnectTime) => {
        playErrorUp(props.src)
    })
}
onMounted(() => {
    initPlayer()
})
const playM3u8 = (video, url, art) => {
    if (Hls.isSupported()) {
        if (art.hls) art.hls.destroy()
        const hls = new Hls()
        hls.loadSource(url)
        hls.attachMedia(video)
        art.hls = hls
        art.on('destroy', () => hls.destroy())
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url
    } else {
        art.notice.show = 'Unsupported playback format: m3u8'
    }
}

//上一次记录的播放时间
const preTime = ref(0)
const flag = ref(true)
const playTimeUpdate = () => {
    if (currentTime.value >= 30 && flag.value) {
        if (props.upHistory) {
            props.upHistory(currentTime.value)
            flag.value = false
        }
        preTime.value = currentTime.value
    }
}

const _Api = inject('$api')
//错误上报
const playErrorUp = async url => {
    let res = await _Api._UpPlayError({
        type: 'play_error',
        data: url,
    })
    if (res) {
    }
}
//切换视频状态
const changePlayerStatus = () => {
    player.toggle()
}
//视频时间跳转
const setSeek = time => {
    player.seek = time
}
//视频快进
const forward = time => {
    player.forward = time
}
//视频快进
const backward = time => {
    player.backward = time
}
//视频播放
const play = time => {
    player.play()
}
//视频暂停
const pause = time => {
    player.pause()
}
//设置视频播放速度
const setSpeed = speed => {
    player.playbackRate = speed
}
onBeforeRouteLeave((to, from) => {
    if (props.upHistory) {
        props.upHistory(currentTime.value)
    }
})
// 对外暴漏changePlayerStatus方法
defineExpose({ changePlayerStatus, isLoading, isPause, isPlay, forward, backward, setSeek, play, pause, setSpeed })
</script>
<style lang="scss" scoped>
.player {
    width: 100%;
    height: 100%;
    .artplayer {
        width: 100%;
        height: 100%;
        // aspect-ratio: 16/9;
    }
}
</style>
