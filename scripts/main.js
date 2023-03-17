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

try {
// 發送訊息 (actionbar) { "news": msg, tick: 0, maxtick: 60 }
const prefix = '-'

function runCommand (command) {
    world.getDimension("overworld").runCommandAsync(command);
}

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

for (let player of world.getPlayers()) {
    for (let tag of player.getTags()) {
        if (tag.startsWith('{"news":')) {
            player.removeTag(tag)
        }
    }
}

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



world.events.beforeChat.subscribe(events => {
    let player = events.sender;
    let message = events.message;
    let displayDimension = '§a§l主世界'
    if (player.dimension.id.toLowerCase() == mc.MinecraftDimensionTypes.nether) {
        displayDimension = '§c§l地獄'
    }
    if (player.dimension.id.toLowerCase() == mc.MinecraftDimensionTypes.theEnd) {
        displayDimension = '§b§l終界'
    }
    events.cancel = true
    if (!message.startsWith(prefix)) {
        runCommand(`tellraw @a {"rawtext":[{"text":"§l${displayDimension} §f| §e${player.name} §7> §f${message}"}]}`)
    }
})

// system.runInterval() 類似於tickEvent

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
                for (let tag of player.getTags()) {
                    if (tag.includes("tpaSetting")) {
                        player.removeTag(tag)
                    }
                }
                let json = {
                    "tpaSetting": {"dontDistrub": false, "sec": 60}
                }
                player.addTag(JSON.stringify(json))



                for (let board in score) {
                    player.runCommandAsync(`scoreboard players add @s "${board}" ${score[board]}`)
                }

                // 給予選單 / 提示
                logfor(player.name, '§3§l>> §e本伺服器擁有自訂義指令之功能，請輸入 §b-help §e獲取更多。')
                getMenu(player)
                player.addTag("newPlayer")
            }
    }
}, 1)

// 無敵
mc.world.events.playerJoin.subscribe(event => {
    let player = event.player
    player.addEffect(mc.MinecraftEffectTypes.resistance, 10, 255, false)
})

function getPlayTime () {
    let i = 0
    
    system.runInterval(() => {
        i++
        if (i == 20) {
            i = 0
            for (let player of world.getPlayers()) {
                player.runCommandAsync(`scoreboard players add @s time 1`).then(() => {
                    let sec = worldlog.getScoreFromMinecraft(player.name, "time").score
                    let M = worldlog.getScoreFromMinecraft(player.name, "timeM").score
                    let H = worldlog.getScoreFromMinecraft(player.name, "timeH").score
                    let D = worldlog.getScoreFromMinecraft(player.name, "timeD").score
                    while (sec >= 60) {
                        sec -= 60
                        M ++
                        if (worldlog.getScoreFromMinecraft(player.name, 'land_squ_max').score <= (500000 - 60)) {
                            let getSquMax = worldlog.getScoreFromMinecraft(player.name, 'land_squ_max').score
                            player.runCommandAsync(`scoreboard players add @s land_squ_max 60`)
                            let msg = `§g§l線上獎勵 §f> §a您的領地上限擴大了60格! §f(§e現為 §b${Number(getSquMax) + 60} §e格§f)`
                            let json = { "news": msg, tick: 0, maxtick: 120 }
                            player.addTag(JSON.stringify(json))
                        }
                    }
                    while (M >= 60) {
                        M -= 60
                        H ++
                    }
                    while (H >= 24) {
                        H -= 24
                        D ++
                    }
                    player.runCommandAsync(`scoreboard players set @s time ${sec}`)
                    player.runCommandAsync(`scoreboard players set @s timeM ${M}`)
                    player.runCommandAsync(`scoreboard players set @s timeH ${H}`)
                    player.runCommandAsync(`scoreboard players set @s timeD ${D}`)
                })
            }
        }
    })
}

function displayMenu() {
    function changeScore (scorename, scoreData) {
        try {
            let deleteScore = []
            for (let score of world.scoreboard.getObjective("menu").getParticipants()) {
                if (score.displayName.indexOf(scorename) != -1) {
                    deleteScore.push(score.displayName)
                }
            }
            for (let i in deleteScore) {
                cmd(`scoreboard players reset "${deleteScore[i]}" menu`)
            }
        } catch (e) { world.say(e) }
        cmd(`scoreboard players set "§l§e${scorename} §7- §b${scoreData}" menu 0`)
    }
    mc.system.runInterval(() => {
        let date = new Date();
        let h = date.getUTCHours() + 8
        let m = date.getMinutes()
        let s = date.getSeconds()
        let bh = 0
        let bm = 0
        let bs = 0
        if (h < 10) {
            bh = "0" + h
        } else { bh = h }
        if (m < 10) {
            bm = "0" + m
        } else { bm = m }
        if (s < 10) {
            bs = '0' + s
        } else { bs = s }
        let dates = `${bh}:${bm}:${bs}`
        changeScore("現在時間", dates)
    }, 1)
}

getPlayTime()
displayMenu()






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
} catch (e) {log(e)}










} catch (e) {log(e)}