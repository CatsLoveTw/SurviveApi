import * as mc from '@minecraft/server'
import { cmd, log, logfor } from '../../lib/GametestFunctions'
import { worldlog } from '../../lib/function'

export const chatCommands = [
    // 設定Tag - {"tpaSetting": {"dontDistrub": boolean, "sec": number}}
    // 設定請求Tag - {"tpaReq": {"source": string, "reqName": string, "tpa": number, 'message': string, "duration": number, "startTime": number}} 
    // 設定被請求Tag - {"tpaReqed": {"source": string, "reqName": string, "tpa": number, 'message': string, "duration": number, "startTime": number}}
    // source 請求玩家名稱 reqName 被請求玩家名稱 tpa - 0 請求玩家傳送至被請求玩家 / 1 被請求玩家傳送至請求玩家 duration 持續時間 startTime 開始時間 (unixTime - 毫秒)
    // 檢查請求/被請求到期 §
    {
        command: 'tpa',
        des: '玩家互傳 (只有特殊時間可用)',
        values: [
            ["accept"],
            ["deny"],
            ["delete"]
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
                if (args[1] != 'accept' && args[1] != 'deny' && args[1] != 'delete') {
                    return error()
                }
                let check = false
                for (let tag of player.getTags()) {
                    // 接受
                    if (args[1] == 'accept') {
                        if (tag.startsWith('{"tpaReqed":')) {
                            /**
                             * @type {{"tpaReqed": {"source": string, "reqName": string, "tpa": number, 'message': string, "duration": number, "startTime": number}}}
                             */
                            let json = JSON.parse(tag)
                            /**
                             * @type {mc.Player}
                             */
                            let getSource
                            /**
                             * @type {mc.Player}
                             */
                            let reqed
                            for (let player of worldlog.getPlayers()) {
                                if (player.name == json.tpaReqed.source) {
                                    getSource = player
                                }
                                if (player.name == json.tpaReqed.reqName) {
                                    reqed = player
                                }
                            }
                            if (!getSource || !reqed) {
                                player.removeTag(tag)
                                return logfor(player.name, `§c§l>> §e找不到玩家，請求失敗!`)
                            }
                            if (json.tpaReqed.tpa == 0) {
                                cmd(`tp "${json.tpaReqed.source}" "${json.tpaReqed.reqName}"`).then(() => {
                                    logfor(json.tpaReqed.source, `§a§l>> §e請求成功，已經將您傳送至 §b${json.tpaReqed.reqName}!`)
                                    logfor(json.tpaReqed.reqName, `§a§l>> §e成功接受請求!`)
                                    let tpaMsgs = ["他想要傳送到你這", "要求你傳送到他那"]
                                    let deleteMsgSource = `§e您已向 §b${json.tpaReqed.reqName} §e發送請求，等待回復...`
                                    let deleteMsgReqed = `§b${json.tpaReqed.source} §e${tpaMsgs[json.tpaReqed.tpa]}，輸入 §a-tpa accept 同意 §c-tpa deny 拒絕...`
                                    // 刪除訊息
                                    for (let tag of player.getTags()) {
                                        if (tag.includes(deleteMsgReqed)) {
                                            player.removeTag(tag)
                                        }
                                    }
                                    for (let tag of getSource.getTags()) {
                                        if (tag.includes(deleteMsgSource)) {
                                            getSource.removeTag(tag)
                                        }
                                    }
                                    // 刪除請求
                                    player.removeTag(tag)
                                    let removeJSON = {
                                        "tpaReq": {
                                            "source": json.tpaReqed.source,
                                            "reqName": json.tpaReqed.reqName,
                                            "tpa": json.tpaReqed.tpa,
                                            'message': json.tpaReqed.message,
                                            "duration": json.tpaReqed.duration,
                                            "startTime": json.tpaReqed.startTime
                                        }
                                    } 
                                    getSource.removeTag(JSON.stringify(removeJSON))
                                })
                            } else {
                                cmd(`tp "${json.tpaReqed.reqName}" "${json.tpaReqed.source}"`).then(() => {
                                    logfor(json.tpaReqed.source, `§a§l>> §e請求成功，已經將他傳送至您!`)
                                    logfor(json.tpaReqed.reqName, `§a§l>> §e成功接受請求，已經將您傳送至 §b${json.tpaReqed.source}!`)
                                    let tpaMsgs = ["他想要傳送到你這", "要求你傳送到他那"]
                                    let deleteMsgSource = `§e您已向 §b${json.tpaReqed.reqName} §e發送請求，等待回復...`
                                    let deleteMsgReqed = `§b${json.tpaReqed.source} §e${tpaMsgs[json.tpaReqed.tpa]}，輸入 §a-tpa accept 同意 §c-tpa deny 拒絕...`
                                    // 刪除訊息
                                    for (let tag of player.getTags()) {
                                        if (tag.includes(deleteMsgReqed)) {
                                            player.removeTag(tag)
                                        }
                                    }
                                    for (let tag of getSource.getTags()) {
                                        if (tag.includes(deleteMsgSource)) {
                                            getSource.removeTag(tag)
                                        }
                                    }
                                    // 刪除請求
                                    player.removeTag(tag)
                                    let removeJSON = {
                                        "tpaReq": {
                                            "source": json.tpaReqed.source,
                                            "reqName": json.tpaReqed.reqName,
                                            "tpa": json.tpaReqed.tpa,
                                            'message': json.tpaReqed.message,
                                            "duration": json.tpaReqed.duration,
                                            "startTime": json.tpaReqed.startTime
                                        }
                                    } 
                                    getSource.removeTag(JSON.stringify(removeJSON))
                                })
                            }
                            check = true
                        }
                    } else if (args[1] == 'deny') {
                        if (tag.startsWith('{"tpaReqed":')) {
                            /**
                            * @type {{"tpaReqed": {"source": string, "reqName": string, "tpa": number, 'message': string, "duration": number, "startTime": number}}}
                            */
                            let json = JSON.parse(tag)
                            /**
                             * @type {mc.Player}
                             */
                            let getSource
                            /**
                             * @type {mc.Player}
                             */
                            let reqed
                            for (let player of worldlog.getPlayers()) {
                                if (player.name == json.tpaReqed.source) {
                                    getSource = player
                                }
                                if (player.name == json.tpaReqed.reqName) {
                                    reqed = player
                                }
                            }
                            if (!getSource || !reqed) {
                                player.removeTag(tag)
                                return logfor(player.name, `§c§l>> §e找不到玩家，請求失敗!`)
                            }
                            logfor(player.name, `§a§l>> §e拒絕成功!`)
                            logfor(getSource.name, `§c§l>> §e請求失敗，對方拒絕了該請求`)
                            let tpaMsgs = ["他想要傳送到你這", "要求你傳送到他那"]
                            let deleteMsgSource = `§e您已向 §b${json.tpaReqed.reqName} §e發送請求，等待回復...`
                            let deleteMsgReqed = `§b${json.tpaReqed.source} §e${tpaMsgs[json.tpaReqed.tpa]}，輸入 §a-tpa accept 同意 §c-tpa deny 拒絕...`
                            // 刪除訊息
                            for (let tag of player.getTags()) {
                                if (tag.includes(deleteMsgReqed)) {
                                    player.removeTag(tag)
                                }
                            }
                            for (let tag of getSource.getTags()) {
                                if (tag.includes(deleteMsgSource)) {
                                    getSource.removeTag(tag)
                                }
                            }
                            // 刪除請求
                            player.removeTag(tag)
                            let removeJSON = {
                                "tpaReq": {
                                    "source": json.tpaReqed.source,
                                    "reqName": json.tpaReqed.reqName,
                                    "tpa": json.tpaReqed.tpa,
                                    'message': json.tpaReqed.message,
                                    "duration": json.tpaReqed.duration,
                                    "startTime": json.tpaReqed.startTime
                                }
                            }
                            getSource.removeTag(JSON.stringify(removeJSON))
                            check = true
                        }
                    } else if (args[1] == 'delete') {
                        if (tag.startsWith('{"tpaReq":')) {
                            /**
                             * @type {{"tpaReq": {"source": string, "reqName": string, "tpa": number, 'message': string, "duration": number, "startTime": number}}}
                             */
                            let json = JSON.parse(tag)
                            /**
                             * @type {mc.Player}
                             */
                            let getSource
                            /**
                             * @type {mc.Player}
                             */
                            let reqed
                            for (let player of worldlog.getPlayers()) {
                                if (player.name == json.tpaReq.source) {
                                    getSource = player
                                }
                                if (player.name == json.tpaReq.reqName) {
                                    reqed = player
                                }
                            }
                            if (!getSource || !reqed) {
                                player.removeTag(tag)
                                let deleteMsgSource = `§e您已向 §b${json.tpaReq.reqName} §e發送請求，等待回復...`
                                // 刪除訊息
                                for (let tag of player.getTags()) {
                                    if (tag.includes(deleteMsgSource)) {
                                        player.removeTag(tag)
                                    }
                                }
                                return logfor(player.name, `§a§l>> §etpa請求刪除成功!`)
                            }
                            logfor(player.name, `§a§l>> §etpa請求刪除成功!`)
                            logfor(reqed.name, `§3§l>> §b${player.name} §e已撤回了tpa請求`)
                            let tpaMsgs = ["他想要傳送到你這", "要求你傳送到他那"]
                            let deleteMsgSource = `§e您已向 §b${json.tpaReq.reqName} §e發送請求，等待回復...`
                            let deleteMsgReqed = `§b${json.tpaReq.source} §e${tpaMsgs[json.tpaReq.tpa]}，輸入 §a-tpa accept 同意 §c-tpa deny 拒絕...`
                            // 刪除訊息
                            for (let tag of player.getTags()) {
                                if (tag.includes(deleteMsgSource)) {
                                    player.removeTag(tag)
                                }
                            }
                            for (let tag of reqed.getTags()) {
                                if (tag.includes(deleteMsgReqed)) {
                                    reqed.removeTag(tag)
                                }
                            }
                            // 刪除請求
                            player.removeTag(tag)
                            let removeJSON = {
                                "tpaReqed": {
                                    "source": json.tpaReq.source,
                                    "reqName": json.tpaReq.reqName,
                                    "tpa": json.tpaReq.tpa,
                                    'message': json.tpaReq.message,
                                    "duration": json.tpaReq.duration,
                                    "startTime": json.tpaReq.startTime
                                }
                            }
                            reqed.removeTag(JSON.stringify(removeJSON))
                            check = true
                        }
                    }
                }
                if (!check) {
                    return logfor(player.name, `§c§l>> §e執行失敗，沒有可用的請求!`)
                }
            }
    }
]