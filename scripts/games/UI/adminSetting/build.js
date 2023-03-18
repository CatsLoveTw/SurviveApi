import * as mc from '@minecraft/server'
import { worldlog } from '../../../lib/function'
import { cmd, log } from '../../../lib/GametestFunctions'

export function build () {
    function addBoard(ID, Display) {
        cmd(`scoreboard objectives add ${ID} dummy "${Display}"`)
    }
    const boards = {
        "permission": "權限管理",
        "adminDelete": "即將被刪除"
    }
    try {
        for (let board in boards) {
            addBoard(board, boards[board])
        }
    } catch { }

    mc.system.runInterval(() => {
        for (let player of mc.world.getPlayers()) {
            try {
                if (worldlog.getScoreFromMinecraft(player.name, 'permission').score == 2 && player.hasTag("admin")) {
                    player.runCommandAsync(`ability @s mayfly true`)
                }
            } catch { }
        }
        let getDeletesPlayer = worldlog.getScoreboardPlayers('adminDelete').disname
        for (let deletePlayer of getDeletesPlayer) {
            for (let player of mc.world.getPlayers()) {
                if (deletePlayer == player.name) {
                    player.removeTag(`admin`)
                    cmd(`scoreboard players reset "${deletePlayer}" adminDelete`)
                    logfor(player.name, `§c§l>> §e您的管理員權限已被刪除。`)
                }
            }
        }
    }, 1)
}