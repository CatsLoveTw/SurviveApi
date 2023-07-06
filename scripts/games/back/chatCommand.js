import * as mc from '@minecraft/server'
import { cmd, log, logfor } from '../../lib/GametestFunctions'
import { playerDB } from '../../config'

export const chatCommands = [
    // backTag = {"back": {"x": number, "y": number, "z": number, "dimension": string | undefined}}

    /*
        let json = {
            "back": {
                "x": 0,
                "y": 0,
                "z": 0,
                "dimension": string | undefined
            }
        }
    */
    {
        command: 'back',
        des: '回到死亡點或傳送點',
        values: [
            ['accept'],
            ['deny'],
            ['delete']
        ],
        adminOnly: false,
        loginOnly: true,
        run:
            /**
            @param {mc.Player} player
            @param {string} message
            */
            function (player, message, error) {
                const db = playerDB.table(player.id), Back = db.getData("backLocation")
                if (Back && typeof Back.value == "object") {
                    let json = Back.value
                    const Location = {
                        x: json.back.x,
                        y: json.back.y,
                        z: json.back.z
                    }
                    if (json.back.dimension) {
                        const Dimension = mc.world.getDimension(json.back.dimension)
                        player.teleport(Location, {dimension: Dimension})
                    } else {
                        player.teleport(Location)
                    }
                    logfor(player.name, `§a§l>> §e傳送成功!`)
                    return;
                } else {
                    return logfor(player.name, `§c§l>> §e找不到可傳送的位置，請稍後再試!`)
                }
            }
    }
]