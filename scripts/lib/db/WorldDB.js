/// <reference path="../../games/titleraw/index.d.ts" />
/// <reference path="defindDB.d.ts" />

import * as mc from "@minecraft/server"
import { isNum, worldlog } from "../function.js";
import { defaultValue } from "../../config.js";
import { cmd_async, getSearchTextLength } from "../GametestFunctions.js";

function cmd(command) {
    return mc.world.getDimension("overworld").runCommand(command)
}

function cmd_async(command) {
    return mc.world.getDimension("overworld").runCommandAsync(command)
}

function log(message) {
    mc.world.sendMessage(message)
}


// 記分板項目基本儲存型式: table|||key:::內容
// 記分板項目物件(Object)儲存型式: table|||key:::{ObjKey1: ObjValue1, ObjKey2: ObjValue2...}
// 記分板項目陣列(Array)儲存型式: table|||key:::[value1 , value2 , value3...]
export const functions = {
    /**
     * 取得Table的所有內容
     * @param {string} dbName 
     * @param {string} tableName
     */
    getTableData(dbName, tableName) {
        try {
            const allData = mc.world.scoreboard.getObjective(dbName).getParticipants();

            let tableData = []
            for (let data of allData) {
                const name = data.displayName, table = name.split("|||")[0], key = name.split("|||")[1].split(":::")[0], value = name.split(":::")[1];
                const score = mc.world.scoreboard.getObjective(dbName).getScore(data)

                if (table != tableName) continue;
                tableData.push({
                    key,
                    value,
                    score
                })
            }

            return tableData.length > 0 ? tableData : null
        } catch {
            return null
        }
    },


    /**
     * 嘗試將記分板值(字串)轉變為陣列/物件
     * 此處我利用ChatGPT進行初步構建，只能說真的好用XD~
     * @param {string} str
     */
    getNewType(str) {
        const stack = [];
        const result = [];

        let currentItem = result;
        let currentProp = null;
        let currentValue = "";

        function convertValue(value) {
            if (!isNaN(value)) {
                return Number(value);
            } else if (value == "true") {
                return true
            } else if (value == "false") {
                return false
            } else {
                return value;
            }
        }

        function convertString(value) {
            if (value.startsWith("{") && value.endsWith("}")) {
                return value;
            }
            return JSON.stringify(value).replace(/"/g, '\\"');
        }

        for (let i = 0; i < str.length; i++) {
            const char = str[i];

            if (char === "[") {
                const newArray = [];
                if (currentItem !== null) {
                    if (currentProp !== null) {
                        currentItem[currentProp] = newArray;
                        currentProp = null;
                    } else {
                        currentItem.push(newArray);
                    }
                }
                stack.push([currentItem, currentProp]);
                currentItem = newArray;
            } else if (char === "{") {
                const newObject = {};
                if (currentItem !== null) {
                    if (currentProp !== null) {
                        currentItem[currentProp] = newObject;
                        currentProp = null;
                    } else {
                        currentItem.push(newObject);
                    }
                }
                stack.push([currentItem, currentProp]);
                currentItem = newObject;
            } else if (char === "]" || char === "}") {
                if (currentValue.trim().length > 0) {
                    if (currentItem !== null) {
                        if (currentProp !== null) {
                            currentItem[currentProp] = convertValue(currentValue.trim());
                            currentProp = null;
                        } else {
                            currentItem.push(convertValue(currentValue.trim()));
                        }
                    }
                    currentValue = "";
                }

                const [parentItem, parentProp] = stack.pop();
                currentItem = parentItem;
                currentProp = parentProp;
            } else if (char === ",") {
                if (currentValue.trim().length > 0) {
                    if (currentItem !== null) {
                        if (currentProp !== null) {
                            currentItem[currentProp] = convertValue(currentValue.trim());
                            currentProp = null;
                        } else {
                            currentItem.push(convertValue(currentValue.trim()));
                        }
                    }
                    currentValue = "";
                }
            } else if (char === ":") {
                if (currentValue.trim().length > 0 && currentProp === null) {
                    currentProp = currentValue.trim();
                    currentValue = "";
                } else {
                    currentValue += char;
                }
            } else {
                currentValue += char;
            }
        }

        if (currentValue.trim().length > 0) {
            if (currentItem !== null) {
                if (currentProp !== null) {
                    currentItem[currentProp] = convertValue(currentValue.trim());
                    currentProp = null;
                } else {
                    currentItem.push(convertValue(currentValue.trim()));
                }
            }
        }

        return result[0];
    },





    /**
     * 嘗試將物件轉變為字串
     * @param {{}} obj
     * @returns {false | string} `false` 代表無法轉換，可能是內容不為物件
     */
    objectToString(obj) {
        try {
        if (typeof obj != "object") return false;

        let last = "{"

        let keyLength = Object.keys(obj).length

        let now = 0
        for (let key in obj) {
            now++

            // 是否為物件、陣列
            let value
            if (typeof obj[key] == "object" && !Array.isArray(obj[key])) {
                value = this.objectToString(obj[key])
            } else if (Array.isArray(obj[key])) {
                value = this.arrayToString(obj[key])
            } else value = obj[key];

            value = (typeof value == "string" && value.indexOf("\n") != -1) ? value.replace(/\n/g, "/n") : value
            last += `${key}: ${value}`
            if (now != keyLength) last += ", "; // 若不是最後一項key，將用", "分隔每個key
        }

        last += "}"
        return last;
    } catch (e) {log(e)}
    },

    /**
     * 嘗試將陣列轉換成字串
     * @param {any[]} value 
     */
    arrayToString(value) {
        try {
        if (!Array.isArray(value)) return false;
        if (value.length == 0) return "[]"
        let last = "["

        let length = value.length;
        let nowLength = 0;
        for (let data of value) {
            nowLength++
            let val
            // 是否為物件、陣列
            if (typeof data == "object" && !Array.isArray(data)) {
                val = this.objectToString(data)
            } else if (Array.isArray(data)) {
                val = this.arrayToString(data)
            } else val = data;

            val = (typeof val == "string" && val.indexOf("\n") != -1) ? val.replace(/\n/g, "/n") : val
            last += `${val}`
            if (nowLength != length) last += " , "; // 若不是最後一項key，將用", "分隔每個key
        }

        last += "]"
        return last
    } catch (e) {log(e)}
    }
}

/**
 * 表格資料庫系統\
 * 感謝資料庫思想提供:{@linkcode https://github.com/dada878/Bedrock-Gametest-Plugin/tree/master data878/Bedrock-Gametest-Plugin}
 */
export class WorldDB {
    /**
     * 建立一個世界資料庫
     * @param {string} name 資料庫名稱
     */
    constructor(name) {
        this.name = name;
        try { cmd_async(`scoreboard objectives add "${name}" dummy`); } catch { };
    }

    /**
     * 在資料世界庫使用一個表格
     * @param {string} tableName 表格名稱 
     * @returns 創建/取得到的表格
     */
    table(tableName) {
        return new WorldDB_Table(this.name, tableName);
    }

    /**
     * 取得資料庫所有表格名稱
     */
    getTables() {
        const allData = mc.world.scoreboard.getObjective(this.name).getParticipants();
        let tables = []
        for (let data of allData) {
            const name = data.displayName, table = name.split("|||")[0]
            if (tables.includes(table)) continue;
            tables.push(table)
        }

        return tables
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
    getData(key, debug = false) {
        key = key.toLowerCase();
        const tableData = functions.getTableData(this.dbName, this.tableName);
        if (!tableData) return null;
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

        if (value == "true" || value == "false") return { value: value == "true" ? true : false, score} // 布林值回傳
        if (isNum(value)) return { value: Number(value), score }; // 數值回傳
        value = value.replaceAll(" , ", ", ")
        if (value.startsWith("[") && value.endsWith("]")) {
            if (value.slice(1, -1).length == 0) return { value: [], score }
            /**
             * @type {any[]}
             */
            let array = functions.getNewType(value)
            // 加工 (\n)
            array = JSON.parse(JSON.stringify(array).replaceAll("/n", "\\n"))
            // log(JSON.stringify(array))
            return { value: array, score }
        } // 陣列回傳
        
        let newValue = functions.getNewType(value) ? functions.getNewType(value) : value
        // 加工 (\n)
        if (typeof newValue == "string") newValue = newValue.replaceAll("/n", "\n")
        else newValue = JSON.parse(JSON.stringify(newValue).replaceAll("/n", "\\n"))
        return { value: newValue , score }; // 字串 / 物件回傳
    }

    /**
     * 新增或修改內容
     * @param {string} key 
     * @param {string | number | {} | any[]} value
     * @param {number} score 顯示於記分板上的分數 預設`0`
     */
    setData(key, value, score = 0) {
        key = key.toLowerCase()
        value = (typeof value == "string" && value.indexOf("\n") != -1) ? value.replace(/\n/g, "/n") : value 
        if (typeof value == "object" && !Array.isArray(value)) value = functions.objectToString(value); // 判斷是否為物件類型

        // 刪除原先的內容
        let scoreboard = mc.world.scoreboard.getObjective(this.dbName);
        for (let par of scoreboard.getParticipants()) {
            let name = par.displayName;
            if (name.startsWith(`${this.tableName}|||${key}:::`)) {
                cmd(`scoreboard players reset "${name}" ${this.dbName}`)
            }
        }

        // 判斷是否為Array類型
        if (Array.isArray(value)) {
            let list = `${this.tableName}|||${key}:::`
            list += functions.arrayToString(value)
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
        key = key.toLowerCase()
        const tableData = functions.getTableData(this.dbName, this.tableName)
        const filter = tableData.filter(value => value.key == key)
        if (filter.length == 0) return false;

        const value = filter[0].value;
        mc.system.runTimeout(() => {
            const list = `${this.tableName}|||${key}:::${value}`;
            cmd(`scoreboard players reset "${list}" ${this.dbName}`)
        }, 1)
        return true;
    }

    /**
     * 取得所有鑰匙
     */
    getKeys() {
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
    getAll() {
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