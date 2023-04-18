import * as mc from '@minecraft/server';
import { logfor, log, cmd } from '../../lib/GametestFunctions';

export function build () {
    // 設定Tag - {"tpaSetting": {"dontDistrub": boolean, "sec": number}}
    // 設定請求Tag - {"tpaReq": {"source": string, "reqName": string, "tpa": number, 'message': string, "duration": number, "startTime": number}} 
    // 設定被請求Tag - {"tpaReqed": {"source": string, "reqName": string, "tpa": number, 'message': string, "duration": number, "startTime": number}}
    // source 請求玩家名稱 reqName 被請求玩家名稱 tpa - 0 請求玩家傳送至被請求玩家 / 1 被請求玩家傳送至請求玩家 duration 持續時間 startTime 開始時間 (unixTime - 毫秒)
    // 檢查請求/被請求到期 §
    mc.system.runInterval(() => {
        for (let player of mc.world.getPlayers()) {
            for (let tag of player.getTags()) {
                if (tag.startsWith('{"tpaReq":')) {
                    /**
                     * @type {{"tpaReq": {"source": string, "reqName": string, "tpa": number, 'message': string, "duration": number, "startTime": number}} }
                     */
                    let json = JSON.parse(tag)
                    let duration = json.tpaReq.duration * 1000
                    if ((new Date().getTime() - json.tpaReq.startTime) >= duration) {
                        player.removeTag(tag)
                        logfor(player.name, `§c§l>> §e您的請求已經結束，對方無應答。`)
                    }
                }
                if (tag.startsWith('{"tpaReqed":')) {
                    /**
                     * @type {{"tpaReqed": {"source": string, "reqName": string, "tpa": number, 'message': string, "duration": number, "startTime": number}}}
                     */
                    let json = JSON.parse(tag)
                    let duration = json.tpaReqed.duration * 1000
                    if ((new Date().getTime() - json.tpaReqed.startTime) >= duration) {
                        player.removeTag(tag)
                        logfor(player.name, `§c§l>> §etpa邀請已經結束，您沒有回覆。`)
                    }
                }
            }
        }
    }, 1)
    // 偵測對方下線
    mc.system.runInterval(() => {
        for (let player of mc.world.getPlayers()) {
            for (let tag of player.getTags()) {
                if (tag.startsWith('{"tpaReq":')) {
                    /**
                     * @type {{"tpaReq": {"source": string, "reqName": string, "tpa": number, 'message': string, "duration": number, "startTime": number}} }
                     */
                    let json = JSON.parse(tag)
                    let check = false
                    for (let player of mc.world.getPlayers()) {
                        if (player.name == json.tpaReq.reqName) {
                            check = true                            
                        }
                    }
                    if (!check) {
                        let deleteMsgSource = `§e您已向 §b${json.tpaReq.reqName} §e發送請求，等待回復...`
                        // 刪除訊息
                        for (let tag of player.getTags()) {
                            if (tag.includes(deleteMsgSource)) {
                                player.removeTag(tag)
                            }
                        }
                        player.removeTag(tag)
                        logfor(player.name, `§c§l>> §e您的請求已經結束，原因:對方下線。`)
                    }
                }
                if (tag.startsWith('{"tpaReqed":')) {
                    /**
                     * @type {{"tpaReqed": {"source": string, "reqName": string, "tpa": number, 'message': string, "duration": number, "startTime": number}}}
                     */
                    let json = JSON.parse(tag)
                    let check = false
                    for (let player of mc.world.getPlayers()) {
                        if (player.name == json.tpaReqed.source) {
                            check = true                            
                        }
                    }
                    if (!check) {
                        let tpaMsgs = ["他想要傳送到你這", "要求你傳送到他那"]
                        let deleteMsgReqed = `§b${json.tpaReqed.source} §e${tpaMsgs[json.tpaReqed.tpa]}，輸入 §a-tpa accept 同意 §c-tpa deny 拒絕...`
                        // 刪除訊息
                        for (let tag of player.getTags()) {
                            if (tag.includes(deleteMsgReqed)) {
                                player.removeTag(tag)
                            }
                        }
                        player.removeTag(tag)
                        logfor(player.name, `§c§l>> §etpa邀請已經結束，原因:對方下線。`)
                    }
                }
            }
        }
    }, 2)
    
    // 偵測下線玩家又上線的tag清除
    mc.system.runInterval(() => {
        for (let player of mc.world.getPlayers()) {
            for (let tag of player.getTags()) {
                if (tag.startsWith('{"tpaReq":')) {
                    /**
                     * @type {{"tpaReq": {"source": string, "reqName": string, "tpa": number, 'message': string, "duration": number, "startTime": number}} }
                     */
                    let json = JSON.parse(tag)
                    let check = false
                    for (let player of mc.world.getPlayers()) {
                        if (player.name == json.tpaReq.reqName) {
                            for (let tag of player.getTags()) {
                                let json2 = {
                                    "tpaReqed":{
                                        "source": json.tpaReq.source,
                                        "reqName": json.tpaReq.reqName,
                                        "tpa": json.tpaReq.tpa,
                                        'message': json.tpaReq.message,
                                        "duration": json.tpaReq.duration,
                                        "startTime": json.tpaReq.startTime
                                    }
                                }
                                if (tag == JSON.stringify(json2)) {
                                    check = true
                                }
                            }
                        }
                    }
                    if (!check) {
                        player.removeTag(tag)
                        logfor(player.name, `§c§l>> §e您的請求已經結束，原因:對方沒有該請求，可能是因為您在請求中途下線`)
                    }
                }
                if (tag.startsWith('{"tpaReqed":')) {
                    /**
                     * @type {{"tpaReqed": {"source": string, "reqName": string, "tpa": number, 'message': string, "duration": number, "startTime": number}}}
                     */
                    let json = JSON.parse(tag)
                    let check = false
                    for (let player of mc.world.getPlayers()) {
                        if (player.name == json.tpaReqed.source) {
                            for (let tag of player.getTags()) {
                                let json2 = {
                                    "tpaReq":{
                                        "source": json.tpaReqed.source,
                                        "reqName": json.tpaReqed.reqName,
                                        "tpa": json.tpaReqed.tpa,
                                        'message': json.tpaReqed.message,
                                        "duration": json.tpaReqed.duration,
                                        "startTime": json.tpaReqed.startTime
                                    }
                                }
                                if (tag == JSON.stringify(json2)) {
                                    check = true
                                }
                            }
                        }
                    }
                    if (!check) {
                        player.removeTag(tag)
                        logfor(player.name, `§c§l>> §etpa邀請已經結束，原因:對方沒有提出該請求，可能是因為您在被請求時下線。`)
                    }
                }
            }
        }
    }, 20)
}