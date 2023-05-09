import { world } from '@minecraft/server'
import * as mc from '@minecraft/server'
import { prefix } from '../main';
import { checkAccountActive, checkLogin } from './account/functions';

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
    if (checkAccountActive() && !checkLogin(player) && !message.startsWith(prefix)) return player.sendMessage(`§c§l>> §e未登入玩家無法聊天!`)
    if (!message.startsWith(prefix)) {
        player.runCommandAsync(`tellraw @a {"rawtext":[{"text":"§l${displayDimension} §f| §e${player.name} §7> §f${message}"}]}`)
    }
})