import { world, system } from "@minecraft/server"
import * as mc from "@minecraft/server"
import * as ui from '@minecraft/server-ui'
import { cmd, log, logfor } from './lib/GametestFunctions.js'
import { randomInt, worldlog } from "./lib/function.js"
import * as chatCommnad from './games/chatCommands/build.js'
import * as land from './games/land/build.js'
import { playerUI } from "./games/UI/player.js"
import * as titleraw from './games/titleraw/build.js'

// world.getDimension("overworld").runCommandAsync("say hi:>")

// let UI = new ui.MessageFormData()
// .title("測試")
// .body("測試")
// .button1("是")
// .button2("否")
// .show(world.getAllPlayers()[0]).then(res => {
//     log(res.selection)
// })

const prefix = '-'

function runCommand (command) {
    world.getDimension("overworld").runCommandAsync(command);
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

// system.runSchedule() 類似於tickEvents

const scoreboards = {
    "land_squ": 0,
    "land_squ_max": 500,
    "land_land": 0,
    "land_land_max": 20,
    "time": 0,
    "timeD": 0,
    "timeH": 0,
    "timeM": 0
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
                for (let board in score) {
                    player.runCommandAsync(`scoreboard players add @s "${board}" ${score[board]}`)
                }
                player.addTag("newPlayer")
            }
    }
}, 1)


function getNow_PlayTime () {
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

getNow_PlayTime()






// build
try {
    chatCommnad.build(prefix)
    land.build()
    titleraw.build()
} catch (e) {log(e)}










