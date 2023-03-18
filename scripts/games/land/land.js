import * as mc from '@minecraft/server'
import * as ui from '@minecraft/server-ui'
import { worldlog } from '../../lib/function.js'
import { log, cmd, logfor, cmd_Dimension } from '../../lib/GametestFunctions.js'
import { checkInLand, checkInLand_Pos, checkNearLand_Pos } from './build.js'
export const times = 180 // 設定過期時間 (秒)
/**
 * 
 * @param {string} land 
 * @returns {{name: string, pos: {x: {1: string, 2: string},z: {1: string, 2: string},},UID: string,player: string | false,permission: {build: string,container: string,portal: string}, users: false | [{username: string,permission: {build: string, container: string, portal: string}}], public: boolean}}
 */
function getLandData(land) {
    // name_,_posx|posz/posx2|posz2_,_ID_,_player_,_build|container|action_,_players:build|container|action:/:
    // name_,_posx|posz/posx2|posz2_,_ID_,_true_,_build|container|action
    let args = land.split("_,_")

    let postion = args[1].split("/")
    let x = postion[0].split("|")[0]
    let x2 = postion[1].split("|")[0]
    let z = postion[0].split("|")[1]
    let z2 = postion[1].split("|")[1]

    let permissions = args[4].split("|")
    /**
    * @type {[{username: string,permission: {build: string, container: string, portal: string}}]}
    */
    let usersList = []
    if (args[3] != 'true') {
        let users = args[5].split(":/:")
        for (let user of users) {
            let username = user.split(":")[0]
            let per = user.split(":")[1].split("|")
            let userPermissions = {
                build: per[0],
                container: per[1],
                portal: per[2],
            }
            usersList.push({ username: username, permission: userPermissions })
        }
    }
    if (args[3] != "true") {
        return {
            name: args[0],
            pos: {
                x: { 1: x, 2: x2 },
                z: { 1: z, 2: z2 },
            },
            UID: args[2],
            player: args[3],
            permission: {
                build: permissions[0],
                container: permissions[1],
                portal: permissions[2],
            },
            users: usersList,
            public: false,
        }
    } else {
        return {
            name: args[0],
            pos: {
                x: { 1: x, 2: x2 },
                z: { 1: z, 2: z2 },
            },
            UID: args[2],
            player: false,
            permission: {
                build: permissions[0],
                container: permissions[1],
                portal: permissions[2],
            },
            users: false,
            public: true,
        }
    }
}

/**
 * 
 * @param {{name: string, pos: {x: {1: string, 2: string},z: {1: string, 2: string},},UID: string,player: string | false,permission: {build: string,container: string,action: string}, users: false | [{username: string,permission: {build: string, container: string, action: string}}], public: boolean}} landData 
 */
function transfromLand(landData) {
    // name_,_posx|posz/posx2|posz2_,_ID_,_player_,_build|container|action_,_players:build|container|action:/:
    // name_,_posx|posz/posx2|posz2_,_ID_,_true_,_build|container|action
    let name = landData.name;
    let pos = landData.pos.x[1] + "|" + landData.pos.z[1] + "/" + landData.pos.x[2] + "|" + landData.pos.z[2]
    let UID = landData.UID;
    let player = landData.player
    if (landData.public) {
        player = 'true'
    }
    let permission = landData.permission.build + "|" + landData.permission.container + "|" + landData.permission.action
    if (!landData.public) {
        let userList = []
        /**
         * @type {[{username: string,permission: {build: string, container: string, action: string}}]}
         */
        let users = landData.users
        for (let user of users) {
            let name = user.username
            let per = user.permission
            userList.push(`${name}:${per.build}|${per.container}|${per.action}`)
        }
        return `${name}_,_${pos}_,_${UID}_,_${player}_,_${permission}_,_${userList.join(":/:")}`
    }
    return `${name}_,_${pos}_,_${UID}_,_true_,_${permission}`
}

/**
 * 
 * @param {mc.Player} player 
 */
export function getAdmin(player) {
    let getPermission = worldlog.getScoreFromMinecraft(player.name, 'permission')
    if (!getPermission || getPermission.score == 1) {
        return false
    }
    return true
}


export function build() {
    /**
     * 
     * @param {mc.Player} player 
     */
    function addfly (player) {
        player.runCommandAsync('ability @s mayfly true')
    }
    
    /**
     * 
     * @param {mc.Player} player 
     */
    function removefly (player) {
        player.runCommandAsync('ability @s mayfly false')
        let y = 0
        for (let i=-64; i < player.location.y; i++) {
            try {
                let x = Math.trunc(player.location.x)
                let z = Math.trunc(player.location.z)
                let block = mc.world.getDimension(player.dimension.id).getBlock({x: x, y: i, z: z})
                if (block.typeId != 'minecraft:air') {
                    y = i
                }
            } catch (e) {log(e)}
        }
        let playerY = Math.trunc(player.location.y)
        if (Math.abs(playerY - y) > 3) {
            player.runCommandAsync(`tp @s ~ ${y+1} ~`)
            player.runCommandAsync(`effect @s resistance 1 255 true`)
        }
    }

    // 偵測是否建造過久 / 玩家在其他維度建造領地隻偵測
    mc.system.runInterval(() => {
        let players = mc.world.getPlayers();
        for (let player of players) {
            let getTimes = new Date().getTime(); // unixTime 毫秒
            for (let tag of player.getTags()) {
                // createTag: {"landCreate":{"at": number(unixtime), "name": string, "step": number(步驟進行)}}
                if (tag.includes('{"landCreate":{')) {
                    let data = JSON.parse(tag)
                    // 偵測過期時間 (3分鐘)
                    if ((getTimes - data.landCreate.at) >= (times * 1000)) {
                        player.removeTag(tag)
                        logfor(player.name, `§c§l>> §e您建造領地 §b${data.landCreate.name} §e已經超過 §g${times / 60}分鐘 §e系統已經自動刪除該計畫。`)
                    }
                }
            }
        }
    }, 1)

    // 建造偵測
    mc.world.events.blockPlace.subscribe(events => {
        let player = events.player
        let blockPos = events.block.location
        let check = false
        /**
         * @type {{"landCreate":{"dime": string, "at": number, 'name': string, 'step': number, 'pos': {x: number | false, z: number | false}, 'pos2': {x: number | false, z: number | false}, 'admin': boolean}}}
         * 
         * Step起始為1
         */
        let json = {}
        let tags = ''
        for (let tag of player.getTags()) {
            if (tag.includes('{"landCreate":{')) {
                check = true
                json = JSON.parse(tag)
                tags = tag
            }
        }
        if (!check) {
            return;
        }
        if (json.landCreate.dime == 'over') {
            cmd(`setblock ${blockPos.x} ${blockPos.y} ${blockPos.z} air`)
        } else if (json.landCreate.dime == 'nether') {
            mc.world.getDimension(mc.MinecraftDimensionTypes.nether).runCommandAsync(`setblock ${blockPos.x} ${blockPos.y} ${blockPos.z} air`)
        } else if (json.landCreate.dime == 'end') {
            mc.world.getDimension(mc.MinecraftDimensionTypes.theEnd).runCommandAsync(`setblock ${blockPos.x} ${blockPos.y} ${blockPos.z} air`)
        }
        player.runCommandAsync(`give @s ${events.block.typeId}`)
        if (Number(json.landCreate.step) == 1) {
            logfor(player.name, `§a§l>> §e成功設置第一點! §f(§bx§f:§b${blockPos.x} §7| §bz§f:§b${blockPos.z}§f)`)
            player.removeTag(tags)
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
            return player.addTag(JSON.stringify(Json))
        }

        if (Number(json.landCreate.step == 2)) {
            // button1: 1 button2: 0
            let squ = (Math.abs(json.landCreate.pos.x - blockPos.x) + 1) * (Math.abs(json.landCreate.pos.z - blockPos.z) + 1)
            if (!json.landCreate.admin) {
                if ((squ + worldlog.getScoreFromMinecraft(player.name, "land_squ").score) > worldlog.getScoreFromMinecraft(player.name, "land_squ_max").score || (worldlog.getScoreFromMinecraft(player.name, 'land_land').score + 1) > worldlog.getScoreFromMinecraft(player.name, 'land_land_max').score) {
                    player.removeTag(tags)
                    let msg = `§e§l領地系統 §f> §a您正在建造領地 §7-`
                    for (let tag of player.getTags()) {
                        if (tag.includes(msg)) {
                            player.removeTag(tag)
                        }
                    }
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
                                    player.removeTag(tags)
                                    let msg = `§e§l領地系統 §f> §a您正在建造領地 §7-`
                                    for (let tag of player.getTags()) {
                                        if (tag.includes(msg)) {
                                            player.removeTag(tag)
                                        }
                                    }
                                    return logfor(player.name, `§c§l>> §e領地重疊!`)
                                }
                            }
                        }
                    }
                }
            } catch (e) { log(e) }
            let UI = new ui.MessageFormData()
                .title("§e§l領地建造確認")
            if (json.landCreate.admin) {
                UI.body(`§e§l您成功設定了§b公共§e領地! 最後一步，確認領地訊息是否正確\n§e領地資料為 §f-\n§e領地名稱 §f- §e${json.landCreate.name}\n§e領地範圍 §f- §e${squ} 格 \n§ex§f:§e ${Math.min(json.landCreate.pos.x, blockPos.x)}§f-§e${Math.max(json.landCreate.pos.x, blockPos.x)}\n§ey§f: §e全部\n§ez§f: §e${Math.min(json.landCreate.pos.x, blockPos.x)}§f-§e${Math.max(json.landCreate.pos.x, blockPos.x)}`)
            } else {
                UI.body(`§e§l您成功設定了領地! 最後一步，確認領地訊息是否正確\n§e領地資料為 §f-\n§e領地名稱 §f- §e${json.landCreate.name}\n§e領地範圍 §f- §e${squ} 格 \n§ex§f:§e ${Math.min(json.landCreate.pos.x, blockPos.x)}§f-§e${Math.max(json.landCreate.pos.x, blockPos.x)}\n§ey§f: §e全部\n§ez§f: §e${Math.min(json.landCreate.pos.x, blockPos.x)}§f-§e${Math.max(json.landCreate.pos.x, blockPos.x)}`)
            }
            UI.button1("§a§l創建")
            UI.button2("§c§l取消")
                .show(player).then(res => {
                    if (!res || res.selection === 0 || res.canceled) {
                        player.removeTag(tags)
                        let msg = `§e§l領地系統 §f> §a您正在建造領地 §7-`
                        for (let tag of player.getTags()) {
                            if (tag.includes(msg)) {
                                player.removeTag(tag)
                            }
                        }
                        return logfor(player.name, `§c§l>> §e取消成功!`)
                    }
                    if (res.selection == 1) {
                        let land = json.landCreate
                        // name_,_posx|posz/posx2|posz2_,_ID_,_player_,_build|container|action_,_players:build|container|action:/:
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
                        if (!json.landCreate.admin) {
                            landData = `${land.name}_,_${land.pos.x}|${land.pos.z}/${blockPos.x}|${blockPos.z}_,_${ID}_,_${player.name}_,_false|false|false_,_${player.name}:true|true|true`
                        } else {
                            landData = `${land.name}_,_${land.pos.x}|${land.pos.z}/${blockPos.x}|${blockPos.z}_,_${ID}_,_true_,_false|false|false`
                        }
                        if (json.landCreate.dime == 'over') {
                            cmd(`scoreboard players set "${landData}" lands ${ID}`)
                        }
                        if (json.landCreate.dime == 'nether') {
                            cmd(`scoreboard players set "${landData}" lands_nether ${ID}`)
                        }
                        if (json.landCreate.dime == 'end') {
                            cmd(`scoreboard players set "${landData}" lands_end ${ID}`)
                        }
                        if (!json.landCreate.admin) {
                            player.runCommandAsync(`scoreboard players add @s "land_squ" ${squ}`)
                            player.runCommandAsync(`scoreboard players add @s "land_land" 1`)
                        }
                        player.removeTag(tags)
                        let msg = `§e§l領地系統 §f> §a您正在建造領地 §7-`
                        for (let tag of player.getTags()) {
                            if (tag.includes(msg)) {
                                player.removeTag(tag)
                            }
                        }
                        logfor(player.name, `§a§l>> §e創建成功!`)
                    }
                })
        }
    })

    // 偵測進入領地 + 模式切換 dime: over nether end
    mc.system.runInterval(() => {
        // Inland tag = {'inLand": {"land": land, "per": {"build": string, "container": string}}}
        try {
            let getAllLand = worldlog.getScoreboardPlayers('lands').disname
            for (let land of getAllLand) {
                let data = getLandData(land)
                for (let player of mc.world.getPlayers()) {
                    let check = true
                    for (let tag of player.getTags()) {
                        if (tag.startsWith('{"inLand":') || player.dimension.id.toLowerCase() != 'minecraft:overworld') {
                            check = false
                        }
                    }
                    if (check) {
                        let playerPos = player.location
                        let x1 = Math.max(Number(data.pos.x[1]), Number(data.pos.x[2]))
                        let x2 = Math.min(Number(data.pos.x[1]), Number(data.pos.x[2]))
                        let z1 = Math.max(Number(data.pos.z[1]), Number(data.pos.z[2]))
                        let z2 = Math.min(Number(data.pos.z[1]), Number(data.pos.z[2]))
                        if (Math.floor(playerPos.x) <= x1 && Math.floor(playerPos.x) >= x2) {
                            if (Math.floor(playerPos.z) <= z1 && Math.floor(playerPos.z) >= z2) {
                                let getPer = { "build": "false", "container": "false", "portal": "false" }
                                // 偵測公共權限
                                if (data.permission.build == "true") {
                                    getPer.build = "true"
                                }
                                if (data.permission.container == "true") {
                                    getPer.container = "true"
                                }
                                if (data.permission.portal == "true") {
                                    getPer.portal = "true"
                                }
                                // 偵測設定權限
                                if (!data.public) {
                                    for (let user of data.users) {
                                        if (user.username == player.name) {
                                            getPer.build = user.permission.build
                                            getPer.container = user.permission.container
                                            getPer.portal = user.permission.portal
                                        }
                                    }
                                }
                                if (getPer.build == "false" && !getAdmin(player)) {
                                    player.runCommandAsync('gamemode a @s')
                                }

                                if (getPer.build == 'true') {
                                    addfly(player)
                                    logfor(player.name, `§a§l>> §e您可以在領地內飛行!`)
                                }

                                for (let tag of player.getTags()) {
                                    let msg = `§e§l領地系統 §f> §c您已經離開領地!`
                                    if (tag.includes(`${msg}`)) {
                                        player.removeTag(tag)
                                    }
                                }
                                let msg = ''
                                let perList = []
                                if (getPer.build == "false" && !getAdmin(player)) {
                                    perList.push(`§c§l建築/破壞`)
                                }
                                if (getPer.container == "false" && !getAdmin(player)) {
                                    perList.push(`§c§l容器操作`)
                                }
                                if (getPer.portal == "false" && !getAdmin(player)) {
                                    perList.push("§c§l傳送點設置")
                                }
                                let displayPer = ''
                                if (perList.length > 0) {
                                    displayPer = `§e§l沒有的權限§f: §c${perList.join(" §7| §c")}`
                                }
                                if (!data.public) {
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
                                player.addTag(JSON.stringify({ "news": msg, tick: 0, maxtick: 60 }))
                                let json = {
                                    inLand: {
                                        "dime": "over",
                                        "land": data,
                                        "per": {
                                            build: getPer.build,
                                            container: getPer.container,
                                            portal: getPer.portal,
                                        }
                                    }
                                }
                                player.addTag(JSON.stringify(json))
                            }
                        }
                    }
                }
            }
        } catch { }
        try {
            let getAllLand = worldlog.getScoreboardPlayers('lands_nether').disname
            for (let land of getAllLand) {
                let data = getLandData(land)
                for (let player of mc.world.getPlayers()) {
                    let check = true
                    for (let tag of player.getTags()) {
                        if (tag.startsWith('{"inLand":') || player.dimension.id.toLowerCase() != 'minecraft:nether') {
                            check = false
                        }
                    }
                    if (check) {
                        let playerPos = player.location
                        let x1 = Math.max(Number(data.pos.x[1]), Number(data.pos.x[2]))
                        let x2 = Math.min(Number(data.pos.x[1]), Number(data.pos.x[2]))
                        let z1 = Math.max(Number(data.pos.z[1]), Number(data.pos.z[2]))
                        let z2 = Math.min(Number(data.pos.z[1]), Number(data.pos.z[2]))
                        if (Math.floor(playerPos.x) <= x1 && Math.floor(playerPos.x) >= x2) {
                            if (Math.floor(playerPos.z) <= z1 && Math.floor(playerPos.z) >= z2) {
                                let getPer = { "build": "false", "container": "false", "portal": "false" }
                                // 偵測公共權限
                                if (data.permission.build == "true") {
                                    getPer.build = "true"
                                }
                                if (data.permission.container == "true") {
                                    getPer.container = "true"
                                }
                                if (data.permission.portal == "true") {
                                    getPer.portal = "true"
                                }
                                // 偵測設定權限
                                if (!data.public) {
                                    for (let user of data.users) {
                                        if (user.username == player.name) {
                                            getPer.build = user.permission.build
                                            getPer.container = user.permission.container
                                            getPer.portal = user.permission.portal
                                        }
                                    }
                                }
                                if (getPer.build == "false" && !getAdmin(player)) {
                                    player.runCommandAsync('gamemode a @s')
                                }

                                for (let tag of player.getTags()) {
                                    let msg = `§e§l領地系統 §f> §c您已經離開領地!`
                                    if (tag.includes(`${msg}`)) {
                                        player.removeTag(tag)
                                    }
                                }
                                let msg = ''
                                let perList = []
                                if (getPer.build == "false" && !getAdmin(player)) {
                                    perList.push(`§c§l建築/破壞`)
                                }
                                if (getPer.container == "false" && !getAdmin(player)) {
                                    perList.push(`§c§l容器操作`)
                                }
                                if (getPer.portal == "false" && !getAdmin(player)) {
                                    perList.push("§c§l傳送點設置")
                                }
                                let displayPer = ''
                                if (perList.length > 0) {
                                    displayPer = `§e§l沒有的權限§f: §c${perList.join(" §7| §c")}`
                                }
                                if (!data.public) {
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
                                player.addTag(JSON.stringify({ "news": msg, tick: 0, maxtick: 60 }))
                                let json = {
                                    inLand: {
                                        "dime": 'nether',
                                        "land": data,
                                        "per": {
                                            build: getPer.build,
                                            container: getPer.container
                                        }
                                    }
                                }
                                player.addTag(JSON.stringify(json))
                            }
                        }
                    }
                }
            }
        } catch { }
        try {
            let getAllLand = worldlog.getScoreboardPlayers('lands_end').disname
            for (let land of getAllLand) {
                let data = getLandData(land)
                for (let player of mc.world.getPlayers()) {
                    let check = true
                    for (let tag of player.getTags()) {
                        if (tag.startsWith('{"inLand":') || player.dimension.id.toLowerCase() != 'minecraft:the_end') {
                            check = false
                        }
                    }
                    if (check) {
                        let playerPos = player.location
                        let x1 = Math.max(Number(data.pos.x[1]), Number(data.pos.x[2]))
                        let x2 = Math.min(Number(data.pos.x[1]), Number(data.pos.x[2]))
                        let z1 = Math.max(Number(data.pos.z[1]), Number(data.pos.z[2]))
                        let z2 = Math.min(Number(data.pos.z[1]), Number(data.pos.z[2]))
                        if (Math.floor(playerPos.x) <= x1 && Math.floor(playerPos.x) >= x2) {
                            if (Math.floor(playerPos.z) <= z1 && Math.floor(playerPos.z) >= z2) {
                                let getPer = { "build": "false", "container": "false", "portal": "false" }
                                // 偵測公共權限
                                if (data.permission.build == "true") {
                                    getPer.build = "true"
                                }
                                if (data.permission.container == "true") {
                                    getPer.container = "true"
                                }
                                if (data.permission.portal == "true") {
                                    getPer.portal = "true"
                                }
                                // 偵測設定權限
                                if (!data.public) {
                                    for (let user of data.users) {
                                        if (user.username == player.name) {
                                            getPer.build = user.permission.build
                                            getPer.container = user.permission.container
                                            getPer.portal = user.permission.portal
                                        }
                                    }
                                }
                                if (getPer.build == "false" && !getAdmin(player)) {
                                    player.runCommandAsync('gamemode a @s')
                                }

                                for (let tag of player.getTags()) {
                                    let msg = `§e§l領地系統 §f> §c您已經離開領地!`
                                    if (tag.includes(`${msg}`)) {
                                        player.removeTag(tag)
                                    }
                                }
                                let msg = ''
                                let perList = []
                                if (getPer.build == "false" && !getAdmin(player)) {
                                    perList.push(`§c§l建築/破壞`)
                                }
                                if (getPer.container == "false" && !getAdmin(player)) {
                                    perList.push(`§c§l容器操作`)
                                }
                                if (getPer.portal == "false" && !getAdmin(player)) {
                                    perList.push("§c§l傳送點設置")
                                }
                                let displayPer = ''
                                if (perList.length > 0) {
                                    displayPer = `§e§l沒有的權限§f: §c${perList.join(" §7| §c")}`
                                }
                                if (!data.public) {
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
                                player.addTag(JSON.stringify({ "news": msg, tick: 0, maxtick: 60 }))
                                let json = {
                                    inLand: {
                                        'dime': 'end',
                                        "land": data,
                                        "per": {
                                            build: getPer.build,
                                            container: getPer.container
                                        }
                                    }
                                }
                                player.addTag(JSON.stringify(json))
                            }
                        }
                    }
                }
            }
        } catch { }
    }, 1)

    // 領地權限更改偵測
    mc.system.runInterval(() => {
        for (let player of mc.world.getPlayers()) {
            for (let tag of player.getTags()) {
                if (tag.startsWith('{"inLand":')) {
                    /**
                     * @type {{inLand: {dime: string, land: {name: string, pos: {x: {1: string, 2: string},z: {1: string, 2: string},},UID: string,player: string | false,permission: {build: string,container: string,action: string}, users: false | [{username: string,permission: {build: string, container: string, action: string}}], public: boolean}, per: {build: string, container: string}}}}
                     */
                    let data = JSON.parse(tag)
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
                            for (let user of getLand.users) {
                                // log(user.username)
                                if (user.username == player.name) {
                                    // /**
                                    //  * @type {{username: string, permission: {build: boolean, container: boolean, action: boolean}}}
                                    //  */
                                    // let user = user
                                    // log(user.permission.build)
                                    // log(getLand.permission.build)
                                    // 訊息重複發出之問題未修復..
                                    if (`${user.permission.build}` != data.inLand.per.build) {
                                        logfor(player.name, `§3§l>> §e偵測到您的 §b建築/破壞/飛行權限 §e更改`)
                                        player.removeTag(tag)
                                        data.inLand.per.build = `${user.permission.build}`
                                        player.addTag(JSON.stringify(data))
                                        if (data.inLand.per.build == "false") {
                                            removefly(player)
                                            player.runCommandAsync(`gamemode a @s`)
                                        }
                                        if (data.inLand.per.build == "true") {
                                            addfly(player)
                                            player.runCommandAsync(`gamemode s @s`)
                                        }
                                    }
                                    if (`${user.permission.container}` != data.inLand.per.container) {
                                        logfor(player.name, `§3§l>> §e偵測到您的 §b容器操作權限 §e更改`)
                                        player.removeTag(tag)
                                        data.inLand.per.container = `${user.permission.container}`
                                        player.addTag(JSON.stringify(data))
                                    }
                                    if (`${user.permission.portal}` != data.inLand.per.portal) {
                                        logfor(player.name, `§3§l>> §e偵測到您的 §b傳送點設置權限 §e更改`)
                                        player.removeTag(tag)
                                        data.inLand.per.portal = `${user.permission.portal}`
                                        player.addTag(JSON.stringify(data))
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }, 3)

    // 領地公共權限更改偵測
    mc.system.runInterval(() => {
        for (let player of mc.world.getPlayers()) {
            for (let tag of player.getTags()) {
                if (tag.startsWith('{"inLand":') && !getAdmin(player)) {
                    /**
                     * @type {{inLand: {dime: string, land: {name: string, pos: {x: {1: string, 2: string},z: {1: string, 2: string},},UID: string,player: string | false,permission: {build: string,container: string,action: string}, users: false | [{username: string,permission: {build: string, container: string, action: string}}], public: boolean}, per: {build: string, container: string}}}}
                     */
                    let data = JSON.parse(tag)
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
                            if (landData.permission != getLand.permission) {
                                for (let user of getLand.users) {
                                    if (user.username == player.name) {
                                        return;
                                    }
                                }
                                if (getLand.permission.build != data.inLand.per.build) {
                                    logfor(player.name, `§3§l>> §e偵測到領地 §b建築/破壞權限 §e更改`)
                                    player.removeTag(tag)
                                    data.inLand.per.build = getLand.permission.build
                                    player.addTag(JSON.stringify(data))
                                    if (data.inLand.per.build == "false") {
                                        removefly(player)
                                        player.runCommandAsync(`gamemode a @s`)
                                    }
                                    if (data.inLand.per.build == "true") {
                                        addfly(player)
                                        player.runCommandAsync(`gamemode s @s`)
                                    }
                                }
                                if (getLand.permission.container != data.inLand.per.container) {
                                    logfor(player.name, `§3§l>> §e偵測到領地 §b容器操作權限 §e更改`)
                                    player.removeTag(tag)
                                    data.inLand.per.container = getLand.permission.container
                                    player.addTag(JSON.stringify(data))
                                }
                                if (getLand.permission.portal != data.inLand.per.portal) {
                                    logfor(player.name, `§3§l>> §e偵測到領地 §b傳送點設置權限 §e更改`)
                                    player.removeTag(tag)
                                    data.inLand.per.portal = getLand.permission.portal
                                    player.addTag(JSON.stringify(data))
                                }
                            }
                        }
                    }
                }
            }
        }
    }, 3)

    // 偵測離開領地
    mc.system.runInterval(() => {
        // §
        try {
            for (let player of mc.world.getPlayers()) {
                for (let tag of player.getTags()) {
                    if (tag.startsWith('{"inLand":')) {
                        /**
                         * @type {{inLand: {land: {name: string, pos: {x: {1: string, 2: string},z: {1: string, 2: string},},UID: string,player: string | false,permission: {build: string,container: string,action: string}, users: false | [{username: string,permission: {build: string, container: string, action: string}}], public: boolean}, per: {build: string, container: string}}}}
                         */
                        let landData = JSON.parse(tag)
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
                        // 這是個超蠢的方法 拜託不要學><
                        if (player.dimension.id.toLowerCase() != dime) {
                            for (let tag of player.getTags()) {
                                let msg = ''
                                if (!data.public) {
                                    msg = `§e§l領地系統 §f> §a您已進入了 §b${data.player} §e的領地`
                                } else {
                                    msg = `§e§l領地系統 §f> §a您已進入了 §6公共領地 §f- §e${data.name}`
                                }
                                if (tag.replace("\n", "").includes(`${msg}`)) {
                                    player.removeTag(tag)
                                }
                            }
                            let msg = `§e§l領地系統 §f> §c您已經離開領地!`
                            player.addTag(JSON.stringify({ "news": msg, tick: 0, maxtick: 60 }))
                            player.removeTag(tag)
                            if (!getAdmin(player)) {
                                player.runCommandAsync("gamemode s")
                                removefly(player)
                            }
                        }
                        if ((Math.floor(playerPos.x) <= x1 && Math.floor(playerPos.x) >= x2)) {
                        } else {
                            for (let tag of player.getTags()) {
                                let msg = ''
                                if (!data.public) {
                                    msg = `§e§l領地系統 §f> §a您已進入了 §b${data.player} §e的領地`
                                } else {
                                    msg = `§e§l領地系統 §f> §a您已進入了 §6公共領地 §f- §e${data.name}`
                                }
                                if (tag.replace("\n", "").includes(`${msg}`)) {
                                    player.removeTag(tag)
                                }
                            }
                            let msg = `§e§l領地系統 §f> §c您已經離開領地!`
                            player.addTag(JSON.stringify({ "news": msg, tick: 0, maxtick: 60 }))
                            player.removeTag(tag)
                            if (!getAdmin(player)) {
                                player.runCommandAsync("gamemode s")
                                removefly(player)
                            }
                        }
                        if ((Math.floor(playerPos.z) <= z1 && Math.floor(playerPos.z) >= z2)) {
                        } else {
                            for (let tag of player.getTags()) {
                                let msg = ''
                                if (!data.public) {
                                    msg = `§e§l領地系統 §f> §a您已進入了 §b${data.player} §e的領地`
                                } else {
                                    msg = `§e§l領地系統 §f> §a您已進入了 §6公共領地 §f- §e${data.name}`
                                }
                                if (tag.replace("\n", "").includes(`${msg}`)) {
                                    player.removeTag(tag)
                                }
                            }
                            let msg = `§e§l領地系統 §f> §c您已經離開領地!`
                            player.addTag(JSON.stringify({ "news": msg, tick: 0, maxtick: 60 }))
                            player.removeTag(tag)
                            if (!getAdmin(player)) {
                                player.runCommandAsync("gamemode s")
                                removefly(player)
                            }
                        }
                    }
                }
            }
        } catch (e) { log(e) }
    }, 1)


    // 偵測交互
    mc.world.events.beforeItemUseOn.subscribe(events => {
        const { source: player, getBlockLocation } = events
        for (let tag of player.getTags()) {
            if (tag.startsWith('{"inLand":')) {
                /**
                         * @type {{inLand: {dime: string, land: {name: string, pos: {x: {1: string, 2: string},z: {1: string, 2: string},},UID: string,player: string | false,permission: {build: string,container: string,action: string}, users: false | [{username: string,permission: {build: string, container: string, action: string}}], public: boolean}, per: {build: string, container: string}}}}
                         */
                let landData = JSON.parse(tag)
                if (landData.inLand.per.container == "false" && !getAdmin(player)) {
                    let getBlock = mc.world.getDimension(player.dimension.id).getBlock(getBlockLocation())
                    let denyBlocks = [
                        'chest',
                        'gate',
                        'door',
                        'smoker',
                        'furnace'
                    ]
                    for (let block of denyBlocks) {
                        if (getBlock.typeId.includes(block)) {
                            if (block == 'door' || block == 'gate') {
                                player.runCommandAsync('tp ^^^-0.5')
                            }
                            events.cancel = true
                            let msg = `§e§l領地系統 §f> §c您沒有權限使用該方塊!`
                            for (let tag of player.getTags()) {
                                if (tag.includes(msg)) {
                                    player.removeTag(tag)
                                }
                            }
                            player.addTag(JSON.stringify({ "news": msg, tick: 0, maxtick: 60 }))
                        }
                    }
                }
            }
        }
    })


    // 偵測在領地外使用/破壞領地內之容器

    // 使用
    mc.world.events.beforeItemUseOn.subscribe(events => {
        const { source: player, getBlockLocation } = events
        let landData = checkInLand_Pos(getBlockLocation().x, getBlockLocation().z, player.dimension.id)
        if (!landData) return;
        let getPer = { "container": "false" }
        // 偵測公共權限
        if (landData.permission.container == "true") {
            getPer.container = "true"
        }
        // 偵測設定權限
        if (!landData.public) {
            for (let user of landData.users) {
                if (user.username == player.name) {
                    getPer.container = user.permission.container
                }
            }
        }
        if (getPer.container == "false" && !getAdmin(player)) {
            let getBlock = mc.world.getDimension(player.dimension.id).getBlock(events.getBlockLocation())
            let denyBlocks = [
                'chest',
                'gate',
                'door',
                'smoker',
                'furnace'
            ]
            for (let block of denyBlocks) {
                if (getBlock.typeId.includes(block)) {
                    if (block == 'door' || block == 'gate') {
                        player.runCommandAsync('tp ^^^-0.5')
                    }
                    events.cancel = true
                    let msg = `§e§l領地系統 §f> §c您沒有權限使用該方塊!`
                    for (let tag of player.getTags()) {
                        if (tag.includes(msg)) {
                            player.removeTag(tag)
                        }
                    }
                    player.addTag(JSON.stringify({ "news": msg, tick: 0, maxtick: 60 }))
                }
            }
        }
    })

    // 放置
    mc.world.events.blockPlace.subscribe(events => {
        let { block, player, dimension } = events
        let data = checkInLand_Pos(block.location.x, block.location.z, player.dimension.id)
        if (!data) return;
        let getPer = { "build": "false" }
        // 偵測公共權限
        if (data.permission.build == "true") {
            getPer.build = "true"
        }
        // 偵測設定權限
        if (!data.public) {
            for (let user of data.users) {
                if (user.username == player.name) {
                    getPer.build = user.permission.build
                }
            }
        }

        if (getPer.build == 'false' && !getAdmin(player)) {
            player.runCommandAsync(`setblock ${block.location.x} ${block.location.y} ${block.location.z} air`)
            let msg = `§e§l領地系統 §f> §c您沒有權限放置該方塊!`
            for (let tag of player.getTags()) {
                if (tag.includes(msg)) {
                    player.removeTag(tag)
                }
            }
            player.addTag(JSON.stringify({ "news": msg, tick: 0, maxtick: 60 }))
        }
    })

    // 破壞
    mc.world.events.blockBreak.subscribe(events => {
        let { block, player, dimension, brokenBlockPermutation } = events
        let data = checkInLand_Pos(block.location.x, block.location.z, player.dimension.id)
        if (!data) return;
        let getPer = { "build": "false" }
        // 偵測公共權限
        if (data.permission.build == "true") {
            getPer.build = "true"
        }
        // 偵測設定權限
        if (!data.public) {
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
            for (let tag of player.getTags()) {
                if (tag.includes(msg)) {
                    player.removeTag(tag)
                }
            }
            player.addTag(JSON.stringify({ "news": msg, tick: 0, maxtick: 60 }))
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
                        if (checkNearLand_Pos(entity.location.x, entity.location.z, dimension, 3)) {
                            mc.world.getDimension(dimension).runCommandAsync(`particle minecraft:huge_explosion_emitter ${entity.location.x} ${entity.location.y} ${entity.location.z}`)
                            for (let entity2 of mc.world.getDimension(dimension).getEntities()) {
                                if (worldlog.isNear(entity.location, entity2.location, 3)) {
                                    if (entity2.typeId != 'minecraft:tnt' && entity2.typeId != 'minecraft:item') {
                                        entity2.runCommandAsync(`playSound random.explode @s`)
                                        entity2.runCommandAsync(`damage @s 10`)
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