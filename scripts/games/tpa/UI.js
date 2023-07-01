import * as mc from '@minecraft/server'
import * as ui from '@minecraft/server-ui'
import { isNum, worldlog } from '../../lib/function';
import { addSign, checkPoint, log, logfor } from '../../lib/GametestFunctions';
import { tpaSetting } from './defind';
import { playerDB } from '../../config';

/**
 * 
 * @param {mc.Player} player 
 */
export function UI (player) {
    // 設定Tag - {"tpaSetting": {"dontDistrub": boolean, "sec": number}}
    // 設定請求Tag - {"tpaReq": {"source": string, "reqName": string, "tpa": number, 'message': string, "duration": number, "startTime": number}} 
    // 設定被請求Tag - {"tpaReqed": {"source": string, "reqName": string, "tpa": number, 'message': string, "duration": number, "startTime": number}}
    // source 請求玩家名稱 reqName 被請求玩家名稱 tpa - 0 請求玩家傳送至被請求玩家 / 1 被請求玩家傳送至請求玩家 duration 持續時間 startTime 開始時間 (unixTime - 毫秒)
    const db = playerDB.table(player.id)
    let form = new ui.ActionFormData()
        .title("§e§l玩家互傳功能")
        .button('§e§l互傳系統')
        .button('§6§l設定')
        .button("§b§l黑名單系統")
        .show(player).then(res => {
            if (res.canceled || !res) return;
            if (res.selection === 0) {
                let players = []
                for (let pl of worldlog.getPlayers()) {
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
                                    let data = new tpaSetting().getDataFromTag(tag)
                                    if (data.banlist.includes(player.name)) return logfor(player.name, `§c§l>> §e您已被他人設定為黑名單對象，請稍後再試!`)
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
                                "tpaReq": {
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
                            
                            const seleDB = playerDB.table(selePlayer.id), db = playerDB.table(player.id)
                            db.setData("tpaRequire", Req)
                            seleDB.setData("tpaRequired", Reqed)

                            let msg = `§a§lTpa請求 §f> §e您已向 §b${selePlayer.name} §e發送請求，等待回復...`
                            addSign(msg, player, 60)

                            msg = `§a§lTpa邀請 §f> §b${player.name} §e${tpaMsg}，輸入 §a-tpa accept 同意 §c-tpa deny 拒絕...`
                            addSign(msg, selePlayer, 60)

                            logfor(player.name, `§a§l>> §e請求發送成功，等待回應... (您也可以輸入-tpa delete 撤回請求) §f(§b對方§f: ${selePlayer.name} §b持續時間§f: ${duration}s§f)`)
                            logfor(selePlayer.name, `§e§l>> §b${player.name} §e發送了tpa請求，${tpaMsg}，可輸入 §a-tpa accept 接受 §c-tpa deny 拒絕 §f(§b訊息§f: §b${message}§f)`)
                        })
                })
            } else if (res.selection === 1) {
                setting()
                function setting () {
                    /**
                     * @type {tpaSetting}
                     */
                    let tpaSetting_ = {}
                    let settingTag = ''
                    for (let tag of player.getTags()) {
                        if (tag.startsWith('{"tpaSetting":')) {
                            settingTag = tag
                            tpaSetting_ = new tpaSetting().getDataFromTag(tag)
                        }
                    }
                    let dontDistrub = tpaSetting_.Distrub
                    let sec = tpaSetting_.sec
                    let form = new ui.ModalFormData()
                        .title("§e§l玩家互傳 - 設定")
                        .toggle("§c§l請勿打擾", dontDistrub)
                        .textField("§e§l設定被請求持續時間", "秒數", sec.toString())
                        .show(player).then(res => {
                            let dontDistrub = res.formValues[0]
                            let sec = res.formValues[1].trim()
                            if (sec == '' || !isNum(sec) || checkPoint(sec)) {
                                UI(player)
                                return logfor(player.name, `§c§l>> §e設定參數錯誤!`)
                            }
                            sec = Number(sec)
                            player.removeTag(settingTag)
                            let newTag = new tpaSetting(sec, dontDistrub, tpaSetting_.banlist, false).toJSON()
                            db.setData("tpaSetting", newTag)
                            logfor(player.name, `§a§l>> §e設定成功!`)
                            return UI(player)
                        })
                }
            } else if (res.selection === 2) {
                function ban () {
                let form = new ui.ActionFormData()
                    .title("§e§l黑名單系統")
                    .button("§a§l新增")
                    .button("§c§l刪除")
                    .button("§7§l返回")
                    .show(player).then(res => {
                        if (res.selection === 2) return UI(player)
                        if (res.selection === 0) {
                            function add (name) {
                                let settingTag
                                for (let tag of player.getTags()) {
                                    if (tag.startsWith('{"tpaSetting":')) {
                                        settingTag = tag
                                    }
                                }
                                let data = new tpaSetting().getDataFromTag(settingTag)
                                if (data.banlist.includes(name)) return logfor(player.name, `§c§l>> §e新增失敗，名稱重複!`);
                                if (name == player.name) return logfor(player.name, `§c§l>> §e不可黑名單自己!`)
                                player.removeTag(settingTag)
                                data.banlist.push(name)

                                let setting = new tpaSetting(data.sec, data.Distrub, data.banlist, false).toJSON()
                                db.setData("tpaSetting", setting)
                                return logfor(player.name, `§a§l>> §e新增成功!`)
                            }
                            
                            let form = new ui.ActionFormData()
                                .title('§e§l黑名單系統 §f- §a新增')
                                .button("§b§l線上玩家新增")
                                .button("§e§l手動新增")
                                .button("§7§l返回")
                                .show(player).then(res => {
                                    if (res.selection === 2) return ban()
                                    if (res.selection === 0) {
                                        let settingTag
                                        for (let tag of player.getTags()) {
                                            if (tag.startsWith('{"tpaSetting":')) {
                                                settingTag = tag
                                            }
                                        }
                                        let data = new tpaSetting().getDataFromTag(settingTag)
                                        let players = []
                                        let form = new ui.ActionFormData()
                                            .title('§e§l黑名單系統 §f- §b線上玩家新增')
                                        for (let pl of mc.world.getAllPlayers()) {
                                            let getlist = data.banlist
                                            if (!getlist.includes(pl.name) && pl.name != player.name) {
                                                players.push(pl)
                                                form.button("§e§l" + pl.name)
                                            }
                                        }
                                        if (players.length == 0) return logfor(player.name, `§c§l>> §e沒有玩家可新增`)
                                        form.show(player).then(res => {
                                            if (res.canceled) return;
                                            let selePlayer = players[res.selection]
                                            add(selePlayer.name)
                                        })
                                    }

                                    if (res.selection === 1) {
                                        let form = new ui.ModalFormData()
                                            .title('§e§l黑名單系統 §f- §e手動新增')
                                            .textField("§e§l輸入玩家名稱", "名稱")
                                            .show(player).then(res => {
                                                if (res.canceled) return;
                                                let name = res.formValues[0]
                                                if (name.trim() == '') return logfor(player.name, `§c§l>> §e名稱不得為空!`)
                                                add(name)
                                            })
                                    }
                                })
                        }

                        if (res.selection === 1) {
                            let settingTag
                            for (let tag of player.getTags()) {
                                if (tag.startsWith('{"tpaSetting":')) {
                                    settingTag = tag
                                }
                            }
                            let data = new tpaSetting().getDataFromTag(settingTag)
                            let banlist = data.banlist
                            let form = new ui.ActionFormData()
                                .title("§b§l黑名單系統 §f- §c刪除")
                            for (let ban of banlist) {
                                form.button(ban)
                            }
                            form.button('§7§l返回')
                            form.show(player).then(res => {
                                if (res.canceled) return;
                                if (res.selection === banlist.length) return ban();
                                let selePlayer = banlist[res.selection]
                                banlist.splice(banlist.indexOf(selePlayer), 1)
                                player.removeTag(settingTag)

                                let setting = new tpaSetting(data.sec, data.Distrub, banlist, false).toJSON()
                                db.setData("tpaSetting", setting)
                                return logfor(player.name, `§a§l>> §e刪除成功!`) 
                            })
                        }
                    })
            
                }
                ban()
            }
        })
}