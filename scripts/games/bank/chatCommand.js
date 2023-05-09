import * as mc from '@minecraft/server'
import { cmd, log, logfor } from '../../lib/GametestFunctions'
import { worldlog } from '../../lib/function'


// 轉帳系統tag 給錢: {"senderTM": {"value": number, "sender": string, "target": string, "startTime": number}}
// 收到錢: {"targetTM": {"value": number, "sender": string, "target": string, "startTime": number}}
// value 轉帳金額 sender 轉帳人 target 收帳者 startTime 開始時間
export const chatCommands = [
    // §
    {
        command: 'tm',
        des: '轉帳退款 (只有特殊時間可用)',
        values: [
            ["back"],
        ],
        adminOnly: false,
        loginOnly: true,
        run:
            /**
            @param {mc.Player} player
            @param {string} message
            */
            function (player, message, error) {
                let args = message.split(" ")
                if (args[1] != 'back') {
                    return error()
                }
                let check = false
                for (let tag of player.getTags()) {
                    if (tag.includes('{"senderTM":')) {
                        /**
                         * @type {{"senderTM": {"value": number, "sender": string, "target": string, "startTime": number}}}
                         */
                        let json = JSON.parse(tag)
                        for (let pl of worldlog.getPlayers()) {
                            if (pl.name == json.senderTM.target) {
                                let getMoney = json.senderTM.value
                                let SenderMsg = `§a§l銀行系統 §f> §e您可以在30秒內無條件收回該轉帳 輸入-tm back`
                                let TargetMsg = `§a§l銀行系統 §f> §e注意 §b${player.name} §e可在30秒內收回轉帳交易!`
                                player.runCommandAsync(`scoreboard players add @s money ${getMoney}`)
                                pl.runCommandAsync(`scoreboard players remove @s money ${getMoney}`)
                                logfor(player.name, `§a§l>> §e退款成功!`)
                                logfor(pl.name, `§c§l>> §e轉帳交易已被 §b${player.name} §e收回`)
                                for (let tag of player.getTags()) {
                                    if (tag.includes(SenderMsg)) {
                                        player.removeTag(tag)
                                    }
                                }
                                for (let tag of pl.getTags()) {
                                    if (tag.includes(TargetMsg)) {
                                        pl.removeTag(tag)
                                    }
                                }
                                let Senderjson = {
                                    "senderTM": {
                                        "value": json.senderTM.value,
                                        "sender": json.senderTM.sender,
                                        "target": json.senderTM.target,
                                        "startTime": json.senderTM.startTime
                                    }
                                }
                                let Targetjson = {
                                    "targetTM": {
                                        "value": json.senderTM.value,
                                        "sender": json.senderTM.sender,
                                        "target": json.senderTM.target,
                                        "startTime": json.senderTM.startTime
                                    }
                                }
                                player.removeTag(JSON.stringify(Senderjson))
                                pl.removeTag(JSON.stringify(Targetjson))
                                return;
                            }
                        }
                        let getMoney = json.senderTM.value
                        let SenderMsg = `§a§l銀行系統 §f> §e您可以在30秒內無條件收回該轉帳 輸入-tm back`
                        let TargetMsg = `§a§l銀行系統 §f> §e注意 §b${player.name} §e可在30秒內收回轉帳交易!`
                        player.runCommandAsync(`scoreboard players add @s money ${getMoney}`)
                        logfor(player.name, `§a§l>> §e退款成功! §f(§b對方將在上線後自動扣款§b)`)
                        for (let tag of player.getTags()) {
                            if (tag.includes(SenderMsg)) {
                                player.removeTag(tag)
                            }
                        }
                        let Senderjson = {
                            "senderTM": {
                                "value": json.senderTM.value,
                                "sender": json.senderTM.sender,
                                "target": json.senderTM.target,
                                "startTime": json.senderTM.startTime
                            }
                        }
                        player.removeTag(JSON.stringify(Senderjson))
                        cmd(`scoreboard players set "${json.senderTM.target}_._${json.senderTM.value}_._${json.senderTM.sender}" sysTM 0`)
                        check = true
                    }
                }
                if (!check) {
                    return logfor(player.name, `§c§l>> §e執行失敗，沒有可用的退款!`)
                }
            }
    }
]