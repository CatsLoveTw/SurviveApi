import * as mc from '@minecraft/server'
import { playerUI } from '../UI/player'

export function build() {
    mc.world.events.beforeItemUse.subscribe(events => {
        const { source: player, item } = events
        if (player.typeId == "minecraft:player") {
            if (item.typeId == "minecraft:compass" && item.nameTag == '§e§l選單系統' && item.getLore()[0] == "§e§l右鍵/長按螢幕開啟選單") {
                playerUI(player)
            }
        }
    })
}