import { system, world } from "@minecraft/server"
import * as mc from '@minecraft/server'
import { worldlog } from "../lib/function"
import { cmd_async, log, logfor } from "../lib/GametestFunctions"
import Event from "./eventBuild"

Event.on("afterPlayerJoin", event => {
    let player = event.playerName
    cmd_async(`effect "${player}" resistance 10 255 true`)
})