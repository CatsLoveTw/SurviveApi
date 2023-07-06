import * as mc from '@minecraft/server'
import * as ui from '@minecraft/server-ui'
import { worldlog } from '../../lib/function.js'
import { log, cmd, logfor, cmd_async } from '../../lib/GametestFunctions.js'
import { banList, transformScoreboard } from './build.js'

export function adminUI (player) {
    let form = new ui.ActionFormData()
        .title("§e§l黑名單系統")
        .button("§a§l新增")
        .button("§b§l查看")
        .show(player).then(res => {
            if (res.selection === 0) {
                let add = () => {
                    let form = new ui.ActionFormData()
                        .title("§e§l黑名單系統 §f- §a新增")
                        .button("§a§l線上玩家")
                        .button("§b§l手動輸入")
                        .button("§7§l返回")
                        .show(player).then(res => {
                            if (res.selection === 2) return adminUI(player);
                            if (res.selection === 0) {
                                let players = []
                                let playerNames = []
                                for (let pl of mc.world.getAllPlayers()) {
                                    players.push(pl)
                                    playerNames.push(pl.name)
                                }

                                let form = new ui.ActionFormData()
                                    .title("§e§l黑名單系統 §f- §e選擇在線玩家")
                                for (let name of playerNames) {
                                    form.button(name)
                                }
                                form.button("§7§l返回")
                                form.show(player).then(res => {
                                    if (res.selection === playerNames.length) return add();
                                    if (res.canceled) return
                                    let selePlayerName = playerNames[res.selection]
                                    return addMenu(selePlayerName);
                                })
                            }

                            if (res.selection === 1) {
                                addMenu('')
                            }

                            function addMenu(playerName) {
                                let display = playerName
                                if (!display) display = '';
                                let form = new ui.ModalFormData()
                                    .title("§e§l黑名單系統 §f- §a新增玩家")
                                    .textField("§e§l請輸入玩家名稱", "名稱", playerName)
                                    .textField("§e§l請輸入玩家被ban原因", "原因", "")
                                    .show(player).then(res => {
                                        if (res.canceled) return;
                                        for (let ban of worldlog.getScoreboardPlayers("banlist").disname) {
                                            let data = transformScoreboard(ban)
                                            if (data.playerName == res.formValues[0]) return logfor(player.name, `§c§l>> §e名稱重複!`)
                                        }
                                        let name = res.formValues[0]
                                        let reason = res.formValues[1]
                                        if (name == '' || reason == '') return logfor(player.name, `§c§l>> §e參數不得為空!`)
                                        let text = new banList(name, reason).transform()
                                        cmd(`scoreboard players add "${text}" banlist 0`)
                                        return logfor(player.name, `§a§l>> §e新增成功!`)
                                    })
                            }
                        }) 
                }
                add()
            }

            if (res.selection === 1) {
                function list() {
                    let bans = worldlog.getScoreboardPlayers("banlist").disname
                    let form = new ui.ActionFormData()
                        .title("§e§l黑名單系統 §f- §b查看")
                    for (let ban of bans) {
                        let data = transformScoreboard(ban)
                        form.button(data.playerName)
                    }
                    form.button("§7§l返回")
                    form.show(player).then(res => {
                        if (res.selection === bans.length) return adminUI(player);
                        if (res.canceled) return;
                        /**
                         * @type {string}
                         */
                        let seleBan = bans[res.selection]
                        let data = transformScoreboard(seleBan)
                        let form = new ui.ActionFormData()
                            .title("§e§l黑名單系統 §f- §b" + data.playerName)
                            .body(`§e§l玩家名稱 §f- §e${data.playerName}\n§b§l原因 §f- §b${data.reason}`)
                            .button("§b§l修改")
                            .button("§c§l刪除")
                            .button("§7§l返回")
                            .show(player).then(res => {
                                if (res.selection === 0) {
                                    let form = new ui.ModalFormData()
                                    .title("§e§l黑名單系統 §f- §b修改玩家")
                                    .textField("§e§l請輸入玩家名稱", "名稱", data.playerName)
                                    .textField("§e§l請輸入玩家被ban原因", "原因", data.reason)
                                    .show(player).then(res => {
                                        if (res.canceled) return;
                                        for (let ban of worldlog.getScoreboardPlayers("banlist").disname) {
                                            let data = transformScoreboard(ban)
                                            if (data.playerName == res.formValues[0]) {
                                                cmd(`scoreboard players reset "${ban}" banlist`)
                                            }
                                        }

                                        let name = res.formValues[0]
                                        let reason = res.formValues[1]
                                        if (name == '' || reason == '') return logfor(player.name, `§c§l>> §e參數不得為空!`)
                                        let text = new banList(name, reason).transform()
                                        cmd(`scoreboard players add "${text}" banlist 0`)
                                        return logfor(player.name, `§a§l>> §e修改成功!`)
                                    })
                                } else if (res.selection === 1) {
                                    cmd(`scoreboard players reset "${data.transform()}" banlist`)
                                    return logfor(player.name, `§a§l>> §e§l刪除成功!`)
                                } else if (res.selection === 2) return list();
                            })
                    })
                }
                list()
            }
        })
}