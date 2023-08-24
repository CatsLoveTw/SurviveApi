import * as mc from "@minecraft/server";
import { playerDB } from "../config";
import { isNum } from "./function";

const cmd = function(command) {
    return mc.world.getDimension("overworld").runCommand(command)
};

/**
 * 異步執行
 * @param {string} command 
 * @returns 
 */
export const cmd_async = function(command) {
    return mc.world.getDimension("overworld").runCommandAsync(command)
}

const cmd_Dimension = (command, dimension) => {
    return mc.world.getDimension(dimension).runCommand(command)
}
  
/**
 * 傳送一則訊息給玩家
 * @param {Minecraft.Player | string} player 玩家
 * @param {string} message 訊息
 */
export function logfor(player, message) {
    try {
        mc.system.runTimeout(() => {
            if (typeof player != typeof "string") {
                player = player.name;
            }
            let okay_message = message.toString().replaceAll('\"', "''").replaceAll('\\', "/")
            if (player.includes("@")) {
                mc.world.getDimension("overworld").runCommandAsync(`tellraw ${player} {"rawtext":[{"text":"${okay_message}"}]}`)
            } else {
                mc.world.getDimension("overworld").runCommandAsync(`tellraw "${player}" {"rawtext":[{"text":"${okay_message}"}]}`)
            }
        }, 2)
    } catch { }
};

const titlefor = function(playername,message) {
    let okay_message = message
    mc.world.getDimension("overworld").runCommandAsync(`titleraw "${playername}" actionbar {"rawtext":[{"text":"${okay_message}"}]}`)
}

const titlelog = function(message) {
    let okay_message = message
    mc.world.getDimension("overworld").runCommandAsync(`titleraw @a actionbar {"rawtext":[{"text":"${okay_message}"}]}`)
}

const log = function(message) {
    let okay_message = message.toString().replace('\"',"''").replace('\\',"/")
    mc.world.sendMessage(okay_message)
}

/**
 * 強制踢出玩家
 * @param {mc.Player} player 
 */
export function kickPlayer2(player) {
    player.triggerEvent("kick");
}

/**
 * 踢出玩家
 * @param {mc.Player} player 
 */
 export function kickPlayer(player) {
    cmd(`kick ${player.name}`);
}

/**
 * 新增動態Actionbar
 * @param {string} message 
 * @param {mc.Player} player 
 * @param {number} tick 
 */
const addSign = function(message, player, tick, nowTick = 0, debug = false) {
    message = transformToString(message)
    let db = playerDB.table(player.id);
    let allMessage = db.getData('dynamic_message')
    if (!allMessage || allMessage.value.length == 0) return db.setData("dynamic_message", [{ news: message, tick: nowTick, maxtick: tick }], 0)
    if (allMessage.value.length > 0) {
        allMessage.value.push({ news: message, tick: nowTick, maxtick: tick })
        db.setData("dynamic_message", allMessage.value, allMessage.score)
    }
}

/**
 * 刪除動態Actionbar
 * @param {string} deleteMessage 
 * @param {mc.Player} player 
 * @param {boolean | null} includes 預設為`true`
 * @returns 是否成功刪除
 */
const removeSign = function(deleteMessage, player, includes = true) {
    let db = playerDB.table(player.id);

    let allMessage = db.getData("dynamic_message")

    if (!allMessage) return false;

    let isDeleted = false
    for (let mess of allMessage.value) {
        const news = transformToString(mess.news)
        if (!includes) {
            if (news == deleteMessage) {
                allMessage.value.splice(allMessage.value.indexOf(mess), 1)
                db.setData("dynamic_message", allMessage.value, 0)
                isDeleted = true
            }
        } else {
            if (news.includes(deleteMessage)) {
                allMessage.value.splice(allMessage.value.indexOf(mess), 1)
                db.setData("dynamic_message", allMessage.value, 0)
                isDeleted = true
            }
        }
    }
    if (isDeleted) return true
    
    return false
}

/**
 * 取得動態Actionbar
 * @param {mc.Player} player 
 */
const getSign = function(player) {
    let db = playerDB.table(player.id)
    return db.getData("dynamic_message")
}

/**
 * 確認數字是否有小數點
 * @param {number} number 
 * @returns 
 */
export const checkPoint = (number) => {
    if (number.toString().indexOf('.') != -1) return true
    return false
}

/**
 * 
 * @param {string} text 
 * @returns 
 */
export function deleteColor(text) {
    var returnText = text
    returnText = returnText.replace(/§./g, "")
    return returnText
}

/**
 * 
 * @param {string} text 
 * @param {string} searchText 
 */
export function getSearchTextLength (text, searchText) {
    let t = text
    let len = 0
    while (true) {
        if (t.indexOf(searchText) != -1) {
            len++
            t = t.replace(searchText, "")
        } else {
            break;
        }
    }
    return len
}

/**
 * 將數值、布林值轉為字串
 * @param {string | number | boolean} value 
 * @returns 
 */
export function transformToString (value) {
    return typeof value == "string" ? value : String(value);
}

/**
 * 將字串轉為布林值
 * @param {string} boolean 
 * @returns 
 */
export function convertBoolean (boolean) {
    return boolean == "true" ? true : false
}

export {cmd, cmd_Dimension, log, titlefor, titlelog, addSign, removeSign, getSign}