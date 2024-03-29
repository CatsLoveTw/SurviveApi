import * as mc from '@minecraft/server'
import { cmd, getSearchTextLength, log, logfor } from '../../lib/GametestFunctions'
import { version, updateDate, updates } from '../../config.js'

export const chatCommands = [
    {
        command: 'info',
        des: 'api簡介',
        values: [
            [{"version": "§e§l版本資訊"}],
            [{"update": "§e§l更新內容"}],
        ],
        adminOnly: false,
        loginOnly: false,
        run:
            /**
            @param {mc.Player} player
            @param {string} message
            */
            function (player, message, error) {
                let args = message.split(" ")
                if (args[1] != 'version' && args[1] != 'update') return error();
                if (args[1] == 'version') {
                    logfor(player.name, `§3§l>> §e目前版本§f:§e${version} §f(§e${updateDate}§f)\n§7|||| §e創作者 §7- §eCat1238756 §b(§bOM§f:§bcatmeowmeowmeow §7/ §bDiscord§f:§bCat1238756#9196)`)
                } else if (args[1] == 'update') {
                    let text = '§l§b更新內容 §7| §b影響程度§f'
                    for (let i in updates) {
                        let all = 0
                        let score = 0
                        for (let j in updates[i]) {
                            all++
                            let update = updates[i][j]
                            let args = update.split(" | ")
                            let affect = args[1]
                            if (affect.startsWith('低')) {
                                score += 1 + (getSearchTextLength(affect, "+") * 0.5)
                            }
                            if (affect.startsWith('中')) {
                                score += 2 + (getSearchTextLength(affect, "+") * 0.5)
                            }
                            if (affect.startsWith('高')) {
                                score += 3 + (getSearchTextLength(affect, "+") * 0.5)
                            }
                            if (affect.startsWith('極高')) {
                                score += 4.5 + (getSearchTextLength(affect, "+") * 0.5)
                            }
                            if (affect.startsWith('必備')) {
                                score += 7 + (getSearchTextLength(affect, "+") * 0.5)
                            }
                        }
                        let level = Number(i.split(" | ")[1])
                        score += all * level
                        let average = score / all
                        let deleteScore = 1
                        let affect = ''
                        if (average >= 1 && average < 2) {
                            affect += '§7§l低'
                        }
                        if (average >= 2 && average < 3) {
                            affect += '§6§l中'
                            deleteScore = 2
                        }
                        if (average >= 3 && average < 5) {
                            affect += '§c§l高'
                            deleteScore = 3
                        }
                        if (average >= 5 && average < 7.5) {
                            affect += '§c§l極高'
                            deleteScore = 5
                        }
                        if (average >= 7.5 && average < 9.5) {
                            affect += '§d§l必備'
                            deleteScore = 7.5
                        }
                        // plus
                        let dicimal = average - deleteScore
                        let spread = dicimal
                        while (spread >= 0.5) {
                            spread -= 0.5
                            affect += "+"
                        }
                        if (spread >= 0.01) {
                            affect += "§f" + (spread).toFixed(2)
                        }
                        affect += "§7 (" + average.toFixed(2) + ")"
                        text += `\n§e§l版本 §7- §e${i.split(" | ")[0]} §7| ${affect}\n`
                        for (let j in updates[i]) {
                            let update = updates[i][j]
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
                            if (affect.startsWith('極高')) {
                                displayEffect += `§c${affect}`
                            }
                            if (affect.startsWith('必備')) {
                                displayEffect += `§d${affect}`
                            }
                            text += `§f§l${Number(j)+1}.${context} §f| ${displayEffect}§e\n`
                        }
                    }
                    logfor(player.name, text)
                }
            }
    }
]