import * as mc from '@minecraft/server'
import * as ui from '@minecraft/server-ui'
import { worldlog } from '../../lib/function.js'
import { log, cmd, logfor } from '../../lib/GametestFunctions.js'
import { checkInLand } from '../land/build.js'
import { getLandData } from '../land/UI.js'
import * as playerUI from '../UI/player.js'

/**
 * 
 * @param {mc.Player} player 
 * @param {"over" | "nether" | "end"} dimension
 * @returns {string[]}
 */
export function getHomes(player, dimension) {
    let tags = []
    for (let tag of player.getTags()) {
        if (tag.startsWith('{"home":')) {
            /**
             * @type {{"home": {"name": string, "pos": {"x": number, "y": number, "z": number}, land: {name: string, pos: {x: {1: string, 2: string},z: {1: string, 2: string},},UID: string,player: string | false,permission: {build: string,container: string,portal: string}, users: false | [{username: string,permission: {build: string, container: string, portal: string}}], public: boolean}, dime: "over" | "nether" | "end"}}}
             */
            let data = JSON.parse(tag)
            if (data.home.dime == dimension) {
                tags.push(tag)
            }
        }
    }
    return tags
}

/**
 * 
 * @param {string} home
 * @returns {{dime: 'over' | 'nether' | 'end', name: string, pos: {x: string, y: string, z: string}, land: {name: string, pos: {x: {1: string, 2: string},z: {1: string, 2: string},},UID: string,player: string | false,permission: {build: string,container: string,portal: string}, users: [{username: string,permission: {build: string, container: string, portal: string}}], public: boolean}}}
 */
export function getPublicHomeData(home) {
    let args = home.split('___')
    let dime = args[0]
    let name = args[1]
    let pos = args[2]
    let land = args[3]

    let e = pos.split("|")
    let x = e[0]
    let y = e[1]
    let z = e[2]
    /**
     * @type {{name: string, pos: {x: {1: string, 2: string},z: {1: string, 2: string},},UID: string,player: string | false,permission: {build: string,container: string,portal: string}, users: false | [{username: string,permission: {build: string, container: string, portal: string}}], public: boolean}}
     */
    let landData = {}
    let getLandScoreBoard = ''
    land = land.replace(":", '')
    let LANDargs = land.split("_,_")
    let LANDNAME = LANDargs[0].replace("land", '')
    let LANDPOS = LANDargs[1].split("/")
    let LAND1POS = LANDPOS[0].split("|")
    let LAND2POS = LANDPOS[1].split("|")
    let LANDpos = {
        x: LAND1POS[0],
        z: LAND1POS[1],
        x2: LAND2POS[0],
        z2: LAND2POS[1],
    }
    let LANDPLAYRER = LANDargs[2]
    let LANDUID = LANDargs[3]

    if (dime != 'over') {
        getLandScoreBoard = '_' + dime
    }
    for (let seleLand of worldlog.getScoreboardPlayers('lands' + getLandScoreBoard).disname) {
        let landD = getLandData(seleLand)
        let check = true
        if (landD.name != LANDNAME) check = false;
        if (landD.UID != LANDUID) check = false;
        if (landD.player != LANDPLAYRER) check = false;
        if (landD.pos.x[1] != LANDpos.x) check = false;
        if (landD.pos.z[1] != LANDpos.z) check = false;
        if (landD.pos.x[2] != LANDpos.x2) check = false;
        if (landD.pos.z[2] != LANDpos.z2) check = false;
        if (check) {
            landData = landD
        }
    }

    return {
        dime: dime,
        name: name,
        pos: { x: x, y: y, z: z },
        land: landData
    }
}

/**
 * 
 * @param {mc.Player} player
 * @param {'over' | 'nether' | 'end'} dime 
 * @returns {string}
 */
export function findPlayerPublicHome(player, dime) {
    let homes = []
    let getHomes = worldlog.getScoreboardPlayers('publicHome').disname
    for (let home of getHomes) {
        let getData = getPublicHomeData(home)
        if (getData.land.player == player.name && getData.dime == dime) {
            homes.push(home)
        }
    }
    return homes
}

/**
 * 
 * @param {mc.Player} player 
 */
export function UI(player) {
    // {"home": {"name": string, "pos": {"x": number, "y": number, "z": number}, land: {name: string, pos: {x: {1: string, 2: string},z: {1: string, 2: string},},UID: string,player: string | false,permission: {build: string,container: string,portal: string}, users: false | [{username: string,permission: {build: string, container: string, portal: string}}], public: boolean}, dime: "over" | "nether" | "end"}}
    // dime = over | nether | end
    let text = ''
    let homes = ''
    let dime = 'over'
    if (player.dimension.id.toLowerCase() == mc.MinecraftDimensionTypes.overworld) {
        homes = getHomes(player, "over")
    }
    if (player.dimension.id.toLowerCase() == mc.MinecraftDimensionTypes.nether) {
        dime = 'nether'
        text = ' ??f(??c????????f)'
        homes = getHomes(player, "nether")
    }
    if (player.dimension.id.toLowerCase() == mc.MinecraftDimensionTypes.theEnd) {
        dime = 'end'
        text = ' ??f(??a????????f)'
        homes = getHomes(player, "end")
    }
    let form = new ui.ActionFormData()
        .title("??e??l?????????" + text)
        .button("??e??l???????????????")
        .button("??e??l???????????????")
        .show(player).then(res => {
            if (res.selection === 0) {
                let form = new ui.ActionFormData()
                    .title("??e??l?????????" + text)
                    .button("??a??l??????", 'textures/ui/imagetaggedcornergreen.png')
                    // .button('??c??l??????', 'textures/ui/realms_red_x.png')
                    // .button('??e??l??????', 'textures/ui/share_google.png')
                    .button('??b??l??????', 'textures/ui/magnifyingGlass.png')
                    .show(player).then(res => {
                        if (res.canceled) return playerUI.playerUI(player);
                        if (res.selection === 0) {
                            let land = checkInLand(player)
                            if (!land) return logfor(player.name, `??c??l>> ??e??????????????????????????????!`)
                            // ????????????
                            for (let tag of player.getTags()) {
                                if (tag.startsWith('{"inLand":')) {
                                    /**
                                     * @type {{inLand: {land: {name: string, pos: {x: {1: string, 2: string},z: {1: string, 2: string},},UID: string,player: string | false,permission: {build: string,container: string,action: string}, users: false | [{username: string,permission: {build: string, container: string, action: string}}], public: boolean}, per: {build: string, container: string, portal: string}}}}
                                     */
                                    let landData = JSON.parse(tag)
                                    if (landData.inLand.per.portal == "false") {
                                        return logfor(player.name, `??c??l>> ??e??????????????????????????????????????????!`)
                                    }
                                }
                            }

                            let form = new ui.ModalFormData()
                                .title("??e??l???????????????")
                                .textField("??e??l?????????????????????", '??????')
                                .show(player).then(res => {
                                    if (res.canceled) return;
                                    let name = res.formValues[0]
                                    let homeJSON = {
                                        "home": {
                                            "name": name,
                                            "pos": {
                                                "x": player.location.x,
                                                "y": player.location.y,
                                                "z": player.location.z
                                            },
                                            land: land,
                                            dime: dime
                                        }
                                    }
                                    player.addTag(JSON.stringify(homeJSON))
                                    logfor(player.name, `??a??l>> ??e????????????!`)
                                })
                        }
                        if (res.selection === 1) {
                            form1()
                            function form1() {
                                let homes = getHomes(player, dime)
                                if (homes.length == 0) return logfor(player.name, `??c??l>> ??e????????????????????????!`)
                                let form = new ui.ActionFormData()
                                    .title("??e??l?????????")
                                for (let home of homes) {
                                    /**
                                     * @type {{"home": {"name": string, "pos": {"x": number, "y": number, "z": number}, land: {name: string, pos: {x: {1: string, 2: string},z: {1: string, 2: string},},UID: string,player: string | false,permission: {build: string,container: string,portal: string}, users: false | [{username: string,permission: {build: string, container: string, portal: string}}], public: boolean}, dime: "over" | "nether" | "end"}}}
                                     */
                                    let getData = JSON.parse(home)
                                    let seleHome = getData.home
                                    let x = Math.trunc(seleHome.pos.x)
                                    let y = Math.trunc(seleHome.pos.y)
                                    let z = Math.trunc(seleHome.pos.z)
                                    form.button(`??e??l?????? ??f- ??e${seleHome.name}\n??bx??f: ??b${x} ??f| ??by??f: ??b${y} ??f| ??bz??f: ??b${z}`)
                                }
                                form.button('??7??l??????')
                                form.show(player).then(res => {
                                    if (res.canceled) return;
                                    if (res.selection === homes.length) {
                                        return UI(player)
                                    }
                                    form2()
                                    function form2() {
                                        /**
                                         * @type {string}
                                         */
                                        let home = homes[res.selection]
                                        /**
                                         * @type {{"home": {"name": string, "pos": {"x": number, "y": number, "z": number}, land: {name: string, pos: {x: {1: string, 2: string},z: {1: string, 2: string},},UID: string,player: string | false,permission: {build: string,container: string,portal: string}, users: false | [{username: string,permission: {build: string, container: string, portal: string}}], public: boolean}, dime: "over" | "nether" | "end"}}}
                                         */
                                        let getData = JSON.parse(home)
                                        let seleHome = getData.home
                                        let x = Math.trunc(seleHome.pos.x)
                                        let y = Math.trunc(seleHome.pos.y)
                                        let z = Math.trunc(seleHome.pos.z)
                                        let form = new ui.ActionFormData()
                                            .title(`??e??l????????? ??f- ??e${getData.home.name}`)
                                            .body(`??e??l??????????????? ??f- ??e${getData.home.name}\n??b??l??????????????? ??f- ??bx??f: ??b${x} ??f| ??by??f: ??b${y} ??f| ??bz??f: ??b${z}\n??f?????????????????????:\n??e???????????? ??f- ??e${seleHome.land.name}\n??a??????????????? ??f- ??a${seleHome.land.player}`)
                                            .button("??a??l??????", 'textures/blocks/portal_placeholder.png')
                                            .button("??c??l??????", 'textures/ui/realms_red_x.png')
                                            .button("??e??l??????", 'textures/ui/share_google.png')
                                            .button("??7??l??????", 'textures/ui/arrow_right.png')
                                            .show(player).then(res => {
                                                if (res.canceled) return;
                                                if (res.selection === 0) {
                                                    for (let postag of player.getTags()) {
                                                        if (postag.startsWith('{"back":')) {
                                                            player.removeTag(postag)
                                                        }
                                                    }
                                                    let json = {
                                                        "back": {
                                                            "x": seleHome.pos.x,
                                                            "y": seleHome.pos.y,
                                                            "z": seleHome.pos.z
                                                        }
                                                    }
                                                    player.addTag(JSON.stringify(json))
                                                    player.runCommandAsync(`tp @s ${seleHome.pos.x} ${seleHome.pos.y} ${seleHome.pos.z}`)
                                                    logfor(player.name, `??a??l>> ??e????????????!`)
                                                }
                                                if (res.selection === 1) {
                                                    player.removeTag(home)
                                                    logfor(player.name, `??a??l>> ??e????????????!`)
                                                }
                                                if (res.selection === 2) {
                                                    let otherPlayers = []
                                                    let form = new ui.ActionFormData()
                                                        .title("??e??l??????????????? ??f- ??e" + getData.home.name)
                                                    for (let otherPlayer of mc.world.getAllPlayers()) {
                                                        if (otherPlayer != player) {
                                                            form.button(`??e??l${otherPlayer.name}`)
                                                            otherPlayers.push(otherPlayer)
                                                        }
                                                    }
                                                    if (otherPlayers.length === 0) {
                                                        return logfor(player.name, `??c??l>> ??e????????????????????????!`)
                                                    }
                                                    form.button("??7??l??????")
                                                    form.show(player).then(res => {
                                                        if (res.canceled) return;
                                                        if (res.selection === otherPlayers.length) return form2()
                                                        /**
                                                         * @type {mc.Player}
                                                         */
                                                        let other = otherPlayers[res.selection]

                                                        let sourceMessage = `??e????????? ??b${other.name} ??e?????????????????????????????????...`
                                                        let sharedMessage = `??b${player.name} ??e??????????????????????????? ??f- ??e${getData.home.name}`

                                                        let shareJSON = {
                                                            "homeShare": {
                                                                "source": player.name,
                                                                "sharedName": other.name,
                                                                "duration": 30,
                                                                "startTime": new Date().getTime(),
                                                                "homeData": getData
                                                            }
                                                        }
                                                        let sharedJSON = {
                                                            "homeShared": {
                                                                "source": player.name,
                                                                "sharedName": other.name,
                                                                "duration": 30,
                                                                "startTime": new Date().getTime(),
                                                                "homeData": getData
                                                            }
                                                        }
                                                        let shareMessageSend = { "news": sourceMessage, tick: 0, maxtick: 30 * 20 }
                                                        let sharedMessageSend = { "news": sharedMessage, tick: 0, maxtick: 30 * 20 }

                                                        player.addTag(JSON.stringify(shareJSON))
                                                        player.addTag(JSON.stringify(shareMessageSend))
                                                        other.addTag(JSON.stringify(sharedJSON))
                                                        other.addTag(JSON.stringify(sharedMessageSend))
                                                        logfor(player.name, `??a??l>> ??e???????????????????????????????????????... ??f(??e???????????? ??b-sharehome delete ??e??????????????f)`)
                                                        logfor(other.name, `??3??l>> ??b${player.name} ??e???????????????????????????????????? ??a-sharehome accept ?????? ??c-sharehome deny ??????...`)
                                                    })
                                                }
                                                if (res.selection === 3) {
                                                    form1()
                                                }
                                            })
                                    }
                                })
                            }
                        }
                    })
            }
            if (res.selection === 1) {
                publicUI(player)
            }
    })
}

/**
 * 
 * @param {mc.Player} player 
 */
export function publicUI (player) {
    // ????????? publicHome ??????:dime___name___x|y|z___land:name_,_posx|posz/posx2|posz2_,_player_,_UID
    // dime = 'over' | 'nether' | 'end'
    let getDime = 'over'
    let list = ''
    if (player.dimension.id.toLowerCase() == mc.MinecraftDimensionTypes.nether) {
        list = ' ??f(??c??l????????f)'
        getDime = 'nether'
    }
    if (player.dimension.id.toLowerCase() == mc.MinecraftDimensionTypes.theEnd) {
        list = ' ??f(??a??l????????f)'
        getDime = 'end'
    }
    let form = new ui.ActionFormData()
        .title("??a??l???????????????" + list)
        .button("??a??l??????", 'textures/ui/imagetaggedcornergreen.png')
        .button('??b??l?????? - ?????????', 'textures/ui/magnifyingGlass.png')
        .button('??b??l?????? - ??????', 'textures/ui/magnifyingGlass.png')
        .show(player).then(res => {
            try {
            if (res.canceled) return;
            if (res.selection === 0) {
                let land = checkInLand(player)
                if (!land) return logfor(player.name, `??c??l>> ??e??????????????????????????????!`)
                // ????????????
                for (let tag of player.getTags()) {
                    if (tag.startsWith('{"inLand":')) {
                        /**
                         * @type {{inLand: {land: {name: string, pos: {x: {1: string, 2: string},z: {1: string, 2: string},},UID: string,player: string | false,permission: {build: string,container: string,action: string}, users: false | [{username: string,permission: {build: string, container: string, action: string}}], public: boolean}, per: {build: string, container: string, portal: string}}}}
                         */
                        let landData = JSON.parse(tag)
                        if (landData.inLand.land.player != player.name) {
                            return logfor(player.name, `??c??l>> ??e????????????????????????????????????!`)
                        } 
                        for (let home of worldlog.getScoreboardPlayers('publicHome').disname) {
                            let data = getPublicHomeData(home)
                            if (data.land.name == landData.inLand.land.name && data.land.UID == landData.inLand.land.UID && data.land.player == landData.inLand.land.player) {
                                let dataPOS = data.land.pos
                                let landDataPOS = landData.inLand.land.pos
                                if (dataPOS.x[1] == landDataPOS.x[1] && dataPOS.x[2] == landDataPOS.x[2] && dataPOS.z[1] == landDataPOS.z[1] && dataPOS.z[2] == landDataPOS.z[2])
                                return logfor(player.name, `??c??l>> ??e???????????????????????? ??b1 ??e??????????????????!`)
                            }
                        }
                    }
                }
                
                // ????????? publicHome ??????:dime___name___x|y|z___land:name_,_posx|posz/posx2|posz2_,_player_,_UID
                let form = new ui.ModalFormData()
                    .title("??a??l?????????????????????")
                    .textField("??e??l????????????", '??????')
                    .show(player).then(res => {
                        if (res.canceled) return;
                        /**
                         * @type {string}
                         */
                        let name = res.formValues[0].trim()
                        if (name == '' || !name) return logfor(player.name, `??c??l>> ??e??????????????????!`)
                        let x = player.location.x
                        let y = player.location.y
                        let z = player.location.z
                        /**
                         * @type {{x: {1: string, 2: string}, z: {1: string, 2: string}}}
                         */
                        let landPos = land.pos
                        let texts = `${getDime}___${name}___${x}|${y}|${z}___land:${land.name}_,_${landPos.x[1]}|${landPos.z[1]}/${landPos.x[2]}|${landPos.z[2]}_,_${land.player}_,_${land.UID}`
                        cmd(`scoreboard players set "${texts}" publicHome ${land.UID}`)
                        logfor(player.name, `??a??l>> ??e???????????????????????????!`)
                    })
            }
            if (res.selection === 1) {
                lookForServerPublicHome()
                function lookForServerPublicHome() {
                    let homes = worldlog.getScoreboardPlayers('publicHome').disname
                    if (homes.length === 0) return logfor(player.name, `??c??l>> ??e?????????????????????????????????!`)
                    let form = new ui.ActionFormData()
                        .title("??e??l??????????????????????????????")
                        .button("??b??l??????")
                    for (let home of homes) {
                        let homeData = getPublicHomeData(home)
                        let text = `??e??l?????? ??f- ??e${homeData.name} ??7| ??a????????? ??f- ??e${homeData.land.player}\n??e????????? ??f- ??e${homeData.land.name}`
                        form.button(text)
                    }
                    form.button("??7??l??????")
                    form.show(player).then(res => {
                        if (res.selection === homes.length+1) return publicUI(player);
                        if (res.selection === 0) {
                            try {
                            let form = new ui.ModalFormData()
                                .title("??e??l??????????????? ??f- ??e??????")
                                .textField("??e??l??????????????????", '??????')
                                .toggle("??b??l?????????????????????", true)
                                .toggle("??b??l???????????????")
                                .toggle("??b??l??????????????????")
                                .toggle("??7??l??????")
                                .show(player).then(res => {
                                    let newHomes = []
                                    if (res.canceled) return;
                                    let text = res.formValues[0]
                                    let searchTypes = {
                                        name: res.formValues[1],
                                        user: res.formValues[2],
                                        landName: res.formValues[3]
                                    }
                                    let form = new ui.ActionFormData()
                                        .title("??e??l????????????")
                                        .body(`??e??l??????????????? ??f"??b${text}??f" ??e???????????????`)
                                    if (res.formValues[4]) {
                                        return lookForServerPublicHome()
                                    }
                                    for (let home of homes) {
                                        let data = getPublicHomeData(home)
                                        let check = true
                                        if (searchTypes.name) {
                                            if (data.name.includes(text)) {
                                                newHomes.push(home)
                                                check = false
                                            }
                                        }

                                        if (searchTypes.user && check) {
                                            if (data.land.player.includes(text)) {
                                                newHomes.push(home)
                                                check = false
                                            }
                                        }

                                        if (searchTypes.landName && check) {
                                            if (data.land.name.includes(text)) {
                                                newHomes.push(home)
                                                check = false
                                            }
                                        }
                                    }
                                    for (let home of newHomes) {
                                        let homeData = getPublicHomeData(home)
                                        let homeName = ''
                                        let player = ''
                                        let landName = ''
                                        if (searchTypes.name) {
                                            for (let name of homeData.name.replaceAll(text, `_${text}_`).split('_')) {
                                                if (name == text) {
                                                    homeName += `??b${name}`
                                                } else {
                                                    homeName += `??e${name}`
                                                }
                                            }
                                        } else {homeName = `??e${homeData.name}`};

                                        if (searchTypes.user) {
                                            for (let name of homeData.land.player.replaceAll(text, `_${text}_`).split('_')) {
                                                if (name == text) {
                                                    player += `??b${name}`
                                                } else {
                                                    player += `??e${name}`
                                                }
                                            }
                                        } else {player = `??e${homeData.land.player}`};
                                        if (searchTypes.landName) {
                                            for (let name of homeData.land.name.replaceAll(text, `_${text}_`).split('_')) {
                                                if (name == text) {
                                                    landName += `??b${name}`
                                                } else {
                                                    landName += `??e${name}`
                                                }
                                            }
                                        } else {landName = `??e${homeData.land.name}`};
                                        let text2 = `??e??l?????? ??f- ??e${homeName} ??7| ??a????????? ??f- ??e${player}\n??e????????? ??f- ??e${landName}`
                                        form.button(text2)
                                    }
                                    form.button("??7??l??????")
                                    form.show(player).then(res => {
                                        if (res.selection === newHomes.length) return lookForServerPublicHome();
                                        list(newHomes[res.selection])
                                    })
                                })
                            } catch (e) {log(e)}
                        }
                        if (res.selection != 0) {
                            let home = homes[res.selection - 1]
                            list(home)
                        }
                        function list (home) {
                        let homeData = getPublicHomeData(home)
                        
                        let permission = `\n??b??l??????/???????????? ??f- ??b${homeData.land.permission.build}\n??b??l???????????? ??f- ??b${homeData.land.permission.container}\n??b??l????????????????????? ??f- ??b${homeData.land.permission.portal}`
                        let description = `??e??l??????????????? ??f- ??e${homeData.name}\n??a??l????????? ??f- ??a${homeData.land.player}\n??e????????? ??f- ??e${homeData.land.name}\n??b?????????????????? ??f- ??b${permission}`
                        let form = new ui.ActionFormData()
                            .title(`??e??l?????????????????????????????? ??f- ??e${homeData.name}`)
                            .body(description)
                            .button("??a??l??????", 'textures/blocks/portal_placeholder.png')
                            .button("??7??l??????", 'textures/ui/arrow_right.png')
                            .show(player).then(res => {
                                if (res.canceled || res.selection === 1) return lookForServerPublicHome();
                                if (res.selection === 0) {
                                    for (let postag of player.getTags()) {
                                        if (postag.startsWith('{"back":')) {
                                            player.removeTag(postag)
                                        }
                                    }
                                    let x = homeData.pos.x
                                    let y = homeData.pos.y
                                    let z = homeData.pos.z
                                    let json = {
                                        "back": {
                                            "x": x,
                                            "y": y,
                                            "z": z
                                        }
                                    }
                                    player.addTag(JSON.stringify(json))
                                    player.runCommandAsync(`tp @s ${x} ${y} ${z}`)
                                    logfor(player.name, `??a??l>> ??e????????????!`)
                                }
                            })
                        }
                    })
                }
            }
            if (res.selection === 2) {
                lookForPersonalHome()
                function lookForPersonalHome () {
                    let homes = findPlayerPublicHome(player, getDime)
                    if (homes.length === 0) return logfor(player.name, `??c??l>> ??e????????????????????????!`);
                    let form = new ui.ActionFormData()
                        .title("??e??l?????????????????????")
                        .button("??b??l??????")
                    for (let home of homes) {
                        let homeData = getPublicHomeData(home)
                        let text = `??e??l?????? ??f- ??e${homeData.name} ??7| ??e????????? ??f- ??e${homeData.land.name}`
                        form.button(text)
                    }
                    form.button("??7??l??????")
                    form.show(player).then(res => {
                        if (res.selection === homes.length + 1) return publicUI(player);
                        if (res.selection === 0) {
                            try {
                            let form = new ui.ModalFormData()
                                .title("??e??l??????????????? ??f- ??e??????")
                                .textField("??e??l??????????????????", '??????')
                                .toggle("??b??l?????????????????????", true)
                                .toggle("??b??l??????????????????")
                                .toggle("??7??l??????")
                                .show(player).then(res => {
                                    let newHomes = []
                                    if (res.canceled) return;
                                    let text = res.formValues[0]
                                    let searchTypes = {
                                        name: res.formValues[1],
                                        landName: res.formValues[2]
                                    }
                                    let form = new ui.ActionFormData()
                                        .title("??e??l????????????")
                                        .body(`??e??l??????????????? ??f"??b${text}??f" ??e???????????????`)
                                    if (res.formValues[3]) {
                                        return lookForPersonalHome()
                                    }
                                    for (let home of homes) {
                                        let data = getPublicHomeData(home)
                                        let check = true
                                        if (searchTypes.name) {
                                            if (data.name.includes(text)) {
                                                newHomes.push(home)
                                                check = false
                                            }
                                        }

                                        if (searchTypes.landName && check) {
                                            if (data.land.name.includes(text)) {
                                                newHomes.push(home)
                                                check = false
                                            }
                                        }
                                    }
                                    for (let home of newHomes) {
                                        let homeData = getPublicHomeData(home)
                                        let homeName = ''
                                        let landName = ''
                                        if (searchTypes.name) {
                                            for (let name of homeData.name.replaceAll(text, `_${text}_`).split('_')) {
                                                if (name == text) {
                                                    homeName += `??b${name}`
                                                } else {
                                                    homeName += `??e${name}`
                                                }
                                            }
                                        } else {homeName = `??e${homeData.name}`};
                                        if (searchTypes.landName) {
                                            for (let name of homeData.land.name.replaceAll(text, `_${text}_`).split('_')) {
                                                if (name == text) {
                                                    landName += `??b${name}`
                                                } else {
                                                    landName += `??e${name}`
                                                }
                                            }
                                        } else {landName = `??e${homeData.land.name}`};
                                        let text2 = `??e??l?????? ??f- ??e${homeName} ??7| ??e????????? ??f- ??e${landName}`
                                        form.button(text2)
                                    }
                                    form.button("??7??l??????")
                                    form.show(player).then(res => {
                                        if (res.selection === newHomes.length) return lookForServerPublicHome();
                                        list(newHomes[res.selection])
                                    })
                                })
                            } catch (e) {log(e)}
                        }
                        if (res.selection != 0) {
                            let home = homes[res.selection - 1]
                            list(home)
                        }
                        function list(home) {
                            let homeData = getPublicHomeData(home)

                            let permission = `\n??b??l??????/???????????? ??f- ??b${homeData.land.permission.build}\n??b??l???????????? ??f- ??b${homeData.land.permission.container}\n??b??l????????????????????? ??f- ??b${homeData.land.permission.portal}`
                            let description = `??e??l??????????????? ??f- ??e${homeData.name}\n??a??l????????? ??f- ??a${homeData.land.player}\n??e????????? ??f- ??e${homeData.land.name}\n??b?????????????????? ??f- ??b${permission}`
                            let form = new ui.ActionFormData()
                                .title(`??e??l?????????????????????????????? ??f- ??e${homeData.name}`)
                                .body(description)
                                .button("??a??l??????", 'textures/blocks/portal_placeholder.png')
                                .button("??c??l??????", 'textures/ui/realms_red_x.png')
                                .button("??7??l??????", 'textures/ui/arrow_right.png')
                                .show(player).then(res => {
                                    if (res.canceled || res.selection === 2) return lookForPersonalHome();
                                    if (res.selection === 0) {
                                        for (let postag of player.getTags()) {
                                            if (postag.startsWith('{"back":')) {
                                                player.removeTag(postag)
                                            }
                                        }
                                        let x = homeData.pos.x
                                        let y = homeData.pos.y
                                        let z = homeData.pos.z
                                        let json = {
                                            "back": {
                                                "x": x,
                                                "y": y,
                                                "z": z
                                            }
                                        }
                                        player.addTag(JSON.stringify(json))
                                        player.runCommandAsync(`tp @s ${x} ${y} ${z}`)
                                        logfor(player.name, `??a??l>> ??e????????????!`)
                                    }
                                    if (res.selection === 1) {
                                        cmd(`scoreboard players reset "${home}" publicHome`).then(() => {
                                            return logfor(player.name, `??a??l>> ??e????????????!`)
                                        })
                                    }
                                })
                        }
                    })
                }
                }
            } catch (e) {log(e)}
        } 
        
        )}