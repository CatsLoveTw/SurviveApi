import * as mc from '@minecraft/server'
import { getRandomIntInclusive, worldlog } from '../../lib/function'
import { log, logfor, cmd, cmd_async } from '../../lib/GametestFunctions'
import { dieMessages, playerDB } from '../../config'
import Event from '../../system/eventBuild'

export function build() {
    cmd_async(`gamerule showdeathmessages false`)
    function addBoard(ID, Display) {
        cmd_async(`scoreboard objectives add "${ID}" dummy ${Display}`)
    }
    const boards = {
        "death": "死亡次數"
    }
    try {
        for (let board in boards) {
            addBoard(board, boards[board])
        }
    } catch { }

    Event.on("afterEntityDie", (events) => {
        let player = events.deadEntity;
        try {
            if (player.typeId == 'minecraft:player') {
                const db = playerDB.table(player.id)
                player.runCommandAsync(`scoreboard players add @s death 1`)
                let json = {
                    "back": {
                        "x": player.location.x,
                        "y": player.location.y,
                        "z": player.location.z,
                        'dimension': player.dimension.id,
                    }
                }

                db.setData("backLocation", json)

                player.runCommandAsync(`tellraw @s {"rawtext":[{"text":"§3§l>> §e您可以透過 §b-back §e回到死亡點!"}]}`)
                let dieMessage = dieMessages[getRandomIntInclusive(0, dieMessages.length - 1)]
                log(`§c§l死亡訊息 §f> §b${player.name} §e${dieMessage}`)
            }
        } catch {}
    })
}