import * as mc from '@minecraft/server'
import { worldlog } from '../../lib/function'
import { log, logfor, cmd, removeSign } from '../../lib/GametestFunctions'
import { getPublicHomeData } from './UI'
import { getLandData } from '../land/defind'
import { playerDB } from '../../config'

export function build() {
    function addBoard(ID, Display) {
        cmd(`scoreboard objectives add "${ID}" dummy ${Display}`)
    }
    const boards = {
        "publicHome": "公共傳送點"
    }
    try {
        for (let board in boards) {
            addBoard(board, boards[board])
        }
    } catch { }


    // 設定請求Tag - {"homeShare": {"source": string, "sharedName": string, "duration": number, "startTime": number, "homeData": {"home": {"name": string, "pos": {"x": number, "y": number, "z": number}, land: {name: string, pos: {x: {1: string, 2: string},z: {1: string, 2: string},},UID: string,player: string | false,permission: {build: string,container: string,portal: string}, users: false | [{username: string,permission: {build: string, container: string, portal: string}}], public: boolean}, dime: "over" | "nether" | "end"}}}}
    // 設定被請求Tag - {"homeShared": {"source": string, "sharedName": string, "duration": number, "startTime": number, "homeData": {"home": {"name": string, "pos": {"x": number, "y": number, "z": number}, land: {name: string, pos: {x: {1: string, 2: string},z: {1: string, 2: string},},UID: string,player: string | false,permission: {build: string,container: string,portal: string}, users: false | [{username: string,permission: {build: string, container: string, portal: string}}], public: boolean}, dime: "over" | "nether" | "end"}}}}
    // Source `§e您已向 §b${json.homeShare.sharedName} §e發送分享請求，等待回復...`
    // shared `§b${json.homeShared.source} §e想要分享傳送點給你 §f- §e${json.homeShared.homeData.home.name}`
    // 偵測領地&公共/普通傳送點刪除
    mc.system.runInterval(() => {
        let dimensions = ["lands", "lands_nether", "lands_end"]
        for (let player of worldlog.getPlayers()) {
            const db = playerDB.table(player.id), homes = db.getData("homes")
            if (!homes || homes.value.length == 0) continue;
            let check = false
            for (let index in dimensions) {
                let lands = worldlog.getScoreboardPlayers(dimensions[index]).disname
                for (let home of homes.value) {
                    for (let land of lands) {
                        let getData = home, data = getLandData(land)
                        let getDataPos = getData.home.land.pos
                        let dataPos = data.pos
                        if (getDataPos.x[1] == dataPos.x[1] && getDataPos.x[2] == dataPos.x[2] && getDataPos.z[1] == dataPos.z[1] && getDataPos.z[2] == dataPos.z[2]) {
                            if (getData.home.land.UID == data.UID) {
                                if (getData.home.land.name == data.name) {
                                    if (getData.home.land.player == data.player) {
                                        check = true
                                    }
                                }
                            }
                        }
                    }
                    if (!check) {
                        logfor(player.name, `§c§l>> §e偵測到傳送點所在領地被刪除! §f- §c${home.home.name}`)
                        
                        homes.value.splice(homes.value.indexOf(home), 1)
                        db.setData("homes", homes.value, homes.score)
                    }
                }
            }
        }
        // 公共傳送點刪除偵測
        let publicHomes = worldlog.getScoreboardPlayers("publicHome").disname
        for (let publicHome of publicHomes) {
            if (!getPublicHomeData(publicHome).landDataCheck) {
                let homeData = getPublicHomeData(publicHome)
                logfor(homeData.scoreData.player, `§c§l>> §e偵測到公共傳送點被刪除! §f| §e公共傳送點名 §f- §b${homeData.name} §7| §e領地名 §f- §b${homeData.scoreData.name}`)
                cmd(`scoreboard players reset "${publicHome}" publicHome`)
            }
        }
    }, 40)

    // 檢查請求/被請求到期 §
    mc.system.runInterval(() => {
        for (let player of worldlog.getPlayers()) {
            const db = playerDB.table(player.id), share = db.getData("homeShare"), shared = db.getData("homeShared")
            if (share && typeof share.value == "object") {
                let duration = share.value.homeShare.duration * 1000
                if ((new Date().getTime() - share.value.homeShare.startTime) >= duration) {
                    db.removeData("homeShare")
                    logfor(player.name, `§c§l>> §e您的分享請求已經結束，對方無應答。`)
                }
            }
            if (shared && typeof shared.value == "object") {
                let duration = shared.value.homeShared.duration * 1000
                if ((new Date().getTime() - shared.value.homeShared.startTime) >= duration) {
                    db.removeData("homeShared")
                    logfor(player.name, `§c§l>> §e傳送點分享請求已經結束，您沒有回覆。`)
                }
            }
        }
    }, 1)
    // 偵測對方下線
    mc.system.runInterval(() => {
        for (let player of worldlog.getPlayers()) {
            const db = playerDB.table(player.id), share = db.getData("homeShare"), shared = db.getData("homeShared")
            if (share && typeof share.value == "object") {
                let check = false
                for (let player of worldlog.getPlayers()) {
                    if (player.name == share.value.homeShare.sharedName) {
                        check = true
                    }
                }
                if (!check) {
                    let deleteMsgSource = `§e您已向 §b${share.value.homeShare.sharedName} §e發送分享請求，等待回復...`
                    // 刪除訊息
                    removeSign(deleteMsgSource, player)

                    db.removeData("homeShare")
                    logfor(player.name, `§c§l>> §e您的請求已經結束，原因:對方下線。`)
                }
            }
            if (shared && typeof shared.value == "object") {
                let check = false
                for (let player of worldlog.getPlayers()) {
                    if (player.name == shared.value.homeShared.source) {
                        check = true
                    }
                }
                if (!check) {
                    let deleteMsgReqed = `§b${shared.value.homeShared.source} §e想要分享傳送點給你 §f- §e${shared.value.homeShared.homeData.home.name}`
                    // 刪除訊息
                    removeSign(deleteMsgReqed, player)

                    db.removeData("homeShared")
                    logfor(player.name, `§c§l>> §e傳送點分享請求已經結束，原因:對方下線。`)
                }
            }
        }
    }, 2)

    // 偵測下線玩家又上線的tag清除
    mc.system.runInterval(() => {
        for (let player of worldlog.getPlayers()) {
            const db = playerDB.table(player.id), share = db.getData("homeShare"), shared = db.getData("homeShared")
            if (share && typeof share.value == "object") {
                let check = false
                for (let player of worldlog.getPlayers()) {
                    if (player.name == share.value.homeShare.sharedName) {
                        const _db = playerDB.table(player.id), _shared = _db.getData("homeShared")
                        let json2 = {
                            "homeShared": {
                                "source": share.value.homeShare.source,
                                "sharedName": share.value.homeShare.sharedName,
                                "duration": share.value.homeShare.duration,
                                "startTime": share.value.homeShare.startTime,
                                "homeData": share.value.homeShare.homeData
                            }
                        }

                        const sharedData = _shared.value.homeShared, jsonData = json2.homeShared
                        if (sharedData.duration != jsonData.duration) continue;
                        if (sharedData.sharedName != jsonData.sharedName) continue;
                        if (sharedData.source != jsonData.source) continue;
                        if (sharedData.startTime != jsonData.startTime) continue;
                        check = true
                    }
                }
                if (!check) {
                    db.removeData("homeShare")
                    logfor(player.name, `§c§l>> §e您的分享請求已經結束，原因:對方沒有該請求，可能是因為您在請求中途下線`)
                }
            }
            if (shared && typeof shared.value == "object") {
                let check = false
                for (let player of worldlog.getPlayers()) {
                    if (player.name == shared.value.homeShared.source) {
                        const _db = playerDB.table(player.id), _share = _db.getData("homeShared")
                        let json2 = {
                            "homeShare": {
                                "source": shared.value.homeShared.source,
                                "sharedName": shared.value.homeShared.sharedName,
                                "duration": shared.value.homeShared.duration,
                                "startTime": shared.value.homeShared.startTime,
                                "homeData": shared.value.homeShared.homeData
                            }
                        }

                        const shareData = _share.value.homeShared, jsonData = json2.homeShare
                        if (shareData.duration != jsonData.duration) continue;
                        if (shareData.sharedName != jsonData.sharedName) continue;
                        if (shareData.source != jsonData.source) continue;
                        if (shareData.startTime != jsonData.startTime) continue;
                        check = true
                    }
                }
                if (!check) {
                    db.removeData("homeShared")
                    logfor(player.name, `§c§l>> §e分享請求已經結束，原因:對方沒有提出該請求，可能是因為您在被請求時下線。`)
                }
            }
        }
    }, 20)
}