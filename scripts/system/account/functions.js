import * as mc from '@minecraft/server'
import { worldlog } from '../../lib/function.js'
import { addSign, cmd, getSign, log, logfor } from '../../lib/GametestFunctions.js'
import { loginSession } from './classes.js'
import { removeSign } from '../../lib/GametestFunctions.js'
import { playerDB } from '../../config.js'

/**
 * 取得帳戶資訊
 * @param {number} id 玩家帳戶ID 
 * @returns 若找不到ID資料則回傳false
 */
export function getAccountData(id) {
    let accounts = worldlog.getScoreboardPlayers('accounts')
    for (let i in accounts.disname) {
        if (accounts.score[i] == id) {
            let disname = accounts.disname[i]
            let args = disname.split('|||')
            let omid = args[0].replace("omid:", "")
            let name = args[1].replace("name:", "")
            let password = args[2].replace('password', "")

            return new loginSession(id, name, omid, password)
        }
    }
    return false
}

/**
* 檢查玩家是否有登入帳戶
* @param {mc.Player} player 要檢查之玩家
* @returns 
*/
export function checkLogin(player) {
    for (let tag of player.getTags()) {
        if (tag.startsWith('{"loginSession":')) {
            return loginSession.transformData(tag)
        }
    }
    return false
}

/**
 * 嘗試登入
 * @param {mc.Player} player 
 * @param {string} omid 
 * @param {string} password 
 * @returns 
 */
export function login(player, omid, password) {
    for (let tag of player.getTags()) {
        if (tag.startsWith('{"loginSession":')) {
            return logfor(player.name, '§c§l>> §e請先登出後再切換帳戶!')
        }
    }
    const db = playerDB.table(player.id)
    let accounts = worldlog.getScoreboardPlayers('accounts').score
    for (let id of accounts) {
        let data = getAccountData(id)
        if (data.omid == omid) {
            if (data.password == password) {
                let session = new loginSession(id, data.name, omid, password).toJSON()
                db.setData("loginSession", session)
                logfor(player.name, `§a§l>> §e歡迎回來 §b${data.name}§e!`)
                let pos = mc.world.getDefaultSpawnPosition()
                player.runCommandAsync(`tp @s ${pos.x} ${pos.y} ${pos.z}`)
                player.runCommandAsync(`effect @s clear`)
                return;
            }
        }
    }
    return logfor(player.name, "§c§l>> §eOMID或密碼錯誤!")
}

/**
 * 未登入玩家應對措施
 * @param {mc.Player} player 
 */
export function newPlayer(player) {
    let signs = getSign(player)
    if (signs.length > 0) {
        removeSign("§c§l請登入帳戶以繼續遊玩本伺服! -login <omid> <password>", player)
    }
    addSign('§c§l請登入帳戶以繼續遊玩本伺服! -login <omid> <password>', player, 21)
    player.runCommandAsync(`ability @s mayfly false`)
    player.runCommandAsync(`effect @s weakness 3 255 true`)
    player.runCommandAsync(`effect @s blindness 3 255 true`)
    player.runCommandAsync(`effect @s slowness 3 255 true`)
    player.runCommandAsync(`effect @s invisibility 3 255 true`)
} 

/**
 * 確認帳號功能是否啟用
 */
export function checkAccountActive() {
    if (worldlog.getScoreboardPlayers('accountActive').score.length > 0) {
        return true
    }
    return false
}