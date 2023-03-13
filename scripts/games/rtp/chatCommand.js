import * as mc from '@minecraft/server'
import * as ui from '@minecraft/server-ui'
import { getRandomIntInclusive, worldlog } from '../../lib/function.js'
import { log, cmd, logfor } from '../../lib/GametestFunctions.js'

const rtpTime = 30

export const chatCommands = [
    {
        command: 'rtp',
        des: '隨機傳送',
        values: [
            ["<空>"]
        ],
        adminOnly: false,
        run:
            /**
            @param {mc.Player} player
            @param {string} message
            */
            function (player, message, error) {
                let rtp_time = worldlog.getScoreFromMinecraft(player.name, 'rtp_time').score
                if (rtp_time > 0) {
                    return logfor(player.name, `§c§l>> §e您的隨機傳送冷卻還未結束! §f(§e剩餘 §b${rtp_time} §e秒§f)`)
                }
                
                let x = getRandomIntInclusive(0, 9999999)
                let z = getRandomIntInclusive(0, 9999999)
                player.runCommandAsync(`effect @s blindness 5 255 true`)
                player.runCommandAsync(`effect @s resistance 15 255 true`)
                player.runCommandAsync(`effect @s slowness 5 255 true`)
                player.runCommandAsync(`tp ${x} 350 ${z}`).then(() => {
                    logfor(player.name, `§a§l>> §e傳送成功!`)
                    player.runCommandAsync(`scoreboard players set @s rtp_time ${rtpTime}`)
                    player.runCommandAsync(`tickingarea remove load`)
                })
            }
    }
]