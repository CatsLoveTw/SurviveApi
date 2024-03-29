import { world, system } from '@minecraft/server'
import * as mc from '@minecraft/server'
import { cmd, cmd_async, log, logfor } from '../lib/GametestFunctions'
import { tpaSetting } from '../games/tpa/defind'
import { worldlog } from '../lib/function'
import { playerDB } from '../config'



function getMenu (player) {
    /**
    * @type {mc.EntityInventoryComponent}
    */
    let inv = player.getComponent("inventory")
    let count = 0
    let Slot = 0
    for (let i = 0; i < 36; i++) {
        if (Slot == 0) {
            try {
                if (inv.container.getItem(i).typeId) {
                    count++
                } else {
                    Slot = i
                }
            } catch {
                Slot = i
            }
        }
    }
    if (count == 36) return logfor(player.name, `§c§l>> §e背包已滿，請稍後嘗試!`)

    let newItem = new mc.ItemStack("minecraft:compass", 1)
    newItem.nameTag = `§e§l選單系統`
    newItem.setLore(["§e§l右鍵/長按螢幕開啟選單"])
    inv.container.setItem(Slot, newItem)
}


// 紀錄玩家資訊
const scoreboards = {
    "land_squ": 0,
    "land_squ_max": 500,
    "land_land": 0,
    "land_land_max": 30,
    "time": 0,
    "timeD": 0,
    "timeH": 0,
    "timeM": 0,
    "money": 0,
    "rtp_time": 0,
    'death': 0
}
system.runInterval(() => {
    let score = {}
    for (let player of worldlog.getPlayers()) {
        for (let board in scoreboards) {
            if (scoreboards[board] == 0) { 
                player.runCommandAsync(`scoreboard players add @s "${board}" ${scoreboards[board]}`)
            } else {
                score[board] = scoreboards[board]
            }
        }
            if (!player.hasTag('newPlayer')) {
                const db = playerDB.table(player.id)
                log(`§b§l>> §e歡迎 ${player.name} 加入SCC大家庭~`)
                
                // tpa設定
                let tpaSet = new tpaSetting(60, false, [], false)
                db.setData("tpaSetting", tpaSet.toJSON())


                for (let board in score) {
                    player.runCommandAsync(`scoreboard players add @s "${board}" ${score[board]}`)
                }
                // 給予選單 / 提示
                logfor(player.name, '§3§l>> §e本伺服器擁有自訂義指令之功能，請輸入 §b-help §e獲取更多。')
                getMenu(player)
                player.addTag("newPlayer")
            }
    }
}, 5)

// 紀錄系統資訊

const boards = {
    "time": "秒",
    "timeM": '分',
    "timeH": "時",
    'timeD': "天",
    "menu": "§l---§e伺服器資訊§f---"
}

for (let board in boards) {
    try {
        cmd_async(`scoreboard objectives add "${board}" dummy "${boards[board]}"`)
    } catch {}
}