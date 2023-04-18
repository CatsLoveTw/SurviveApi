import { world } from '@minecraft/server'
import * as mc from '@minecraft/server'
import { prefix } from '../main';

world.events.beforeChat.subscribe(events => {
    let player = events.sender;
    let message = events.message;
    let displayDimension = '§a§l主世界'
    if (player.dimension.id.toLowerCase() == mc.MinecraftDimensionTypes.nether) {
        displayDimension = '§c§l地獄'
    }
    if (player.dimension.id.toLowerCase() == mc.MinecraftDimensionTypes.theEnd) {
        displayDimension = '§b§l終界'
    }
    events.cancel = true
    if (!message.startsWith(prefix)) {
        player.runCommandAsync(`tellraw @a {"rawtext":[{"text":"§l${displayDimension} §f| §e${player.name} §7> §f${message}"}]}`)
    }
})