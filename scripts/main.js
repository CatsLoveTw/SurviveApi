import { world, system } from "@minecraft/server"
import * as mc from "@minecraft/server"
import * as ui from '@minecraft/server-ui'
import { cmd, log, logfor } from './lib/GametestFunctions.js'
import { randomInt, worldlog } from "./lib/function.js"
import * as chatCommnad from './games/chatCommands/build.js'
import * as land from './games/land/build.js'
import { playerUI } from "./games/UI/player.js"
import * as titleraw from './games/titleraw/build.js'
import * as tpa from './games/tpa/build.js'
import * as bank from './games/bank/build.js'
import * as home from './games/home/build.js'
import * as menu from './games/menu/build.js'
import * as rtp from './games/rtp/build.js'
import * as death from './games/death/build.js'
import * as notice from './games/notice/build.js'
import * as adminSetting from './games/UI/adminSetting/build.js'
import * as shop from './games/shop/build.js'
import * as money_leaderboard from './games/money_leaderboard/build.js'
import * as test from './games/test/build.js'
import "./games/ban/build.js"
import "./system/import.js"

export const version = "BETA V2.2.53"
export const updateDate = '2023/4/21 (Fri.)'
export const updates = {
    "BETA V2.2.4 | 3.25": [
        "API正式邁入BETA階段! | 低",
        "修復領地在特殊情況下無法刪除的問題 | 高",
        "修復金錢排行榜顯示問題 | 中+",
        "修復公共 / 普通傳送點無法隨領地移除的問題 | 高",
        "修復其他維度領地離開偵測異常問題 | 高",
        "飛行權限更改偵測已新增 | 中",
        "修復領地權限更改訊息在特殊情況下重複發送問題 | 低+",
        "新增黑名單系統 | 中+",
        "銀行系統回歸 | 中+",
    ],
    "BETA V2.2.5 | 0.65": [
        "新增掉落物&經驗清除功能 | 中",
        "新增領地管理功能 (管理員選單) | 中",
        "新增tpa黑名單系統 | 中",
    ],
    "BETA 2.2.51 | 1.875": [
        "修復使用傳送點時顯示問題 | 低+",
        "修改領地飛行機制 (持續給予權限 -> 進入時給予) | 高",
        "API進行初步優化，減少執行次數 | 高",
    ],
    "BETA 2.2.52 | 0.875": [
        "修復傳送點因錯誤偵測而遭移除的問題 | 高",
        "公共送點傳選單新增飛行權限顯示 | 低",
    ],
    "BETA 2.2.53 | 0.6": [
        "現在自訂指令系統大小寫皆可偵測 | 低",
        "新增物品標籤功能 -setItemTag | 低+",
        "新增死亡訊息 | 低+",
        "修復第一次加入時沒有選單的問題 | 中",
        "更改 -info update 顯示訊息 | 低",
        "新增首次加入訊息 | 低+"
    ],
}
export const prefix = '-'
/**
 * 死亡訊息 (從中隨機挑選)
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

try {
// 發送訊息 (actionbar) { "news": msg, tick: 0, maxtick: 60 }

for (let player of world.getPlayers()) {
    for (let tag of player.getTags()) {
        if (tag.startsWith('{"news":')) {
            player.removeTag(tag)
        }
    }
}


system.events.beforeWatchdogTerminate.subscribe(event => {
    event.cancel = true
})

// system.runInterval() 類似於tickEvent

// build
try {
    chatCommnad.build(prefix)
    land.build()
    titleraw.build()
    tpa.build()
    bank.build()
    home.build()
    menu.build()
    rtp.build()
    death.build()
    notice.build()
    adminSetting.build()
    shop.build()
    money_leaderboard.build()
    test.build()
} catch (e) {log("buildError" + e)}
} catch (e) {log(e)}