import * as mc from '@minecraft/server'
import { world } from '@minecraft/server'
import { worldlog } from '../../lib/function'
import { addSign, cmd, log, removeSign, titlefor } from '../../lib/GametestFunctions'
import { checkAccountActive, checkLogin } from '../../system/account/functions';
import { playerDB } from '../../config';

export function build() {
    // {"news": msg, tick: 0, maxtick: 20}
    mc.system.runInterval(() => {
        for (let player of mc.world.getPlayers()) {
            // 處理動態消息
            let display = []
            let db = playerDB.table(player.id)
            let allDynamicMessage = db.getData("dynamic_message")
            if (allDynamicMessage && allDynamicMessage.value.length > 0) {
                for (let message of allDynamicMessage.value) {
                    const news = typeof message.news == "string" ? message.news : String(message.news);
                    if (message.tick >= message.maxtick) {
                        removeSign(news, player)
                    } else {
                        removeSign(news, player)
                        addSign(news, player, message.maxtick, message.tick + 1)
                        display.push(`§l§f${((message.maxtick - message.tick) / 20).toFixed(1)}s §7| ` + news + "\n")
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
            let money = worldlog.getScoreFromMinecraft(player.name, 'money').score
            let dismoney = ''
            if (money < 1000) {
                dismoney = money
            } else {
                let B = 1000000000
                let M = 1000000
                let K = 1000
                let check = true
                if (money >= B && check) {
                    dismoney = (money / B).toFixed(2) + "B"
                    check = false
                }
                if (money >= M && check) {
                    dismoney = (money / M).toFixed(2) + "M"
                    check = false
                }
                if (money >= K && check) {
                    dismoney = (money / K).toFixed(2) + "K"
                }
                let get = dismoney.split('.')[1]
                // slice (不被包含, 包含) ex: 你好.slice(1, 2) 只會顯示2 (好)
                if (get.slice(1, 2) == '0') {
                    dismoney = dismoney.split('.')[0] + '.' + get.slice(0, 1) + get.slice(2, 3)
                    if (get.slice(0, 1) == '0') {
                        dismoney = dismoney.split('.')[0] + get.slice(2, 3)
                    }
                }

            }

            let time = `§f${disD} §b日 §f${disH} §b小時 §f${disM} §b分鐘 §f${disS} §b秒`
            if (!checkLogin(player) && checkAccountActive()) {
                titlefor(player.name, `§l${display.join("")}`)
            } else {
                titlefor(player.name, `§l${display.join("")}§g金錢 §7- §e${dismoney} `)
            }
        }
    }, 1)
}