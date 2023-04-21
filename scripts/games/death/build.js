import * as mc from '@minecraft/server'
import { getRandomIntInclusive, worldlog } from '../../lib/function'
import { log, logfor, cmd } from '../../lib/GametestFunctions'
import { dieMessages } from '../../main'

export function build() {
    cmd(`gamerule showdeathmessages false`)
    function addBoard(ID, Display) {
        cmd(`scoreboard objectives add "${ID}" dummy ${Display}`)
    }
    const boards = {
        "death": "死亡次數"
    }
    try {
        for (let board in boards) {
            addBoard(board, boards[board])
        }
    } catch { }

    mc.world.events.entityDie.subscribe((events) => {
        let player = events.deadEntity
        if (player.typeId == 'minecraft:player') {
            player.runCommandAsync(`scoreboard players add @s death 1`)
            for (let postag of player.getTags()) {
                if (postag.startsWith('{"back":')) {
                    player.removeTag(postag)
                }
            }
            let json = {
                "back": {
                    "x": player.location.x,
                    "y": player.location.y,
                    "z": player.location.z,
                    'dimension': player.dimension.id,
                }
            }
            player.addTag(JSON.stringify(json))
            player.runCommandAsync(`tellraw @s {"rawtext":[{"text":"§3§l>> §e您可以透過 §b-back §e回到死亡點!"}]}`)
            let dieMessage = dieMessages[getRandomIntInclusive(0, dieMessages.length-1)]
            log(`§c§l死亡訊息 §f> §b${player.name} §e${dieMessage}`)
        }
    })
}