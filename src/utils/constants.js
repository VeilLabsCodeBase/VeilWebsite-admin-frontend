import { _Decrypto } from '@/utils/commonFn'

const {
    DEV,
    E_IS_ENCRYPT,
    E_PROHIBIT_OPEN_CONSOLE,
    E_CLEAR_CONSOLE_PRINT,
    E_API_PREFIX,
    E_API_BASE_URL,
    E_AES_API_KEY,
    E_AES_CEB_KEY,
    E_AES_BNC_KEY,
    E_DEBUG_KEY,
    E_UPLOAD_KEY,
} = import.meta.env

/**
 * 从配置文件中读取
 * 请勿编辑
 */
export const IS_DEV = DEV // 是否处于开发环境
export const IS_ENCRYPT = parseInt(E_IS_ENCRYPT) // 打开加密请求
export const PROHIBIT_OPEN_CONSOLE = parseInt(E_PROHIBIT_OPEN_CONSOLE) // 禁止打开控制台
export const CLEAR_CONSOLE_PRINT = parseInt(E_CLEAR_CONSOLE_PRINT) // 清除控制台打印
export const API_PREFIX = E_API_PREFIX // API 请求前缀
export const API_BASE_URL = E_API_BASE_URL // API 请求地址
export const AES_API_KEY = _Decrypto(E_AES_API_KEY) // 接口请求 的 AES KEY
export const AES_CEB_KEY = _Decrypto(E_AES_CEB_KEY) // ceb文件 的 AES KEY
export const AES_BNC_KEY = _Decrypto(E_AES_BNC_KEY) // bnc文件 的 AES KEY
export const DEBUG_KEY = _Decrypto(E_DEBUG_KEY) // 生产环境打开控制台的key
export const UPLOAD_KEY = E_UPLOAD_KEY // 上传文件接口的KEY

/**
 * 全局常量
 */
export const UPLOAD_FILE_DIR = 'tiktok_comic_H5' // 上传文件的存放路径
export const API_COMMON_PREFIX = '/api' // t1api ,mhapi接口 公共前缀
export const CACHE_PREFIX = 'tiktokComic_' // local、session缓存 字段前缀
export const AES_CACHE_KEY = 'FLs3oA3p2a39Gnsm' // AES加密 local、session缓存
export const TOKEN = 'tiktokLSP' // TOKEN
export const SEARCH_RECORD = 'SearchRecord' // 搜索记录
export const INDEXDB_NAME = 'tiktok-DB' // indexDB名称
