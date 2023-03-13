import * as mc from '@minecraft/server'
import { cmd, log, logfor } from '../../lib/GametestFunctions'

export const chatCommands = [
    // 設定請求Tag - {"homeShare": {"source": string, "sharedName": string, "duration": number, "startTime": number, "homeData": {"home": {"name": string, "pos": {"x": number, "y": number, "z": number}, land: {name: string, pos: {x: {1: string, 2: string},z: {1: string, 2: string},},UID: string,player: string | false,permission: {build: string,container: string,portal: string}, users: false | [{username: string,permission: {build: string, container: string, portal: string}}], public: boolean}, dime: "over" | "nether" | "end"}}}} 
    // 設定被請求Tag - {"homeShared": {"source": string, "sharedName": string, "duration": number, "startTime": number, "homeData": {"home": {"name": string, "pos": {"x": number, "y": number, "z": number}, land: {name: string, pos: {x: {1: string, 2: string},z: {1: string, 2: string},},UID: string,player: string | false,permission: {build: string,container: string,portal: string}, users: false | [{username: string,permission: {build: string, container: string, portal: string}}], public: boolean}, dime: "over" | "nether" | "end"}}}}
    {
        command: 'getmenu',
        des: '取得選單系統 (請確認背包是否已滿)',
        values: [],
        adminOnly: false,
        run:
            /**
            @param {mc.Player} player
            @param {string} message
            */
            function (player, message, error) {
                /**
                 * @type {mc.EntityInventoryComponent}
                 */
                let inv = player.getComponent("inventory")
                let count = 0
                let Slot = 0
                for (let i = 0; i < 36; i++) {
                    if (Slot == 0) {
                        try {
                            if (inv.container.getItem(i).typeId) {
                                count++
                            } else {
                                Slot = i
                            }
                        } catch {
                            Slot = i
                        }
                    }
                }
                if (count == 36) return logfor(player.name, `§c§l>> §e背包已滿，請稍後嘗試!`)

                let newItem = new mc.ItemStack(mc.MinecraftItemTypes.compass, 1)
                newItem.nameTag = `§e§l選單系統`
                newItem.setLore(["§e§l右鍵/長按螢幕開啟選單"])
                inv.container.setItem(Slot, newItem)
                logfor(player.name, `§a§l>> §e取得成功!`)
            }
    }
]