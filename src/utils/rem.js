/**
 * 动态设置 root rem 的值
 */

const uiWidth = 375 // 设计稿宽度
const maxWidth = 750 // 最大宽度
const ratio = uiWidth / 100 // 在设计稿宽度下 按照 1rem = 100px 进行开发

const root = document.documentElement || document.body
const eventName = 'orientationchange' in window ? 'orientationchange' : 'resize'

const setRem = () => {
    const w = root.clientWidth
    const currentWidth = w >= maxWidth ? maxWidth : w
    root.style.fontSize = `${currentWidth / ratio}px`
}

setRem()
window.addEventListener(eventName, setRem, false)
