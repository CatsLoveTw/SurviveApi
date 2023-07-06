import * as mc from '@minecraft/server';
import { logfor, log, cmd, removeSign } from '../../lib/GametestFunctions';
import { worldlog } from '../../lib/function';
import { playerDB } from '../../config';

export function build () {
    // 設定Tag - {"tpaSetting": {"dontDistrub": boolean, "sec": number}}
    // 設定請求Tag - {"tpaReq": {"source": string, "reqName": string, "tpa": number, 'message': string, "duration": number, "startTime": number}} 
    // 設定被請求Tag - {"tpaReqed": {"source": string, "reqName": string, "tpa": number, 'message': string, "duration": number, "startTime": number}}
    // source 請求玩家名稱 reqName 被請求玩家名稱 tpa - 0 請求玩家傳送至被請求玩家 / 1 被請求玩家傳送至請求玩家 duration 持續時間 startTime 開始時間 (unixTime - 毫秒)
    // 檢查請求/被請求到期 §
    mc.system.runInterval(() => {
        for (let player of worldlog.getPlayers()) {
            const db = playerDB.table(player.id), TpaReq = db.getData("tpaRequire"), TpaReqed = db.getData("tpaRequired")
            if (TpaReq && typeof TpaReq.value == "object") {
                let json = TpaReq.value
                let duration = json.tpaReq.duration * 1000
                if ((new Date().getTime() - json.tpaReq.startTime) >= duration) {
                    db.removeData("tpaRequire")
                    logfor(player.name, `§c§l>> §e您的請求已經結束，對方無應答。`)
                }
            }
            if (TpaReqed && typeof TpaReqed.value == "object") {
                let json = TpaReqed.value
                let duration = json.tpaReqed.duration * 1000
                if ((new Date().getTime() - json.tpaReqed.startTime) >= duration) {
                    db.removeData("tpaRequired")
                    logfor(player.name, `§c§l>> §etpa邀請已經結束，您沒有回覆。`)
                }
            }
        }
    }, 1)
    // 偵測對方下線
    mc.system.runInterval(() => {
        for (let player of worldlog.getPlayers()) {
            const db = playerDB.table(player.id), TpaReq = db.getData("tpaRequire"), TpaReqed = db.getData("tpaRequired")
            if (TpaReq && typeof TpaReq.value == "object") {
                let json = TpaReq.value
                let check = false
                for (let player of worldlog.getPlayers()) {
                    if (player.name == json.tpaReq.reqName) {
                        check = true
                    }
                }
                if (!check) {
                    let deleteMsgSource = `§e您已向 §b${json.tpaReq.reqName} §e發送請求，等待回復...`
                    // 刪除訊息
                    removeSign(deleteMsgSource, player)
                    db.removeData("tpaRequire")
                    logfor(player.name, `§c§l>> §e您的請求已經結束，原因:對方下線。`)
                }
            }
            if (TpaReqed && typeof TpaReqed.value == "object") {
                let json = TpaReqed.value
                let check = false
                for (let player of worldlog.getPlayers()) {
                    if (player.name == json.tpaReqed.source) {
                        check = true
                    }
                }
                if (!check) {
                    let tpaMsgs = ["他想要傳送到你這", "要求你傳送到他那"]
                    let deleteMsgReqed = `§b${json.tpaReqed.source} §e${tpaMsgs[json.tpaReqed.tpa]}，輸入 §a-tpa accept 同意 §c-tpa deny 拒絕...`
                    // 刪除訊息
                    removeSign(deleteMsgReqed, player)
                    db.removeData("tpaRequired")
                    logfor(player.name, `§c§l>> §etpa邀請已經結束，原因:對方下線。`)
                }
            }
        }
    }, 2)
    
    // 偵測下線玩家又上線的tag清除
    mc.system.runInterval(() => {
        for (let player of worldlog.getPlayers()) {
            const db = playerDB.table(player.id), TpaReq = db.getData("tpaRequire"), TpaReqed = db.getData("tpaRequired")
            if (TpaReq && typeof TpaReq.value == "object") {
                let json = TpaReq.value
                let check = false

                for (let player2 of worldlog.getPlayers()) {
                    if (player2.name != json.tpaReq.reqName) continue;
                    const db2 = playerDB.table(player2.id), TpaReqed2 = db2.getData("tpaRequired")
                    if (!TpaReqed2 || typeof TpaReqed2.value != "object") continue;
                    const data = json.tpaReq, mirrorData = TpaReqed2.value.tpaReqed
                    if (data.duration != mirrorData.duration) continue;
                    if (data.message != mirrorData.message) continue;
                    if (data.reqName != mirrorData.reqName) continue;
                    if (data.source != mirrorData.source) continue;
                    if (data.startTime != mirrorData.startTime) continue;
                    if (data.tpa != mirrorData.tpa) continue;
                    check = true
                }

                if (!check) {
                    db.removeData("tpaRequire")
                    logfor(player.name, `§c§l>> §e您的請求已經結束，原因:對方沒有該請求，可能是因為您在請求中途下線`)
                }
            }
            if (TpaReqed && typeof TpaReqed.value == "object") {
                let json = TpaReqed.value
                let check = false

                for (let player2 of worldlog.getPlayers()) {
                    if (player2.name != json.tpaReqed.source) continue;
                    const db2 = playerDB.table(player2.id), TpaReq2 = db2.getData("tpaRequire")
                    if (!TpaReq2 || typeof TpaReq2.value != "object") continue;
                    const data = json.tpaReqed, mirrorData = TpaReq2.value.tpaReq
                    if (data.duration != mirrorData.duration) continue;
                    if (data.message != mirrorData.message) continue;
                    if (data.reqName != mirrorData.reqName) continue;
                    if (data.source != mirrorData.source) continue;
                    if (data.startTime != mirrorData.startTime) continue;
                    if (data.tpa != mirrorData.tpa) continue;
                    check = true
                }
                
                if (!check) {
                    db.removeData("tpaRequired")
                    logfor(player.name, `§c§l>> §etpa邀請已經結束，原因:對方沒有提出該請求，可能是因為您在被請求時下線。`)
                }
            }
        }
    }, 20)
}