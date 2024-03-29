import { world } from "@minecraft/server"
import * as mc from "@minecraft/server"
import { cmd, cmd_async, log, logfor } from './GametestFunctions.js'
import { leaderboard } from "./leaderboard.js"
import { checkAccountActive, checkLogin, newPlayer } from "../system/account/functions.js"
/**
 * 
 * @param {never} val 
 * @returns {boolean}
 * @功用 判斷是否為數字 (數字 - true, 非數字 - false)
 */
function isNum(val){
  return !isNaN(val)
}
/**
 * 
 * @param {number} max 最大數字 
 * @param {boolean} removeZeroBoolean 是否刪除0
 * @returns {number}
 */
function randomInt (max, removeZeroBoolean) {
    let boolen = removeZeroBoolean
    let maxs = max+1
    let random = Math.floor(Math.random() * maxs)
    if (boolen) {
        if (random == 0) {
            return 1
        } else {return random}
    } else {return random}
}

function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min); // 最大是包含的 最小也是
}

/**
 * 等待
 * @param {number} tick 
 * @returns {Promise<true>}
 */
export function sleep (tick) {
    return new Promise((resolve, reject) => {
        mc.system.runTimeout(() => {
            resolve(true)
        }, tick)
    })
}


class worldlogs {
    constructor () {

    }
    getOnlinePlayer () {
        return mc.world.getAllPlayers().length;
    }
    /**
     * @param {string | number} nameID 要搜尋的名稱
     * @param {string | number} scoreobjID 要搜尋的記分板
     * @return {null | number} 分數
     * @提醒 這個資料可能會有錯誤!
     */
    getScore (nameID, scoreobjID) {
        let data = this.getScoreFromMinecraft(nameID, scoreobjID)
        if (!data) return null;
        return data.score
    }
    /**
     * @param {string | number} scoreboardID 記分板ID
     * @returns {{"disname": string[], "score": number[], type: number[], entity: "未知問題已停用[]"}}
     * @disname 記分板_名稱
     * @score 記分板_名稱分數
     * @type 記分板_名稱類型 1: 玩家, 2: 生物, 3: 假玩家(可能由玩家自己新增) 
     * @entity 記分版_玩家 | 生物
     * @提醒 這個資料可能會有錯誤!
    */
    getScoreboardPlayers (scoreboardID) {
        let playerobj = world.scoreboard.getObjective(scoreboardID).getParticipants()
        if (playerobj.length == 0 || !playerobj) {
            return {"disname": [], "score": [], "type": [], "entity": []}
        }
        let disname = []
        let score = []
        let type = [] 
        let getentity = []
        for (let player of playerobj) {
            disname.push(player.displayName)
            score.push(Number(this.getScoreFromMinecraft(player.displayName, scoreboardID).score))
            type.push(player.type)
            // log(player.type)
            // if (player.type == 1 || player.type == 2) {
            //     getentity.push(player.getEntity())
            // } 
        }
        return {"disname": disname, "score": score, "type": type, "entity": getentity}
    }
    /**
     * 
     * @param {string | number} nameID 搜尋的名稱 
     * @param {string | number} scoreboardID  搜尋的記分板ID
     * @returns {{score: number, nameID: nameID} | false} 
     * @回傳 false | score: 分數 nameID: 搜尋的名稱
     * @提醒 這個資料可能會有錯誤!
     */
    getScoreFromMinecraft (nameID, scoreboardID) {
        let namedata
        let scoreboardData = world.scoreboard.getObjective(scoreboardID).getParticipants()
        for (let data of scoreboardData) {
            // log(data.displayName + ' ' + nameID)
            if (data.displayName == nameID) {
                // log (`test`)
                namedata = data
            }
        }
        if (!namedata) {
            return false
        }
        let score = world.scoreboard.getObjective(scoreboardID).getScore(namedata)
        return {'score': score, 'nameID': nameID}
    }
    /**
     * @param {mc.Entity | mc.Player} entityClass
     * @returns {string} 玩家分數
     * @deprecated 
     */
    getEntityScore (entityClass, scoreName) {
        let result = entityClass.runCommand(`scoreboard players add @s ${scoreName} 0`).statusMessage
        let res1 = result.split("(")[1].split(" ")[1]
        let res2 = res1.replace(`)`, "")
        return res2
    }

    /**
     * @param {string | number} scoreboardID 記分板ID
     * @param {number} rankvalue 要取得的排名
     * @param {boolean} deleteZero 是否刪除分數為0的玩家排名
     * name: 玩家名稱 score: 分數
     * @提醒 這個資料可能會有錯誤!
     */
    getLeaderboard (scoreboardID, rankvalue, deleteZero) {
        let lb = leaderboard(scoreboardID, rankvalue, deleteZero)
        return lb
    }
    
    /**
     * 
     * @param {mc.Vector3} pos1 
     * @param {mc.Vector3} pos2 
     * @param {Number} near 
     */
    isNear (pos1, pos2, near) {
        let x = Math.abs(pos1.x - pos2.x)
        let y = Math.abs(pos1.y - pos2.y)
        let z = Math.abs(pos1.z - pos2.z)
        if (x <= near && y <= near && z <= near) {
            return true
        }
        return false
    }
    
    /**
     * 
     * @param {{id: string, disname: string}[]} scoreboards 
     */
    addScoreBoards (scoreboards) {
        for (let scoreboard of scoreboards) {
            try {
                cmd_async(`scoreboard objectives add ${scoreboard.id} dummy ${scoreboard.disname}`)
            } catch {}
        }
    }

    /**
     * 取得玩家
     * @param {boolean} includeNotLogin 是否包含未登入玩家 (預設為false)
     */
    getPlayers (includeNotLogin = false) {
        let players = mc.world.getAllPlayers()
        if (includeNotLogin) {
            return players
        }

        if (!includeNotLogin && !checkAccountActive()) {
            return players
        }

        if (!includeNotLogin) {
            let newPlayers = []
            for (let pl of players) {
                if (checkLogin(pl)) {
                    newPlayers.push(pl)
                }
            }
            return newPlayers
        }
    }
}
/**
 * 方便好用的Class - 取得Minecraft各種資料 | 擁有中文註解
 * 
 * By:Cat1238756
 */
const worldlog = new worldlogs()

export { isNum, randomInt, worldlog, getRandomIntInclusive }