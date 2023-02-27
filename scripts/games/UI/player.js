import * as mc from '@minecraft/server'
import * as ui from '@minecraft/server-ui'
import * as land from '../land/UI.js'
import { adminUI } from './admin.js';
import * as tpa from '../tpa/UI.js'
import * as bank from '../bank/UI.js'

export function playerUI (player) {
    let form = new ui.ActionFormData()
        .title("§e§l玩家選單")
        .button("§e§l領地功能")
        .button("§e§l玩家互傳功能(tpa)")
        .button("§e§l銀行功能")
        .button("§e§l管理員選單")
        .show(player).then(res => {
            if (!res) return;
            if (res.selection === 0) {
                land.UI(player)
            } else if (res.selection === 1) {
                tpa.UI(player)
            } else if (res.selection === 2) {
                bank.UI(player)
            } else if (res.selection === 3) {
                if (player.hasTag("admin")) {
                    adminUI(player)
                } else {
                    logfor (player.name, `§c§l>> §e您沒有權限開啟該選單!`)
                }
            }
        })
}