import { world } from "@minecraft/server"
import * as mc from "@minecraft/server"
import { cmd, log, logfor } from './GametestFunctions.js'
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
    return Math.floor(Math.random() * (max - min + 1) + min); //The maximum is inclusive and the minimum is inclusive
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


class worldDBs {
    constructor () {
        let alldb = []
        for (let id of worldlog.getScoreobjs["id"]) {
            if (id.startsWith("DB")) {
                alldb.push(id.replace("DB", ''))
            }
        } 
        this.getAllDB = alldb
    }
    addDB (Name) {
        try{cmd (`scoreboard objectives add "DB:${Name}" dummy`)} catch {}
    }
    removeDB (Name) {
        try {cmd (`scoreboard objectives remove "DB:${Name}"`)} catch {} 
    }
    add (TEXTName, DBID, DBText_array) {
        cmd (`scoreboard players set "${TEXTName + ' text:' + DBText_array.join(',')}" "DB:${DBID}" 0`)
    }
    set (TEXTName, DBID, DBText_array) {
        let serid = []
        let ser = []
       for (let name of worldlog.getScoreboardPlayers(`DB:${DBID}`)["disname"]) {
        if (name.startsWith(TEXTName)) {
            ser.push(name)
            serid.push(name.split(" ")[0])
        }
       }
       if (serid.length == 0) {
        return false
       } else {
        cmd (`scoreboard players reset "${ser}" "DB:${DBID}"`)
        cmd (`scoreboard players set "${TEXTName + ' text:' + DBText_array.join(',')}" "DB:${DBID}" 0`)
        return true
    }
    }
    remove (TEXTName, DBID) {
        let serid = []
        for (let name of worldlog.getScoreboardPlayers(`DB:${DBID}`)["disname"]) {
            if (name.startsWith(TEXTName)) {
                serid.push(name)
            }
        }
        if (serid.length == 0) {
            return false
        } else {
            for (let id of serid) {
            cmd (`scoreboard players reset "${id}" "DB:${DBID}"`)
        }
    }
    }
    DBPlayerlist (DBID) {
        let getDBp = worldlog.getScoreboardPlayers(`DB:${DBID}`)
        let textname = []
        let text = []
        for (let name of getDBp) {
            textname.push(name.split(':')[0].replace(" text", ''))
            text.push(name.split(':')[1])
        }
        return {"textname": textname, 'text': text}
    }
    getDBPlayerScoreData (DBplayerName, DBID) {
        let allp = worldDB.DBPlayerlist(DBID)
        for (let i in allp) {
        if (allp['textname'][i].startsWith(DBplayerName)) {
            var Dbtextname = allp['textname'][i]
            var DBTEXT = allp['text'][i]
        }
        }
        // this.adds = wd
        return {"DBTEXTNAME": Dbtextname, "DBTEXT": DBTEXT}
    }
}


class worldlogs {
    constructor () {
        let playerdata = []
        let playername = []
        for (let player of world.getPlayers()) {
            playerdata.push(player)
            playername.push(player.name)
        }
        /**
         * @type {{Data: mc.Player, Name: string}}
         * @回傳
         * 物件 {}
         * @內容
         * Data: PlayerClass (mc.Player) 
         * 
         * Name: 玩家名稱 (mc.Player.name)
         * 
         * @提醒 這個資料可能會有錯誤!
         */
        this.getPlayers = {"Data": playerdata, "Name": playername}
        // 取得玩家


        let entitydata = []
        let entitynameTag = []
        let entityid = []
        for (let entity of world.getDimension("overworld").getEntities()) {
            entitydata.push(entity)
            let nametag
            if (!entity.nameTag) {
                 nametag = '無'
            } else {nametag = entity.nameTag}
            entitynameTag.push(nametag)
            entityid.push(entity.id)
        }
        /**
         * @type {{Data: mc.Entity | mc.Player, nameTag: string, ID: string}}
         * @回傳
         * 物件 {}
         * @內容
         * Data: EntityClass (mc.Entity)
         * 
         * nameTag: 生物名 (若沒有取名就沒有)
         * 
         * id: 生物ID (例如:羊 = minecraft:sheep)
         * 
         * @提醒 這個資料可能會有錯誤!
         */
        this.getEntity = {"Data": entitydata, "nameTag": entitynameTag, "id": entityid}
        // 取得生物

        let scoresname = []
        let scoresid = []
        let obj = []
        for (let scoreobj of world.scoreboard.getObjectives()) {
            obj.push(scoreobj)
            scoresname.push(scoreobj.displayName)
            scoresid.push(scoreobj.id)
        }
        /**
         * @type {{obj: mc.ScoreboardObjective[], displayName: string[], id: string[]}}
         * @回傳
         * 物件 {}
         * @內容
         * obj: ScoreboardObjective 
         * 
         * displayName: 記分板"顯示"名稱
         * 
         * id: 記分板名稱
         * 
         * @提醒 這個資料可能會有錯誤!
         */
        this.getScoreobjs = {"obj": obj, "displayName": scoresname, "id": scoresid}
        // 取得記分板
        let onlineplayer = []
        for (let pl of world.getPlayers()) {
            onlineplayer.push(pl.name)
        }
        /**
         * @type {number}
         * @回傳
         * 數字 number
         * @內容
         * 當前玩家人數
         * @提醒 這個資料可能會有錯誤!
         */
        this.getOnlinePlayer = onlineplayer.length
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
        let disname = []
        let score = []
        let type = [] 
        let getentity = []
        for (let player of playerobj) {
            disname.push(player.displayName)
            score.push(this.getScoreFromMinecraft(player.displayName, scoreboardID).score)
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
    
}
/**
 * 方便好用的Class - 取得Minecraft各種資料 | 擁有中文註解
 * 
 * By:Cat1238756
 */
const worldlog = new worldlogs()
/**
 * 記分板資料庫 | 未翻譯
 * 
 * By:Cat1238756
 */
const worldDB = new worldDBs()
export { isNum, randomInt, getScore, worldlog, worldDB, getRandomIntInclusive }