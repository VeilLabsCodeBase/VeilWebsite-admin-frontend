import axios from 'axios'
import BMF from 'browser-md5-file'
import {
    _LocalCache
} from '@/utils/cache'
import {
    TOKEN
} from '@/utils/constants'
import { ElMessage } from 'element-plus'
import router from '@/router'
export const _UploadImg = async (file, url) => {
    let token = _LocalCache.Get(TOKEN)
    if(!token){
        router.push('/login')
    }
    const configUploadURL = url.includes('?') ? `${url}&` : `${url}?`
    const uploadURL = `${configUploadURL}token=${token}&file_name=${file.name}`
    // 上传文件
    const res = await uploadImg(uploadURL, {file:file})
    if (res) return res
}
// 上传视频
export const _UploadVideo = async (file, url, callBack = () => {}) => {
    // checkMp4File(file)
    var uploadOverNum=0;
    var newName
    if (file.name && file.name.includes('.mp4')) {
        newName = file.name.replace('.mp4', '')
        if (newName.length > 20) {
            newName = newName.slice(0, 20) + '.mp4'
        }
    } else {
        ElMessage.error("请上传mp4文件")
        return
    }
    var videoId = ''
    var timer = ''
    let token = _LocalCache.Get(TOKEN)
    if(!token){
        router.push('/login')
    }
    //获取文件的MD5值
    const bmf = new BMF()
    var _md5 = ''

    const chunkSize = 2 * 1024 * 1024 // 2MB一片
    const chunkCount = Math.ceil(file.size / chunkSize) // 总片数
    // console.log("总片数", chunkCount);
    //获取每一片的文件数据
    var getChunkInfo = (file, currentChunk, chunkSize) => {
        let start = currentChunk * chunkSize
        let end = Math.min(file.size, start + chunkSize)
        let chunk = file.slice(start, end)
        return {
            start,
            end,
            chunk
        }
    }
    //上传切片
    var uploadChunk = async (file, currentChunk, chunkSize, chunkCount) => {
        const {
            chunk
        } = getChunkInfo(file, currentChunk, chunkSize)
        const configUploadURL = url.includes('?') ? `${url}&` : `${url}?`
        const uploadURL = `${configUploadURL}file_name=${newName}&md5=${_md5}&page=${currentChunk + 1}&total_page=${chunkCount}&token=${token}`
        try {
            const res = await uploadImg(uploadURL, chunk)
            if (res) {
                uploadOverNum++
                if(res?.id){
                    videoId = res.id
                }
                callBack(res,(uploadOverNum/chunkCount).toFixed(2)*100)
            }
        } catch (error) {
            //失败重试一次
            const res = await uploadImg(uploadURL, chunk)
            if (res) {
                uploadOverNum++
                if(res?.id){
                    videoId = res.id
                }
                callBack(res,(uploadOverNum/chunkCount).toFixed(2)*100)
            }
        }
    }
    //查询视频信息
    var checkUploadEnd = async videoId => {
        const configCheckURL = _SystemInfo.upload_file_query_url
        const checkURL = `${configCheckURL}&id=${videoId}`
        try {
            const res = await uploadImg(checkURL)
            if (res?.file_m3u8) {
                clearInterval(timer)
                callBack(res)
                //获取最终视频信息
            }
        } catch (error) {
            console.log('查询视频信息失败')
        }
    }

    //并发数量
    const uploadCount = 8
    //取模
    const yuCount = chunkCount % uploadCount
    // console.log('chunkCount---', chunkCount)
    // console.log('yuCount+++', yuCount)
    bmf.md5(
        file,
        async (err, md5) => {
                _md5 = md5
                if (chunkCount > uploadCount) {
                    for (var i = 0; i < chunkCount - yuCount; i += uploadCount) {
                        // console.log('i****', i)
                        //并发队列
                        let queueArr = []
                        for (var e = 0; e < uploadCount; e++) {
                            queueArr.push(uploadChunk(file, i + e, chunkSize, chunkCount))
                        }
                        try {
                            await Promise.all(queueArr)
                        } catch (error) {
                            console.log('errror----**', error)
                        }
                    }
                    for (var n = chunkCount - yuCount; n < chunkCount; n++) {
                        uploadChunk(file, n, chunkSize, chunkCount)
                    }
                } else {
                    //切片总数小于队列数的时候
                    for (var m = 0; m < chunkCount; m++) {
                        uploadChunk(file, m, chunkSize, chunkCount)
                    }
                }
            },
            progress => {
                // console.log("progress number:", progress);
            }
    )
}

//调上传接口
const uploadImg = async (url, param) => {
    console.log('上传图片',url);
    let res = await axios({
        method: 'post',
        url: url,
        headers: {
            'Content-Type': 'multipart/form-data',
        },
        data: param,
    })
    if (res.status==200) {
        if (res?.data?.code == 200) {
            return res.data.data
        } else {
            if(res?.data?.code == 2002){
                router.push('/login')
            }
            return null
        }
    }else{
       
        ElMessage.error("上传失败")
    }
}
//检查是不是mp4文件
const checkMp4File = file => {
    var localFile = file
    var reader = new FileReader()
    const _this = this
    reader.readAsArrayBuffer(localFile)
    reader.onload = function () {
        var bytes = new Uint8Array(this.result)
        // 头信息
        const fileHead1 = bytes.slice(0, 20)
        if (
            !(
                fileHead1[0] == 0 &&
                fileHead1[1] == 0 &&
                fileHead1[2] == 0 &&
                fileHead1[4] == 102 &&
                fileHead1[5] == 116 &&
                fileHead1[6] == 121 &&
                fileHead1[7] == 112
            )
        ) {
            ElMessage.error("请上传标准的mp4文件")
        } else {
            console.log(123456)
        }

        //const bodyData = bytes.slice(40, bytes.length);
    }
}