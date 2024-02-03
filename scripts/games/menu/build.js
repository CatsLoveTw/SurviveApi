import * as mc from '@minecraft/server'
import { playerUI } from '../UI/player'
import Event from '../../system/eventBuild'

export function build() {
    Event.on("afterItemUse", events => {
        const { source: player, itemStack: item } = events
        if (player.typeId == "minecraft:player") {
            if (item.typeId == "minecraft:compass" && item.nameTag == '§e§l選單系統' && item.getLore().includes("§e§l右鍵/長按螢幕開啟選單")) {
                playerUI(player)
            }
        }
    })
}