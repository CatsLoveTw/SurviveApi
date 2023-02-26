import * as mc from '@minecraft/server'
import * as ui from '@minecraft/server-ui'
import { worldlog } from '../../lib/function.js'
import { log, cmd, logfor } from '../../lib/GametestFunctions.js'

// 在這個檔案內 unix為1970/1/1至今的毫秒數

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

/**
 * 
 * @param {mc.Player} player 
 */
function getPlayerLands(player) {
    let lands = worldlog.getScoreboardPlayers("lands").disname
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
        let form = new ui.ActionFormData()
            .title("§e§l領地系統")
            .body(`§e§l您已經建造了 §b${getSqu}§f/§b${getSquMax} §e格 §f/ §b${getlands}§f/§b${getlandsMax} §e塊領地`)
            .button("§a§l新增")
            .button('§c§l刪除')
            .button('§e§l查看')
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
    }

    function add() {
        let form = new ui.ModalFormData()
            .title("§a§l新增領地")
            .textField(`§e§l輸入領地名稱`, `§e§l名稱`)
        form.show(player).then(res => {
            if (player.dimension.id != 'minecraft:overworld') {
                return logfor(player.name, `§c§l>> §e領地不可建於地獄或終界!`)
            }
            for (let tag of player.getTags()) {
                if (tag.includes('{"landCreate":{')) {
                    let data = JSON.parse(tag)
                    return logfor(player.name, `§c§l>> §e您的領地建造項目 §b${data.landCreate.name} §e還未結束!`)
                }
            }
            if (!res) return;

            let name = res.formValues[0].trim()
            let playerLands = getPlayerLands(player)
            if (name == '') {
                return logfor(player.name, `§c§l>> §e領地名稱不得為空!`)
            }
            for (let land of playerLands) {
                if (land.name == name) {
                    return logfor(player.name, `§c§l>> §e領地名稱重複!`)
                }
            }
            // createTag: {"landCreate":{"at": number(unixtime), "name": string, "step": number}}
            let json = {
                "landCreate": {
                    "at": new Date().getTime(),
                    "name": name,
                    "step": 1
                }
            }
            player.addTag(JSON.stringify(json))
            logfor(player.name, `§a§l>> §e放置隨意方塊在地面即可設置領地範圍 §f(§6建議使用泥土§f)`);
        })
    }

    function remove() {
        if (getPlayerLands(player).length == 0) {
            return logfor(player.name, '§c§l>> §e您還沒有領地!')
        }
        let lands = getPlayerLands(player)
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
                        let squ = (Math.abs(Number(land.pos.x[1]) - Number(land.pos.x[2])) + 1) * (Math.abs(Number(land.pos.z[1]) - Number(land.pos.z[2])) + 1)
                        cmd(`scoreboard players reset "${name}" lands`);
                        player.runCommandAsync(`scoreboard players add @s "land_squ" -${squ}`)
                        player.runCommandAsync(`scoreboard players add @s "land_land" -1`)
                        return logfor(player.name, `§c§l>> §e刪除成功!`);
                    }
                    return menu()
                })
        })
    }

    function list() {
        let lands = getPlayerLands(player)
        let form = new ui.ActionFormData()
            .title("§e§l查看領地")
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
             * @param {{name: string, pos: {x: {1: string, 2: string},z: {1: string, 2: string},},UID: string,player: string | false,permission: {build: string,container: string,action: string}, users: false | [{username: string,permission: {build: string, container: string, action: string}}], public: boolean}} land 
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
                    .button("§7§l返回")
                    .show(player).then(res => {
                        if (res.selection === 2 || !res || res.canceled) return list();
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
                                                                                        logfor (player.name, '§c§l>> §e名稱重複!')
                                                                                        return Personal()
                                                                                    }
                                                                                }
                                                                                cmd(`scoreboard players reset "${transfromLand(land)}" lands`)
                                                                                land.users.push({username: name, permission: {build: "false", container: "false", action: "true"}})
                                                                                cmd(`scoreboard players set "${transfromLand(land)}" lands ${land.UID}`).then(() => {
                                                                                    logfor (player.name, '§a§l>> §e設定成功!')
                                                                                    return Personal();
                                                                                })
                                                                            })
                                                                    } else if (res.selection === 1) {
                                                                        let players = []
                                                                        let form = new ui.ActionFormData()
                                                                            .title("§a§l線上玩家新增")
                                                                            for (let player of mc.world.getAllPlayers()) {
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
                                                                                return logfor (player.name, `§c§l>> §e沒有玩家可新增!`)
                                                                            }
                                                                            form.show(player).then(res => {
                                                                                if (res.canceled || !res) return;
                                                                                let selePlayer = players[res.selection]
                                                                                cmd(`scoreboard players reset "${transfromLand(land)}" lands`)
                                                                                land.users.push({username: selePlayer, permission: {build: "false", container: "false", action: "true"}})
                                                                                cmd(`scoreboard players set "${transfromLand(land)}" lands ${land.UID}`).then(() => {
                                                                                    logfor (player.name, '§a§l>> §e設定成功!')
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
                                                                return logfor (player.name, `§c§l>> §e沒有玩家可刪除`)
                                                            }
                                                            form.show(player).then(res => {
                                                                if (res.canceled || !res) return;
                                                                let selePlayer = players[res.selection]
                                                                cmd(`scoreboard players reset "${transfromLand(land)}" lands`)
                                                                let newUsers = land.users.filter(item => item.username !== selePlayer.username);
                                                                land.users = newUsers
                                                                cmd(`scoreboard players set "${transfromLand(land)}" lands ${land.UID}`)
                                                                logfor(player.name, `§a§l>> §e刪除成功!`)
                                                            })
                                                        } else if (res.selection === 2) {
                                                            permissionChange()
                                                            function permissionChange() {
                                                                let players = []
                                                                let form = new ui.ActionFormData()
                                                                    .title('§e§l修改權限')
                                                                for (let user of land.users) {
                                                                    if (user.username != land.player) {
                                                                        form.button(`§e§l${user.username}`)
                                                                        players.push(user)
                                                                    }
                                                                }
                                                                if (players.length == 0) {
                                                                    return logfor (player.name, '§c§l>> §e沒有玩家可以修改!')
                                                                }
                                                                form.show(player).then(res => {
                                                                    function changeBoolean (text) {
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
                                                                        .show(player).then(res => {
                                                                            if (!res || res.canceled) return Personal();
                                                                            let build = res.formValues[0]
                                                                            let container = res.formValues[1]
                                                                            cmd(`scoreboard players reset "${transfromLand(land)}" lands`)
                                                                            let newUsers = land.users.filter(item => item.username !== selePlayer.username);
                                                                            land.users = newUsers
                                                                            land.users.push({username: selePlayer.username, permission: {build: `${build}`, container: `${container}`, action: "true"}})
                                                                            cmd(`scoreboard players set "${transfromLand(land)}" lands ${land.UID}`).then(() => {
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
                                            function changeBoolean (text) {
                                                if (text == 'true') {
                                                    return true
                                                } 
                                                return false
                                            }
                                            let form = new ui.ModalFormData()
                                                .title("§e§l公共權限設定")
                                                .toggle("§b§l建築/破壞權限", changeBoolean(land.permission.build))
                                                .toggle("§b§l容器交互權限", changeBoolean(land.permission.container))
                                                .show(player).then(res => {
                                                    if (!res || res.canceled) return perMenu();
                                                    let build = res.formValues[0]
                                                    let container = res.formValues[1]
                                                    cmd(`scoreboard players reset "${transfromLand(land)}" lands`)
                                                    land.permission.build = `${build}`
                                                    land.permission.container = `${container}`
                                                    cmd(`scoreboard players set "${transfromLand(land)}" lands ${land.UID}`)
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
                                user.push(`§e§l玩家§f: §e${name} §7| §b建築§f/§b破壞§f: §b${permission.build} §b容器§f: §b${permission.container}`)
                            }
                            let squ = (Math.abs(Number(x1) - Number(x2)) + 1) * (Math.abs(Number(z1) - Number(z2)))
                            let form = new ui.ActionFormData()
                                .title("§e§l領地資訊")
                                .body(`§e§l領地名稱 §f- §e${land.name}\n§b領地座標 §f- §bx§7:§b${x1}§f-§b${x2} | §bz§7:§b${z1}§f-§b${z2} §f(§e${squ} 格§f)\n§a§l權限管理:\n\n§a公共:\n§a建築/破壞:${land.permission.build}\n§a容器:${land.permission.container}\n\n§a個人:\n${user.join("\n")}`)
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