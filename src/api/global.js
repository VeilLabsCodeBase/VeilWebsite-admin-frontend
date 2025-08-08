import { _Request } from '../utils/request'

// 全局接口
export const _upLogin = data => _Request('/admin/login', data) //登陆
export const _userList = data => _Request('/admin/user/list', data, 'get') //用户列表
export const _depositList = data => _Request('/admin/deposit/list', data, 'get') //充值列表
export const _depositUpdate = data => _Request('/admin/deposit/update', data) //更新充值信息
export const _WithdrawList = data => _Request('/withdraw/list', data,'get') //提现记录
export const _WithdrawAudit = data => _Request('/admin/withdraw/audit', data) //审查

export const _GlobalApi = {
    _upLogin,
    _userList,
    _depositList,
    _depositUpdate,
    _WithdrawList,
    _WithdrawAudit,
}
