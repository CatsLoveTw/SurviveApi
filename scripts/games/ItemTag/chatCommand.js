import * as mc from '@minecraft/server'
import { cmd, log, logfor } from '../../lib/GametestFunctions'
import * as defind from '../../defind.js'

export const chatCommands = [
    // 設定請求Tag - {"homeShare": {"source": string, "sharedName": string, "duration": number, "startTime": number, "homeData": {"home": {"name": string, "pos": {"x": number, "y": number, "z": number}, land: {name: string, pos: {x: {1: string, 2: string},z: {1: string, 2: string},},UID: string,player: string | false,permission: {build: string,container: string,portal: string}, users: false | [{username: string,permission: {build: string, container: string, portal: string}}], public: boolean}, dime: "over" | "nether" | "end"}}}} 
    // 設定被請求Tag - {"homeShared": {"source": string, "sharedName": string, "duration": number, "startTime": number, "homeData": {"home": {"name": string, "pos": {"x": number, "y": number, "z": number}, land: {name: string, pos: {x: {1: string, 2: string},z: {1: string, 2: string},},UID: string,player: string | false,permission: {build: string,container: string,portal: string}, users: false | [{username: string,permission: {build: string, container: string, portal: string}}], public: boolean}, dime: "over" | "nether" | "end"}}}}
    {
        command: 'setItemTag',
        des: '設定標籤到物品上，新增後將無法更改',
        values: [
            ["<空>"]
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
                /**
                 * @type {mc.EntityInventoryComponent}
                 */
                let getInv = player.getComponent("inventory")
                let getItem = getInv.container.getItem(player.selectedSlot)
                if (!getItem) return logfor(player.name, `§c§l>> §e沒有手持物品，新增失敗!`)
                let getLore = getItem.getLore()
                if (getLore.length > 0) {
                    let data = new defind.ItemTag().getDataFromLore(getLore)
                    if (data) {
                        return logfor(player.name, `§c§l>> §e該物品已經設定過標籤!`)
                    }
                }
                
                let lore = getLore
                if (lore.length == 0) {
                    lore = undefined
                }
                getItem.setLore(new defind.ItemTag(player.name).transfromToLore(lore).lore)
                getInv.container.setItem(player.selectedSlot, getItem)
                logfor(player.name, `§a§l>> §e設定成功!`)
            }
    }
]