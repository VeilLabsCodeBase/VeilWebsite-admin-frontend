import { _Request } from '../utils/request'

// 全局接口
export const _upLogin = data => _Request('/admin/login', data) //登陆
export const _userList = data => _Request('/admin/user/list', data, 'get') //用户列表
export const _depositList = data => _Request('/admin/deposit/list', data, 'get') //充值列表
export const _depositUpdate = data => _Request('/admin/deposit/update', data) //更新充值信息
export const _WithdrawList = data => _Request('/withdraw/list', data,'get') //提现记录
export const _WithdrawAudit = data => _Request('/admin/withdraw/audit', data) //审查
export const _UserModellingTree = data => _Request('/admin/user/modellingTree', data,'get') //获取经济模型树
export const _GeoRegion = data => _Request('/admin/geoRegion/page', data) //地域管理列表
export const _GeoRegionGeoType = data => _Request('/geoRegion/geoType', data,'get') //地域管理列表
export const _GeoRegionRemoveGeo = data => _Request('/admin/geoRegion/removeGeo', data) //地域删除
export const _GeoRegionCreateGeo = data => _Request('/admin/geoRegion/createGeo', data) //地域添加
export const _NodePage = data => _Request('/admin/node/page', data) //节点列表
export const _NodeRemoveBizNode = data => _Request('/admin/node/removeBizNode', data) //删除节点
export const _NodeCreateBizNode = data => _Request('/admin/node/createBizNode', data) //创建节点

export const _GlobalApi = {
    _upLogin,
    _userList,
    _depositList,
    _depositUpdate,
    _WithdrawList,
    _WithdrawAudit,
    _UserModellingTree,
    _GeoRegion,
    _GeoRegionGeoType,
    _GeoRegionRemoveGeo,
    _GeoRegionCreateGeo,
    _NodePage,
    _NodeRemoveBizNode,
    _NodeCreateBizNode,
}
