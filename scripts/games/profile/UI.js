import * as mc from '@minecraft/server'
import * as ui from '@minecraft/server-ui'
import { log, logfor } from '../../lib/GametestFunctions.js';
import { worldlog } from '../../lib/function.js';
import { playerUI } from '../UI/player.js';

function checkZero (number) {
    if (number < 10 && number > 0) {
        return '0' + number
    }
    return number
}

export function UI(player) {
    let D = worldlog.getScoreFromMinecraft(player.name, "timeD").score
    let H = worldlog.getScoreFromMinecraft(player.name, "timeH").score
    let M = worldlog.getScoreFromMinecraft(player.name, "timeM").score
    let S = worldlog.getScoreFromMinecraft(player.name, "time").score
    let disD = checkZero(D)
    let disH = checkZero(H)
    let disM = checkZero(M)
    let disS = checkZero(S)

    let money = worldlog.getScoreFromMinecraft(player.name, 'money').score
    let time = `§f${disD} §b日 §f${disH} §b小時 §f${disM} §b分鐘 §f${disS} §b秒`
    let death = `§f${worldlog.getScoreFromMinecraft(player.name, 'death').score} §b次`
    let form = new ui.ActionFormData()
        .title("§e§l個人資訊")
        .body(`§e§l遊玩時長 §7- ${time}\n§c§l死亡次數 §7- ${death}`)
        .button(`§7§l返回`, 'textures/ui/arrow_right.png')
        .show(player).then(res => {
            if (res.selection === 0) return playerUI(player)
        })
}