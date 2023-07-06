import * as mc from '@minecraft/server'
import * as ui from '@minecraft/server-ui'
import { worldlog } from '../../lib/function.js'
import { log, cmd, logfor, cmd_Dimension, getSign, removeSign, addSign, cmd_async } from '../../lib/GametestFunctions.js'
import { checkInLand, checkInLand_Pos, checkNearLand_Pos } from './build.js'
import { Land, LandCreate, getLandData, newLandPermission, newLandPosition, newLandUser } from './defind.js'
import { playerDB } from '../../config.js'
export const times = 180 // 設定過期時間 (秒)

/**
 * 
 * @param {mc.Player} player 
 */
export function getAdmin(player) {
    let getPermission = worldlog.getScoreFromMinecraft(player.name, 'permission')
    if (!getPermission || getPermission.score == 1 || !player.hasTag('admin')) {
        return false
    }
    return true
}

/**
* 
* @param {mc.Player} player 
*/
export function removefly (player) {
    player.runCommandAsync('ability @s mayfly false')
    let y = 0
    for (let i=-64; i < player.location.y; i++) {
        try {
            let x = Math.trunc(player.location.x)
            let z = Math.trunc(player.location.z)
            let block = mc.world.getDimension(player.dimension.id).getBlock({x: x, y: i, z: z})
            if (!block) return;
            if (block.typeId != 'minecraft:air') {
                y = i
            }
        } catch (e) {}
    }
    let playerY = Math.trunc(player.location.y)
    if (Math.abs(playerY - y) > 3) {
        player.runCommandAsync(`tp @s ~ ${y+1} ~`)
        player.runCommandAsync(`effect @s resistance 1 255 true`)
    }
}

export function build() {
    /**
     * 
     * @param {mc.Player} player 
     */
    function addfly (player) {
        player.runCommandAsync('ability @s mayfly true')
    }

    // 偵測是否建造過久 / 玩家在其他維度建造領地之偵測
    mc.system.runInterval(() => {
        let players = worldlog.getPlayers();
        for (let player of players) {
            let getTimes = new Date().getTime(); // unixTime 毫秒
            const db = playerDB.table(player.id)

            const LandCreating = db.getData("landCreating")
            if (LandCreating && typeof LandCreating.value == "object") {
                // 偵測過期時間 (3分鐘)
                if ((getTimes - LandCreating.value.landCreate.at) >= (times * 1000)) {
                    db.removeData("landCreating")
                    logfor(player.name, `§c§l>> §e您建造領地 §b${LandCreating.value.landCreate.name} §e已經超過 §g${times / 60}分鐘 §e系統已經自動刪除該計畫。`)
                }
            }
        }
    }, 1)

    // 建造偵測
    mc.world.afterEvents.blockPlace.subscribe(events => {
        const player = events.player, db = playerDB.table(player.id)
        let blockPos = events.block.location

        
        let checkExist = db.getData("landCreating")
        if (!checkExist || !checkExist.value.landCreate) return;
        /**
         * Step起始為1
         */
        let json = db.getData("landCreating").value
        if (json.landCreate.dime == 'overworld') {
            cmd_async(`setblock ${blockPos.x} ${blockPos.y} ${blockPos.z} air`)
        } else if (json.landCreate.dime == 'nether') {
            mc.world.getDimension(mc.MinecraftDimensionTypes.nether).runCommandAsync(`setblock ${blockPos.x} ${blockPos.y} ${blockPos.z} air`)
        } else if (json.landCreate.dime == 'end') {
            mc.world.getDimension(mc.MinecraftDimensionTypes.theEnd).runCommandAsync(`setblock ${blockPos.x} ${blockPos.y} ${blockPos.z} air`)
        }


        /**
         * @type {mc.EntityInventoryComponent}
         */
        let getINV = player.getComponent("inventory")
        let slot = getINV.container.getSlot(player.selectedSlot)
        // 該變數紀錄物品被放置之前的數據，因此不用調整
        let item = slot.getItem()
        // 測試後發現同時間設定物品會發生問題
        mc.system.runTimeout(() => {
            slot.setItem(item)
        }, 2)
        // 恢復物品

        if (Number(json.landCreate.step) == 1) {
            logfor(player.name, `§a§l>> §e成功設置第一點! §f(§bx§f:§b${blockPos.x} §7| §bz§f:§b${blockPos.z}§f)`)
            db.removeData("landCreating")
            let Json = {
                "landCreate": {
                    "dime": json.landCreate.dime,
                    "at": json.landCreate.at,
                    "name": json.landCreate.name,
                    "step": 2,
                    "pos": {
                        x: blockPos.x,
                        z: blockPos.z,
                    },
                    "pos2": {
                        x: false,
                        z: false
                    },
                    "admin": json.landCreate.admin
                }
            }

            return db.setData("landCreating", Json, 0)
        }

        if (Number(json.landCreate.step == 2)) {
            // button1: 1 button2: 0
            let squ = (Math.abs(json.landCreate.pos.x - blockPos.x) + 1) * (Math.abs(json.landCreate.pos.z - blockPos.z) + 1)
            if (!json.landCreate.admin) {
                let check1 = (squ + worldlog.getScoreFromMinecraft(player.name, "land_squ").score) > worldlog.getScoreFromMinecraft(player.name, "land_squ_max").score || (worldlog.getScoreFromMinecraft(player.name, 'land_land').score + 1) > worldlog.getScoreFromMinecraft(player.name, 'land_land_max').score
                if (check1 || squ > 20000) {
                    // 刪除領地建造中紀錄
                    db.removeData("landCreating")
                    // 刪除訊息
                    let msg = `§e§l領地系統 §f> §a您正在建造領地 §7-`
                    removeSign(msg, player)
                    // 返回錯誤訊息
                    if (squ > 20000) return logfor(player.name, `§c§l>> §e因系統限制，領地大小不得大於 §b20000 §e格!`)
                    return logfor(player.name, `§c§l>> §e創建失敗! 領地格數超過上限!`)
                }
            }
            let allLand = worldlog.getScoreboardPlayers("lands").disname
            if (json.landCreate.dime == 'nether') {
                allLand = worldlog.getScoreboardPlayers('lands_nether').disname
            }
            if (json.landCreate.dime == 'end') {
                allLand = worldlog.getScoreboardPlayers('lands_end').disname
            }
            try {
                if (allLand.length > 0) {
                    for (let landD of allLand) {
                        let land = getLandData(landD)
                        let x = json.landCreate.pos.x
                        let x2 = blockPos.x
                        let z = json.landCreate.pos.z
                        let z2 = blockPos.z
                        for (let i = Math.min(Number(x), Number(x2)); i <= Math.max(Number(x), Number(x2)); i++) {
                            for (let j = Math.min(Number(z), Number(z2)); j <= Math.max(Number(z), Number(z2)); j++) {
                                let landX = Math.min(Number(land.pos.x[1]), Number(land.pos.x[2]))
                                let landX2 = Math.max(Number(land.pos.x[1]), Number(land.pos.x[2]))
                                let landZ = Math.min(Number(land.pos.z[1]), Number(land.pos.z[2]))
                                let landZ2 = Math.max(Number(land.pos.z[1]), Number(land.pos.z[2]))
                                if ((i >= landX && i <= landX2) && (j >= landZ && j <= landZ2)) {
                                    db.removeData("landCreating")
                                    let msg = `§e§l領地系統 §f> §a您正在建造領地 §7-`
                                    removeSign(msg, player)
                                    return logfor(player.name, `§c§l>> §e領地重疊!`)
                                }
                            }
                        }
                    }
                }
            } catch (e) { log("land(280)" + e) }
            let UI = new ui.MessageFormData()
                .title("§e§l領地建造確認")
            if (json.landCreate.admin) {
                UI.body(`§e§l您成功設定了§b公共§e領地! 最後一步，確認領地訊息是否正確\n§e領地資料為 §f-\n§e領地名稱 §f- §e${json.landCreate.name}\n§e領地範圍 §f- §e${squ} 格 \n§ex§f:§e ${Math.min(json.landCreate.pos.x, blockPos.x)}§f-§e${Math.max(json.landCreate.pos.x, blockPos.x)}\n§ey§f: §e全部\n§ez§f: §e${Math.min(json.landCreate.pos.x, blockPos.x)}§f-§e${Math.max(json.landCreate.pos.x, blockPos.x)}`)
            } else {
                UI.body(`§e§l您成功設定了領地! 最後一步，確認領地訊息是否正確\n§e領地資料為 §f-\n§e領地名稱 §f- §e${json.landCreate.name}\n§e領地範圍 §f- §e${squ} 格 \n§ex§f:§e ${Math.min(json.landCreate.pos.x, blockPos.x)}§f-§e${Math.max(json.landCreate.pos.x, blockPos.x)}\n§ey§f: §e全部\n§ez§f: §e${Math.min(json.landCreate.pos.x, blockPos.x)}§f-§e${Math.max(json.landCreate.pos.x, blockPos.x)}`)
            }
            UI.button2("§a§l創建")
            UI.button1("§c§l取消")
                .show(player).then(res => {
                    if (!res || res.selection === 0 || res.canceled) {
                        db.removeData("landCreating")
                        let msg = `§e§l領地系統 §f> §a您正在建造領地 §7-`
                        removeSign(msg, player)
                        return logfor(player.name, `§c§l>> §e取消成功!`)
                    }
                    if (res.selection == 1) {
                        let land = json.landCreate
                        // name_,_posx|posz/posx2|posz2_,_ID_,_player_,_build|container|action_,_players:build|container|portal|fly:/:
                        let ID = 1
                        let landData = ''
                        let IDs = worldlog.getScoreboardPlayers("lands").score
                        if (json.landCreate.dime == 'nether') {
                            IDs = worldlog.getScoreboardPlayers('lands_nether').score
                        }
                        if (json.landCreate.dime == 'end') {
                            IDs = worldlog.getScoreboardPlayers('lands_end').score
                        }
                        if (IDs.length > 0) {
                            let max = IDs[0]
                            IDs.forEach(item => max = item > max ? item : max)
                            ID = max + 1
                        }
                        let landPosition = newLandPosition(Number(land.pos.x), blockPos.x, Number(land.pos.z), blockPos.z)
                        let landPermission = newLandPermission(false, false, false, false, false)
                        if (!json.landCreate.admin) {
                            let landUser = newLandUser(player.name, true, true, true, true)
                            landData = new Land(land.name, landPosition, ID, player.name, landPermission, [landUser], false, false).transfromLand()
                        } else {
                            landData = new Land(land.name, landPosition, ID, false, landPermission, false, true, false).transfromLand()
                        }
                        if (json.landCreate.dime == 'overworld') {
                            cmd_async(`scoreboard players set "${landData}" lands ${ID}`)
                        }
                        if (json.landCreate.dime == 'nether') {
                            cmd_async(`scoreboard players set "${landData}" lands_nether ${ID}`)
                        }
                        if (json.landCreate.dime == 'end') {
                            cmd_async(`scoreboard players set "${landData}" lands_end ${ID}`)
                        }
                        if (!json.landCreate.admin) {
                            player.runCommandAsync(`scoreboard players add @s "land_squ" ${squ}`)
                            player.runCommandAsync(`scoreboard players add @s "land_land" 1`)
                        }
                        db.removeData("landCreating")
                        let msg = `§e§l領地系統 §f> §a您正在建造領地 §7-`
                        removeSign(msg, player)
                        logfor(player.name, `§a§l>> §e創建成功!`)
                    }
                })
        }
    })
    // 建造顯示
    mc.system.runInterval(() => {
        for (let player of mc.world.getAllPlayers()) {
            for (let msg of getSign(player).value) {
                let msgData = msg
                if (msgData.news.startsWith("§e§l領地系統 §f> §a您正在建造領地 §7- ")) {
                    const db = playerDB.table(player.id), LandCreatingExist = db.getData("landCreating");
                    if (LandCreatingExist && typeof LandCreatingExist.value == "object") {
                        let json = LandCreatingExist.value

                        if (json.landCreate.pos) {
                            let max = worldlog.getScoreFromMinecraft(player.name, 'land_squ_max').score - worldlog.getScoreFromMinecraft(player.name, 'land_squ').score
                            if (max > 20000) max = 20000
                            let squ = (Math.abs(json.landCreate.pos.x - Math.floor(player.location.x)) + 1) * (Math.abs(json.landCreate.pos.z - Math.floor(player.location.z)) + 1)
                            let squDisplay = ''
                            if (squ > max) squDisplay += "§c"
                            if (squ < max) squDisplay += '§e'
                            squDisplay += squ
                            removeSign(msgData.news, player)
                            let message = `§e§l領地系統 §f> §a您正在建造領地 §7- §b${json.landCreate.name} §f(§e目前格數 §f- ${squDisplay}§f/§e${max} §e格§f)`
                            addSign(message, player, (msgData.maxtick - msgData.tick))
                        }
                    }
                }
            }
        }
    }, 1)
    // 偵測進入領地 + 模式切換 dime: over nether end
    mc.system.runInterval(() => {
        // Inland tag = {'inLand": {"land": land, "per": {"build": string, "container": string}}}
        try {
            let landIDs = ['lands', 'lands_nether', 'lands_end']
            let landDimes = ['over', 'nether', 'end']
            for (let i in landIDs) {
                let landID = landIDs[i]
                let landDime = landDimes[i]
                let getAllLand = worldlog.getScoreboardPlayers(landID).disname
                for (let land of getAllLand) {
                    let data = getLandData(land)
                    for (let player of worldlog.getPlayers()) {
                        let check = true
                        const db = playerDB.table(player.id), InLandExist = db.getData("inLandData")
                            if (InLandExist && typeof InLandExist.value == "object") {
                                check = false
                            }
                            if (landID == 'lands' && player.dimension.id != mc.MinecraftDimensionTypes.overworld) {
                                check = false
                            }
                            if (landID == 'lands_nether' && player.dimension.id != mc.MinecraftDimensionTypes.nether) {
                                check = false
                            }
                            if (landID == 'lands_end' && player.dimension.id != mc.MinecraftDimensionTypes.theEnd) {
                                check = false
                            }
                        if (check) {
                            const db = playerDB.table(player.id)
                            let playerPos = player.location
                            let x1 = Math.max(Number(data.pos.x[1]), Number(data.pos.x[2]))
                            let x2 = Math.min(Number(data.pos.x[1]), Number(data.pos.x[2]))
                            let z1 = Math.max(Number(data.pos.z[1]), Number(data.pos.z[2]))
                            let z2 = Math.min(Number(data.pos.z[1]), Number(data.pos.z[2]))
                            if (Math.floor(playerPos.x) <= x1 && Math.floor(playerPos.x) >= x2) {
                                if (Math.floor(playerPos.z) <= z1 && Math.floor(playerPos.z) >= z2) {
                                    // 設定權限
                                    /**
                                     * @type {import('./index.js').InLand_landPermission}
                                     */
                                    let getPer = {}
                                    // 偵測公共權限
                                    for (let pubPer in data.permission) {
                                        getPer[pubPer] = data.permission[pubPer]
                                    }

                                    // 偵測設定權限
                                    if (!data.Public) {
                                        const users = data.users
                                        if (users) {
                                            for (let user of users) {
                                                if (user.username == player.name) {
                                                    for (let userPer in user.permission) {
                                                        getPer[userPer] = user.permission[userPer]
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    if (!getPer.build && !getAdmin(player)) {
                                        player.runCommandAsync('gamemode a @s')
                                    }

                                    if (getPer.build || getPer.fly) {
                                        addfly(player)
                                        logfor(player.name, `§a§l>> §e您可以在領地內飛行!`)
                                    }

                                    let delMsg = `§e§l領地系統 §f> §c您已經離開領地!`
                                    removeSign(delMsg, player)
                                    let msg = ''
                                    let perList = []
                                    if (getPer.build && !getAdmin(player)) {
                                        perList.push(`§a§l建築/破壞`)
                                    }
                                    if ((getPer.container || getPer.build) && !getAdmin(player)) {
                                        perList.push(`§a§l容器操作`)
                                    }
                                    if ((getPer.container || getPer.build || getPer.fly) && !getAdmin(player)) {
                                        perList.push(`§a§l飛行權限`)
                                    }
                                    if (getPer.portal && !getAdmin(player)) {
                                        perList.push("§a§l傳送點設置")
                                    }
                                    let displayPer = ''
                                    if (perList.length > 0) {
                                        displayPer = `§e§l擁有的權限§f: §a${perList.join(" §7| §a")}`
                                    }
                                    if (!data.Public) {
                                        if (!getAdmin(player)) {
                                            msg = `\n§e§l領地系統 §f> §a您已進入了 §b${data.player} §e的領地 §f- §e${data.name} ${displayPer}`
                                        } else {
                                            msg = `\n§e§l領地系統 §f> §a您已進入了 §b${data.player} §e的領地 §f- §e${data.name} ${displayPer}`
                                        }
                                    } else {
                                        if (!getAdmin(player)) {
                                            msg = `\n§e§l領地系統 §f> §a您已進入了 §6公共領地 §f- §e${data.name} ${displayPer}`
                                        } else {
                                            msg = `\n§e§l領地系統 §f> §a您已進入了 §6公共領地 §f- §e${data.name} ${displayPer}`
                                        }
                                    }
                                    
                                    addSign(msg, player, 40, 0, true)


                                    let json = {
                                        inLand: {
                                            "dime": landDime,
                                            "land": data,
                                            "per": {
                                                build: getPer.build,
                                                container: getPer.container,
                                                portal: getPer.portal,
                                                fly: getPer.fly
                                            }
                                        }
                                    }
                                    db.setData("inLandData", json)
                                }
                            }
                        }
                    }
                }
            }
        } catch { }
    }, 3)

    // 領地權限更改偵測
    mc.system.runInterval(() => {
        for (let player of worldlog.getPlayers()) {
            const db = playerDB.table(player.id), InLandExist = db.getData("inLandData")
            if (InLandExist && typeof InLandExist.value == "object") {
                let data = InLandExist.value
                let lands = worldlog.getScoreboardPlayers('lands')
                if (data.inLand.dime == 'nether') {
                    lands = worldlog.getScoreboardPlayers('lands_nether')
                }
                if (data.inLand.dime == 'end') {
                    lands = worldlog.getScoreboardPlayers('lands_end')
                }
                for (let land of lands.disname) {
                    let landData = data.inLand.land
                    let getLand = getLandData(land)
                    let check = true
                    if (landData.name != getLand.name) { check = false; };
                    if (landData.UID != getLand.UID) { check = false; };
                    if (landData.player != getLand.player) { check = false; };
                    if ((landData.pos.x[1] != getLand.pos.x[1]) && (landData.pos.x[2] != getLand.pos.x[2]) && (landData.pos.z[1] != getLand.pos.z[1]) && (landData.pos.z[2] != getLand.pos.z[2])) { check = false; };
                    if (check) {
                        const users = getLand.users
                        if (users) {
                            for (let user of users) {
                                if (user.username == player.name) {
                                    if (user.permission.build != data.inLand.per.build) {
                                        logfor(player.name, `§3§l>> §e偵測到您的 §b建築/破壞 §e更改`)
                                        data.inLand.per.build = user.permission.build
                                        db.setData("inLandData", data)
                                        if (!data.inLand.per.build) {
                                            player.runCommandAsync(`gamemode a @s`)
                                        }
                                        if (data.inLand.per.build) {
                                            player.runCommandAsync(`gamemode s @s`)
                                        }
                                        return;
                                    }
                                    if (user.permission.container != data.inLand.per.container) {
                                        logfor(player.name, `§3§l>> §e偵測到您的 §b容器操作權限 §e更改`)
                                        data.inLand.per.container = user.permission.container
                                        db.setData("inLandData", data)
                                        return;
                                    }
                                    if (user.permission.portal != data.inLand.per.portal) {
                                        logfor(player.name, `§3§l>> §e偵測到您的 §b傳送點設置權限 §e更改`)
                                        data.inLand.per.portal = user.permission.portal
                                        db.setData("inLandData", data)
                                        return;
                                    }
                                    if (user.permission.fly != data.inLand.per.fly) {
                                        logfor(player.name, `§3§l>> §e偵測到您的 §b飛行權限 §e更改`)
                                        data.inLand.per.fly = user.permission.fly
                                        db.setData("inLandData", data)
                                        if (!data.inLand.per.fly) {
                                            removefly(player)
                                        }
                                        if (data.inLand.per.fly) {
                                            addfly(player)
                                        }
                                        return;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }, 15)

    // 領地公共權限更改偵測
    mc.system.runInterval(() => {
        for (let player of worldlog.getPlayers()) {
            const db = playerDB.table(player.id), InLandExist = db.getData("inLandData")
            if (InLandExist && typeof InLandExist.value == "object" && !getAdmin(player)) {
                let data = InLandExist.value
                let lands = worldlog.getScoreboardPlayers('lands')
                if (data.inLand.dime == 'nether') {
                    lands = worldlog.getScoreboardPlayers('lands_nether')
                }
                if (data.inLand.dime == 'end') {
                    lands = worldlog.getScoreboardPlayers('lands_end')
                }
                for (let land of lands.disname) {
                    let landData = data.inLand.land
                    let getLand = getLandData(land)
                    let check = true
                    if (landData.name != getLand.name) { check = false; };
                    if (landData.UID != getLand.UID) { check = false; };
                    if (landData.player != getLand.player) { check = false; };
                    if ((landData.pos.x[1] != getLand.pos.x[1]) && (landData.pos.x[2] != getLand.pos.x[2]) && (landData.pos.z[1] != getLand.pos.z[1]) && (landData.pos.z[2] != getLand.pos.z[2])) { check = false; };
                    if (check && getLand.Public) {
                        if (landData.permission != getLand.permission) {
                            if (getLand.permission.build != data.inLand.per.build) {
                                logfor(player.name, `§3§l>> §e偵測到領地 §b建築/破壞權限 §e更改`)
                                data.inLand.per.build = getLand.permission.build
                                db.setData("inLandData", data)
                                if (!data.inLand.per.build) {
                                    removefly(player)
                                }
                                if (data.inLand.per.build) {
                                    addfly(player)
                                }
                                return;
                            }
                            if (getLand.permission.container != data.inLand.per.container) {
                                logfor(player.name, `§3§l>> §e偵測到領地 §b容器操作權限 §e更改`)
                                data.inLand.per.container = getLand.permission.container
                                db.setData("inLandData", data)
                                return;
                            }
                            if (getLand.permission.portal != data.inLand.per.portal) {
                                logfor(player.name, `§3§l>> §e偵測到領地 §b傳送點設置權限 §e更改`)
                                data.inLand.per.portal = getLand.permission.portal
                                db.setData("inLandData", data)
                                return;
                            }
                            if (getLand.permission.fly != data.inLand.per.fly) {
                                logfor(player.name, `§3§l>> §e偵測到您的 §b飛行權限 §e更改`)
                                data.inLand.per.fly = getLand.permission.fly
                                db.setData("inLandData", data)
                                if (!data.inLand.per.fly) {
                                    removefly(player)
                                }
                                if (data.inLand.per.fly) {
                                    addfly(player)
                                }
                                return;
                            }
                        }
                    }
                }
            }
        }
    }, 15)

    // 偵測離開領地
    mc.system.runInterval(() => {
        // §
        try {
            if (!worldlog.getPlayers()) return;
            for (let player of worldlog.getPlayers()) {
                const db = playerDB.table(player.id), InLandExist = db.getData("inLandData")
                if (InLandExist && typeof InLandExist.value == "object") {
                    let landData = InLandExist.value
                    let playerPos = player.location
                    let data = landData.inLand.land
                    let x1 = Math.max(Number(data.pos.x[1]), Number(data.pos.x[2]))
                    let x2 = Math.min(Number(data.pos.x[1]), Number(data.pos.x[2]))
                    let z1 = Math.max(Number(data.pos.z[1]), Number(data.pos.z[2]))
                    let z2 = Math.min(Number(data.pos.z[1]), Number(data.pos.z[2]))
                    let dime = landData.inLand.dime
                    if (dime == 'over') {
                        dime = mc.MinecraftDimensionTypes.overworld
                    }
                    if (dime == 'nether') {
                        dime = mc.MinecraftDimensionTypes.nether
                    }
                    if (dime == 'end') {
                        dime = mc.MinecraftDimensionTypes.theEnd
                    }

                    if (player.dimension.id.toLowerCase() != dime) {
                        leaveLand()
                    }
                    if (!(Math.floor(playerPos.x) <= x1 && Math.floor(playerPos.x) >= x2)) {
                        leaveLand()
                    }
                    if (!(Math.floor(playerPos.z) <= z1 && Math.floor(playerPos.z) >= z2)) {
                        leaveLand()
                    }


                    function leaveLand () {
                        let delMsg = ''
                        if (!data.public) {
                            delMsg = `§e§l領地系統 §f> §a您已進入了 §b${data.player} §e的領地`
                        } else {
                            delMsg = `§e§l領地系統 §f> §a您已進入了 §6公共領地 §f- §e${data.name}`
                        }
                        removeSign(delMsg, player)
                        let msg = `§e§l領地系統 §f> §c您已經離開領地!`
                        addSign(msg, player, 60)
                        db.removeData("inLandData")
                        if (!getAdmin(player)) {
                            player.runCommandAsync("gamemode s")
                            removefly(player)
                        }
                    }
                }
            }
        } catch (e) { log("land(615)" + e) }
    }, 2)

    // 偵測交互
    mc.world.beforeEvents.itemUseOn.subscribe(events => {
        const { source: player, blockFace } = events
        const db = playerDB.table(player.id), InLandExist = db.getData("inLandData")
        if (InLandExist && typeof InLandExist.value == "object") {
            let landData = InLandExist.value
            if (!landData.inLand.per.container && !getAdmin(player)) {
                if (!landData.inLand.per.build) {
                    events.cancel = true
                    let msg = `§e§l領地系統 §f> §c您沒有權限使用該方塊!`
                    removeSign(msg, player)
                    addSign(msg, player, 60)
                }
            }
        }
    })


    // 偵測在領地外使用/破壞領地內之容器

    // 使用
    mc.world.beforeEvents.itemUseOn.subscribe(events => {
        const { source: player } = events
        let getBlock = player.getBlockFromViewDirection()
        let landData = checkInLand_Pos(getBlock.location.x, getBlock.location.z, player.dimension.id)
        if (!landData) return;
        let getPer = { "container": false, "build": false }
        // 偵測公共權限
        if (landData.permission.container) {
            getPer.container = true
        }
        if (landData.permission.build) {
            getPer.container = true
        }
        // 偵測設定權限
        if (!landData.Public) {
            for (let user of landData.users) {
                if (user.username == player.name) {
                    getPer.container = user.permission.container
                    getPer.build = user.permission.build
                }
            }
        }
        if (!getPer.container && !getPer.build && !getAdmin(player)) {
            events.cancel = true
            let msg = `§e§l領地系統 §f> §c您沒有權限使用該方塊!`
            removeSign(msg, player)
            addSign(msg, player, 60)

        }
    })

    // 放置
    mc.world.afterEvents.blockPlace.subscribe(events => {
        let { block, player, dimension } = events
        let data = checkInLand_Pos(block.location.x, block.location.z, player.dimension.id)
        if (!data) return;
        let getPer = { "build": false }
        // 偵測公共權限
        if (data.permission.build) {
            getPer.build = true
        }
        // 偵測設定權限
        if (!data.Public) {
            for (let user of data.users) {
                if (user.username == player.name) {
                    getPer.build = user.permission.build
                }
            }
        }

        if (getPer.build == 'false' && !getAdmin(player)) {
            player.runCommandAsync(`setblock ${block.location.x} ${block.location.y} ${block.location.z} air`)
            player.runCommandAsync(`give @s ${block.typeId}`)
            let msg = `§e§l領地系統 §f> §c您沒有權限放置該方塊!`
            removeSign(msg, player)
            addSign(msg, player, 60)
        }
    })

    // 破壞
    mc.world.afterEvents.blockBreak.subscribe(events => {
        let { block, player, dimension, brokenBlockPermutation } = events
        let data = checkInLand_Pos(block.location.x, block.location.z, player.dimension.id)
        if (!data) return;
        let getPer = { "build": false }
        // 偵測公共權限
        if (data.permission.build) {
            getPer.build = true
        }
        // 偵測設定權限
        if (!data.Public) {
            for (let user of data.users) {
                if (user.username == player.name) {
                    getPer.build = user.permission.build
                }
            }
        }
        if (getPer.build == 'false' && !getAdmin(player)) {
            block.setPermutation(brokenBlockPermutation)
            mc.world.getDimension(dimension.id).runCommandAsync(`kill @e[type=item, x=${block.x}, y=${block.y}, z=${block.z}]`)
            let msg = `§e§l領地系統 §f> §c您沒有權限破壞該方塊!`
            removeSign(msg, player)
            addSign(msg, player, 60)
        }
    })

    // 偵測TNT爆炸
    mc.system.runInterval(() => {
        let dimensions = ['overworld', 'nether', 'the_end']
        for (let dimension of dimensions) {
            let query = {
                type: 'tnt'
            }
            for (let entity of mc.world.getDimension(dimension).getEntities(query)) {
                if (!entity.hasTag('exp')) {
                    mc.system.runTimeout(() => {
                        let land = checkNearLand_Pos(entity.location.x, entity.location.z, dimension, 3)
                        if (land && land.permission.tnt) {
                            mc.world.getDimension(dimension).runCommandAsync(`particle minecraft:huge_explosion_emitter ${entity.location.x} ${entity.location.y} ${entity.location.z}`)
                            for (let entity2 of mc.world.getDimension(dimension).getEntities()) {
                                if (worldlog.isNear(entity.location, entity2.location, 3)) {
                                    if (entity2.typeId != 'minecraft:tnt' && entity2.typeId != 'minecraft:item') {
                                        entity2.runCommandAsync(`damage @s 10`)
                                    }
                                }
                                if (worldlog.isNear(entity.location, entity2.location, 15)) {
                                    if (entity2.typeId == 'minecraft:player') {
                                        entity2.runCommandAsync(`playSound random.explode @s`)
                                        addSign(`§e§l領地系統 §f> §b領地已開啟防爆功能!`, entity2, 80)
                                    }
                                }
                            }
                            entity.kill()
                        }
                    }, 79)
                    entity.addTag('exp')
                }
            }
        }
    }, 1)
}