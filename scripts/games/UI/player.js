import * as mc from '@minecraft/server'
import * as ui from '@minecraft/server-ui'
import * as land from '../land/UI.js'

export function playerUI (player) {
    let form = new ui.ActionFormData()
        .title("§e§l玩家選單")
        .button("§e§l領地功能")
        .button("§e§l管理員選單")
        .show(player).then(res => {
            if (!res) return;
            if (res.selection === 0) {
                land.UI(player)
            } else if (res.selection === 1) {
                if (player.hasTag("admin")) {

                } else {
                    logfor (player.name, `§c§l>> §e您沒有權限開啟該選單!`)
                }
            }
        })
}