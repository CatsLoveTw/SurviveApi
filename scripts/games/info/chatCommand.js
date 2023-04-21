import * as mc from '@minecraft/server'
import { cmd, log, logfor } from '../../lib/GametestFunctions'
import * as updatedata from '../../main.js'

export const chatCommands = [
    {
        command: 'info',
        des: 'api簡介',
        values: [
            [{"version": "§e§l版本資訊"}],
            [{"update": "§e§l更新內容"}],
        ],
        adminOnly: false,
        run:
            /**
            @param {mc.Player} player
            @param {string} message
            */
            function (player, message, error) {
                let args = message.split(" ")
                if (args[1] != 'version' && args[1] != 'update') return error();
                if (args[1] == 'version') {
                    logfor(player.name, `§3§l>> §e目前版本§f:§e${updatedata.version} §f(§e${updatedata.updateDate}§f) §7| §e創作者 §7- §eCat1238756 §f(§bOM§f:§bcatmeowmeowmeow§f)`)
                } else if (args[1] == 'update') {
                    let text = ''
                    for (let i in updatedata.updates) {
                        text += `§e§l版本 §7- §e${i}\n§f(§b更新內容 §7| §b影響程度§f)\n`
                        for (let j in updatedata.updates[i]) {
                            let update = updatedata.updates[i][j]
                            let args = update.split(" | ")
                            let context = args[0]
                            let affect = args[1]
                            let displayEffect = ''
                            if (affect.startsWith('低')) {
                                displayEffect += `§7${affect}`
                            }
                            if (affect.startsWith('中')) {
                                displayEffect += `§6${affect}`
                            }
                            if (affect.startsWith('高')) {
                                displayEffect += `§c${affect}`
                            }
                            text += `§f§l${Number(j)+1}.${context} §f| ${displayEffect}§e\n`
                        }
                    }
                    logfor(player.name, text)
                }
            }
    }
]