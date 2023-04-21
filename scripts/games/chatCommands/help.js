import * as mc from '@minecraft/server'
import * as ui from '@minecraft/server-ui'
import { log, cmd, logfor } from '../../lib/GametestFunctions.js'
import * as chatCommand from './export.js'

export const chatCommands = [
    {
        command: 'help',
        des: '查看指令介紹',
        values: [
            ["<指令|string>"],
            ["<空>"]
        ],
        adminOnly: false,
        run:
            /**
            @param {mc.Player} player
            @param {string} message
            */
            function (player, message, error) {
                let args = message.split(" ")
                let CommandList = []
                if (!args[1]) {
                    for (let j in chatCommand) {
                        for (let i in chatCommand[j].chatCommands) {
                            /**
                             * @type {{command: string, des: string, values: string[][], adminOnly: boolean, run: Function}}
                             */
                            let command = chatCommand[j].chatCommands[i]
                            CommandList.push(`§f-§a${command.command} §7- ${command.des}`)
                        }
                    }
                    logfor(player.name, `§e§l所有的指令 §f- §e共 §b${CommandList.length} §e條\n§e若要更加了解指令內容及範例，可打上 §b-help 指令名稱\n§r${CommandList.join('\n')}`)
                } else {
                    let CommandList = []
                    try {
                        let command = chatCommand[args[1].toLowerCase()].chatCommands[0]
                        let values = ''
                        for (let value of command.values) {
                            values += `§g§l-${command.command} `
                            if (value.length > 1) {
                                for (let i in value) {
                                    let val = value[i]
                                    if (JSON.stringify(val).includes("{")) {
                                        for (let j in val) {
                                            val = `§g§l${j} §f(§g${val[j]}§f)`
                                        }
                                    }
                                    values += `${val} `
                                }
                            } else {
                                let val = value[0]
                                if (JSON.stringify(val).includes("{")) {
                                    for (let j in val) {
                                        val = `§g§l${j} §f(§g${val[j]}§f)`
                                    }
                                }
                                values += `${val} `
                                // values += `${value} `
                            }
                            values += `§7| `
                        }
                        if (command.values.length == 0) {
                            values += `§g§l-${command.command} <空> §7| `
                        }
                        let only = '§a無'
                        if (command.adminOnly) {
                            only = '§c有'
                        }
                        CommandList.push(`§a§l指令 §f- §a${command.command}\n§e介紹 §f- §e${command.des}\n§g§l格式 §f- §g${values.slice(0, values.length - 4)}\n§b§l管理員限定 §f- §b${only}`)
                        logfor(player.name, `§f§l-------------------------\n${CommandList.join("\n§f§l-------------------------\n")}\n§f§l-------------------------`)
                    } catch (e) {
                        logfor (player.name, `§c§l>> §e查無指令`)
                    }
                }
            }
    }
]