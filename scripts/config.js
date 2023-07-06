import * as database from "./lib/db/WorldDB"
export * from "./config_DB"

/**
 * @readonly
 * @description 自訂義指令的前綴
 */
export const prefix = "-";

/**
 * @readonly
 * @description API版本
 */
export const version = "BETA V2.2.7"
/**
 * @readonly
 * @description API更新時間
 */
export const updateDate = '2023/7/6 (Thurs.)'
/**
 * @readonly
 * @description API更新內容
 */
export const updates = {
    // "版本號 | 加權值": []
    "BETA 2.2.7-build1 | 0": [
        "嘗試將玩家資料儲存 tag -> 記分板 (未完成) | 中+"
    ],
    "BETA 2.2.7 | 2": [
        "支持版本V1.20.0+ | 必備",
        "資料儲存轉移至記分板 | 極高"
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