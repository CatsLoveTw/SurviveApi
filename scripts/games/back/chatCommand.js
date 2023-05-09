import * as mc from '@minecraft/server'
import { cmd, log, logfor } from '../../lib/GametestFunctions'

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
                for (let tag of player.getTags()) {
                    if (tag.startsWith('{"back":')) {
                        /**
                         * @type {{"back": {"x": number, "y": number, "z": number, "dimension": string | undefined}}}
                         */
                        let json = JSON.parse(tag)
                        if (json.back.dimension) {
                            if (player.dimension.id == json.back.dimension) {
                                player.runCommandAsync(`tp @s ${json.back.x} ${json.back.y} ${json.back.z}`)
                            } else {
                                function listDimension (dimension) {
                                    if (dimension == mc.MinecraftDimensionTypes.overworld) return '§a§l主世界'
                                    if (dimension == mc.MinecraftDimensionTypes.nether) return '§c§l地獄'
                                    if (dimension == mc.MinecraftDimensionTypes.theEnd) return '§b§l終界'
                                }
                                logfor(player.name, `§c§l>> §e無法傳送! §f(§e目標維度§f:${listDimension(json.back.dimension)} §7| §e所在維度§f:${listDimension(player.dimension.id)}§f)`)
                                return;
                            }
                        } else {
                            player.runCommandAsync(`tp @s ${json.back.x} ${json.back.y} ${json.back.z}`)
                        }
                        logfor(player.name, `§a§l>> §e傳送成功!`)
                        return;
                    }
                }
                return logfor(player.name, `§c§l>> §e找不到可傳送的位置，請稍後再試!`)
            }
    }
]