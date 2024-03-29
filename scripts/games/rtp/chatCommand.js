import * as mc from '@minecraft/server'
import * as ui from '@minecraft/server-ui'
import { getRandomIntInclusive, worldlog } from '../../lib/function.js'
import { log, cmd, logfor } from '../../lib/GametestFunctions.js'
import { playerDB } from '../../config.js'

const rtpTime = 30

export const chatCommands = [
    {
        command: 'rtp',
        des: '隨機傳送',
        values: [
            ["<空>"]
        ],
        adminOnly: false,
        loginOnly: true,
        run:
            /**
            @param {mc.Player} player
            @param {string} message
            */
            function (player, message, error) {
                if (player.dimension.id != mc.MinecraftDimensionTypes.overworld) return logfor(player.name, `§c§l>> §ertp功能僅支援主世界!`)
                let rtp_time = worldlog.getScoreFromMinecraft(player.name, 'rtp_time').score
                if (rtp_time > 0) {
                    return logfor(player.name, `§c§l>> §e您的隨機傳送冷卻還未結束! §f(§e剩餘 §b${rtp_time} §e秒§f)`)
                }
                
                let x = getRandomIntInclusive(-100000, 100000), z = getRandomIntInclusive(-100000, 100000)

                const db = playerDB.table(player.id)
                let json = {
                    "back": {
                        "x": player.location.x,
                        "y": player.location.y,
                        "z": player.location.z,
                        "dimension": player.dimension.id,
                    }
                }
                player.runCommandAsync(`tellraw @s {"rawtext":[{"text":"§3§l>> §e您可以透過 §b-back §e回到上個位置!"}]}`)
                db.setData("backLocation", json)

                player.runCommandAsync(`effect @s blindness 5 255 true`)
                player.runCommandAsync(`effect @s resistance 15 255 true`)
                player.runCommandAsync(`effect @s slowness 5 255 true`)

                player.runCommandAsync(`tp ${x} 350 ${z}`)
                logfor(player.name, `§a§l>> §e傳送成功!`)
                player.runCommandAsync(`scoreboard players set @s rtp_time ${rtpTime}`)
            }
    }
]