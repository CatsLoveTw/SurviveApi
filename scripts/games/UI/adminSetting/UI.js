import * as ui from '@minecraft/server-ui'
import * as mc from '@minecraft/server'
import { worldlog } from '../../../lib/function'
import { adminUI } from '../admin.js'
import { cmd, log, logfor } from '../../../lib/GametestFunctions'

let dropdown = ['§e§l普通管理員', '§b§l巡查管理員']
/**
 * 
 * @param {mc.Player} player 
 */
export function UI(player) {
    if (player.hasTag('admin')) {
        let form = new ui.ActionFormData()
            .title("§e§l設定管理員")
            .button("§a§l新增")
            .button('§b§l查看')
            .button('§7§l返回')
            .show(player).then(res => {
                if (res.selection === 2) return adminUI(player)

                if (res.selection === 0) {
                    function addAdmin(player, selePlayer, value) {
                        if (value == 0) {
                            selePlayer.addTag("admin")
                            selePlayer.runCommandAsync(`scoreboard players set "${selePlayer.name}" permission 1`)
                        } else {
                            selePlayer.addTag("admin")
                            selePlayer.runCommandAsync(`scoreboard players set "${selePlayer.name}" permission 2`)
                        }
                        logfor(player.name, `§a§l>> §e設定成功!`)
                    }
                    form1()
                    function form1() {
                        let form = new ui.ActionFormData()
                            .title("§e§l新增管理員")
                            .button("§a§l線上玩家")
                            .button("§7§l返回")
                            .show(player).then(res => {
                                if (res.selection === 1) return UI(player)
                                if (res.selection === 0) {
                                    let allPlayers = []
                                    let form = new ui.ActionFormData()
                                        .title("§e§l新增管理員 §f- §e線上玩家")
                                    for (let player of worldlog.getPlayers()) {
                                        if (!player.hasTag('admin')) {
                                            allPlayers.push(player)
                                            form.button(player.name)
                                        }
                                    }
                                    form.button("§7§l返回")
                                    form.show(player).then(res => {
                                        if (res.selection === allPlayers.length) return form1()
                                        if (res.canceled) return;
                                        let form = new ui.ModalFormData()
                                            .title("§e§l新增管理員 §f- §e" + selePlayer.name)
                                            .dropdown("§l§e普通管理員 §7- §f可以使用管理員選單，除了設定管理員與玩家領地\n§b巡查管理員 §7- §f擁有無敵 加速 飛行等功能，也可管理玩家領地與管理員設定。\n§e選擇管理員類別", dropdown, 0)
                                            .show(player).then(res => {
                                                if (res.canceled) return;
                                                addAdmin(player, allPlayers[res.selection], res.formValues[0])
                                            })
                                    })
                                }
                            })
                    }
                }

                if (res.selection === 1) {
                    try {
                    form1()
                    } catch (e) {log(e)}
                    function form1() {
                        let getAdmins = worldlog.getScoreboardPlayers('permission').disname
                        let getDeleteAdmins = worldlog.getScoreboardPlayers('adminDelete').disname
                        let form = new ui.ActionFormData()
                            .title('§e§l查看管理員')
                            .body("§e§l管理員 §b1 §e級 §7- §e普通管理員\n§e管理員 §b2 §e級 §7- §b巡查管理員")
                        for (let admin of getAdmins) {
                            let getPermission = worldlog.getScoreFromMinecraft(admin, 'permission').score
                            form.button(`§e§l名稱 §7- §e${admin}\n§b§l管理階級 §f- §e${getPermission} 級`)
                        }
                        if (getDeleteAdmins.length > 0) {
                            for (let deleteAdmin of getDeleteAdmins) {
                                form.button(`§e§l名稱 §7- §e${deleteAdmin}\n§b§l管理階級 §f- §e0 級 §f(§e在該玩家上線時自動刪除§f)`)
                            }
                        }
                        form.button('§7§l返回')
                        form.show(player).then(res => {
                            if (res.selection === (getAdmins.length) + (getDeleteAdmins.length)) return UI(player)
                            if (res.canceled) return;
                            /**
                             * @type {string}
                             */
                            let selePlayer
                            if (res.selection < getAdmins.length) {
                                selePlayer = getAdmins[res.selection]
                            } else {
                                selePlayer = getDeleteAdmins[res.selection]
                            }

                            let getPermission = worldlog.getScoreFromMinecraft(selePlayer, 'permission')
                            let text = ''
                            let check = true
                            if (getPermission) {
                                text += `§b管理階級 §7- §b${getPermission.score} §b級`
                            } else {
                                text += `§c§l即將被刪除`
                                check = false
                            }
                            let form = new ui.ActionFormData()
                                .title("§e§l管理員設定")
                                .body(`§e§l管理員名稱 §7- §e${selePlayer}\n${text}`)
                            if (check) {
                                form.button(`§b§l調整`)
                                form.button(`§c§l刪除`)
                            } else {
                                form.button(`§a§l復原`)
                            }
                            form.button(`§7§l返回`)
                            form.show(player).then(res => {
                                if (res.selection === 2 && check) return form1()
                                if (res.selection === 1 && !check) return form1()
                                
                                if (check) {
                                    if (res.selection === 0) {
                                        let form = new ui.ModalFormData()
                                            .title(`§e§l管理員調整 §f- §e${selePlayer}`)
                                            .dropdown('§e§l選擇階級', dropdown, getPermission.score-1)
                                            .show(player).then(res => {
                                                if (res.canceled) return
                                                let sele = res.formValues[0]
                                                cmd(`scoreboard players set "${selePlayer}" permission ${sele + 1}`)
                                                let query = {
                                                    name: selePlayer
                                                }
                                                let Seplayer = mc.world.getPlayers(query)
                                                if (Seplayer.length > 0 && (sele + 1) == 2) {
                                                    Seplayer[0].runCommandAsync(`ability @s mayfly false`)
                                                }
                                                return logfor(player.name, `§a§l>> §e修改成功!`);
                                            })
                                    }
                                    if (res.selection === 1) {
                                        cmd(`scoreboard players reset "${selePlayer}" permission`)
                                        cmd(`scoreboard players set "${selePlayer}" adminDelete 0`)
                                        return logfor(player.name, `§a§l>> §e該玩家已經被放入刪除清單，將在玩家上線後自動刪除。在該玩家上線之前，您也可以回到選單復原此操作。`)
                                    }
                                } else {
                                    if (res.selection === 0) {
                                        cmd(`scoreboard players reset "${selePlayer}" adminDelete`)
                                        cmd(`scoreboard players set "${selePlayer}" permission 1`)
                                        return logfor(player.name, `§a§l>> §e回復成功! §f(§e回覆後預設為§b 普通管理員 §e請至選單內自行修改。§f)`)
                                    }
                                }
                            })
                        })
                    }
                }
            })
    } else {
        return logfor(player.name, `§c§l>> §e您沒有權限使用該功能!`)
    }
}