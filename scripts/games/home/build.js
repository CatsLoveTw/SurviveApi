import * as mc from '@minecraft/server'
import { worldlog } from '../../lib/function'
import { log, logfor, cmd } from '../../lib/GametestFunctions'
import { getLandData } from '../land/UI'

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
    // shared `§b${json.homeShared.source} §e想要分享傳送點給你 §f- §e${json.homeShared.homeData.home.name}，輸入 §a-sharehome accept 同意 §c-sharehome deny 拒絕...`
    
    for (let player of mc.world.getAllPlayers()) {
        for (let tag of player.getTags()) {
            let dimensions = ["lands", "lands_nether", "lands_end"]
            let check = false
            let index = 0
            if (player.dimension.id.toLowerCase() == mc.MinecraftDimensionTypes.nether) {
                index = 1
            }
            if (player.dimension.id.toLowerCase() == mc.MinecraftDimensionTypes.theEnd) {
                index = 2
            }
            let lands = worldlog.getScoreboardPlayers(dimensions[index]).disname
            for (let land of lands) {
                let data = getLandData(land)
                if (!tag.startsWith('{"home":')) return;
                if (!tag.includes(JSON.stringify(data.pos))) return;
                if (!tag.includes(data.UID)) return;
                if (!tag.includes(data.name)) return;
                if (!tag.includes(data.player)) return;
                check = true
            }
            if (!check) {
                logfor(player.name, `§c§l>> §e偵測到傳送點所在領地被刪除!`)
            }
        }
    }

    // 檢查請求/被請求到期 §
    mc.system.runSchedule(() => {
        for (let player of mc.world.getAllPlayers()) {
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
    mc.system.runSchedule(() => {
        for (let player of mc.world.getAllPlayers()) {
            for (let tag of player.getTags()) {
                if (tag.startsWith('{"homeShare":')) {
                    /**
                     * @type {{"homeShare": {"source": string, "sharedName": string, "duration": number, "startTime": number, "homeData": {"home": {"name": string, "pos": {"x": number, "y": number, "z": number}, land: {name: string, pos: {x: {1: string, 2: string},z: {1: string, 2: string},},UID: string,player: string | false,permission: {build: string,container: string,portal: string}, users: false | [{username: string,permission: {build: string, container: string, portal: string}}], public: boolean}, dime: "over" | "nether" | "end"}}}}}
                     */
                    let json = JSON.parse(tag)
                    let check = false
                    for (let player of mc.world.getAllPlayers()) {
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
                    for (let player of mc.world.getAllPlayers()) {
                        if (player.name == json.homeShared.source) {
                            check = true                            
                        }
                    }
                    if (!check) {
                        let deleteMsgReqed = `§b${json.homeShared.source} §e想要分享傳送點給你 §f- §e${json.homeShared.homeData.home.name}，輸入 §a-sharehome accept 同意 §c-sharehome deny 拒絕...`
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
    mc.system.runSchedule(() => {
        for (let player of mc.world.getAllPlayers()) {
            for (let tag of player.getTags()) {
                if (tag.startsWith('{"homeShare":')) {
                    /**
                     * @type {{"homeShare": {"source": string, "sharedName": string, "duration": number, "startTime": number, "homeData": {"home": {"name": string, "pos": {"x": number, "y": number, "z": number}, land: {name: string, pos: {x: {1: string, 2: string},z: {1: string, 2: string},},UID: string,player: string | false,permission: {build: string,container: string,portal: string}, users: false | [{username: string,permission: {build: string, container: string, portal: string}}], public: boolean}, dime: "over" | "nether" | "end"}}}}}
                     */
                    let json = JSON.parse(tag)
                    let check = false
                    for (let player of mc.world.getAllPlayers()) {
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
                    for (let player of mc.world.getAllPlayers()) {
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
    }, 2)
}