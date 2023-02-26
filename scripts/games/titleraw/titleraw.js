import * as mc from '@minecraft/server'
import { world } from '@minecraft/server'
import { worldlog } from '../../lib/function'
import { cmd, log, titlefor } from '../../lib/GametestFunctions'

export function build () {
    // {"news": msg, tick: 0, maxtick: 20}
    mc.system.runSchedule(() => {
        for (let player of world.getAllPlayers()) {
            let display = []
            for (let tag of player.getTags()) {
                if (tag.startsWith('{"news"')) {
                    if (JSON.parse(tag).tick == JSON.parse(tag).maxtick) {
                        player.removeTag(tag)
                    } else {
                        player.removeTag(tag)
                        let data = JSON.parse(tag)
                        data.tick = data.tick+1
                        data = JSON.stringify(data)
                        player.addTag(data)
                        display.push(`§l§f${((JSON.parse(data).maxtick - JSON.parse(data).tick) / 20).toFixed(1)}s §a> ` + JSON.parse(data).news + "\n")
                    }
                }
            }
            let D = worldlog.getScoreFromMinecraft(player.name, "timeD").score
            let H = worldlog.getScoreFromMinecraft(player.name, "timeH").score
            let M = worldlog.getScoreFromMinecraft(player.name, "timeM").score
            let S = worldlog.getScoreFromMinecraft(player.name, "time").score
            let disD = D
            let disH = H
            let disM = M
            let disS = S
            if (H < 10 && H != 0) {
                disH = "0" + H
            }
            if (M < 10 && M != 0) {
                disM = "0" + M
            } 
            if (S < 10 && S != 0) {
                disS = "0" + S
            }

            let time = `§f${disD} §b日 §f${disH} §b小時 §f${disM} §b分鐘 §f${disS} §b秒`
            titlefor(player.name, `§l${display.join("")}§f遊玩 §7- ${time}`)
        }
    }, 1)
}