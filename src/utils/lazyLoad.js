export const useObserver = () => {
    return (domREF, callback = () => {}) =>
        onMounted(() => {
            const element = toValue(domREF)
            const observer = new IntersectionObserver((entries, observer) => {
                entries.forEach(async (entry, index) => {
                    if (entry.isIntersecting) {
                        try {
                            // 当dom元素出现在屏幕中时，执行回调
                            await callback()
                            // 停止观察dom元素
                            observer.unobserve(entry.target)
                        } catch (error) {}
                    }
                })
            })

            // 开始观察dom元素
            observer.observe(element)
        })
}
