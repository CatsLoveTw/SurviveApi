import * as mc from '@minecraft/server'
import { cmd, log, logfor } from '../../lib/GametestFunctions'

export const chatCommands = [
    // 設定請求Tag - {"homeShare": {"source": string, "sharedName": string, "duration": number, "startTime": number, "homeData": {"home": {"name": string, "pos": {"x": number, "y": number, "z": number}, land: {name: string, pos: {x: {1: string, 2: string},z: {1: string, 2: string},},UID: string,player: string | false,permission: {build: string,container: string,portal: string}, users: false | [{username: string,permission: {build: string, container: string, portal: string}}], public: boolean}, dime: "over" | "nether" | "end"}}}} 
    // 設定被請求Tag - {"homeShared": {"source": string, "sharedName": string, "duration": number, "startTime": number, "homeData": {"home": {"name": string, "pos": {"x": number, "y": number, "z": number}, land: {name: string, pos: {x: {1: string, 2: string},z: {1: string, 2: string},},UID: string,player: string | false,permission: {build: string,container: string,portal: string}, users: false | [{username: string,permission: {build: string, container: string, portal: string}}], public: boolean}, dime: "over" | "nether" | "end"}}}}
    {
        command: 'sharehome',
        des: '分享傳送點功能',
        values: [
            [{ "accept": '被分享時可用' }],
            [{ "deny": "被分享時可用" }],
            [{ "delete": "分享時可用" }]
        ],
        adminOnly: false,
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
                        if (tag.startsWith('{"homeShared":')) {
                            /**
                             * @type {{"homeShared": {"source": string, "sharedName": string, "duration": number, "startTime": number, "homeData": {"home": {"name": string, "pos": {"x": number, "y": number, "z": number}, land: {name: string, pos: {x: {1: string, 2: string},z: {1: string, 2: string},},UID: string,player: string | false,permission: {build: string,container: string,portal: string}, users: false | [{username: string,permission: {build: string, container: string, portal: string}}], public: boolean}, dime: "over" | "nether" | "end"}}}}}
                             */
                            let json = JSON.parse(tag)
                            /**
                             * @type {mc.Player}
                             */
                            let getSource
                            /**
                             * @type {mc.Player}
                             */
                            let sharedName
                            for (let player of mc.world.getAllPlayers()) {
                                if (player.name == json.homeShared.source) {
                                    getSource = player
                                }
                                if (player.name == json.homeShared.sharedName) {
                                    sharedName = player
                                }
                            }
                            if (!getSource || !sharedName) {
                                player.removeTag(tag)
                                return logfor(player.name, `§c§l>> §e找不到玩家，分享失敗!`)
                            }
                            player.addTag(JSON.stringify(json.homeShared.homeData))
                            let deleteMsgSource = `§e您已向 §b${json.homeShared.sharedName} §e發送分享請求，等待回復...`
                            let deleteMsgReqed = `§b${json.homeShared.source} §e想要分享傳送點給你 §f- §e${json.homeShared.homeData.home.name}，輸入 §a-sharehome accept 同意 §c-sharehome deny 拒絕...`
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
                                "homeShare": {
                                    "source": json.homeShared.source,
                                    "sharedName": json.homeShared.sharedName,
                                    "duration": json.homeShared.duration,
                                    "startTime": json.homeShared.startTime,
                                    "homeData": json.homeShared.homeData
                                }
                            }
                            getSource.removeTag(JSON.stringify(removeJSON))
                            check = true
                        }
                    } else if (args[1] == 'deny') {
                        if (tag.startsWith('{"homeShared":')) {
                            /**
                             * @type {{"homeShared": {"source": string, "sharedName": string, "duration": number, "startTime": number, "homeData": {"home": {"name": string, "pos": {"x": number, "y": number, "z": number}, land: {name: string, pos: {x: {1: string, 2: string},z: {1: string, 2: string},},UID: string,player: string | false,permission: {build: string,container: string,portal: string}, users: false | [{username: string,permission: {build: string, container: string, portal: string}}], public: boolean}, dime: "over" | "nether" | "end"}}}}}
                             */
                            let json = JSON.parse
                            /**
                             * @type {mc.Player}
                             */
                            let getSource
                            /**
                             * @type {mc.Player}
                             */
                            let sharedName
                            for (let player of mc.world.getAllPlayers()) {
                                if (player.name == json.homeShared.source) {
                                    getSource = player
                                }
                                if (player.name == json.homeShared.sharedName) {
                                    sharedName = player
                                }
                            }
                            if (!getSource || !sharedName) {
                                player.removeTag(tag)
                                return logfor(player.name, `§c§l>> §e找不到玩家，分享失敗!`)
                            }
                            logfor(player.name, `§a§l>> §e拒絕成功!`)
                            logfor(getSource.name, `§c§l>> §e請求失敗，對方拒絕了分享請求`)
                            let deleteMsgSource = `§e您已向 §b${json.homeShared.sharedName} §e發送分享請求，等待回復...`
                            let deleteMsgReqed = `§b${json.homeShared.source} §e想要分享傳送點給你 §f- §e${json.homeShared.homeData.home.name}，輸入 §a-sharehome accept 同意 §c-sharehome deny 拒絕...`
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
                                "homeShare": {
                                    "source": json.homeShared.source,
                                    "sharedName": json.homeShared.sharedName,
                                    "duration": json.homeShared.duration,
                                    "startTime": json.homeShared.startTime,
                                    "homeData": json.homeShared.homeData
                                }
                            }
                            getSource.removeTag(JSON.stringify(removeJSON))
                            check = true
                        }
                    } else if (args[1] == 'delete') {
                        if (tag.startsWith('{"homeShare":')) {
                            /**
                             * @type {{"homeShare": {"source": string, "sharedName": string, "duration": number, "startTime": number, "homeData": {"home": {"name": string, "pos": {"x": number, "y": number, "z": number}, land: {name: string, pos: {x: {1: string, 2: string},z: {1: string, 2: string},},UID: string,player: string | false,permission: {build: string,container: string,portal: string}, users: false | [{username: string,permission: {build: string, container: string, portal: string}}], public: boolean}, dime: "over" | "nether" | "end"}}}}}
                             */
                            let json = JSON.parse(tag)
                            /**
                             * @type {mc.Player}
                             */
                            let getSource
                            /**
                             * @type {mc.Player}
                             */
                            let sharedName
                            for (let player of mc.world.getAllPlayers()) {
                                if (player.name == json.homeShare.source) {
                                    getSource = player
                                }
                                if (player.name == json.homeShare.sharedName) {
                                    sharedName = player
                                }
                            }
                            if (!getSource || !sharedName) {
                                player.removeTag(tag)
                                return logfor(player.name, `§a§l>> §e傳送點分享請求刪除成功!`)
                            }
                            logfor(player.name, `§a§l>> §e傳送點分享請求刪除成功!`)
                            logfor(reqed.name, `§3§l>> §b${player.name} §e已撤回了傳送點分享請求`)
                            let deleteMsgSource = `§e您已向 §b${json.homeShare.sharedName} §e發送分享請求，等待回復...`
                            let deleteMsgReqed = `§b${json.homeShare.source} §e想要分享傳送點給你 §f- §e${json.homeShare.homeData.home.name}，輸入 §a-sharehome accept 同意 §c-sharehome deny 拒絕...`
                            // 刪除訊息
                            for (let tag of player.getTags()) {
                                if (tag.includes(deleteMsgSource)) {
                                    player.removeTag(tag)
                                }
                            }
                            for (let tag of sharedName.getTags()) {
                                if (tag.includes(deleteMsgReqed)) {
                                    sharedName.removeTag(tag)
                                }
                            }
                            // 刪除請求
                            player.removeTag(tag)
                            let removeJSON = {
                                "homeShared": {
                                    "source": json.homeShare.source,
                                    "sharedName": json.homeShare.sharedName,
                                    "duration": json.homeShare.duration,
                                    "startTime": json.homeShare.startTime,
                                    "homeData": json.homeShare.homeData
                                }
                            }
                            sharedName.removeTag(JSON.stringify(removeJSON))
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