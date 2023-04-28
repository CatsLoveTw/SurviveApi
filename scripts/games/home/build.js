import * as mc from '@minecraft/server'
import { worldlog } from '../../lib/function'
import { log, logfor, cmd } from '../../lib/GametestFunctions'
import { getPublicHomeData } from './UI'
import { getLandData } from '../land/defind'

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
        for (let player of mc.world.getPlayers()) {
            for (let tag of player.getTags()) {
                let check = false
                for (let index in dimensions) {
                    let lands = worldlog.getScoreboardPlayers(dimensions[index]).disname
                    if (tag.startsWith('{"home":')) {
                        for (let land of lands) {
                            /**
                            * @type {{"home": {"name": string, "pos": {"x": number, "y": number, "z": number}, land: {name: string, pos: {x: {1: string, 2: string},z: {1: string, 2: string},},UID: string,player: string | false,permission: {build: string,container: string,portal: string}, users: false | [{username: string,permission: {build: string, container: string, portal: string}}], public: boolean}, dime: "over" | "nether" | "end"}}}
                            */
                            let getData = JSON.parse(tag)
                            let data = getLandData(land)
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
                    }
                }
                if (!check) {
                    /**
                    * @type {{"home": {"name": string, "pos": {"x": number, "y": number, "z": number}, land: {name: string, pos: {x: {1: string, 2: string},z: {1: string, 2: string},},UID: string,player: string | false,permission: {build: string,container: string,portal: string}, users: false | [{username: string,permission: {build: string, container: string, portal: string}}], public: boolean}, dime: "over" | "nether" | "end"}}}
                    */
                    let getData = JSON.parse(tag)
                    logfor(player.name, `§c§l>> §e偵測到傳送點所在領地被刪除! §f- §c${getData.home.name}`)
                    player.removeTag(tag)
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
        for (let player of mc.world.getPlayers()) {
            for (let tag of player.getTags()) {
                if (tag.startsWith('{"homeShare":')) {
                    /**
                     * @type {{"homeShare": {"source": string, "sharedName": string, "duration": number, "startTime": number, "homeData": {"home": {"name": string, "pos": {"x": number, "y": number, "z": number}, land: {name: string, pos: {x: {1: string, 2: string},z: {1: string, 2: string},},UID: string,player: string | false,permission: {build: string,container: string,portal: string}, users: false | [{username: string,permission: {build: string, container: string, portal: string}}], public: boolean}, dime: "over" | "nether" | "end"}}}}}
                     */
                    let json = JSON.parse(tag)
                    let duration = json.homeShare.duration * 1000
                    if ((new Date().getTime() - json.homeShare.startTime) >= duration) {
                        player.removeTag(tag)
                        logfor(player.name, `§c§l>> §e您的分享請求已經結束，對方無應答。`)
                    }
                }
                if (tag.startsWith('{"homeShared":')) {
                    /**
                     * @type {{"homeShared": {"source": string, "sharedName": string, "duration": number, "startTime": number, "homeData": {"home": {"name": string, "pos": {"x": number, "y": number, "z": number}, land: {name: string, pos: {x: {1: string, 2: string},z: {1: string, 2: string},},UID: string,player: string | false,permission: {build: string,container: string,portal: string}, users: false | [{username: string,permission: {build: string, container: string, portal: string}}], public: boolean}, dime: "over" | "nether" | "end"}}}}}
                     */
                    let json = JSON.parse(tag)
                    let duration = json.homeShared.duration * 1000
                    if ((new Date().getTime() - json.homeShared.startTime) >= duration) {
                        player.removeTag(tag)
                        logfor(player.name, `§c§l>> §e傳送點分享請求已經結束，您沒有回覆。`)
                    }
                }
            }
        }
    }, 1)
    // 偵測對方下線
    mc.system.runInterval(() => {
        for (let player of mc.world.getPlayers()) {
            for (let tag of player.getTags()) {
                if (tag.startsWith('{"homeShare":')) {
                    /**
                     * @type {{"homeShare": {"source": string, "sharedName": string, "duration": number, "startTime": number, "homeData": {"home": {"name": string, "pos": {"x": number, "y": number, "z": number}, land: {name: string, pos: {x: {1: string, 2: string},z: {1: string, 2: string},},UID: string,player: string | false,permission: {build: string,container: string,portal: string}, users: false | [{username: string,permission: {build: string, container: string, portal: string}}], public: boolean}, dime: "over" | "nether" | "end"}}}}}
                     */
                    let json = JSON.parse(tag)
                    let check = false
                    for (let player of mc.world.getPlayers()) {
                        if (player.name == json.homeShare.sharedName) {
                            check = true
                        }
                    }
                    if (!check) {
                        let deleteMsgSource = `§e您已向 §b${json.homeShare.sharedName} §e發送分享請求，等待回復...`
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
                if (tag.startsWith('{"homeShared":')) {
                    /**
                     * @type {{"homeShared": {"source": string, "sharedName": string, "duration": number, "startTime": number, "homeData": {"home": {"name": string, "pos": {"x": number, "y": number, "z": number}, land: {name: string, pos: {x: {1: string, 2: string},z: {1: string, 2: string},},UID: string,player: string | false,permission: {build: string,container: string,portal: string}, users: false | [{username: string,permission: {build: string, container: string, portal: string}}], public: boolean}, dime: "over" | "nether" | "end"}}}}}
                     */
                    let json = JSON.parse(tag)
                    let check = false
                    for (let player of mc.world.getPlayers()) {
                        if (player.name == json.homeShared.source) {
                            check = true
                        }
                    }
                    if (!check) {
                        let deleteMsgReqed = `§b${json.homeShared.source} §e想要分享傳送點給你 §f- §e${json.homeShared.homeData.home.name}`
                        // 刪除訊息
                        for (let tag of player.getTags()) {
                            if (tag.includes(deleteMsgReqed)) {
                                player.removeTag(tag)
                            }
                        }
                        player.removeTag(tag)
                        logfor(player.name, `§c§l>> §e傳送點分享請求已經結束，原因:對方下線。`)
                    }
                }
            }
        }
    }, 2)

    // 偵測下線玩家又上線的tag清除
    mc.system.runInterval(() => {
        for (let player of mc.world.getPlayers()) {
            for (let tag of player.getTags()) {
                if (tag.startsWith('{"homeShare":')) {
                    /**
                     * @type {{"homeShare": {"source": string, "sharedName": string, "duration": number, "startTime": number, "homeData": {"home": {"name": string, "pos": {"x": number, "y": number, "z": number}, land: {name: string, pos: {x: {1: string, 2: string},z: {1: string, 2: string},},UID: string,player: string | false,permission: {build: string,container: string,portal: string}, users: false | [{username: string,permission: {build: string, container: string, portal: string}}], public: boolean}, dime: "over" | "nether" | "end"}}}}}
                     */
                    let json = JSON.parse(tag)
                    let check = false
                    for (let player of mc.world.getPlayers()) {
                        if (player.name == json.homeShare.sharedName) {
                            for (let tag of player.getTags()) {
                                let json2 = {
                                    "homeShared": {
                                        "source": json.homeShare.source,
                                        "sharedName": json.homeShare.sharedName,
                                        "duration": json.homeShare.duration,
                                        "startTime": json.homeShare.startTime,
                                        "homeData": json.homeShare.homeData
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
                        logfor(player.name, `§c§l>> §e您的分享請求已經結束，原因:對方沒有該請求，可能是因為您在請求中途下線`)
                    }
                }
                if (tag.startsWith('{"homeShared":')) {
                    /**
                     * @type {{"homeShared": {"source": string, "sharedName": string, "duration": number, "startTime": number, "homeData": {"home": {"name": string, "pos": {"x": number, "y": number, "z": number}, land: {name: string, pos: {x: {1: string, 2: string},z: {1: string, 2: string},},UID: string,player: string | false,permission: {build: string,container: string,portal: string}, users: false | [{username: string,permission: {build: string, container: string, portal: string}}], public: boolean}, dime: "over" | "nether" | "end"}}}}}
                     */
                    let json = JSON.parse(tag)
                    let check = false
                    for (let player of mc.world.getPlayers()) {
                        if (player.name == json.homeShared.source) {
                            for (let tag of player.getTags()) {
                                let json2 = {
                                    "homeShare": {
                                        "source": json.homeShared.source,
                                        "sharedName": json.homeShared.sharedName,
                                        "duration": json.homeShared.duration,
                                        "startTime": json.homeShared.startTime,
                                        "homeData": json.homeShared.homeData
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
                        logfor(player.name, `§c§l>> §e分享請求已經結束，原因:對方沒有提出該請求，可能是因為您在被請求時下線。`)
                    }
                }
            }
        }
    }, 20)
}