import * as mc from '@minecraft/server'
import * as ui from '@minecraft/server-ui'
import { isNum } from '../../lib/function';
import { log, logfor } from '../../lib/GametestFunctions';

/**
 * 
 * @param {mc.Player} player 
 */
export function UI (player) {
    // 設定Tag - {"tpaSetting": {"dontDistrub": boolean, "sec": number}}
    // 設定請求Tag - {"tpaReq": {"source": string, "reqName": string, "tpa": number, 'message': string, "duration": number, "startTime": number}} 
    // 設定被請求Tag - {"tpaReqed": {"source": string, "reqName": string, "tpa": number, 'message': string, "duration": number, "startTime": number}}
    // source 請求玩家名稱 reqName 被請求玩家名稱 tpa - 0 請求玩家傳送至被請求玩家 / 1 被請求玩家傳送至請求玩家 duration 持續時間 startTime 開始時間 (unixTime - 毫秒)
    let form = new ui.ActionFormData()
        .title("§e§l玩家互傳功能")
        .button('§e§l互傳系統')
        .button('§6§l設定')
        .show(player).then(res => {
            if (res.canceled || !res) return;
            if (res.selection === 0) {
                let players = []
                for (let pl of mc.world.getPlayers()) {
                    if (pl.name != player.name) {
                        players.push(pl)
                    }
                }
                if (players.length == 0) {
                    return logfor(player.name, '§c§l>> §e沒有玩家可以傳送!')
                } 
                let form = new ui.ActionFormData()
                    .title("§e§l玩家互傳")
                for (let player of players) {
                    let check = true
                    for (let tag of player.getTags()) {
                        if (tag.startsWith('{"tpaSetting":')) {
                            let settingJSON = JSON.parse(tag)
                            if (settingJSON.tpaSetting.dontDistrub) {
                                form.button(`${player.name} §f- §c請勿打擾`)
                                check = false
                            }
                        }
                    }
                    if (check) {
                        form.button(player.name)
                    }
                }
                form.show(player).then(res => {
                    if (res.canceled || !res) return;
                    /**
                     * @type {mc.Player}
                     */
                    let selePlayer = players[res.selection]
                    let form = new ui.ModalFormData()
                        .title("§e§l玩家互傳請求設定")
                        .toggle("§e§l要求對方傳送到這裡", false)
                        .textField("§b§l請求訊息", "訊息", "未設定訊息")
                        .show(player).then(res => {
                            /**
                             * @type {{"tpaSetting": {"dontDistrub": boolean, "sec": number}}}
                             */
                            let settingJSON
                            let duration = 15
                            for (let tag of selePlayer.getTags()) {
                                if (tag.startsWith('{"tpaReqed":')) {
                                    return logfor(player.name, `§3§l>> §e玩家正在被其他人請求，請稍後再試...`)
                                }
                                if (tag.startsWith('{"tpaSetting":')) {
                                    settingJSON = JSON.parse(tag)
                                    if (settingJSON.tpaSetting.dontDistrub) {
                                        return logfor(player.name, `§c§l>> §e對方已開啟請勿打擾功能，請稍後再試!`)
                                    }
                                    duration = settingJSON.tpaSetting.sec
                                }
                            }
                            let setting = res.formValues[0]
                            let tpaMsgs = ["他想要傳送到你這", "要求你傳送到他那"]
                            let tpaID = 0
                            let message = res.formValues[1]
                            if (message == '') {
                                message = '無'
                            }
                            if (setting) {
                                tpaID = 1
                            }
                            let tpaMsg = tpaMsgs[tpaID]
                            let Req = {
                                "tpaReq": 
                                {
                                    "source": player.name,
                                    "reqName": selePlayer.name,
                                    "tpa": tpaID,
                                    "message": message,
                                    "duration": duration,
                                    "startTime": new Date().getTime()
                                }
                            } 
                            let Reqed = {
                                "tpaReqed": {
                                    "source": player.name,
                                    "reqName": selePlayer.name, 
                                    "tpa": tpaID,
                                    "message": message,
                                    "duration": duration,
                                    "startTime": new Date().getTime()
                                }
                            } 
                            selePlayer.addTag(JSON.stringify(Reqed))
                            player.addTag(JSON.stringify(Req))
                            let msg = `§a§lTpa請求 §f> §e您已向 §b${selePlayer.name} §e發送請求，等待回復...`
                            player.addTag(JSON.stringify({ "news": msg, tick: 0, maxtick: 60 }))
                            msg = `§a§lTpa邀請 §f> §b${player.name} §e${tpaMsg}，輸入 §a-tpa accept 同意 §c-tpa deny 拒絕...`
                            selePlayer.addTag(JSON.stringify({ "news": msg, tick: 0, maxtick: 60 }))
                            logfor(player.name, `§a§l>> §e請求發送成功，等待回應... (您也可以輸入-tpa delete 撤回請求) §f(§b對方§f: ${selePlayer.name} §b持續時間§f: ${duration}s§f)`)
                            logfor(selePlayer.name, `§e§l>> §b${player.name} §e發送了tpa請求，${tpaMsg}，可輸入 §a-tpa accept 接受 §c-tpa deny 拒絕 §f(§b訊息§f: §b${message}§f)`)
                        })
                })
            } else if (res.selection === 1) {
                setting()
                function setting () {
                    /**
                     * @type {{"tpaSetting": {"dontDistrub": boolean, 'sec': number}}}
                     */
                    let tpaSetting = {}
                    let settingTag = ''
                    for (let tag of player.getTags()) {
                        if (tag.startsWith('{"tpaSetting":')) {
                            settingTag = tag
                            tpaSetting = JSON.parse(tag)
                        }
                    }
                    let dontDistrub = tpaSetting.tpaSetting.dontDistrub
                    let sec = tpaSetting.tpaSetting.sec
                    let form = new ui.ModalFormData()
                        .title("§e§l玩家互傳 - 設定")
                        .toggle("§c§l請勿打擾", dontDistrub)
                        .textField("§e§l設定被請求持續時間", "秒數", sec.toString())
                        .show(player).then(res => {
                            let dontDistrub = res.formValues[0]
                            let sec = res.formValues[1].trim()
                            if (sec == '' || !isNum(sec)) {
                                UI(player)
                                return logfor(player.name, `§c§l>> §e設定參數錯誤!`)
                            }
                            sec = Number(sec)
                            player.removeTag(settingTag)
                            tpaSetting.tpaSetting.dontDistrub = dontDistrub
                            tpaSetting.tpaSetting.sec = sec
                            player.addTag(JSON.stringify(tpaSetting))
                            logfor(player.name, `§a§l>> §e設定成功!`)
                            return UI(player)
                        })
                }
            }
        })
}