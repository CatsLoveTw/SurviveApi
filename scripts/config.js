import * as database from "./lib/db/WorldDB"

/**
 * @readonly
 * @description 自訂義指令的前綴
 */
export const prefix = "-";

/**
 * @readonly
 * @description API版本
 */
export const version = "BETA V2.2.63"
/**
 * @readonly
 * @description API更新時間
 */
export const updateDate = '2023/5/9 (Tue.)'
/**
 * @readonly
 * @description API更新內容
 */
export const updates = {
    // "版本號 | 加權值": []
    "BETA 2.2.6 | 2.45": [
        "支持版本V1.19.80+ | 必備",
        "掉落物移除上限 400 -> 250 個數量 | 中",
        "新增領地時，已可及時觀看上限格數 | 中",
        "因系統限制，領地最大暫限20000格 | 極高",
        "領地防爆功能已可在公共權限內調整，並新增提示 | 中+",
        "修復可跨維度傳送公共傳送點的問題 | 中+",
        "掉落物移除BUG已修復 | 極高+",
        "修復rtp在其他維度傳送時可能遇到的問題 | 中",
    ],
    "BETA 2.2.61 | 2.5": [
        "修復無法新增領地的問題 | 必備",
        "修復領地刪除時依然可飛行的問題 | 高+",
        "修復建造領地時，歸還方塊不同問題 | 中+"
    ],
    "BETA 2.2.62 | 2": [
        "修復新增領地時，方塊不會歸還的問題 | 極高",
        "修復公共領地失效的問題 | 高+",
        "新增帳號系統 (僅供自己使用) | 低"
    ],
    "BETA 2.2.63 | 0": [
        "帳號系統小更新 | 低"
    ]
}


/**
 * @readonly
 * @description 死亡訊息 (從中隨機挑選)
 */
export const dieMessages = [
    "鼠掉了",
    '"笑死"了',
    "死亡了",
    "消失在世界中",
    "被打死了",
    "不見了",
    "啪，沒了",
    "蹦! 爆炸了",
    "離開了世界",
    "壯烈犧牲了",
    "不幸死亡了",
    "在冒險途中遭遇了不測",
    "的靈魂被黑暗吞噬了",
    "在意外中喪生",
    "被一個神祕的敵人擊敗",
    "在一次逃生中失敗了",
    "被瞬間處決了",
    "遭遇了災害",
    "的寶物被狡猾的小偷偷走了，他因此憤而自盡",
    "在一場激烈的戰爭中倒下",
    "不慎跌下懸崖",
    "因為一個錯誤的判斷而失去生命",
    "遭遇了一個致命的陷阱，無法逃脫",
    "染疫Covid-19時死亡了",
    "失去了生命的火花",
    "突發心臟病而死亡",
    "中暑了",
    "自殺了",
    "不敵黑暗而倒下"
]

/**
 * @readonly
 * @description 玩家資料庫
 */
export const playerDB = new database.playerWorldDB("playerDB")

/**
 * @readonly
 * @description 插件設定資料庫
 * @deprecated 暫時不會使用，敬請期待
 */
export const pluginDB = new database.WorldDB("pluginDB")