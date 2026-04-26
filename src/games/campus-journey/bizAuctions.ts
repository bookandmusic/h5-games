export type BizAuction = {
  name: string
  description: string
  valueMin: number
  valueMax: number
}

export const bizAuctionPool: BizAuction[] = [
  { name: '优质客户合同', description: '一份长期稳定的客户合作协议', valueMin: 400, valueMax: 700 },
  { name: '品牌代言机会', description: '知名品牌邀请你作为行业代表合作', valueMin: 500, valueMax: 900 },
  { name: '核心地段铺位', description: '市中心商业街的黄金位置商铺', valueMin: 600, valueMax: 1000 },
  { name: '专利技术授权', description: '一项热门领域的独家技术使用权限', valueMin: 350, valueMax: 650 },
  { name: '供应链合作名额', description: '加入头部企业的核心供应商体系', valueMin: 450, valueMax: 800 },
  { name: '行业展会展位', description: '国际行业博览会的中心展区位置', valueMin: 300, valueMax: 550 },
  { name: '线上平台流量包', description: '头部电商平台的首页推荐流量', valueMin: 250, valueMax: 500 },
  { name: '研发团队挖角', description: '从竞争对手处引进核心技术人才', valueMin: 500, valueMax: 850 },
  { name: '原材料长期供应', description: '锁定低价原材料的三年供应协议', valueMin: 400, valueMax: 750 },
  { name: '海外市场准入证', description: '进入东南亚市场的关键资质许可', valueMin: 550, valueMax: 950 },
  { name: '连锁加盟优先权', description: '知名连锁品牌的区域独家加盟权', valueMin: 450, valueMax: 700 },
  { name: '广告投放套餐', description: '城市核心商圈的全媒体广告资源', valueMin: 350, valueMax: 600 },
  { name: '物流仓储合作', description: '覆盖全国的冷链仓储配送网络', valueMin: 500, valueMax: 800 },
  { name: '政府补贴项目', description: '符合政策扶持条件的创业补贴资格', valueMin: 300, valueMax: 500 },
  { name: '行业峰会赞助', description: '顶级行业峰会的冠名赞助席位', valueMin: 600, valueMax: 1100 },
]
