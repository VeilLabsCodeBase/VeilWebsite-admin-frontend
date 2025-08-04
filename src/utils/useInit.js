import { dbGetAllItems, dbDeleteItem } from '@/utils/indexedDB'

// 各种初始化操作
export const useInit = () => {
    // 预加载图片
    const imgArray = [
       
    ]
    var images = new Array()
    const preloadImg = () => {
        for (let i = 0; i < imgArray.length; i++) {
            images[i] = new Image()
            images[i].src = imgArray[i]
        }
    }

    // 处理图片缓存90天
    const handleImgCache = async () => {
        const imgList = await dbGetAllItems()
        const validTime = 60 * 60 * 24 * 90
        const timestamp = parseInt(new Date().getTime() / 1000)

        imgList.forEach(item => {
            const interval = timestamp - item.updated_at
            if (interval > validTime) dbDeleteItem(item.id)
        })
    }

    preloadImg() // 预加载数据
    handleImgCache() // 处理图片缓存
}
