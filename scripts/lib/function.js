import { world } from "@minecraft/server"
import * as mc from "@minecraft/server"
import { cmd, log, logfor } from './GametestFunctions.js'
import { leaderboard } from "./leaderboard.js"
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
 * 
 * @param {any} player 玩家ID 
 * @param {any} scoreName 記分板ID
 * @returns {number}
 * @提醒 這個函數可能會引發錯誤
 */
function getScore (player, scoreName) {
    // cmd(`scoreboard players add "${player}" ${scoreName} 0`)
    return worldlog.getScoreFromMinecraft(player, scoreName).score
}

// class worldScoreBoard {
//     constructor() {
//     }
//     add
// }

/**
 * 世界記分板資料庫系統
 */

class worldDB {
    // 內容 - key:,value: 
    /**
     * 
     * @param {string} DBID 輸入資料庫ID
     */
    constructor (DBID) {
        this.id = DBID
    }
    /**
     * 新增資料庫
     * @returns {Promise<mc.ScoreboardObjective>}
     */
    async addDB () {
        await cmd(`scoreboard objectives add "DB:${this.id}" dummy`)
        let allBoards = mc.world.scoreboard.getObjectives()
        for (let board of allBoards) {
            if (board.id == `DB:${this.id}`) {
                return board
            }
        }
    }
    /**
     * 刪除資料庫
     */
    removeDB () {
        cmd(`scoreboard objectives remove "DB:${this.id}" dummy`)
    }
    /**
     * 確認資料庫是否存在
     */
    checkDB () {
        let allBoards = mc.world.scoreboard.getObjectives()
        for (let board of allBoards) {
            if (board.id == `DB:${this.id}`) {
                return true
            }
        }
        return false
    }
    /**
     * 取得資料庫記分板
     */
    getDB () {
        let allBoards = mc.world.scoreboard.getObjectives()
        for (let board of allBoards) {
            if (board.id == `DB:${this.id}`) {
                return board
            }
        }
        return this.addDB()
    }

    /**
     * 確認資料是否存在
     * @param {string} key
     */
    async checkData (key) {
        if (!this.checkDB()) {
            this.addDB()
            return {value: "", check: false}
        }

        let db = await this.getDB()
        let datas = db.getParticipants()
        for (let data of datas) {
            let Datakey = data.displayName.replace("key:", '').split(",value:")[0]
            let DataValue = data.displayName.split(",value:")[1]
            if (Datakey == key) {
                return {value: DataValue, check: true}
            }
        }
        return {value: "", check: false}
    }

    /**
     * 設定資料
     * @param {string} key 鍵 (搜尋值用)
     * @param {any[] | string | number | boolean} value 值
     */
    async setData (key, value) {
        if (!this.checkDB()) {
            await this.addDB()
        }
        let data = await this.checkData(key)
        if (data.check == true) {
            cmd(`scoreboard players reset "key:${key},value:${data.value}" DB:${this.id}`)
            if (Array.isArray(value)) {
                cmd(`scoreboard players set "key:${key},value:${value.join("___")}" DB:${this.id} 0`)
            } else {
                cmd(`scoreboard players set "key:${key},value:${value}" DB:${this.id} 0`)
            }
        } else {
            if (Array.isArray(value)) {
                cmd(`scoreboard players set "key:${key},value:${value.join("___")}" DB:${this.id} 0`)
            } else {
                cmd(`scoreboard players set "key:${key},value:${value}" DB:${this.id} 0`)
            }
        }
    }
    /**
     * 刪除資料
     * @param {string} key 鍵
     */
    async removeData (key) {
        let data = await this.checkData(key)
        if (data.check) {
            cmd(`scoreboard players remove "key:${key},value:${data.value}" DB:${this.id}`)
        }
    }
    /**
     * 取得資料值
     * @param {string} key 
     * @returns {Promise<false | {key: string;values: string[];isArray: true;} | {key: string;values: string;isArray: false;}>}
     */
    async getData (key) {
        let data = await this.checkData(key)
        if (!data.check) return false
        let values = data.value
        if (data.value.indexOf('___') != -1) {
            return {key: key, values: values.split("___"), isArray: true}
        }
        return {key: key, values: values, isArray: false}
    }


    /**
     * 
     * @returns {{key: string;values: string[];isArray: true;} | {key: string;values: string;isArray: false;}}
     */
    async getAllData () {
        let datas = []
        let db = await this.getDB()
        for (let data of db.getParticipants()) {
            let key = data.displayName.replace("key:", '').split(",value:")[0]
            let a = await this.getData(key)
            datas.push(a)
        }
        return datas
    }
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
     * @return {number} 分數
     * @提醒 這個資料可能會有錯誤!
     */
    getscore (nameID, scoreobjID) {
        return getScore(nameID, scoreobjID)
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
}
/**
 * 方便好用的Class - 取得Minecraft各種資料 | 擁有中文註解
 * 
 * By:Cat1238756
 */
const worldlog = new worldlogs()

export { isNum, randomInt, getScore, worldlog, worldDB, getRandomIntInclusive }