import axios from 'axios'
import CryptoJS from 'crypto-js'
import { AES_CEB_KEY, AES_BNC_KEY } from '@/utils/constants'
import { dbPutItem, dbGetItem } from '@/utils/indexedDB'

// AES加密
export const _EncryptData = (data, key) => {
    const ukey = CryptoJS.enc.Utf8.parse(key)
    const dataSTR = JSON.stringify(data)
    const encrypted = CryptoJS.AES.encrypt(dataSTR, ukey, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7,
    })
    return encrypted.toString()
}

// AES解密
export const _DecryptData = (data, key) => {
    const ukey = CryptoJS.enc.Utf8.parse(key)
    const decrypt = CryptoJS.AES.decrypt(data, ukey, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7,
    })
    return JSON.parse(decrypt.toString(CryptoJS.enc.Utf8))
}

// 获取图片真实数据
export const _GetImgData = async (imgURL, type = 'img') => {
    let imgsrc = imgURL
    if (imgsrc?.includes('.ceb')) {
        imgsrc = await _DecryptIMG(imgURL, AES_CEB_KEY, type)
    } else if (imgsrc?.includes('.bnc')) {
        imgsrc = await _DecryptIMG(imgURL, AES_BNC_KEY, type)
    } else {
        // console.log('不需要处理的图片链接，直接访问', imgURL)
    }
    return imgsrc
}

// 解密图片 type=text,  小说转文字使用
const _DecryptIMG = async (imgURL, key, type = 'img') => {
    let arraybuffer = null
    const id = CryptoJS.MD5(imgURL).toString().toUpperCase()
    const item = await dbGetItem(id)
    if (item) {
        arraybuffer = item.data
        dbPutItem(item)
    }

    if (!arraybuffer) {
        try {
            const res = await axios.get(imgURL, { responseType: 'arraybuffer' })
            arraybuffer = res.data
            dbPutItem({ id, data: res.data })
        } catch (error) {
            console.error(error)
        }
    }

    // 将 ArrayBuffer 转为 Uint8Array
    const u8array = new Uint8Array(arraybuffer)
    // 将 Uint8Array 转为 WordArray
    const newdata = CryptoJS.enc.u8array.parse(u8array)

    const lkey = CryptoJS.enc.Latin1.parse(key)
    const b64data = newdata.toString(CryptoJS.enc.Base64)
    const decrypted = CryptoJS.AES.decrypt(b64data, lkey, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7,
    })

    //把解密后的对象再转为base64编码,这步是关键,跟解密文字不同
    const b64 = decrypted.toString(CryptoJS.enc.Base64)
    if (type == 'img') {
        //将base64转为blob
        const blob = dataURLtoBlob(`data:image/png;base64,${b64}`)
        //将blob对象转为blob url
        let url = URL.createObjectURL(blob)
        return url
    } else if (type == 'text') {
        //将base64转为文字
        return decode64(b64)
    }
}

CryptoJS.enc.u8array = {
    stringify: function (wordArray) {
        const words = wordArray.words
        const sigBytes = wordArray.sigBytes
        const u8 = new Uint8Array(sigBytes)
        for (let i = 0; i < sigBytes; i++) {
            const byte = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff
            u8[i] = byte
        }
        return u8
    },
    parse: function (u8arr) {
        const len = u8arr.length
        const words = []
        for (let i = 0; i < len; i++) {
            words[i >>> 2] |= (u8arr[i] & 0xff) << (24 - (i % 4) * 8)
        }
        return CryptoJS.lib.WordArray.create(words, len)
    },
}
//将base64转为blob
const dataURLtoBlob = dataurl => {
    var arr = dataurl.split(','),
        mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]),
        n = bstr.length,
        u8arr = new Uint8Array(n)
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n)
    }
    return new Blob([u8arr], { type: mime })
}
//base64转换成中文
const decode64 = text => {
    return new TextDecoder().decode(Uint8Array.from(atob(text), c => c.charCodeAt(0)))
}
