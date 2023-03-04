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


// 發送訊息 (actionbar) { "news": msg, tick: 0, maxtick: 60 }
const prefix = '-'

function runCommand (command) {
    world.getDimension("overworld").runCommandAsync(command);
}

for (let player of world.getAllPlayers()) {
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
    events.cancel = true
    if (!message.startsWith(prefix)) {
        runCommand(`tellraw @a {"rawtext":[{"text":"§e§l${player.name} §7> §f${message}"}]}`)
    }
})

world.events.beforeItemUse.subscribe(events => {
    const {source: player, item} = events
    if (player.typeId == "minecraft:player") {
        if (item.typeId == "minecraft:compass") {
            playerUI(player)
        }
    }
})

// system.runSchedule() 類似於tickEvent

const scoreboards = {
    "land_squ": 0,
    "land_squ_max": 500,
    "land_land": 0,
    "land_land_max": 20,
    "time": 0,
    "timeD": 0,
    "timeH": 0,
    "timeM": 0,
    "money": 0,
}
system.runSchedule(() => {
    let score = {}
    for (let player of world.getAllPlayers()) {
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
                player.addTag("newPlayer")
            }
    }
}, 1)


function getPlayTime () {
    let i = 0
    world.events.tick.subscribe(() => {
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
                        if (worldlog.getScoreFromMinecraft(player.name, 'land_squ_max').score <= (10000 - 12)) {
                            let getSquMax = worldlog.getScoreFromMinecraft(player.name, 'land_squ_max').score
                            player.runCommandAsync(`scoreboard players add @s land_squ_max 12`)
                            let msg = `§g§l線上獎勵 §f> §a您的領地上限擴大了12格! §f(§e現為 §b${Number(getSquMax) + 12} §e格§f)`
                            let json = { "news": msg, tick: 0, maxtick: 120 }
                            player.addTag(JSON.stringify(json))
                        }
                    }
                    while (M >= 60) {
                        M -= 60
                        H ++
                    }
                    while (H >= 60) {
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
    mc.system.runSchedule(() => {
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
} catch (e) {log(e)}










