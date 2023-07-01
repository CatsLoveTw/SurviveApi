import * as mc from '@minecraft/server'
import { world } from '@minecraft/server'
import * as ui from '@minecraft/server-ui'
import { addSign, cmd, getSign, log, logfor } from '../../lib/GametestFunctions.js'
import { worldlog } from '../../lib/function.js'
import { checkAccountActive, getAccountData, newPlayer } from './functions.js'
import { loginSession } from './classes.js'

// §
// loginSessionTag =>
// {"loginSession": {"id": number, "name": string, "omid": string}}
// omid:${result.omid}|||name:${result.name}|||password${result.password}"
// 大廳 0 -60 0 遊客區域 0 100 0

world.afterEvents.worldInitialize.subscribe(() => {
    worldlog.addScoreBoards([
        {id: 'accounts', disname: "帳號儲存"},
        {id: 'accountActive', disname: "帳號系統啟用確認"},
        {id: 'websocketcheck', disname: 'ws連線確認'}
    ])
})

world.afterEvents.playerJoin.subscribe(event => {
    if (checkAccountActive()) {
        let playerName = event.playerName
        cmd(`tp "${playerName}" 0 100 0`)
    }
})

mc.system.runInterval(() => {
    if (checkAccountActive()) {
        for (let player of world.getAllPlayers()) {
            // 帳戶偵測/登入/帳號刪除
            let check = false
            for (let tag of player.getTags()) {
                if (tag.startsWith('{"loginSession":')) {
                    function error () {
                        player.removeTag(tag)
                        logfor(player.name, `§c§l>> §e您的帳號因未知原因被刪除!`)
                        player.runCommandAsync(`tp @s 0 300 0`)
                    }
                    check = true
                    let data = loginSession.transformData(tag)

                    if (data.id == -1) {
                        newPlayer(player)
                    }

                    if (!data) {
                        mc.system.runTimeout(() => {
                            if (!data && player.hasTag(tag)) {
                                error()
                            }
                        }, 15)
                    }

                    if (getAccountData(data.id).omid != data.omid || getAccountData(data.id).name != data.name) {
                        mc.system.runTimeout(() => {
                            if ((getAccountData(data.id).omid != data.omid || getAccountData(data.id).name != data.name) && player.hasTag(tag)) {
                                error()
                            }
                        }, 15)
                    }
                }
            }
            if (!check) {
                newPlayer(player)
            }
        }
    }
}, 1)