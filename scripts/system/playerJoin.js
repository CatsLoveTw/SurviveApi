import { system, world } from "@minecraft/server"
import * as mc from '@minecraft/server'
import { worldlog } from "../lib/function"
import { cmd, log, logfor } from "../lib/GametestFunctions"

mc.world.afterEvents.playerJoin.subscribe(event => {
    let player = event.playerName
    cmd(`effect "${player}" resistance 10 255 true`)
})