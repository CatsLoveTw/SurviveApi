import * as mc from '@minecraft/server'
import * as ui from '@minecraft/server-ui'
import * as land from '../land/UI.js'
import { adminUI } from './admin.js';
import * as tpa from '../tpa/UI.js'
import * as bank from '../bank/UI.js'
import * as home from '../home/UI.js'
import { log, logfor } from '../../lib/GametestFunctions.js';

export function playerUI (player) {
    let form = new ui.ActionFormData()
        .title("§e§l玩家選單")
        .button("§e§l領地功能", 'textures/ui/worldsIcon.png')
        .button("§e§l玩家互傳功能(tpa)", 'textures/ui/dressing_room_skins.png')
        .button("§e§l銀行功能", 'textures/ui/MCoin.png')
        .button("§e§l傳送點功能", 'textures/blocks/portal_placeholder.png')
        .button("§e§l個人資訊", 'textures/ui/icon_alex.png')
        .button("§e§l管理員選單", 'textures/ui/permissions_op_crown.png')
        .show(player).then(res => {
            if (!res) return;
            if (res.selection === 0) {
                land.UI(player)
            } else if (res.selection === 1) {
                tpa.UI(player)
            } else if (res.selection === 2) {
                bank.UI(player)
            } else if (res.selection === 3) {
                try {
                home.UI(player)
                } catch (e) {log(e)}
            } else if (res.selection === 4) {
                return logfor(player.name, `§3§l>> §e敬請期待...`)
            } else if (res.selection === 5) {
                if (player.hasTag("admin")) {
                    adminUI(player)
                } else {
                    logfor (player.name, `§c§l>> §e您沒有權限開啟該選單!`)
                }
            }
        })
}