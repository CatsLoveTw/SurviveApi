import { system, world } from "@minecraft/server"
import * as mc from '@minecraft/server'
import { worldlog } from "../../lib/function"
import { cmd, log, logfor } from "../../lib/GametestFunctions"


function changeScore(scorename, scoreData) {
    try {
        let deleteScore = []
        for (let score of world.scoreboard.getObjective("menu").getParticipants()) {
            if (score.displayName.indexOf(scorename) != -1) {
                deleteScore.push(score.displayName)
            }
        }
        for (let i in deleteScore) {
            cmd(`scoreboard players reset "${deleteScore[i]}" menu`)
        }
    } catch (e) { world.sendMessage(e) }
    cmd(`scoreboard players set "§l§e${scorename} §7- §b${scoreData}" menu 0`)
}
mc.system.runInterval(() => {
    let date = new Date();
    let h = date.getUTCHours() + 8
    let m = date.getMinutes()
    let s = date.getSeconds()
    let bh = 0
    let bm = 0
    let bs = 0
    if (h > 23) { h = h - 24 }
    if (h < 10) {
        bh = "0" + h
    } else { bh = h }
    if (m < 10) {
        bm = "0" + m
    } else { bm = m }
    if (s < 10) {
        bs = '0' + s
    } else { bs = s }
    let dates = `${bh}:${bm}:${bs}`
    changeScore("現在時間", dates)
}, 5)