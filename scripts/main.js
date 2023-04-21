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

export const version = "BETA V2.2.52"
export const updateDate = '2023/4/21 (Fri.)'
export const updates = {
    "BETA 2.2.52": [
        "修復傳送點因錯誤偵測而遭移除的問題 | 高",
        "公共傳送點選單新增飛行權限顯示 | 低",
    ],
    "BETA 2.2.51": [
        "修復使用傳送點時顯示問題 | 低+",
        "修改領地飛行機制 (持續給予權限 -> 進入時給予) | 高",
        "API進行初步優化，減少執行次數 | 高",
    ],
    "BETA V2.2.5": [
        "新增掉落物&經驗清除功能 | 中",
        "新增領地管理功能 (管理員選單) | 中",
        "新增tpa黑名單系統 | 中",
    ],
    "BETA V2.2.4": [
        "API正式邁入BETA階段! | 低",
        "修復領地在特殊情況下無法刪除的問題 | 高",
        "修復金錢排行榜顯示問題 | 中+",
        "修復公共 / 普通傳送點無法隨領地移除的問題 | 高",
        "修復其他維度領地離開偵測異常問題 | 高",
        "飛行權限更改偵測已新增 | 中",
        "修復領地權限更改訊息在特殊情況下重複發送問題 | 低+",
        "新增黑名單系統 | 中+",
        "銀行系統回歸 | 中+",
    ]
}
export const prefix = '-'

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