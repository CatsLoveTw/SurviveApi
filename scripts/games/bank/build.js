import * as mc from '@minecraft/server';
import { worldlog } from '../../lib/function';
import { cmd, log, logfor } from '../../lib/GametestFunctions';

export function build () {
    try {
        cmd(`scoreboard objectives add money dummy "§e§l貨幣"`)
    } catch {}
    try {
        cmd(`scoreboard objectives add sysTM dummy "§e§l還錢請求待處理清單"`)
    } catch {}
    // 偵測結束
    mc.system.runInterval(() => {
        // 轉帳系統tag 給錢: {"senderTM": {"value": number, "sender": string, "target": string, "startTime": number}}
        // 收到錢: {"targetTM": {"value": number, "sender": string, "target": string, "startTime": number}}
        // value 轉帳金額 sender 轉帳人 target 收帳者 startTime 開始時間 §
        for (let player of worldlog.getPlayers()) {
            for (let tag of player.getTags()) {
                if (tag.includes('{"senderTM":')) {
                    /**
                     * @type {{"senderTM": {"value": number, "sender": string, "target": string, "startTime": number}}}
                     */
                    let json = JSON.parse(tag)
                    if ((new Date().getTime() - json.senderTM.startTime) >= 30 * 1000) {
                        logfor(player.name, `§a§l>> §e您的無條件退款功能已經結束!`)
                        player.removeTag(tag)
                    }
                }
                if (tag.includes('{"targetTM":')) {
                    /**
                     * @type {{"targetTM": {"value": number, "sender": string, "target": string, "startTime": number}}}
                     */
                    let json = JSON.parse(tag)
                    if ((new Date().getTime() - json.targetTM.startTime) >= 30 * 1000) {
                        logfor(player.name, `§a§l>> §b${json.targetTM.sender} §e的無條件退款功能已經結束!`)
                        player.removeTag(tag)
                    }
                }
            }
        }
    }, 1)

    // 偵測對方上線 ${json.senderTM.target}_._${json.senderTM.value}_._${json.senderTM.sender}
    mc.system.runInterval(() => {
        let disnames = worldlog.getScoreboardPlayers('sysTM').disname
        for (let disname of disnames) {
            let args = disname.split("_._")
            /**
             * @type {mc.Player}
             */
            let target
            let value = args[1]
            let TargetMsg = `§a§l銀行系統 §f> §e注意 §b${args[2]} §e可在30秒內收回轉帳交易!`
            let sendMsg = `§c§l>> §e轉帳交易已被 §b${player.name} §e收回`
            for (let player of worldlog.getPlayers()) {
                if (player.name == args[0]) {
                    target = player
                }
            }
            target.addTag(JSON.stringify({ "news": sendMsg, tick: 0, maxtick: 10 * 20 }))
            target.runCommandAsync(`scoreboard players remove @s money ${value}`)
            cmd(`scoreboard players reset "${disname}" sysTM`)
            for (let tag of target.getTags()) {
                if (tag.includes(TargetMsg)) {
                    target.removeTag(tag)
                }
                if (tag.includes('{"targetTM":')) {
                    target.removeTag(tag)
                }
            }
        }
    }, 1)
}