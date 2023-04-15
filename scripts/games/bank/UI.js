import * as mc from '@minecraft/server';
import { ActionFormData, MessageFormData, ModalFormData } from '@minecraft/server-ui';
import { isNum, worldlog } from '../../lib/function';
import { cmd, log, logfor } from '../../lib/GametestFunctions';
import { playerUI } from '../UI/player';

/**
 * 
 * @param {mc.Player} player 
 */
export function UI(player) {
    // 轉帳系統tag 給錢: {"senderTM": {"value": number, "sender": string, "target": string, "startTime": number}}
    // 收到錢: {"targetTM": {"value": number, "sender": string, "target": string, "startTime": number}}
    // value 轉帳金額 sender 轉帳人 target 收帳者 startTime 開始時間
    for (let tag of player.getTags()) {
        if (tag.includes('{"senderTm":') || tag.includes('{"targetTM":')) {
            return logfor(player.name, `§c§l>> §e請等待上筆無條件退款結束!`)
        }
    }
    let players = []
    let playerNames = []
    for (let pl of mc.world.getPlayers()) {
        if (pl.name != player.name) {
            players.push(pl)
            playerNames.push(pl.name)
        }
    }
    if (worldlog.getScoreFromMinecraft(player.name, `money`).score == 0) {
        return logfor(player.name, `§c§l>> §e沒有錢可轉帳!`)
    }
    if (players.length == 0) {
        return logfor(player.name, `§c§l>> §e沒有玩家可轉帳!`)
    }
    let form = new ActionFormData()
        .title("§b§l轉帳系統")
        .body("§e§l選取玩家")
    for (let pl of playerNames) {
        form.button(pl)
    }
    form.show(player).then(res => {
        if (res.canceled) return playerUI(player);
        let max = worldlog.getScoreFromMinecraft(player.name, 'money').score
        /**
         * @type {mc.Player}
         */
        let selePlayer = players[res.selection]
        let form = new ModalFormData()
            .title("§b§l轉帳系統")
            .textField(`§e§l輸入金額 §f(§61§f-§6${max}§f)`, '金額')
            .show(player).then(res => {
                if (res.canceled) return;
                let sendMoney = res.formValues[0].trim()
                if (sendMoney == '' || Number(sendMoney) < 1 || Number(sendMoney) > max || !isNum(sendMoney)) {
                    return logfor(player.name, `§c§l>> §e參數輸入錯誤!`)
                }

                // let Senderjson = {
                //     "senderTM": {
                //         "value": Number(sendMoney),
                //         "sender": player.name,
                //         "target": selePlayer.name,
                //         "startTime": new Date().getTime()
                //     }
                // }
                // let Targetjson = {
                //     "targetTM": {
                //         "value": Number(sendMoney),
                //         "sender": player.name,
                //         "target": selePlayer.name,
                //         "startTime": new Date().getTime()
                //     }
                // }
                // let SenderMsg = `§a§l銀行系統 §f> §e您可以在30秒內無條件收回該轉帳 輸入-tm back`
                // let TargetMsg = `§a§l銀行系統 §f> §e注意 §b${player.name} §e可在30秒內收回轉帳交易!`
                logfor(player.name, `§a§l>> §e您已轉給 §b${selePlayer.name} §e的 §6${sendMoney} §e元!`)
                logfor(selePlayer.name, `§a§l>> §e您已收到 §b${player.name} §e的 §6${sendMoney} §e元!`)
                // player.addTag(JSON.stringify({ "news": SenderMsg, tick: 0, maxtick: 30 * 20 }))
                // selePlayer.addTag(JSON.stringify({ "news": TargetMsg, tick: 0, maxtick: 30 * 20 }))
                // player.addTag(JSON.stringify(Senderjson))
                // selePlayer.addTag(JSON.stringify(Targetjson))
                player.runCommandAsync(`scoreboard players remove @s money ${sendMoney}`)
                selePlayer.runCommandAsync(`scoreboard players add @s money ${sendMoney}`)
            })
    })
}