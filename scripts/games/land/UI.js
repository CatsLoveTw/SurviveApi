import * as mc from '@minecraft/server'
import * as ui from '@minecraft/server-ui'
import { getRandomIntInclusive, worldlog } from '../../lib/function.js'
import { log, cmd, logfor } from '../../lib/GametestFunctions.js'
import * as land from './land.js'

// 這個檔案的代碼沒有做到很好的維護環境，等有空再慢慢改吧><...
// 在這個檔案內 unix為1970/1/1至今的毫秒數

/**
 * 
 * @param {string} land 
 * @returns {{name: string, pos: {x: {1: string, 2: string},z: {1: string, 2: string},},UID: string,player: string | false,permission: {build: string,container: string,portal: string, fly: string}, users: false | [{username: string,permission: {build: string, container: string, portal: string, fly: string}}], public: boolean, old: boolean}}
 */
export function getLandData(land) {
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
                build: per[0],
                container: per[1],
                portal: per[2],
                fly: fly
            }
            usersList.push({ username: username, permission: userPermissions })
        }
    }
    let fly = permissions[3]
    if (fly == 'undefined' || !fly) {
        fly = 'false'
        old = true
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
                fly: fly
            },
            users: usersList,
            public: false,
            old: old
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
                fly: fly
            },
            users: false,
            public: true,
            old: old
        }
    }
}


/**
 * 
 * @param {{name: string, pos: {x: {1: string, 2: string},z: {1: string, 2: string},},UID: string,player: string | false,permission: {build: string,container: string,portal: string, fly: string}, users: false | [{username: string,permission: {build: string, container: string, portal: string, fly: string}}], public: boolean}} landData 
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
    let permission = landData.permission.build + "|" + landData.permission.container + "|" + landData.permission.portal + "|" + landData.permission.fly
    if (!landData.public) {
        let userList = []
        /**
         * @type {[{username: string,permission: {build: string, container: string, portal: string, fly: string}}]}
         */
        let users = landData.users
        for (let user of users) {
            let name = user.username
            let per = user.permission
            userList.push(`${name}:${per.build}|${per.container}|${per.portal}|${per.fly}`)
        }
        return `${name}_,_${pos}_,_${UID}_,_${player}_,_${permission}_,_${userList.join(":/:")}`
    }
    return `${name}_,_${pos}_,_${UID}_,_true_,_${permission}`
}

/**
 * 
 * @param {mc.Player} player 
 * @param {'' | 'nether' | 'end'} dimension
 */
function getPlayerLands(player, dimension) {
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
 * @param {'overworld' | 'nether' | 'end'} dime
 */
function getAdminLands(dime) {
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


/**
 * 
 * @param {mc.Player} player 
 */
export function UI(player) {
    // name_,_posx|posz/posx2|posz2_,_ID_,_player_,_build|container|action_,_players:build|container|action:/:
    // name_,_posx|posz/posx2|posz2_,_ID_,_true_,_build|container|action
    // createTag: {"landCreate":{"at": number(unixtime), "name": string, "step": number(步驟進行)}}
    menu()
    function menu() {
        let getSqu = worldlog.getScoreFromMinecraft(player.name, 'land_squ').score
        let getSquMax = worldlog.getScoreFromMinecraft(player.name, "land_squ_max").score
        let getlands = worldlog.getScoreFromMinecraft(player.name, 'land_land').score // 注意 這不是玩家領地資料 是數量
        let getlandsMax = worldlog.getScoreFromMinecraft(player.name, 'land_land_max').score

        if (player.dimension.id.toLowerCase() == 'minecraft:overworld') {
            form('overworld')
        }
        if (player.dimension.id.toLowerCase() == mc.MinecraftDimensionTypes.nether) {
            form('nether')
        }
        if (player.dimension.id.toLowerCase() == mc.MinecraftDimensionTypes.theEnd) {
            form('end')
        }
        /**
         * 
         * @param {'overworld' | 'nether' | 'end'} dime 
         */
        function form(dime) {
            let landID = 'lands'
            let display = ''
            if (dime == 'nether') {
                landID += '_nether'
                display = '§f(§c§l地獄§f)'
            }
            if (dime == 'end') {
                landID += '_end'
                display = '§f(§a§l終界§f)'
            }
            let form = new ui.ActionFormData()
                .title("§e§l領地系統" + display)
                .body(`§e§l您已經建造了 §b${getSqu}§f/§b${getSquMax} §e格 §f/ §b${getlands}§f/§b${getlandsMax} §e塊領地`)
                .button("§a§l新增", 'textures/ui/imagetaggedcornergreen.png') // 
                .button('§c§l刪除', 'textures/ui/realms_red_x.png')
                .button('§e§l查看', 'textures/ui/magnifyingGlass.png')
                .show(player).then(res => {
                    if (res.selection === 0) {
                        let squ = worldlog.getScoreFromMinecraft(player.name, `land_squ`).score
                        let land = worldlog.getScoreFromMinecraft(player.name, 'land_land').score
                        let squMax = worldlog.getScoreFromMinecraft(player.name, 'land_squ_max').score
                        let landMax = worldlog.getScoreFromMinecraft(player.name, 'land_land_max').score
                        if (squ >= squMax || land >= landMax) {
                            return logfor(player.name, `§c§l>> §e領地已達上限!`)
                        }
                        add()
                    } else if (res.selection === 1) {
                        remove()
                    } else if (res.selection === 2) {
                        list()
                    }
                })

            function add() {
                let form = new ui.ModalFormData()
                    .title("§a§l新增領地")
                    .textField(`§e§l輸入領地名稱`, `§e§l名稱`)
                form.show(player).then(res => {
                    for (let tag of player.getTags()) {
                        if (tag.includes('{"landCreate":{')) {
                            let data = JSON.parse(tag)
                            return logfor(player.name, `§c§l>> §e您的領地建造項目 §b${data.landCreate.name} §e還未結束!`)
                        }
                    }
                    if (!res) return;

                    let name = res.formValues[0].trim()
                    let playerLands = getPlayerLands(player, dime)
                    if (name == '') {
                        return logfor(player.name, `§c§l>> §e領地名稱不得為空!`)
                    }
                    for (let land of playerLands) {
                        if (land.name == name) {
                            return logfor(player.name, `§c§l>> §e領地名稱重複!`)
                        }
                    }
                    // createTag: {"landCreate":{"at": number(unixtime), "name": string, "step": number}}
                    let setDime = 'over'
                    if (dime == 'nether') {
                        setDime = 'nether'
                    }
                    if (dime == 'end') {
                        setDime = 'end'
                    }
                    let json = {
                        "landCreate": {
                            "dime": setDime,
                            "at": new Date().getTime(),
                            "name": name,
                            "step": 1,
                            "admin": false
                        }
                    }
                    let msg = `§e§l領地系統 §f> §a您正在建造領地 §7- §b${name}`
                    player.addTag(JSON.stringify({ "news": msg, tick: 0, maxtick: land.times * 20 }))
                    player.addTag(JSON.stringify(json))
                    logfor(player.name, `§a§l>> §e放置隨意方塊在地面即可設置領地範圍 §f(§6建議使用泥土§f)`);
                })
            }

            function remove() {
                if (getPlayerLands(player, dime).length == 0) {
                    return logfor(player.name, '§c§l>> §e您還沒有領地!')
                }
                let lands = getPlayerLands(player, dime)
                let form = new ui.ActionFormData()
                    .title("§c§l刪除領地")
                for (let land of lands) {
                    let x1 = Math.max(land.pos.x[1], land.pos.x[2])
                    let x2 = Math.min(land.pos.x[1], land.pos.x[2])
                    let z1 = Math.max(land.pos.z[1], land.pos.z[2])
                    let z2 = Math.min(land.pos.z[1], land.pos.z[2])
                    form.button(`§e§l領地名稱 §f- §e${land.name}\n§b領地座標 §f- §bx§7:§b${x1}§f-§b${x2} | §bz§7:§b${z1}§f-§b${z2}`)
                }
                form.show(player).then(res => {
                    if (!res) return;
                    let selection = res.selection
                    /**
                     * @type {{name: string, pos: {x: {1: string, 2: string},z: {1: string, 2: string},},UID: string,player: string | false,permission: {build: string,container: string,portal: string, fly: string}, users: false | [{username: string,permission: {build: string, container: string, portal: string, fly: string}}], public: boolean}}
                     */
                    let land = lands[selection]
                    // MessageFormData 按鈕selection為Button1=1 Button2=0
                    let form = new ui.MessageFormData()
                        .title("§c§l刪除領地確認")
                        .body(`§e§l您正在執行刪除領地 §b${land.name} §e的動作\n§e是否刪除?\n\n§c警告:一旦刪除後就不能復原!`)
                        .button1("§a§l刪除")
                        .button2("§c§l返回")
                        .show(player).then(res => {
                            if (res.selection === 1) {
                                let name = transfromLand(land)
                                let error = true
                                let squ = (Math.abs(Number(land.pos.x[1]) - Number(land.pos.x[2])) + 1) * (Math.abs(Number(land.pos.z[1]) - Number(land.pos.z[2])) + 1)
                                cmd(`scoreboard players reset "${name}" ${landID}`).then(() => {
                                    player.runCommandAsync(`scoreboard players add @s "land_squ" -${squ}`)
                                    player.runCommandAsync(`scoreboard players add @s "land_land" -1`)
                                    for (let pl of mc.world.getPlayers()) {
                                        for (let tag of pl.getTags()) {
                                            if (tag.startsWith('{"inLand":') && tag.includes(JSON.stringify(land.pos)) && tag.includes(land.UID) && tag.includes(land.name)) {
                                                pl.removeTag(tag)
                                                pl.runCommandAsync(`ability @s mayfly false`)
                                                logfor(pl.name, `§3§l>> §e所在領地被刪除!`)
                                            }
                                        }
                                    }
                                    error = false
                                    return logfor(player.name, `§c§l>> §e刪除成功!`);
                                }
                                )
                                mc.system.runTimeout(() => {
                                    if (error) {
                                        logfor(player.name, `§c§l>> §e領地刪除失敗!\n§e請至領地功能 -> 查看 -> 您的領地名稱 -> 修復領地\n然後再試一次!`)
                                    }
                                }, 1000)
                            }
                            if (res.selection === 0 || res.canceled) {
                                return menu()
                            }

                        })
                })
            }

            function list() {
                let lands = getPlayerLands(player, dime)
                let form = new ui.ActionFormData()
                    .title("§e§l查看領地")
                    .body("§e§l權限大小 §f- §e建築>容器>飛行 傳送點獨立 (例如設定建築權限後 容器與飛行權限將會視為開啟)")
                for (let land of lands) {
                    let x1 = Math.max(land.pos.x[1], land.pos.x[2])
                    let x2 = Math.min(land.pos.x[1], land.pos.x[2])
                    let z1 = Math.max(land.pos.z[1], land.pos.z[2])
                    let z2 = Math.min(land.pos.z[1], land.pos.z[2])
                    if (land.old) {
                        form.button(`§b§l[請立即修復§f]\n§e§l領地名稱 §f- §e${land.name}`)
                    } else {
                        form.button(`§e§l領地名稱 §f- §e${land.name}\n§b領地座標 §f- §bx§7:§b${x1}§f-§b${x2} | §bz§7:§b${z1}§f-§b${z2}`)
                    }
                }
                form.show(player).then(res => {
                    if (!res || res.canceled) return;
                    let land = lands[res.selection]
                    landData(land)
                    /**
                     * 
                     * @param {{name: string, pos: {x: {1: string, 2: string},z: {1: string, 2: string},},UID: string,player: string | false,permission: {build: string,container: string,portal: string, fly: string}, users: false | [{username: string,permission: {build: string, container: string, portal: string, fly: string}}], public: boolean, old: boolean}} land 
                     */
                    function landData(land) {
                        let x1 = Math.max(land.pos.x[1], land.pos.x[2])
                        let x2 = Math.min(land.pos.x[1], land.pos.x[2])
                        let z1 = Math.max(land.pos.z[1], land.pos.z[2])
                        let z2 = Math.min(land.pos.z[1], land.pos.z[2])
                        let form = new ui.ActionFormData()
                            .title("§e§l領地")
                            .button("§e§l權限管理")
                            .button("§e§l查看領地資訊")
                            .button("§c§l踢出領地")
                            .button("§7§l返回")
                        if (land.old) {
                            form.button("§a§l修復領地")
                        }
                        form.show(player).then(res => {
                            if (res.selection === 3 || !res || res.canceled) return list();
                            if (res.selection === 4) {
                                for (let l2 of worldlog.getScoreboardPlayers(landID).disname) {
                                    let data = getLandData(l2)
                                    let check = true
                                    if (data.name != land.name) check = false;
                                    if (data.player != land.player) check = false;
                                    if (data.pos.x[1] != land.pos.x[1]) check = false;
                                    if (data.pos.x[2] != land.pos.x[2]) check = false;
                                    if (data.UID != land.UID) check = false;
                                    if (check) {
                                        cmd(`scoreboard players reset "${l2}" ${landID}`)
                                        cmd(`scoreboard players set "${transfromLand(land)}" ${landID} ${land.UID}`)
                                        logfor(player.name, `§a§l>> §e修復成功!`)
                                        break;
                                    }
                                }
                            }
                            if (res.selection === 0) {
                                perMenu()
                                function perMenu() {
                                    let form = new ui.ActionFormData()
                                        .title("§e§l權限管理")
                                        .button("§e§l個人")
                                        .button("§e§l公共")
                                        .button("§7§l返回")
                                        .show(player).then(res => {
                                            if (res.selection === 0) {
                                                Personal()
                                                function Personal() {
                                                    let form = new ui.ActionFormData()
                                                        .title("§e§l個人權限設定")
                                                        .button("§a§l新增")
                                                        .button("§c§l刪除")
                                                        .button("§b§l修改")
                                                        .button("§7§l返回")
                                                        .show(player).then(res => {
                                                            if (res.selection === 0) {
                                                                let form = new ui.ActionFormData()
                                                                    .title("§a§l新增玩家")
                                                                    .button("§e§l手動新增")
                                                                    .button("§a§l線上玩家")
                                                                    .button("§7§l返回")
                                                                    .show(player).then(res => {
                                                                        if (res.selection === 0) {
                                                                            let form = new ui.ModalFormData()
                                                                                .title("§e§l手動新增玩家")
                                                                                .textField("§e§l輸入玩家名稱", "§e§l名稱")
                                                                                .show(player).then(res => {
                                                                                    if (!res || res.canceled || res.formValues[0] == '') return Personal();
                                                                                    let name = res.formValues[0]
                                                                                    for (let user of land.users) {
                                                                                        if (user.username == name) {
                                                                                            logfor(player.name, '§c§l>> §e名稱重複!')
                                                                                            return Personal()
                                                                                        }
                                                                                    }
                                                                                    cmd(`scoreboard players reset "${transfromLand(land)}" ${landID}`)
                                                                                    land.users.push({ username: name, permission: { build: `false`, container: `false`, portal: `false`, fly: `false` } })
                                                                                    cmd(`scoreboard players set "${transfromLand(land)}" ${landID} ${land.UID}`).then(() => {
                                                                                        logfor(player.name, '§a§l>> §e設定成功!')
                                                                                        return Personal();
                                                                                    })
                                                                                })
                                                                        } else if (res.selection === 1) {
                                                                            let players = []
                                                                            let form = new ui.ActionFormData()
                                                                                .title("§a§l線上玩家新增")
                                                                            for (let player of mc.world.getPlayers()) {
                                                                                let check = true
                                                                                for (let user of land.users) {
                                                                                    if (user.username == player.name) {
                                                                                        check = false
                                                                                    }
                                                                                }
                                                                                if (check) {
                                                                                    players.push(player.name)
                                                                                }
                                                                            }
                                                                            for (let player of players) {
                                                                                form.button(`§e§l${player}`)
                                                                            }
                                                                            if (players.length == 0) {
                                                                                return logfor(player.name, `§c§l>> §e沒有玩家可新增!`)
                                                                            }
                                                                            form.show(player).then(res => {
                                                                                if (res.canceled || !res) return;
                                                                                let selePlayer = players[res.selection]
                                                                                cmd(`scoreboard players reset "${transfromLand(land)}" ${landID}`)
                                                                                land.users.push({ username: selePlayer, permission: { build: `false`, container: `false`, portal: `false`, fly: `false` } })
                                                                                cmd(`scoreboard players set "${transfromLand(land)}" ${landID} ${land.UID}`).then(() => {
                                                                                    logfor(player.name, '§a§l>> §e設定成功!')
                                                                                    return Personal();
                                                                                })
                                                                            })
                                                                        } else if (res.selection === 2) {
                                                                            Personal()
                                                                        }
                                                                    })
                                                            } else if (res.selection === 1) {
                                                                let players = []
                                                                let form = new ui.ActionFormData()
                                                                    .title("§c§l刪除玩家")
                                                                for (let user of land.users) {
                                                                    if (user.username != player.name) {
                                                                        form.button(`§e§l${user.username}`)
                                                                        players.push(user)
                                                                    }
                                                                }
                                                                if (players.length == 0) {
                                                                    return logfor(player.name, `§c§l>> §e沒有玩家可刪除`)
                                                                }
                                                                form.show(player).then(res => {
                                                                    if (res.canceled || !res) return;
                                                                    let selePlayer = players[res.selection]
                                                                    cmd(`scoreboard players reset "${transfromLand(land)}" ${landID}`)
                                                                    let newUsers = land.users.filter(item => item.username !== selePlayer.username);
                                                                    land.users = newUsers
                                                                    cmd(`scoreboard players set "${transfromLand(land)}" ${landID} ${land.UID}`)
                                                                    logfor(player.name, `§a§l>> §e刪除成功!`)
                                                                })
                                                            } else if (res.selection === 2) {
                                                                permissionChange()
                                                                function permissionChange() {
                                                                    let players = []
                                                                    let form = new ui.ActionFormData()
                                                                        .title('§e§l修改權限')
                                                                    for (let user of land.users) {
                                                                        // if (user.username != land.player) {
                                                                        form.button(`§e§l${user.username}`)
                                                                        players.push(user)
                                                                        // }
                                                                    }
                                                                    if (players.length == 0) {
                                                                        return logfor(player.name, '§c§l>> §e沒有玩家可以修改!')
                                                                    }
                                                                    form.show(player).then(res => {
                                                                        function changeBoolean(text) {
                                                                            if (text == "true") {
                                                                                return true
                                                                            }
                                                                            return false
                                                                        }
                                                                        if (res.canceled || !res) return Personal();
                                                                        let selePlayer = players[res.selection]
                                                                        let form = new ui.ModalFormData()
                                                                            .title(`§e§l權限設定 - 設定玩家 - ${selePlayer.username}`)
                                                                            .toggle(`§b建築/破壞權限`, changeBoolean(selePlayer.permission.build))
                                                                            .toggle('§b§l容器交互權限', changeBoolean(selePlayer.permission.container))
                                                                            .toggle("§b§l飛行權限", changeBoolean(selePlayer.permission.fly))
                                                                            .toggle('§b§l傳送點設置權限', changeBoolean(selePlayer.permission.portal))
                                                                            .show(player).then(res => {
                                                                                if (!res || res.canceled) return Personal();
                                                                                let build = res.formValues[0]
                                                                                let container = res.formValues[1]
                                                                                let fly = res.formValues[2]
                                                                                let portal = res.formValues[3]
                                                                                cmd(`scoreboard players reset "${transfromLand(land)}" ${landID}`)
                                                                                let newUsers = land.users.filter(item => item.username !== selePlayer.username);
                                                                                land.users = newUsers
                                                                                land.users.push({ username: selePlayer.username, permission: { build: `${build}`, container: `${container}`, portal: `${portal}`, fly: `${fly}` } })
                                                                                cmd(`scoreboard players set "${transfromLand(land)}" ${landID} ${land.UID}`).then(() => {
                                                                                    logfor(player.name, `§a§l>> §e設定成功!`)
                                                                                    return Personal();
                                                                                })
                                                                            })
                                                                    })
                                                                }
                                                            } else if (res.selection === 3) {
                                                                perMenu()
                                                            }
                                                        })
                                                }

                                            } else if (res.selection === 1) {
                                                function changeBoolean(text) {
                                                    if (text == 'true') {
                                                        return true
                                                    }
                                                    return false
                                                }
                                                let form = new ui.ModalFormData()
                                                    .title("§e§l公共權限設定")
                                                    .toggle("§b§l建築/破壞權限", changeBoolean(land.permission.build))
                                                    .toggle("§b§l容器交互權限", changeBoolean(land.permission.container))
                                                    .toggle("§b§l飛行權限", changeBoolean(land.permission.fly))
                                                    .toggle("§b§l傳送點設置權限", changeBoolean(land.permission.portal))
                                                    .show(player).then(res => {
                                                        if (!res || res.canceled) return perMenu();
                                                        let build = res.formValues[0]
                                                        let container = res.formValues[1]
                                                        let fly = res.formValues[2]
                                                        cmd(`scoreboard players reset "${transfromLand(land)}" ${landID}`)
                                                        land.permission.build = `${build}`
                                                        land.permission.container = `${container}`
                                                        land.permission.portal = `${res.formValues[3]}`
                                                        land.permission.fly = `${fly}`
                                                        cmd(`scoreboard players set "${transfromLand(land)}" ${landID} ${land.UID}`)
                                                        logfor(player.name, `§a§l>> §e修改成功!`)
                                                        return perMenu()
                                                    })
                                            } else if (res.selection === 2) {
                                                landData(land)
                                            }
                                        })
                                }
                            } else if (res.selection === 1) {
                                let user = []
                                for (let u of land.users) {
                                    let name = u.username
                                    let permission = u.permission
                                    user.push(`§e§l玩家§f: §e${name} §7| §b建築§f/§b破壞§f: §b${permission.build} §b容器§f: §b${permission.container} §b飛行 §f- §b${permission.fly} §b傳送點設置權§f: §b${permission.portal}`)
                                }
                                let squ = (Math.abs(Number(x1) - Number(x2)) + 1) * (Math.abs(Number(z1) - Number(z2)))
                                let form = new ui.ActionFormData()
                                    .title("§e§l領地資訊")
                                    .body(`§e§l領地名稱 §f- §e${land.name}\n§b領地座標 §f- §bx§7:§b${x1}§f-§b${x2} | §bz§7:§b${z1}§f-§b${z2} §f(§e${squ} 格§f)\n§a§l權限管理:\n\n§a公共:\n§a建築/破壞:${land.permission.build}\n§a容器:${land.permission.container}\n§a飛行:${land.permission.fly}\n§a傳送點設置:${land.permission.portal}\n\n§a個人:\n${user.join("\n")}`)
                                    .button("§7§l返回")
                                    .show(player).then(res => {
                                        if (!res || res.selection === 0) return landData(land);
                                    })
                            } else if (res.selection === 2) {
                                /**
                                 * @type {mc.Player[]}
                                 */
                                let players = []
                                for (let pl of mc.world.getPlayers()) {
                                    let playerPos = pl.location
                                    let data = land
                                    let x1 = Math.max(Number(data.pos.x[1]), Number(data.pos.x[2]))
                                    let x2 = Math.min(Number(data.pos.x[1]), Number(data.pos.x[2]))
                                    let z1 = Math.max(Number(data.pos.z[1]), Number(data.pos.z[2]))
                                    let z2 = Math.min(Number(data.pos.z[1]), Number(data.pos.z[2]))
                                    if (Math.floor(playerPos.x) <= x1 && Math.floor(playerPos.x) >= x2) {
                                        if (Math.floor(playerPos.z) <= z1 && Math.floor(playerPos.z) >= z2) {
                                            if (pl.name != player.name) {
                                                players.push(pl)
                                            }
                                        }
                                    }
                                }
                                if (players.length == 0) {
                                    return logfor(player.name, '§c§l>> §e領地內暫無玩家!')
                                }
                                let form = new ui.ActionFormData()
                                    .title('§c§l踢出領地')
                                for (let player of players) {
                                    form.button(`§e§l${player.name}`)
                                }
                                form.show(player).then(res => {
                                    if (res.canceled || !res) return landData(land);
                                    let data = land
                                    let x1 = Math.max(Number(data.pos.x[1]), Number(data.pos.x[2]))
                                    let x2 = Math.min(Number(data.pos.x[1]), Number(data.pos.x[2]))
                                    let z1 = Math.max(Number(data.pos.z[1]), Number(data.pos.z[2]))
                                    let z2 = Math.min(Number(data.pos.z[1]), Number(data.pos.z[2]))
                                    /**
                                     * @type {mc.Player}
                                     */
                                    let selePlayer = players[res.selection]
                                    let getPos = { x: Number(land.pos.x[getRandomIntInclusive(1, 2)]), z: Number(land.pos.z[getRandomIntInclusive(1, 2)]) }
                                    let addSelection = getRandomIntInclusive(1, 2)
                                    let add = getRandomIntInclusive(55, 200)
                                    if (addSelection == 1) { // x改變
                                        // 偵測範圍
                                        let get = getPos.x + add
                                        if (get <= x1 && get >= x2) {
                                            get = getPos.x - add
                                        }
                                        getPos.x = get
                                    } else { // z改變
                                        let get = getPos.z + add
                                        if (get <= z1 && get >= z2) {
                                            get = getPos.z - add
                                        }
                                        getPos.z = get
                                    }
                                    selePlayer.runCommandAsync(`spreadplayers ${getPos.x} ${getPos.z} 0.000000001 1 @s`).then(() => {
                                        logfor(selePlayer.name, `§c§l>> §e您已被 §b${player.name} §e踢出領地`)
                                        logfor(player.name, '§a§l>> §e執行成功!')
                                        return landData(land)
                                    })
                                })
                            }
                        })
                    }
                })
            }
        }
    }
}


/**
 * 
 * @param {mc.Player} player 
 * @param {'overworld' | 'nether' | 'end'} dime
 */
export function adminUI(player, dime) {
    // name_,_posx|posz/posx2|posz2_,_ID_,_player_,_build|container|action_,_players:build|container|action:/:
    // name_,_posx|posz/posx2|posz2_,_ID_,_true_,_build|container|action
    // createTag: {"landCreate":{"at": number(unixtime), "name": string, "step": number(步驟進行)}}
    let landID = 'lands'
    let display = ''
    if (dime == 'nether') {
        landID += '_nether'
        display = '§f(§c§l地獄§f)'
    }
    if (dime == 'end') {
        landID += '_end'
        display = '§f(§a§l終界§f)'
    }
    menu()
    function menu() {
        let form = new ui.ActionFormData()
            .title("§e§l公共領地系統" + display)
            .button("§a§l新增", 'textures/ui/imagetaggedcornergreen.png')
            .button('§c§l刪除', 'textures/ui/realms_red_x.png')
            .button('§e§l查看', 'textures/ui/magnifyingGlass.png')
            .show(player).then(res => {
                if (res.selection === 0) {
                    add()
                } else if (res.selection === 1) {
                    remove()
                } else if (res.selection === 2) {
                    list()
                }
            })
    }

    function add() {
        let form = new ui.ModalFormData()
            .title("§a§l新增領地")
            .textField(`§e§l輸入領地名稱`, `§e§l名稱`)
        form.show(player).then(res => {
            for (let tag of player.getTags()) {
                if (tag.includes('{"landCreate":{')) {
                    let data = JSON.parse(tag)
                    return logfor(player.name, `§c§l>> §e您的領地建造項目 §b${data.landCreate.name} §e還未結束!`)
                }
            }
            if (!res) return;

            let name = res.formValues[0].trim()
            let playerLands = getAdminLands(dime)
            if (name == '') {
                return logfor(player.name, `§c§l>> §e領地名稱不得為空!`)
            }
            for (let land of playerLands) {
                if (land.name == name) {
                    return logfor(player.name, `§c§l>> §e領地名稱重複!`)
                }
            }
            // createTag: {"landCreate":{"at": number(unixtime), "name": string, "step": number}}

            let setDime = 'over'
            if (dime == 'nether') {
                setDime = 'nether'
            }
            if (dime == 'end') {
                setDime = 'end'
            }
            let json = {
                "landCreate": {
                    "dime": setDime,
                    "at": new Date().getTime(),
                    "name": name,
                    "step": 1,
                    "admin": true
                }
            }
            player.addTag(JSON.stringify(json))
            logfor(player.name, `§a§l>> §e放置隨意方塊在地面即可設置領地範圍 §f(§6建議使用泥土§f)`);
        })
    }

    function remove() {
        if (getAdminLands(dime).length == 0) {
            return logfor(player.name, '§c§l>> §e找不到公共領地!')
        }
        let lands = getAdminLands(dime)
        let form = new ui.ActionFormData()
            .title("§c§l刪除領地")
        for (let land of lands) {
            let x1 = Math.max(land.pos.x[1], land.pos.x[2])
            let x2 = Math.min(land.pos.x[1], land.pos.x[2])
            let z1 = Math.max(land.pos.z[1], land.pos.z[2])
            let z2 = Math.min(land.pos.z[1], land.pos.z[2])
            form.button(`§e§l領地名稱 §f- §e${land.name}\n§b領地座標 §f- §bx§7:§b${x1}§f-§b${x2} | §bz§7:§b${z1}§f-§b${z2}`)
        }
        form.show(player).then(res => {
            if (!res) return;
            let selection = res.selection
            /**
             * @type {{name: string, pos: {x: {1: string, 2: string},z: {1: string, 2: string},},UID: string,player: string | false,permission: {build: string,container: string,action: string}, users: false | [{username: string,permission: {build: string, container: string, action: string}}], public: boolean}}
             */
            let land = lands[selection]
            // MessageFormData 按鈕selection為Button1=1 Button2=0
            let form = new ui.MessageFormData()
                .title("§c§l刪除領地確認")
                .body(`§e§l您正在執行刪除領地 §b${land.name} §e的動作\n§e是否刪除?\n\n§c警告:一旦刪除後就不能復原!`)
                .button1("§a§l刪除")
                .button2("§c§l返回")
                .show(player).then(res => {
                    if (res.selection === 1) {
                        let name = transfromLand(land)
                        cmd(`scoreboard players reset "${name}" ${landID}`);
                        return logfor(player.name, `§c§l>> §e刪除成功!`);
                    }
                    return menu()
                })
        })
    }

    function list() {
        let lands = getAdminLands(dime)
        let form = new ui.ActionFormData()
            .title("§e§l查看公共領地")
        for (let land of lands) {
            let x1 = Math.max(land.pos.x[1], land.pos.x[2])
            let x2 = Math.min(land.pos.x[1], land.pos.x[2])
            let z1 = Math.max(land.pos.z[1], land.pos.z[2])
            let z2 = Math.min(land.pos.z[1], land.pos.z[2])
            form.button(`§e§l領地名稱 §f- §e${land.name}\n§b領地座標 §f- §bx§7:§b${x1}§f-§b${x2} | §bz§7:§b${z1}§f-§b${z2}`)
        }
        form.show(player).then(res => {
            if (!res || res.canceled) return;
            let land = lands[res.selection]
            landData(land)
            /**
             * 
             * @param {{name: string, pos: {x: {1: string, 2: string},z: {1: string, 2: string},},UID: string,player: string | false,permission: {build: string,container: string,portal: string, fly: string}, users: false | [{username: string,permission: {build: string, container: string, portal: string, fly: string}}], public: boolean}} land
             */
            function landData(land) {
                let x1 = Math.max(land.pos.x[1], land.pos.x[2])
                let x2 = Math.min(land.pos.x[1], land.pos.x[2])
                let z1 = Math.max(land.pos.z[1], land.pos.z[2])
                let z2 = Math.min(land.pos.z[1], land.pos.z[2])
                let form = new ui.ActionFormData()
                    .title("§e§l公共領地")
                    .button("§e§l權限管理")
                    .button("§e§l查看領地資訊")
                    .button("§7§l返回")
                    .show(player).then(res => {
                        if (res.selection === 2 || !res || res.canceled) return list();
                        if (res.selection === 0) {
                            perMenu()
                            function perMenu() {
                                let form = new ui.ActionFormData()
                                    .title("§e§l權限管理")
                                    .button("§e§l公共")
                                    .button("§7§l返回")
                                    .show(player).then(res => {
                                        if (res.selection === 0) {
                                            function changeBoolean(text) {
                                                if (text == 'true') {
                                                    return true
                                                }
                                                return false
                                            }
                                            let form = new ui.ModalFormData()
                                                .title("§e§l公共權限設定")
                                                .toggle("§b§l建築/破壞權限", changeBoolean(land.permission.build))
                                                .toggle("§b§l容器交互權限", changeBoolean(land.permission.container))
                                                .toggle('§b§l飛行權限', changeBoolean(land.permission.fly))
                                                .toggle("§b§l傳送點設置權限", changeBoolean(land.permission.portal))
                                                .show(player).then(res => {
                                                    if (!res || res.canceled) return perMenu();
                                                    let build = res.formValues[0]
                                                    let container = res.formValues[1]
                                                    let fly = res.formValues[2]
                                                    let portal = res.formValues[3]
                                                    cmd(`scoreboard players reset "${transfromLand(land)}" ${landID}`)
                                                    land.permission.build = `${build}`
                                                    land.permission.container = `${container}`
                                                    land.permission.portal = `${portal}`
                                                    land.permission.fly = `${fly}`
                                                    cmd(`scoreboard players set "${transfromLand(land)}" ${landID} ${land.UID}`)
                                                    logfor(player.name, `§a§l>> §e修改成功!`)
                                                    return perMenu()
                                                })
                                        } else if (res.selection === 1) {
                                            landData(land)
                                        }
                                    })
                            }
                        } else if (res.selection === 1) {
                            let squ = (Math.abs(Number(x1) - Number(x2)) + 1) * (Math.abs(Number(z1) - Number(z2)))
                            let form = new ui.ActionFormData()
                                .title("§e§l領地資訊")
                                .body(`§e§l公共領地名稱 §f- §e${land.name}\n§b領地座標 §f- §bx§7:§b${x1}§f-§b${x2} | §bz§7:§b${z1}§f-§b${z2} §f(§e${squ} 格§f)\n§a§l權限管理:\n\n§a公共:\n§a建築/破壞:${land.permission.build}\n§a容器:${land.permission.container}\n§a飛行:${land.permission.fly}\n§a傳送點設置:${land.permission.portal}`)
                                .button("§7§l返回")
                                .show(player).then(res => {
                                    if (!res || res.selection === 0) return landData(land);
                                })
                        }
                    })
            }
        })
    }
}

/**
 * 
 * @param {mc.Player} player 
 */
export function listLandUI(player) {
    let form = new ui.ActionFormData()
        .title("§b§l選擇維度")
        .button("§a§l主世界")
        .button("§c§l地獄")
        .button("§b§l終界")
        .show(player).then(res => {
            if (res.selection === 0) menu('overworld')
            if (res.selection === 1) menu('nether')
            if (res.selection === 2) menu('end')
        })
    function menu(dime) {
        /**
         * @type {string[]}
         */
        let lands
        if (dime == 'overworld') lands = worldlog.getScoreboardPlayers("lands").disname
        if (dime == 'nether') lands = worldlog.getScoreboardPlayers("lands_nether").disname
        if (dime == 'end') lands = worldlog.getScoreboardPlayers("lands_end").disname
        let form = new ui.ActionFormData()
            .title("§e§l領地管理")
        form.button("§b§l搜尋")
        for (let land of lands) {
            let data = getLandData(land)
            form.button(`§e§l領地名 §7- §e${data.name}\n§b§l擁有者 §7- §b${data.player}`)
        }
        form.button("§7§l返回")
        form.show(player).then(res => {
            if (res.canceled) return;
            if (res.selection === 0) {
                return searchLand()
            }
            if (res.selection === lands.length + 1) return listLandUI(player)

            return forme(lands[res.selection-1], dime)


            function searchLand() {
                let form = new ui.ModalFormData()
                    .title('§b§l搜尋領地')
                    .textField("§e§l輸入關鍵詞", "關鍵詞", "")
                    .toggle("§e§l搜尋領地名稱")
                    .toggle("§e§l搜尋玩家名稱")
                    .show(player).then(res => {
                        if (res.canceled) return menu(dime)
                        let text = res.formValues[0]
                        let searchTypes = {
                            landName: res.formValues[1],
                            user: res.formValues[2],
                        }
                        let newLands = []
                        let form = new ui.ActionFormData()
                            .title("§e§l搜尋結果")
                            .body(`§e§l以下是有關 §f"§b${text}§f" §e的搜尋結果`)
                        for (let land of lands) {
                            let data = getLandData(land)
                            let check = true
                            if (searchTypes.landName) {
                                if (data.name.includes(text)) {
                                    newLands.push(land)
                                    check = false
                                }
                            }

                            if (searchTypes.user && check) {
                                if (data.player.includes(text)) {
                                    newLands.push(land)
                                    check = false
                                }
                            }
                        }
                        for (let land of newLands) {
                            let landData = getLandData(land)
                            let landName = ''
                            let playerName = ''
                            if (searchTypes.name) {
                                for (let name of landData.name.replaceAll(text, `_${text}_`).split('_')) {
                                    if (name == text) {
                                        landName += `§b${name}`
                                    } else {
                                        landName += `§e${name}`
                                    }
                                }
                            } else { landName = `§e${landData.name}` };

                            if (searchTypes.user) {
                                for (let name of landData.player.replaceAll(text, `_${text}_`).split('_')) {
                                    if (name == text) {
                                        playerName += `§b${name}`
                                    } else {
                                        playerName += `§e${name}`
                                    }
                                }
                            } else { playerName = `§e${landData.player}` };
                            form.button(`§e§l領地名 §7- §e${landName}\n§e§l擁有者 §7- §b${playerName}`)
                        }
                        form.button("§7§l返回")
                        form.show(player).then(res2 => {
                            if (res2.selection === newLands.length) return menu(dime)
                            if (res2.canceled) return;
                            forme(newLands[res2.selection], dime)
                        })
                    })
            }
        })
        /**
         * @param {string} landText
         * @param {'overworld' | 'nether' | 'end'} dime 
         */
        function forme(landText, dime) {
            let land = getLandData(landText)
            let landID = 'lands'
            let display = ''
            if (dime == 'nether') {
                landID += '_nether'
                display = '§f(§c§l地獄§f)'
            }
            if (dime == 'end') {
                landID += '_end'
                display = '§f(§a§l終界§f)'
            }
            let form = new ui.ActionFormData()
                .title("§e§l管理領地 §f- " + data.name)
                .body(`§e§l領地名稱 §7- §e${data.name}\n§b§l擁有者 §7- §b${data.player}`)
                .button('§c§l刪除', 'textures/ui/realms_red_x.png')
                .button('§e§l查看', 'textures/ui/magnifyingGlass.png')
                .show(player).then(res => {
                    if (res.selection === 0) {
                        remove()
                    } else if (res.selection === 1) {
                        list()
                    }
                })

            function remove() {
                let form = new ui.MessageFormData()
                    .title("§c§l刪除領地確認")
                    .body(`§e§l您正在執行刪除領地 §b${land.name} §e的動作\n§e是否刪除?\n\n§c警告:一旦刪除後就不能復原!`)
                    .button1("§a§l刪除")
                    .button2("§c§l返回")
                    .show(player).then(res => {
                        if (res.selection === 1) {
                            let name = transfromLand(land)
                            let error = true
                            let squ = (Math.abs(Number(land.pos.x[1]) - Number(land.pos.x[2])) + 1) * (Math.abs(Number(land.pos.z[1]) - Number(land.pos.z[2])) + 1)
                            cmd(`scoreboard players reset "${name}" ${landID}`).then(() => {
                                player.runCommandAsync(`scoreboard players add @s "land_squ" -${squ}`)
                                player.runCommandAsync(`scoreboard players add @s "land_land" -1`)
                                for (let pl of mc.world.getPlayers()) {
                                    for (let tag of pl.getTags()) {
                                        if (tag.startsWith('{"inLand":') && tag.includes(JSON.stringify(land.pos)) && tag.includes(land.UID) && tag.includes(land.name)) {
                                            pl.removeTag(tag)
                                            pl.runCommandAsync(`ability @s mayfly false`)
                                            logfor(pl.name, `§3§l>> §e所在領地被刪除!`)
                                        }
                                    }
                                }
                                error = false
                                return logfor(player.name, `§c§l>> §e刪除成功!`);
                            }
                            )
                            mc.system.runTimeout(() => {
                                if (error) {
                                    logfor(player.name, `§c§l>> §e領地刪除失敗!\n§e請修復領地，然後再試一次!`)
                                }
                            }, 1000)
                        }
                        if (res.selection === 0 || res.canceled) {
                            return menu()
                        }

                    })
            }

            function list() {
                let lands = getPlayerLands(player, dime)
                let form = new ui.ActionFormData()
                    .title("§e§l查看領地")
                    .body("§e§l權限大小 §f- §e建築>容器>飛行 傳送點獨立 (例如設定建築權限後 容器與飛行權限將會視為開啟)")
                for (let land of lands) {
                    let x1 = Math.max(land.pos.x[1], land.pos.x[2])
                    let x2 = Math.min(land.pos.x[1], land.pos.x[2])
                    let z1 = Math.max(land.pos.z[1], land.pos.z[2])
                    let z2 = Math.min(land.pos.z[1], land.pos.z[2])
                    if (land.old) {
                        form.button(`§b§l[請立即修復§f]\n§e§l領地名稱 §f- §e${land.name}`)
                    } else {
                        form.button(`§e§l領地名稱 §f- §e${land.name}\n§b領地座標 §f- §bx§7:§b${x1}§f-§b${x2} | §bz§7:§b${z1}§f-§b${z2}`)
                    }
                }
                form.show(player).then(res => {
                    if (!res || res.canceled) return;
                    let land = lands[res.selection]
                    landData(land)
                    /**
                     * 
                     * @param {{name: string, pos: {x: {1: string, 2: string},z: {1: string, 2: string},},UID: string,player: string | false,permission: {build: string,container: string,portal: string, fly: string}, users: false | [{username: string,permission: {build: string, container: string, portal: string, fly: string}}], public: boolean, old: boolean}} land 
                     */
                    function landData(land) {
                        let x1 = Math.max(land.pos.x[1], land.pos.x[2])
                        let x2 = Math.min(land.pos.x[1], land.pos.x[2])
                        let z1 = Math.max(land.pos.z[1], land.pos.z[2])
                        let z2 = Math.min(land.pos.z[1], land.pos.z[2])
                        let form = new ui.ActionFormData()
                            .title("§e§l領地")
                            .button("§e§l權限管理")
                            .button("§e§l查看領地資訊")
                            .button("§c§l踢出領地")
                            .button("§7§l返回")
                        if (land.old) {
                            form.button("§a§l修復領地")
                        }
                        form.show(player).then(res => {
                            if (res.selection === 3 || !res || res.canceled) return list();
                            if (res.selection === 4) {
                                for (let l2 of worldlog.getScoreboardPlayers(landID).disname) {
                                    let data = getLandData(l2)
                                    let check = true
                                    if (data.name != land.name) check = false;
                                    if (data.player != land.player) check = false;
                                    if (data.pos.x[1] != land.pos.x[1]) check = false;
                                    if (data.pos.x[2] != land.pos.x[2]) check = false;
                                    if (data.UID != land.UID) check = false;
                                    if (check) {
                                        cmd(`scoreboard players reset "${l2}" ${landID}`)
                                        cmd(`scoreboard players set "${transfromLand(land)}" ${landID} ${land.UID}`)
                                        logfor(player.name, `§a§l>> §e修復成功!`)
                                        break;
                                    }
                                }
                            }
                            if (res.selection === 0) {
                                perMenu()
                                function perMenu() {
                                    let form = new ui.ActionFormData()
                                        .title("§e§l權限管理")
                                        .button("§e§l個人")
                                        .button("§e§l公共")
                                        .button("§7§l返回")
                                        .show(player).then(res => {
                                            if (res.selection === 0) {
                                                Personal()
                                                function Personal() {
                                                    let form = new ui.ActionFormData()
                                                        .title("§e§l個人權限設定")
                                                        .button("§a§l新增")
                                                        .button("§c§l刪除")
                                                        .button("§b§l修改")
                                                        .button("§7§l返回")
                                                        .show(player).then(res => {
                                                            if (res.selection === 0) {
                                                                let form = new ui.ActionFormData()
                                                                    .title("§a§l新增玩家")
                                                                    .button("§e§l手動新增")
                                                                    .button("§a§l線上玩家")
                                                                    .button("§7§l返回")
                                                                    .show(player).then(res => {
                                                                        if (res.selection === 0) {
                                                                            let form = new ui.ModalFormData()
                                                                                .title("§e§l手動新增玩家")
                                                                                .textField("§e§l輸入玩家名稱", "§e§l名稱")
                                                                                .show(player).then(res => {
                                                                                    if (!res || res.canceled || res.formValues[0] == '') return Personal();
                                                                                    let name = res.formValues[0]
                                                                                    for (let user of land.users) {
                                                                                        if (user.username == name) {
                                                                                            logfor(player.name, '§c§l>> §e名稱重複!')
                                                                                            return Personal()
                                                                                        }
                                                                                    }
                                                                                    cmd(`scoreboard players reset "${transfromLand(land)}" ${landID}`)
                                                                                    land.users.push({ username: name, permission: { build: `false`, container: `false`, portal: `false`, fly: `false` } })
                                                                                    cmd(`scoreboard players set "${transfromLand(land)}" ${landID} ${land.UID}`).then(() => {
                                                                                        logfor(player.name, '§a§l>> §e設定成功!')
                                                                                        return Personal();
                                                                                    })
                                                                                })
                                                                        } else if (res.selection === 1) {
                                                                            let players = []
                                                                            let form = new ui.ActionFormData()
                                                                                .title("§a§l線上玩家新增")
                                                                            for (let player of mc.world.getPlayers()) {
                                                                                let check = true
                                                                                for (let user of land.users) {
                                                                                    if (user.username == player.name) {
                                                                                        check = false
                                                                                    }
                                                                                }
                                                                                if (check) {
                                                                                    players.push(player.name)
                                                                                }
                                                                            }
                                                                            for (let player of players) {
                                                                                form.button(`§e§l${player}`)
                                                                            }
                                                                            if (players.length == 0) {
                                                                                return logfor(player.name, `§c§l>> §e沒有玩家可新增!`)
                                                                            }
                                                                            form.show(player).then(res => {
                                                                                if (res.canceled || !res) return;
                                                                                let selePlayer = players[res.selection]
                                                                                cmd(`scoreboard players reset "${transfromLand(land)}" ${landID}`)
                                                                                land.users.push({ username: selePlayer, permission: { build: `false`, container: `false`, portal: `false`, fly: `false` } })
                                                                                cmd(`scoreboard players set "${transfromLand(land)}" ${landID} ${land.UID}`).then(() => {
                                                                                    logfor(player.name, '§a§l>> §e設定成功!')
                                                                                    return Personal();
                                                                                })
                                                                            })
                                                                        } else if (res.selection === 2) {
                                                                            Personal()
                                                                        }
                                                                    })
                                                            } else if (res.selection === 1) {
                                                                let players = []
                                                                let form = new ui.ActionFormData()
                                                                    .title("§c§l刪除玩家")
                                                                for (let user of land.users) {
                                                                    if (user.username != player.name) {
                                                                        form.button(`§e§l${user.username}`)
                                                                        players.push(user)
                                                                    }
                                                                }
                                                                if (players.length == 0) {
                                                                    return logfor(player.name, `§c§l>> §e沒有玩家可刪除`)
                                                                }
                                                                form.show(player).then(res => {
                                                                    if (res.canceled || !res) return;
                                                                    let selePlayer = players[res.selection]
                                                                    cmd(`scoreboard players reset "${transfromLand(land)}" ${landID}`)
                                                                    let newUsers = land.users.filter(item => item.username !== selePlayer.username);
                                                                    land.users = newUsers
                                                                    cmd(`scoreboard players set "${transfromLand(land)}" ${landID} ${land.UID}`)
                                                                    logfor(player.name, `§a§l>> §e刪除成功!`)
                                                                })
                                                            } else if (res.selection === 2) {
                                                                permissionChange()
                                                                function permissionChange() {
                                                                    let players = []
                                                                    let form = new ui.ActionFormData()
                                                                        .title('§e§l修改權限')
                                                                    for (let user of land.users) {
                                                                        // if (user.username != land.player) {
                                                                        form.button(`§e§l${user.username}`)
                                                                        players.push(user)
                                                                        // }
                                                                    }
                                                                    if (players.length == 0) {
                                                                        return logfor(player.name, '§c§l>> §e沒有玩家可以修改!')
                                                                    }
                                                                    form.show(player).then(res => {
                                                                        function changeBoolean(text) {
                                                                            if (text == "true") {
                                                                                return true
                                                                            }
                                                                            return false
                                                                        }
                                                                        if (res.canceled || !res) return Personal();
                                                                        let selePlayer = players[res.selection]
                                                                        let form = new ui.ModalFormData()
                                                                            .title(`§e§l權限設定 - 設定玩家 - ${selePlayer.username}`)
                                                                            .toggle(`§b建築/破壞權限`, changeBoolean(selePlayer.permission.build))
                                                                            .toggle('§b§l容器交互權限', changeBoolean(selePlayer.permission.container))
                                                                            .toggle("§b§l飛行權限", changeBoolean(selePlayer.permission.fly))
                                                                            .toggle('§b§l傳送點設置權限', changeBoolean(selePlayer.permission.portal))
                                                                            .show(player).then(res => {
                                                                                if (!res || res.canceled) return Personal();
                                                                                let build = res.formValues[0]
                                                                                let container = res.formValues[1]
                                                                                let fly = res.formValues[2]
                                                                                let portal = res.formValues[3]
                                                                                cmd(`scoreboard players reset "${transfromLand(land)}" ${landID}`)
                                                                                let newUsers = land.users.filter(item => item.username !== selePlayer.username);
                                                                                land.users = newUsers
                                                                                land.users.push({ username: selePlayer.username, permission: { build: `${build}`, container: `${container}`, portal: `${portal}`, fly: `${fly}` } })
                                                                                cmd(`scoreboard players set "${transfromLand(land)}" ${landID} ${land.UID}`).then(() => {
                                                                                    logfor(player.name, `§a§l>> §e設定成功!`)
                                                                                    return Personal();
                                                                                })
                                                                            })
                                                                    })
                                                                }
                                                            } else if (res.selection === 3) {
                                                                perMenu()
                                                            }
                                                        })
                                                }

                                            } else if (res.selection === 1) {
                                                function changeBoolean(text) {
                                                    if (text == 'true') {
                                                        return true
                                                    }
                                                    return false
                                                }
                                                let form = new ui.ModalFormData()
                                                    .title("§e§l公共權限設定")
                                                    .toggle("§b§l建築/破壞權限", changeBoolean(land.permission.build))
                                                    .toggle("§b§l容器交互權限", changeBoolean(land.permission.container))
                                                    .toggle("§b§l飛行權限", changeBoolean(land.permission.fly))
                                                    .toggle("§b§l傳送點設置權限", changeBoolean(land.permission.portal))
                                                    .show(player).then(res => {
                                                        if (!res || res.canceled) return perMenu();
                                                        let build = res.formValues[0]
                                                        let container = res.formValues[1]
                                                        let fly = res.formValues[2]
                                                        cmd(`scoreboard players reset "${transfromLand(land)}" ${landID}`)
                                                        land.permission.build = `${build}`
                                                        land.permission.container = `${container}`
                                                        land.permission.portal = `${res.formValues[3]}`
                                                        land.permission.fly = `${fly}`
                                                        cmd(`scoreboard players set "${transfromLand(land)}" ${landID} ${land.UID}`)
                                                        logfor(player.name, `§a§l>> §e修改成功!`)
                                                        return perMenu()
                                                    })
                                            } else if (res.selection === 2) {
                                                landData(land)
                                            }
                                        })
                                }
                            } else if (res.selection === 1) {
                                let user = []
                                for (let u of land.users) {
                                    let name = u.username
                                    let permission = u.permission
                                    user.push(`§e§l玩家§f: §e${name} §7| §b建築§f/§b破壞§f: §b${permission.build} §b容器§f: §b${permission.container} §b飛行 §f- §b${permission.fly} §b傳送點設置權§f: §b${permission.portal}`)
                                }
                                let squ = (Math.abs(Number(x1) - Number(x2)) + 1) * (Math.abs(Number(z1) - Number(z2)))
                                let form = new ui.ActionFormData()
                                    .title("§e§l領地資訊")
                                    .body(`§e§l領地名稱 §f- §e${land.name}\n§b領地座標 §f- §bx§7:§b${x1}§f-§b${x2} | §bz§7:§b${z1}§f-§b${z2} §f(§e${squ} 格§f)\n§a§l權限管理:\n\n§a公共:\n§a建築/破壞:${land.permission.build}\n§a容器:${land.permission.container}\n§a飛行:${land.permission.fly}\n§a傳送點設置:${land.permission.portal}\n\n§a個人:\n${user.join("\n")}`)
                                    .button("§7§l返回")
                                    .show(player).then(res => {
                                        if (!res || res.selection === 0) return landData(land);
                                    })
                            } else if (res.selection === 2) {
                                /**
                                 * @type {mc.Player[]}
                                 */
                                let players = []
                                for (let pl of mc.world.getPlayers()) {
                                    let playerPos = pl.location
                                    let data = land
                                    let x1 = Math.max(Number(data.pos.x[1]), Number(data.pos.x[2]))
                                    let x2 = Math.min(Number(data.pos.x[1]), Number(data.pos.x[2]))
                                    let z1 = Math.max(Number(data.pos.z[1]), Number(data.pos.z[2]))
                                    let z2 = Math.min(Number(data.pos.z[1]), Number(data.pos.z[2]))
                                    if (Math.floor(playerPos.x) <= x1 && Math.floor(playerPos.x) >= x2) {
                                        if (Math.floor(playerPos.z) <= z1 && Math.floor(playerPos.z) >= z2) {
                                            if (pl.name != player.name) {
                                                players.push(pl)
                                            }
                                        }
                                    }
                                }
                                if (players.length == 0) {
                                    return logfor(player.name, '§c§l>> §e領地內暫無玩家!')
                                }
                                let form = new ui.ActionFormData()
                                    .title('§c§l踢出領地')
                                for (let player of players) {
                                    form.button(`§e§l${player.name}`)
                                }
                                form.show(player).then(res => {
                                    if (res.canceled || !res) return landData(land);
                                    let data = land
                                    let x1 = Math.max(Number(data.pos.x[1]), Number(data.pos.x[2]))
                                    let x2 = Math.min(Number(data.pos.x[1]), Number(data.pos.x[2]))
                                    let z1 = Math.max(Number(data.pos.z[1]), Number(data.pos.z[2]))
                                    let z2 = Math.min(Number(data.pos.z[1]), Number(data.pos.z[2]))
                                    /**
                                     * @type {mc.Player}
                                     */
                                    let selePlayer = players[res.selection]
                                    let getPos = { x: Number(land.pos.x[getRandomIntInclusive(1, 2)]), z: Number(land.pos.z[getRandomIntInclusive(1, 2)]) }
                                    let addSelection = getRandomIntInclusive(1, 2)
                                    let add = getRandomIntInclusive(55, 200)
                                    if (addSelection == 1) { // x改變
                                        // 偵測範圍
                                        let get = getPos.x + add
                                        if (get <= x1 && get >= x2) {
                                            get = getPos.x - add
                                        }
                                        getPos.x = get
                                    } else { // z改變
                                        let get = getPos.z + add
                                        if (get <= z1 && get >= z2) {
                                            get = getPos.z - add
                                        }
                                        getPos.z = get
                                    }
                                    selePlayer.runCommandAsync(`spreadplayers ${getPos.x} ${getPos.z} 0.000000001 1 @s`).then(() => {
                                        logfor(selePlayer.name, `§c§l>> §e您已被 §b${player.name} §e踢出領地`)
                                        logfor(player.name, '§a§l>> §e執行成功!')
                                        return landData(land)
                                    })
                                })
                            }
                        })
                    }
                })
            }
        }
    }
}