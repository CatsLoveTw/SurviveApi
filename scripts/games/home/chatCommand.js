/// <reference path="./index.d.ts" />

import * as mc from '@minecraft/server'
import { cmd, log, logfor, removeSign } from '../../lib/GametestFunctions'
import { worldlog } from '../../lib/function'
import { playerDB } from '../../config'
import { addHome } from './defind'

export const chatCommands = [
    // 設定請求Tag - {"homeShare": {"source": string, "sharedName": string, "duration": number, "startTime": number, "homeData": {"home": {"name": string, "pos": {"x": number, "y": number, "z": number}, land: {name: string, pos: {x: {1: string, 2: string},z: {1: string, 2: string},},UID: string,player: string | false,permission: {build: string,container: string,portal: string}, users: false | [{username: string,permission: {build: string, container: string, portal: string}}], public: boolean}, dime: "over" | "nether" | "end"}}}} 
    // 設定被請求Tag - {"homeShared": {"source": string, "sharedName": string, "duration": number, "startTime": number, "homeData": {"home": {"name": string, "pos": {"x": number, "y": number, "z": number}, land: {name: string, pos: {x: {1: string, 2: string},z: {1: string, 2: string},},UID: string,player: string | false,permission: {build: string,container: string,portal: string}, users: false | [{username: string,permission: {build: string, container: string, portal: string}}], public: boolean}, dime: "over" | "nether" | "end"}}}}
    {
        command: 'sharehome',
        des: '分享傳送點功能 (被分享時可用)',
        values: [
            ['accept'],
            ['deny'],
            ['delete']
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
                
                const db = playerDB.table(player.id)
                let check = false
                const Share = db.getData("homeShare"), Shared = db.getData("homeShared");
                // 接受
                if (args[1] == 'accept') {
                    if (Shared && typeof Shared.value == "object") {
                        /**
                         * @type {mc.Player}
                         */
                        let getSource
                        /**
                         * @type {mc.Player}
                         */
                        let sharedName
                        for (let player of worldlog.getPlayers()) {
                            if (player.name == Shared.value.homeShared.source) {
                                getSource = player
                            }
                            if (player.name == Shared.value.homeShared.sharedName) {
                                sharedName = player
                            }
                        }
                        if (!getSource || !sharedName) {
                            db.removeData("homeShared")
                            return logfor(player.name, `§c§l>> §e找不到玩家，分享失敗!`)
                        }

                        let homes = db.getData("homes")

                        homes.value.push(json.homeShared.homeData)
                        db.setData("homes", homes.value, homes.score)

                        let deleteMsgSource = `§e您已向 §b${json.homeShared.sharedName} §e發送分享請求，等待回復...`
                        let deleteMsgReqed = `§b${json.homeShared.source} §e想要分享傳送點給你 §f- §e${json.homeShared.homeData.home.name}`
                        // 刪除訊息
                        removeSign(deleteMsgReqed, player)
                        removeSign(deleteMsgSource, getSource)
                        // 刪除請求
                        db.removeData("homeShared")
                        playerDB.table(getSource.id).removeData('homeShare')
                        addHome(player, json.homeShared.homeData)
                        logfor(player.name, `§a§l>> §e接受成功!`)
                        logfor(getSource.name, `§a§l>> §e請求已被對方接受!`)
                        check = true
                    }
                } else if (args[1] == 'deny') {
                    if (Shared && typeof Shared.value == "object") {
                        /**
                         * @type {mc.Player}
                         */
                        let getSource
                        /**
                         * @type {mc.Player}
                         */
                        let sharedName
                        for (let player of worldlog.getPlayers()) {
                            if (player.name == json.homeShared.source) {
                                getSource = player
                            }
                            if (player.name == json.homeShared.sharedName) {
                                sharedName = player
                            }
                        }
                        if (!getSource || !sharedName) {
                            db.removeData("homeShared")
                            return logfor(player.name, `§c§l>> §e找不到玩家，分享失敗!`)
                        }
                        logfor(player.name, `§a§l>> §e拒絕成功!`)
                        logfor(getSource.name, `§c§l>> §e請求失敗，對方拒絕了分享請求`)
                        let deleteMsgSource = `§e您已向 §b${json.homeShared.sharedName} §e發送分享請求，等待回復...`
                        let deleteMsgReqed = `§b${json.homeShared.source} §e想要分享傳送點給你 §f- §e${json.homeShared.homeData.home.name}`
                        // 刪除訊息
                        removeSign(deleteMsgReqed, player)
                        removeSign(deleteMsgSource, getSource)
                        // 刪除請求
                        db.removeData("homeShared")
                        playerDB.table(getSource.id).removeData("homeShare")
                        check = true
                    }
                } else if (args[1] == 'delete') {
                    if (Share && typeof Share.value == "object") {
                        /**
                         * @type {mc.Player}
                         */
                        let getSource
                        /**
                         * @type {mc.Player}
                         */
                        let sharedName
                        for (let player of worldlog.getPlayers()) {
                            if (player.name == json.homeShare.source) {
                                getSource = player
                            }
                            if (player.name == json.homeShare.sharedName) {
                                sharedName = player
                            }
                        }
                        if (!getSource || !sharedName) {
                            db.removeData("homeShare")
                            return logfor(player.name, `§a§l>> §e傳送點分享請求刪除成功!`)
                        }
                        logfor(player.name, `§a§l>> §e傳送點分享請求刪除成功!`)
                        logfor(reqed.name, `§3§l>> §b${player.name} §e已撤回了傳送點分享請求`)
                        let deleteMsgSource = `§e您已向 §b${json.homeShare.sharedName} §e發送分享請求，等待回復...`
                        let deleteMsgReqed = `§b${json.homeShare.source} §e想要分享傳送點給你 §f- §e${json.homeShare.homeData.home.name}`
                        // 刪除訊息
                        removeSign(deleteMsgSource, player)
                        removeSign(deleteMsgReqed, sharedName)
                        // 刪除請求
                        db.removeData("homeShare")
                        playerDB.table(sharedName.id).removeData("homeShared")
                        check = true
                    }
                }
                if (!check) {
                    return logfor(player.name, `§c§l>> §e執行失敗，沒有可用的請求!`)
                }
            }
    }
]