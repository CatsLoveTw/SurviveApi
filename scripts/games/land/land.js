import * as mc from '@minecraft/server'
import * as ui from '@minecraft/server-ui'
import { worldlog } from '../../lib/function.js'
import { log, cmd, logfor } from '../../lib/GametestFunctions.js'
/**
 * 
 * @param {string} land 
 * @returns {{name: string, pos: {x: {1: string, 2: string},z: {1: string, 2: string},},UID: string,player: string | false,permission: {build: string,container: string,action: string}, users: false | [{username: string,permission: {build: string, container: string, action: string}}], public: boolean}}
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
    * @type {[{username: string,permission: {build: string, container: string, action: string}}]}
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
                action: per[2],
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
                action: permissions[2],
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
                action: permissions[2],
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


export function build() {
    const times = 180 // 設定過期時間 (秒)
    // 偵測是否建造過久 / 玩家在其他維度建造領地隻偵測
    mc.system.runSchedule(() => {
        let players = mc.world.getAllPlayers();
        for (let player of players) {
            let getTimes = new Date().getTime(); // unixTime 毫秒
            for (let tag of player.getTags()) {
                // createTag: {"landCreate":{"at": number(unixtime), "name": string, "step": number(步驟進行)}}
                if (tag.includes('{"landCreate":{')) {
                    if (player.dimension.id != 'minecraft:overworld') {
                        player.removeTag(tag)
                        return logfor(player.name, `§c§l>> §e領地不可建於地獄或終界!`)
                    }
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
         * @type {{"landCreate":{"at": number, 'name': string, 'step': number, 'pos': {x: number | false, z: number | false}, 'pos2': {x: number | false, z: number | false}, 'admin': boolean}}}
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

        cmd(`setblock ${blockPos.x} ${blockPos.y} ${blockPos.z} air`)
        player.runCommandAsync(`give @s ${events.block.typeId}`)
        if (Number(json.landCreate.step) == 1) {
            logfor(player.name, `§a§l>> §e成功設置第一點! §f(§bx§f:§b${blockPos.x} §7| §bz§f:§b${blockPos.z}§f)`)
            player.removeTag(tags)
            let Json = {
                "landCreate": {
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
                    return logfor(player.name, `§c§l>> §e創建失敗! 領地格數超過上限!`)
                }
            }
            for (let land of worldlog.getScoreboardPlayers("lands").disname) {
                let data = getLandData(land)
                let x = json.landCreate.pos.x
                let x2 = blockPos.x
                let z = json.landCreate.pos.z
                let z2 = blockPos.z

                for (let i = Math.min(Number(x), Number(x2)); i <= Math.max(Number(x), Number(x2)); i++) {
                    for (let j = Math.min(Number(z), Number(z2)); j <= Math.max(Number(z), Number(z2)); j++) {
                        if (data.pos.x[1] == i && data.pos.z[1] == j) {
                            player.removeTag(tags)
                            return logfor(player.name, `§c§l>> §e領地重疊!`)
                        }
                        if (data.pos.x[2] == i && data.pos.z[2] == j) {
                            player.removeTag(tags)
                            return logfor(player.name, `§c§l>> §e領地重疊!`)
                        }
                    }
                }
            }
            let UI = new ui.MessageFormData()
                .title("§e§l公共領地建造確認")
                if (json.landCreate.admin) {
                    UI.body(`§e§l您成功設定了§b公共§e領地! 最後一步，確認領地訊息是否正確\n§e領地資料為 §f-\n§e領地名稱 §f- §e${json.landCreate.name}\n§e領地範圍 §f- §e${squ} 格 §7(§ex§f:§e ${Math.min(json.landCreate.pos.x, blockPos.x)}§f-§e${Math.max(json.landCreate.pos.x, blockPos.x)} §f| §ey§f: §e全部 §f| §ez§f: §e${Math.min(json.landCreate.pos.x, blockPos.x)}§f-§e${Math.max(json.landCreate.pos.x, blockPos.x)}§7)`)
                } else {
                   UI.body(`§e§l您成功設定了領地! 最後一步，確認領地訊息是否正確\n§e領地資料為 §f-\n§e領地名稱 §f- §e${json.landCreate.name}\n§e領地範圍 §f- §e${squ} 格 §7(§ex§f:§e ${Math.min(json.landCreate.pos.x, blockPos.x)}§f-§e${Math.max(json.landCreate.pos.x, blockPos.x)} §f| §ey§f: §e全部 §f| §ez§f: §e${Math.min(json.landCreate.pos.x, blockPos.x)}§f-§e${Math.max(json.landCreate.pos.x, blockPos.x)}§7)`)
                }
                UI.button1("§a§l創建")
                UI.button2("§c§l取消")
                .show(player).then(res => {
                    if (!res || res.selection === 0 || res.canceled) {
                        player.removeTag(tags)
                        return logfor(player.name, `§c§l>> §e取消成功!`)
                    }
                    if (res.selection == 1) {
                        let land = json.landCreate
                        // name_,_posx|posz/posx2|posz2_,_ID_,_player_,_build|container|action_,_players:build|container|action:/:
                        let ID = 1
                        let landData = ''
                        if (worldlog.getScoreboardPlayers("lands").score.length > 0) {
                            ID = Math.max(worldlog.getScoreboardPlayers('lands').score) + 1
                        }
                        if (!json.landCreate.admin) {
                            landData = `${land.name}_,_${land.pos.x}|${land.pos.z}/${blockPos.x}|${blockPos.z}_,_${ID}_,_${player.name}_,_false|false|false_,_${player.name}:true|true|true`
                        } else {
                            landData = `${land.name}_,_${land.pos.x}|${land.pos.z}/${blockPos.x}|${blockPos.z}_,_${ID}_,_true_,_false|false|false`
                        }
                        cmd(`scoreboard players set "${landData}" lands ${ID}`)
                        if (!json.landCreate.admin) {
                            player.runCommandAsync(`scoreboard players add @s "land_squ" ${squ}`)
                            player.runCommandAsync(`scoreboard players add @s "land_land" 1`)
                        }
                        player.removeTag(tags)
                        logfor(player.name, `§a§l>> §e創建成功!`)
                    }
                })
        }
    })

    // 偵測進入領地 + 模式切換
    mc.system.runSchedule(() => {
        // Inland tag = {'inLand": {"land": land, "per": {"build": string, "container": string}}}
        try {
            let getAllLand = worldlog.getScoreboardPlayers('lands').disname
            for (let land of getAllLand) {
                let data = getLandData(land)
                for (let player of mc.world.getAllPlayers()) {
                    let check = true
                    for (let tag of player.getTags()) {
                        if (tag.startsWith('{"inLand":')) {
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
                                let getPer = { "build": "false", "container": "false" }
                                // 偵測公共權限
                                if (data.permission.build == "true") {
                                    getPer.build = "true"
                                }
                                if (data.permission.container == "true") {
                                    getPer.container = "true"
                                }
                                // 偵測設定權限
                                if (!data.public) {
                                    for (let user of data.users) {
                                        if (user.username == player.name) {
                                            getPer.build = user.permission.build
                                            getPer.container = user.permission.container
                                        }
                                    }
                                }
                                if (getPer.build == "false" && !player.hasTag("admin")) {
                                    player.runCommandAsync('gamemode a @s')
                                }

                                for (let tag of player.getTags()) {
                                    let msg = `§e§l領地系統 §f> §c您已經離開領地!`
                                    if (tag.includes(`${msg}`)) {
                                        player.removeTag(tag)
                                    }
                                }
                                let msg = ''
                                if (!data.public) {
                                    if (!player.hasTag('admin')) {
                                        msg = `\n§e§l領地系統 §f> §a您已進入了 §b${data.player} §e的領地 §f- §e${data.name} \n§7(§e權限§f:§b建築/破壞 §f- §b${getPer.build} §f| §b容器交互 §f- §b${getPer.container}§7)`
                                    } else {
                                        msg = `\n§e§l領地系統 §f> §a您已進入了 §b${data.player} §e的領地 §f- §e${data.name} \n§7(§e權限§f:§b建築/破壞 §f- §6管理員 §f| §b容器交互 §f- §6管理員§7)`
                                    }
                                } else {
                                    if (!player.hasTag('admin')) {
                                        msg = `\n§e§l領地系統 §f> §a您已進入了 §6公共領地 §f- §e${data.name} \n§7(§e權限§f:§b建築/破壞 §f- §b${getPer.build} §f| §b容器交互 §f- §b${getPer.container}§7)`
                                    } else {
                                        msg = `\n§e§l領地系統 §f> §a您已進入了 §6公共領地 §f- §e${data.name} \n§7(§e權限§f:§b建築/破壞 §f- §6管理員 §f| §b容器交互 §f- §6管理員§7)`
                                    }
                                }
                                player.addTag(JSON.stringify({ "news": msg, tick: 0, maxtick: 100 }))
                                let json = {
                                    inLand: {
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

    // 偵測離開領地
    mc.system.runSchedule(() => {
        // §
        try {
            for (let player of mc.world.getAllPlayers()) {
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
                        // 這是個超蠢的方法 拜託不要學><
                        if (Math.floor(playerPos.x) <= x1 && Math.floor(playerPos.x) >= x2) {
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
                            if (!player.hasTag('admin')) {
                                player.runCommandAsync("gamemode s")
                            }
                        }
                        if (Math.floor(playerPos.z) <= z1 && Math.floor(playerPos.z) >= z2) {
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
                            if (!player.hasTag('admin')) {
                                player.runCommandAsync("gamemode s")
                            }
                        }
                    }
                }
            }
        } catch (e) { log(e) }
    }, 1)


    // 偵測交互
    mc.world.events.beforeItemUse.subscribe(events => {
        const { source: player } = events
        for (let tag of player.getTags()) {
            if (tag.startsWith('{"inLand":')) {
                /**
                         * @type {{inLand: {land: {name: string, pos: {x: {1: string, 2: string},z: {1: string, 2: string},},UID: string,player: string | false,permission: {build: string,container: string,action: string}, users: false | [{username: string,permission: {build: string, container: string, action: string}}], public: boolean}, per: {build: string, container: string}}}}
                         */
                let landData = JSON.parse(tag)
                if (landData.inLand.per.container == "false" && !player.hasTag('admin')) {
                    events.cancel = true
                }
            }
        }
    })
}