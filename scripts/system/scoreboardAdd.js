import { world, system } from '@minecraft/server'
import * as mc from '@minecraft/server'
import { cmd, logfor } from '../lib/GametestFunctions'
import { tpaSetting } from '../defind'



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

    let newItem = new mc.ItemStack(mc.MinecraftItemTypes.compass, 1)
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
    for (let player of world.getPlayers()) {
        for (let board in scoreboards) {
            if (scoreboards[board] == 0) { 
                player.runCommandAsync(`scoreboard players add @s "${board}" ${scoreboards[board]}`)
            } else {
                score[board] = scoreboards[board]
            }
        }
            if (!player.hasTag('newPlayer')) {

                // tpa設定
                for (let tag of player.getTags()) {
                    if (tag.includes("tpaSetting")) {
                        player.removeTag(tag)
                    }
                }
                let tpaSettingTag = new tpaSetting(60, false, [], false)
                player.addTag(tpaSettingTag.transformToTag())



                for (let board in score) {
                    player.runCommandAsync(`scoreboard players add @s "${board}" ${score[board]}`)
                }
                getmenu
                // 給予選單 / 提示
                logfor(player.name, '§3§l>> §e本伺服器擁有自訂義指令之功能，請輸入 §b-help §e獲取更多。')
                getMenu(player)
                player.addTag("newPlayer")
            }
    }
}, 1)

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
        cmd(`scoreboard objectives add "${board}" dummy "${boards[board]}"`)
    } catch {}
}