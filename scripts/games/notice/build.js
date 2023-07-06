import * as mc from '@minecraft/server'
import { worldlog } from '../../lib/function'
import { cmd, cmd_async, log, logfor } from '../../lib/GametestFunctions'
import { getNoticeData } from './UI'


export function build() {
    function addBoard(ID, Display) {
        cmd_async(`scoreboard objectives add "${ID}" dummy ${Display}`)
    }
    const boards = {
        "notice": "伺服器公告紀錄"
    }
    try {
        for (let board in boards) {
            addBoard(board, boards[board])
        }
    } catch { }

    // 基本設定
    mc.system.runInterval(() => {
        if (worldlog.getScoreboardPlayers('notice').disname.length === 0) {
            // 設定預設公告
            cmd_async(`scoreboard players set "title:伺服器規範.___.message:§f歡迎來到該伺服器，請遵守以下規則§f:§b請勿刷頻及散布不實言論，這是聊天室基本之禮儀。" notice 0`)
        }
    }, 200)

    mc.world.afterEvents.playerJoin.subscribe(events => {
        let { playerName } = events
        mc.system.runTimeout(() => {
            for (let notice of worldlog.getScoreboardPlayers('notice').disname) {
                let data = getNoticeData(notice)
                let title = data.title
                let message = data.message
                cmd_async(`tellraw "${playerName}" {"rawtext":[{"text":"§f§l---§e伺服器公告§f---\n§e標題 §7- §f${title}\n§e內容 §7- §f${message}"}]}`)
            }
        }, 100)
    })
}