import * as mc from '@minecraft/server'
import * as ui from '@minecraft/server-ui'
import * as land from '../land/UI.js'

/**
 * 
 * @param {mc.Player} player 
 */
export function adminUI (player) {
    let form = new ui.ActionFormData()
        .title("§e§l管理員選單")
        .button("§e§l公共領地功能")
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
        })
}