import * as mc from '@minecraft/server'
import { worldlog } from '../../lib/function'
import { log, logfor, cmd } from '../../lib/GametestFunctions'


export class banList {
    /**
     * 
     * @param {string} playerName 
     * @param {string} reason 
     */
    constructor(playerName, reason) {
        this.playerName = playerName
        this.reason = reason
    }

    /**
     * 
     * @returns 玩家名稱_,_原因
     */
    transform() {
        return `${this.playerName}_,_${this.reason}`
    }
}

export function transformScoreboard(text) {
    let args = text.split("_,_")
    let playerName = args[0]
    let reason = args[1]
    return new banList(playerName, reason)
}


function addBoard(ID, Display) {
    cmd(`scoreboard objectives add "${ID}" dummy ${Display}`)
}
const boards = {
    "banlist": "黑名單玩家"
}
try {
    for (let board in boards) {
        addBoard(board, boards[board])
    }
} catch { }

mc.system.runInterval(() => {
    for (let player of mc.world.getAllPlayers()) {
        for (let ban of worldlog.getScoreboardPlayers("banlist").disname) {
            let getData = transformScoreboard(ban)
            if (getData.playerName == player.name) {
                player.runCommandAsync(`kick "${player.name}" "§c§l您被管理員設定為黑名單，原因:§b${getData.reason}"`)
                mc.world.sendMessage(`§e§l系統 §3> §e已成功將 §b${player.name} §e踢除!`)
            }
        }
    }
}, 1)