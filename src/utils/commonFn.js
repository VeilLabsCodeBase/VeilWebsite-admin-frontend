import { showToast } from 'vant'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
dayjs.extend(utc)
// 复制到粘贴板
export const _Copy = content => {
    const _Aux = document.createElement('input')
    _Aux.setAttribute('value', content)
    document.body.appendChild(_Aux)
    _Aux.select()
    document.execCommand('copy')
    document.body.removeChild(_Aux)
    showToast('复制成功')
}

// 生成范围内的随机数
export const _GetRandom = (Min = 0, Max = 9999999) => {
    const Range = Max - Min
    const Rand = Math.random()
    return Min + Math.round(Rand * Range)
}

// 数组 每隔几个元素添加一个 广告
export const _AddNewItem = (rawList, adList, skipNUm) => {
    if (!skipNUm) return rawList
    if (!adList || adList.length <= 0) return rawList

    const newList = []

    for (let i = 0; i < rawList.length; i++) {
        newList.push(rawList[i])

        if ((i + 1) % skipNUm === 0) {
            const newItem = adList[getRandom(0, adList.length - 1)]
            newItem.type = 'advertise'
            newList.push(newItem)
        }
    }

    return newList
}
//获取url里或者?后边的参数值
export const _GetUrlParame = (parameName, url) => {
    let parames
    if (url.indexOf('?') > -1) {
        parames = url.substring(url.indexOf('?'))
    } else {
        parames = url
    }
    if (parames.indexOf(parameName) > -1) {
        let parameValue
        if (parames.indexOf('&') > -1) {
            let arr = parames.split('&')
            let newArr = []
            arr.forEach((item, index) => {
                let obj = {}
                obj.key = item.split('=')[0]
                obj.value = item.split('=')[1]
                newArr.push(obj)
            })
            newArr.forEach((item, index) => {
                if (item.key == parameName) {
                    parameValue = item.value
                }
            })
        } else {
            parameValue = parames.substring(parames.indexOf(parameName), parames.length)
            parameValue = parameValue.split('=')[1]
        }
        return parameValue
    }
    return ''
}
//获取图片链接名称
export const _GetImgName = url => {
    let newUrl
    if (url.indexOf('?') > -1) {
        newUrl = url.substring(0, url.indexOf('?'))
    } else {
        newUrl = url
    }
    let arr = newUrl.split('/')
    let name = arr[arr.length - 1]
    if (name && (name.includes('.ceb') || name.includes('.bnc'))) {
        return name.split('.')[0]
    }
}
//生成唯一的uuid
export const _GetUuid = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (Math.random() * 16) | 0,
            v = c == 'x' ? r : (r & 0x3) | 0x8
        return v.toString(16)
    })
}
/**
 * 将日期时间调整至东8区时间
 * @param {*string} pvDateTime 待处理日期
 */
export const _AdjustP8 = pvDateTime => {
    return new Date(pvDateTime.getTime() + pvDateTime.getTimezoneOffset() * 60 * 1000 + 8 * 60 * 60 * 1000).getTime()
}

// 格式化 时间
export const _FormatTime = (seconds, format) => {
    if (!format) format = seconds >= 3600 ? 'HH:mm:ss' : 'mm:ss'
    return dayjs.utc(seconds * 1000).format(format)
}
/**
 * 格式化日期
 * @param {*string} date 待处理日期
 * @param {*string} fmt 期望日期格式如："yyyy-MM-dd hh:mm:ss"
 * @returns {string} fmt 已处理日期字符串
 */
//fmt格式
export const _FormatDate = (date, fmt) => {
    if (!date) {
        return
    } else {
        let newDate = new Date(date)
        if (/(y+)/.test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (newDate.getFullYear() + '').substr(4 - RegExp.$1.length))
        }
        var o = {
            'M+': newDate.getMonth() + 1,
            'd+': newDate.getDate(),
            'h+': newDate.getHours(),
            'm+': newDate.getMinutes(),
            's+': newDate.getSeconds(),
        }
        for (var k in o) {
            if (new RegExp(`(${k})`).test(fmt)) {
                var str = o[k] + ''
                fmt = fmt.replace(RegExp.$1, RegExp.$1.length === 1 ? str : ('00' + str).substr(str.length))
            }
        }
        return fmt
    }
}

// 将数字转化为带 k 的字符串
// 默认保留1位小数
export const _ConvertToK = (num, decimal = 1, suffix = 'k+') => {
    if (num < 1000) return num
    return (num / 1000).toFixed(decimal) + suffix
}

// 将数字转化为带 w 的字符串
// 默认保留1位小数
export const _ConvertToW = (num, decimal = 1, suffix = 'w') => {
    if (num < 10000) return num
    return (num / 10000).toFixed(decimal) + suffix
}
/**
 * encrypto xor加密程序
 * @param {Strng} str 待加密字符串
 * @param {Number} xor 异或值
 * @param {Number} hex 加密后的进制数
 * @return {Strng} 加密后的字符串
 */
export function _Encrypto(str, xor = 118, hex = 25) {
    if (typeof str !== 'string' || typeof xor !== 'number' || typeof hex !== 'number') return

    let resultList = []
    hex = hex <= 25 ? hex : hex % 25

    for (let i = 0; i < str.length; i++) {
        // 提取字符串每个字符的ascll码
        let charCode = str.charCodeAt(i)
        // 进行异或加密
        charCode = (charCode * 1) ^ xor
        // 异或加密后的字符转成 hex 位数的字符串
        charCode = charCode.toString(hex)
        resultList.push(charCode)
    }

    let splitStr = String.fromCharCode(hex + 97)
    let resultStr = resultList.join(splitStr)
    return resultStr
}

/**
 * decrypto xor解密程序
 * @param {Strng} str 待加密字符串
 * @param {Number} xor 异或值
 * @param {Number} hex 加密后的进制数
 * @return {Strng} 加密后的字符串
 */
export function _Decrypto(str, xor = 118, hex = 25) {
    if (typeof str !== 'string' || typeof xor !== 'number' || typeof hex !== 'number') return

    let strCharList = []
    let resultList = []
    hex = hex <= 25 ? hex : hex % 25
    // 解析出分割字符
    let splitStr = String.fromCharCode(hex + 97)
    // 分割出加密字符串的加密后的每个字符
    strCharList = str.split(splitStr)

    for (let i = 0; i < strCharList.length; i++) {
        // 将加密后的每个字符转成加密后的ascll码
        let charCode = parseInt(strCharList[i], hex)
        // 异或解密出原字符的ascll码
        charCode = (charCode * 1) ^ xor
        let strChar = String.fromCharCode(charCode)
        resultList.push(strChar)
    }
    let resultStr = resultList.join('')
    return resultStr
}
//挂载vue,可全局调用
export const _SetupUtilsFn = app => {
    const _Filters = { _FormatTime, _FormatDate, _ConvertToK, _ConvertToW, _Encrypto, _Decrypto }
    app.config.globalProperties.$utilsFn = _Filters
    app.provide('$utilsFn', _Filters)
}
