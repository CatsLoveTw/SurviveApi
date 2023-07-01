/**
 * 感謝資料庫思想提供:{@linkcode https://github.com/dada878/Bedrock-Gametest-Plugin/tree/master data878/Bedrock-Gametest-Plugin}
*/

/// <reference path="../../games/titleraw/index.d.ts" />
/// <reference path="defindDB.d.ts" />

import * as mc from "@minecraft/server"
import { cmd, log } from "../GametestFunctions.js"
import { isNum, worldlog } from "../function.js";
import { defaultValue } from "../../config.js";


// 記分板項目基本儲存型式: table|||key:::內容
// 記分板項目物件(Object)儲存型式: table|||key:::{ObjKey1: ObjValue1, ObjKey2: ObjValue2...}
// 記分板項目陣列(Array)儲存型式: table|||key:::[value1 , value2 , value3...]
const functions = {
    /**
     * 取得Table的所有內容
     * @param {string} dbName 
     * @param {string} tableName
     */
    getTableData (dbName, tableName) {
        const allData = mc.world.scoreboard.getObjective(dbName).getParticipants();

        let tableData = []
        for (let data of allData) {
            const name = data.displayName, table = name.split("|||")[0], key = name.split("|||")[1].split(":::")[0], value = name.split(":::")[1];
            const score = data.getScore(mc.world.scoreboard.getObjective(dbName));

            if (table != tableName) continue;
            tableData.push({
                key,
                value,
                score
            })
        }

        return tableData.length > 0 ? tableData : null
    },

    /**
     * 嘗試將值(字串)轉變為物件
     * @param {string} value 
     * @returns {false | {}} `false` 代表無法轉換，可能是字串內容不為物件
     */
    getObject(value) {
        if (!(value.startsWith("{") && value.endsWith("}"))) return false;

        let data = value.slice(1, -1).split(", ") // 將前後 {} 刪除，並區分每個key和value

        let last = {}
        for (let d of data) {
            const key = d.split(": ")[0], val = d.split(": ")[1]; // 區分key和value

            /**
             * 確認value是否為Object內容
             */
            let changeValue = typeof this.getObject(val) === "object" ? this.getObject(val) : val;
            if (isNum(changeValue)) changeValue = Number(changeValue); // 確認value是否為數值
            last[key] = changeValue;
        }

        return last;
    },

    /**
     * 嘗試將物件轉變為字串
     * @param {{}} obj
     * @returns {false | string} `false` 代表無法轉換，可能是內容不為物件
     */
    objectToString(obj) {
        if (typeof obj != "object") return false;

        let last = "{"
        
        let keyLength = Object.keys(obj).length

        let now = 0
        for (let key in obj) {
            now++
            
            let value = typeof obj[key] == "object" ? this.objectToString(obj[key]) : obj[key]; // 確認value是否為物件，並將此轉換為字串
            last += `${key}: ${value}`
            if (now != keyLength) last += ", "; // 若不是最後一項key，將用", "分隔每個key
        }

        last += "}"
        return last;
    }
}

/**
 * 表格資料庫系統
 */
export class WorldDB {
    /**
     * 建立一個世界資料庫
     * @param {string} name 資料庫名稱
     */
    constructor(name) {
        this.name = name;
        try { cmd(`scoreboard objectives add "${name}" dummy`); } catch (e) {};
    }

    /**
     * 在資料世界庫使用一個表格
     * @param {string} tableName 表格名稱 
     * @returns 創建/取得到的表格
     */
    table(tableName) {
        return new WorldDB_Table(this.name, tableName);
    }
}

/**
 * 世界資料庫表格
 */
export class WorldDB_Table {
    constructor(dbName, tableName) {
        this.dbName = dbName;
        this.tableName = tableName;
    }

    /**
     * 取得內容
     * @param {string} key
     * @returns {null | {value: string | number | {} | Array, score: number}} `null` 代表查無此key
     */
    getData (key) {
        key = key.toLowerCase();
        const tableData = functions.getTableData(this.dbName, this.tableName);

        let filter = tableData.filter(value => value.key == key)
        if (filter.length == 0) {
            for (const value of defaultValue) {
                if (value.dbName != this.dbName) continue;
                for (const def of value.values) {
                    if (def.tableName && def.tableName != this.tableName) continue;
                    if (def.key != key) continue;

                    const score = def.score ? def.score : 0;

                    this.setData(key, def.value, score)
                    return { value: def.value, score }
                }
            } // 確認預設
            return null;
        } // 確認是否存在此內容
        let value = filter[0].value;
        const score = filter[0].score;
        
        if (isNum(value)) return {value: Number(value), score}; // 數值回傳

        if (value.startsWith("[") && value.endsWith("]")) {
            if (value.slice(1, -1).length == 0) return {value: [], score}
            let arrayValues = value.slice(1, -1).split(" , ")
            let last = []
            for (let val of arrayValues) {
                let newValue = functions.getObject(val) ? functions.getObject(val) : val
                if (isNum(val)) newValue = Number(val); // 確認內容是否為數值
                last.push(newValue)
            }
            return {value: last, score}
        } // 陣列回傳
        return {value: functions.getObject(value) ? functions.getObject(value) : value, score}; // 字串 / 物件回傳
    }

    /**
     * 新增或修改內容
     * @param {string} key 
     * @param {string | number | {} | any[]} value
     * @param {number} score 顯示於記分板上的分數 預設`0`
     */
    setData (key, value, score = 0) {
        key = key.toLowerCase()
        if (typeof value == "object" && !Array.isArray(value)) value = functions.objectToString(value); // 判斷是否為物件類型
        
        // 刪除原先的內容
        let scoreboard = mc.world.scoreboard.getObjective(this.dbName);
        for (let par of scoreboard.getParticipants()) {
            let name = par.displayName;
            if (name.startsWith(`${this.tableName}|||${key}:::`)) {
                par.removeFromObjective(scoreboard)
            }
        }
        
        // 判斷是否為Array類型
        if (Array.isArray(value)) {
            let list = `${this.tableName}|||${key}:::[`
            let runLen = 0
            if (value.length > 0) {
                for (let val of value) {
                    runLen++
                    if (typeof val == "object") val = functions.objectToString(val);
                    list += val;
                    if (runLen != value.length) list += " , "
                }
            }
            list += "]"
            cmd(`scoreboard players set "${list}" ${this.dbName} ${score}`)
        } else {
            const list = `${this.tableName}|||${key}:::${value}`;
            cmd(`scoreboard players set "${list}" ${this.dbName} ${score}`);
        }
    }

    /**
     * 刪除內容
     * @param {string} key
     * @returns 是否有內容可刪除
     */
    removeData(key) {
        const tableData = functions.getTableData(this.dbName, this.tableName)
        const filter = tableData.filter(value => value.key == key)
        if (filter.length == 0) return false;
        
        const value = filter[0].value;
        const list = `${this.tableName}|||${key}:::${value}`;
        cmd(`scoreboard players reset "${list}" ${this.dbName}`)
        return true;
    }

    /**
     * 取得所有鑰匙
     */
    getKeys () {
        const tableData = functions.getTableData(this.dbName, this.tableName)

        let last = []
        for (let data of tableData) {
            last.push(data.key)
        }
        return last;
    }

    /**
     * 取得所有內容
     * @returns {{value: string | number | {}, score: number}[]}
     */
    getAll () {
        const keys = this.getKeys();

        let last = []
        for (let key of keys) {
            last.push(this.getData(key))
        }

        return last
    }
}





// 利用JSDOC定義特殊Table

/**
 * 玩家資料庫
 */
export class playerWorldDB extends WorldDB {

    /**
     * 在資料世界庫使用一個表格
     * @param {string} tableName 表格名稱 
     * @returns { import("./defindDB.js").playerWorldDB_Table } 創建/取得到的表格
     */
    table(tableName) {
        return new WorldDB_Table(this.name, tableName);
    }
}