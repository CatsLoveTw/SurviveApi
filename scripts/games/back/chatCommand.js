import * as mc from '@minecraft/server'
import { cmd, log, logfor } from '../../lib/GametestFunctions'

export const chatCommands = [
    // backTag = {"back": {"x": number, "y": number, "z": number}}

    /*
        let json = {
            "back": {
                "x": 0,
                "y": 0,
                "z": 0
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
        run:
            /**
            @param {mc.Player} player
            @param {string} message
            */
            function (player, message, error) {
                for (let tag of player.getTags()) {
                    if (tag.startsWith('{"back":')) {
                        /**
                         * @type {{"back": {"x": number, "y": number, "z": number}}}
                         */
                        let json = JSON.parse(tag)
                        player.runCommandAsync(`tp @s ${json.back.x} ${json.back.y} ${json.back.z}`)
                        logfor(player.name, `§a§l>> §e傳送成功!`)
                        return;
                    }
                }
                return logfor(player.name, `§c§l>> §e找不到可傳送的位置，請稍後再試!`)
            }
    }
]