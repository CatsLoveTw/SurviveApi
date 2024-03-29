import { system, world } from "@minecraft/server"
import * as mc from '@minecraft/server'
import { worldlog } from "../lib/function"
import { addSign, cmd, log, logfor } from "../lib/GametestFunctions"
import { checkAccountActive, checkLogin } from "./account/functions"

system.runInterval(() => {
    for (let player of worldlog.getPlayers()) {
        player.runCommand(`scoreboard players add @s time 1`)
        let sec = worldlog.getScoreFromMinecraft(player.name, "time").score
        let M = worldlog.getScoreFromMinecraft(player.name, "timeM").score
        let H = worldlog.getScoreFromMinecraft(player.name, "timeH").score
        let D = worldlog.getScoreFromMinecraft(player.name, "timeD").score
        while (sec >= 60) {
            sec -= 60
            M++
            if (worldlog.getScoreFromMinecraft(player.name, 'land_squ_max').score <= (500000 - 60)) {
                let getSquMax = worldlog.getScoreFromMinecraft(player.name, 'land_squ_max').score
                player.runCommandAsync(`scoreboard players add @s land_squ_max 60`)
                let msg = `§g§l線上獎勵 §f> §a您的領地上限擴大了60格! §f(§e現為 §b${Number(getSquMax) + 60} §e格§f)`
                addSign(msg, player, 120)
            }
        }
        while (M >= 60) {
            M -= 60
            H++
        }
        while (H >= 24) {
            H -= 24
            D++
        }
        player.runCommand(`scoreboard players set @s time ${sec}`)
        player.runCommand(`scoreboard players set @s timeM ${M}`)
        player.runCommand(`scoreboard players set @s timeH ${H}`)
        player.runCommand(`scoreboard players set @s timeD ${D}`)
    }
}, 20)