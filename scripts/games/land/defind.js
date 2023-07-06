import { convertBoolean } from "../../lib/GametestFunctions"
import { isNum, worldlog } from "../../lib/function"
import * as mc from '@minecraft/server'

export class Land {
    /**
     * 
     * @param {string} name 領地名稱
     * @param {import("./index").InLand_Position} pos 領地座標
     * @param {number} UID 領地ID
     * @param {string | false} player 領地擁有者 
     * @param {import("./index").InLand_landPermission} permission 領地公共權限
     * @param {false | import("./index").InLand_landUser[]} users 領地私人權限 (若是公共領地請填 false)
     * @param {boolean} Public 是否為公共領地
     * @param {boolean} old 領地是否為舊版或是否有錯誤
     */
    constructor (name, pos, UID, player, permission, users, Public, old) {
        this.name = name
        this.pos = pos
        this.UID = UID
        this.player = player
        this.permission = permission
        this.users = users
        this.Public = Public
        this.old = old
    }
    /**
     * 
     * @returns 領地在計分板上顯示的內容
     */
    transfromLand() {
        let name = this.name;
        let pos = this.pos.x[1] + "|" + this.pos.z[1] + "/" + this.pos.x[2] + "|" + this.pos.z[2]
        let UID = this.UID;
        let player = this.player
        if (this.Public) {
            player = 'true'
        }
        let permission = ''
        for (let i in this.permission) {
            permission += this.permission[i] + "|"
        }
        permission = permission.slice(0, -1) // 移除最後一個 |
        if (!this.Public) {
            let userList = []
            if (this.users) {
                let users = this.users
                for (let user of users) {
                    let name = user.username
                    let per = user.permission
                    let displayPer = ''
                    for (let i in per) {
                        displayPer += per[i] + "|"
                    }
                    displayPer = displayPer.slice(0, -1) // 移除最後一個 |
                    userList.push(`${name}:${displayPer}`)
                }
            }
            return `${name}_,_${pos}_,_${UID}_,_${player}_,_${permission}_,_${userList.join(":/:")}`
        }
        return `${name}_,_${pos}_,_${UID}_,_true_,_${permission}`
    }
}

/**
 * 
 * @param {number} x1 
 * @param {number} x2 
 * @param {number} z1 
 * @param {number} z2 
 * @returns {import("./index").InLand_Position}
 */
export function newLandPosition (x1, x2, z1, z2) {
    return {
        x: {
            1: x1,
            2: x2
        },
        z: {
            1: z1,
            2: z2
        }
    }
}

/**
 * 
 * @param {string} build 
 * @param {string} container 
 * @param {string} portal 
 * @param {string} fly 
 * @param {string} tnt 
 * @returns {import("./index").landPermission}
 */
export function newLandPermission (build, container, portal, fly, tnt) {
    return {
        build,
        container,
        portal,
        fly,
        tnt
    }
}

/**
 * 
 * @param {string} userName 
 * @param {boolean} build 
 * @param {boolean} container 
 * @param {boolean} portal 
 * @param {boolean} fly 
 * @returns {import("./index").InLand_landUser}
 */
export function newLandUser (userName, build, container, portal, fly) {
    return {
        username: userName,
        permission: {
            build,
            container,
            portal,
            fly
        }
    }
}

/**
 * 
 * @param {string} land 
 */
export function getLandData(land) {
    let args = land.split("_,_")

    let postion = args[1].split("/")
    let x = postion[0].split("|")[0]
    let x2 = postion[1].split("|")[0]
    let z = postion[0].split("|")[1]
    let z2 = postion[1].split("|")[1]
    let permissions = args[4].split("|")

    // 處理私人權限
    /**
    * @type {import("./index").InLand_landUser}
    */
    let usersList = []
    let old = false
    if (args[3] != 'true') {
        let users = args[5].split(":/:")
        for (let user of users) {
            let username = user.split(":")[0]
            let per = user.split(":")[1].split("|")
            let fly = per[3]
            if (fly == 'undefined' || !fly) {
                fly = 'false'
                old = true
            }
            let userPermissions = {
                build: convertBoolean(per[0]),
                container: convertBoolean(per[1]),
                portal: convertBoolean(per[2]),
                fly: convertBoolean(fly),
            }
            usersList.push({ username: username, permission: userPermissions })
        }
    }

    // 處理公共權限
    let fly = permissions[3]
    let tnt = permissions[4]
    if (fly == 'undefined' || !fly) {
        fly = 'false'
        old = true
    }
    if (tnt == 'undefined' || !tnt) {
        tnt = 'false'
        old = true
    }
    let position = {
        x: {
            1: Number(x),
            2: Number(x2)
        },
        z: {
            1: Number(z),
            2: Number(z2)
        }
    }
    let permission = {
        build: convertBoolean(permissions[0]),
        container: convertBoolean(permissions[1]),
        portal: convertBoolean(permissions[2]),
        fly: convertBoolean(fly),
        tnt: convertBoolean(tnt)
    }
    
    const landName = args[0]
    const UID = Number(args[2]), player = args[3]
    if (args[3] != "true") {
        return new Land(landName, position, UID, args[3], permission, usersList, false, old)
    } else {
        return new Land(landName, position, UID, false, permission, false, true, old)
    }
}

/**
 * 取得玩家所擁有的領地
 * @param {mc.Player} player 玩家
 * @param {import("./index").landDimension} dimension 維度
 */
export function getPlayerLands(player, dimension) {
    let lands = worldlog.getScoreboardPlayers("lands").disname
    if (dimension == 'nether') {
        lands = worldlog.getScoreboardPlayers("lands_nether").disname
    }
    if (dimension == 'end') {
        lands = worldlog.getScoreboardPlayers('lands_end').disname
    }
    let playerLand = []
    for (let land of lands) {
        let landDT = getLandData(land)
        if (landDT.player == player.name) {
            playerLand.push(landDT)
        }
    }
    return playerLand
}

/**
 * 取得公共領地
 * @param {import("./index").landDimension} dime
 */
export function getAdminLands(dime) {
    let landID = 'lands'
    if (dime == 'nether') {
        landID += "_nether"
    }
    if (dime == 'end') {
        landID += "_end"
    }
    let lands = worldlog.getScoreboardPlayers(landID).disname
    let playerLand = []
    for (let land of lands) {
        let landDT = getLandData(land)
        if (!landDT.player) {
            playerLand.push(landDT)
        }
    }
    return playerLand
}



// landCreate 

export class LandCreate {
    /**
     * 
     * @param {import("./index").landDimension} dime 領地維度
     * @param {number} at 開始時間 (請使用 Date.getTime()) 
     * @param {string} name 領地名稱 
     * @param {number} step 建造步驟
     * @param {boolean} admin 是否為公共領地
     */
    constructor (dime, at, name, step, admin) {
        this.dime = dime
        this.at = at
        this.name = name
        this.step = step
        this.admin = admin
    }
    /**
     * 
     * @returns {LandCreateJSON}
     */
    toJSON () {
        let json = {
            "landCreate": {
                "dime": this.dime,
                "at": this.at,
                "name": this.name,
                "step": this.step,
                "admin": this.admin
            }
        }
        return json
    }
}

/**
 * 
 * @param {string} tag 
 * @deprecated 已暫停使用
 */
function getLandCreateDataFromTag (tag) {
    let data = JSON.parse(tag)
    let data2 = data.landCreate
    return new LandCreate(data2.dime, data2.at, data2.name, data2.step, data2.admin)
}
// "landCreate": {
//     "dime": setDime,
//     "at": new Date().getTime(),
//     "name": name,
//     "step": 1,
//     "admin": false
// }