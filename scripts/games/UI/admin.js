import * as mc from '@minecraft/server'
import * as ui from '@minecraft/server-ui'
import * as land from '../land/UI.js'
import * as notice from '../notice/UI.js'
import * as adminSetting from './adminSetting/UI.js'
import * as shop from '../shop/UI.js'

/**
 * 
 * @param {mc.Player} player 
 */
export function adminUI (player) {
    let form = new ui.ActionFormData()
        .title("§e§l管理員選單")
        .button("§e§l公共領地功能")
        .button("§e§l公告設定")
        .button('§e§l管理員設定')
        .button("§e§l商品設定")
        .show(player).then(res => {
            if (!res) return;
            if (res.selection === 0) {
                let dime = 'overworld'
                if (player.dimension.id.toLowerCase() == mc.MinecraftDimensionTypes.nether) {
                    dime = 'nether'
                }
                if (player.dimension.id.toLowerCase() == mc.MinecraftDimensionTypes.theEnd) {
                    dime = 'end'
                }
                land.adminUI(player, dime)
            }
            if (res.selection === 1) {
                notice.adminUI(player)
            }
            if (res.selection === 2) {
                adminSetting.UI(player)
            }
            if (res.selection === 3) {
                shop.adminUI(player)
            }
        })
}