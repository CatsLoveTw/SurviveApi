import * as mc from '@minecraft/server'
import { worldlog } from '../../lib/function'
import { cmd, log } from '../../lib/GametestFunctions'

export function build () {
    function addBoard(ID, Display) {
        cmd(`scoreboard objectives add "${ID}" dummy ${Display}`)
    }
    const boards = {
        "rtp_time": "rtp冷卻時間"
    }
    try {
        for (let board in boards) {
            addBoard(board, boards[board])
        }
    } catch { }

    mc.system.runInterval(() => {
        for (let player of mc.world.getPlayers()) {
            if (worldlog.getScoreFromMinecraft(player.name, 'rtp_time').score > 0) {
                player.runCommandAsync(`scoreboard players remove @s rtp_time 1`)
                if (worldlog.getScoreFromMinecraft(player.name, 'rtp_time').score - 1 == 0) {
                    logfor(player.name, `§a§l>> §e您的rtp冷卻已經結束!`)
                }
            }
        }
    }, 20)
}