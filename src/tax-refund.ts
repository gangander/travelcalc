export type DestinationId = 'kr' | 'jp' | 'th' | 'us' | 'sg' | 'eu'

export type TaxRefundRule = {
  eligible: boolean
  minimum: number | null
  defaultRefundRate: number
  rule: string
  detail: string
  officialUrl: string
}

export const TAX_REFUND_RULES: Record<DestinationId, TaxRefundRule> = {
  kr: { eligible: true, minimum: 15000, defaultRefundRate: 7, rule: '單筆滿 ₩15,000', detail: '於 Tax Refund 商店購買；即時退稅單筆須低於 ₩1,000,000，並依規定攜帶商品出境。', officialUrl: 'https://english.visitkorea.or.kr/svc/contents/contentsView.do?menuSn=929&vcontsId=248767' },
  jp: { eligible: true, minimum: 5000, defaultRefundRate: 10, rule: '同店同日未稅滿 ¥5,000', detail: '限合格免稅店與短期旅客；消耗品上限 ¥500,000，離境時需持有商品並出示護照。', officialUrl: 'https://www.customs.go.jp/english/c-answer_e/pdf/FAX5004e.pdf' },
  th: { eligible: true, minimum: 2000, defaultRefundRate: 4, rule: '同店同日滿 ฿2,000', detail: '商店須有 VAT Refund for Tourists 標誌，購買時出示護照並索取 P.P.10，商品須於 60 天內帶出境。', officialUrl: 'https://vrtweb.rd.go.th/81.html' },
  us: { eligible: false, minimum: null, defaultRefundRate: 0, rule: '沒有全國統一旅客退稅', detail: '美國政府不退還外國旅客的銷售稅；少數州或商家方案可能不同，請依當地規定確認。', officialUrl: 'https://www.help.cbp.gov/s/article/Article-1039?language=en_US' },
  sg: { eligible: true, minimum: 100, defaultRefundRate: 7, rule: '同一 GST 商戶滿 S$100', detail: '可合併同一商戶最多 3 張同日收據；須為 eTRS 參與商店，並於購買後 2 個月內攜貨離境。', officialUrl: 'https://www.iras.gov.sg/taxes/goods-services-tax-%28gst%29/consumers/tourist-refund-scheme' },
  eu: { eligible: true, minimum: null, defaultRefundRate: 12, rule: '門檻依購買國家而異', detail: '限非歐盟居民；商品與文件須於購買後 3 個月內在最後離開歐盟時交海關確認，實退額會扣除服務費。', officialUrl: 'https://europa.eu/youreurope/citizens/consumers/shopping/vat/index_en.htm' },
}
