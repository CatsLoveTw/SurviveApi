import * as mc from '@minecraft/server'
import { cmd, log, logfor } from '../../lib/GametestFunctions'
import { worldlog } from '../../lib/function'

export function build () {
    function addBoard(ID, Display) {
        cmd(`scoreboard objectives add "${ID}" dummy ${Display}`)
    }
    const boards = {
        "money_save": "金錢排行計算專用"
    }
    try {
        for (let board in boards) {
            addBoard(board, boards[board])
        }
    } catch { }

    // 將玩家金錢轉移至紀錄排行榜
    mc.system.runInterval(() => {
        for (let player of worldlog.getScoreboardPlayers('money').disname) {
            if (player != 'commands.scoreboard.players.offlinePlayerName') {
                let score = worldlog.getScoreFromMinecraft(player, 'money').score
                cmd(`scoreboard players set "___${player}___" money_save ${score}`)
            }
        }
    })
}