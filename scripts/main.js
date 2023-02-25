import { world, system } from "@minecraft/server"
import * as mc from "@minecraft/server"
import { cmd, log, logfor } from './lib/GametestFunctions.js'
import { randomInt, worldlog } from "./lib/function.js"

// world.getDimension("overworld").runCommandAsync("say hi:>")

function runCommand (command) {
    world.getDimension("overworld").runCommandAsync(command);
}






world.events.beforeChat.subscribe(events => {
    let player = events.sender;
    let message = events.message;
    
    events.cancel = true
    runCommand(`tellraw @a {"rawtext":[{"text":"§e§l${player.name} §7> §f${message}"}]}`)
})

// system.runSchedule() 類似於tickEvents



















