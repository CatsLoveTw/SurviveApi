import * as mc from '@minecraft/server'
import { cmd, log, logfor } from '../../lib/GametestFunctions'
import { checkAccountActive, checkLogin, login } from './functions'
import { loginSession } from './classes'
import { playerDB } from '../../config'

export const chatCommands = [
    // §
    {
        command: 'logout',
        des: '登出帳戶 (特殊)',
        values: [
            ["<空>"]
        ],
        adminOnly: false,
        loginOnly: false,
        run:
            /**
            @param {mc.Player} player
            @param {string} message
            */
            function (player, message, error) {
                if (!checkAccountActive()) return logfor(player.name, "§c§l>> §e無法使用該系統!")
                if (!checkLogin(player)) return logfor(player.name, `§c§l>> §e您還沒有登入帳戶!`)
                if (checkLogin(player).id == -1) return logfor(player.name, `§c§l>> §e訪客帳號無法登出!`)
                const db = playerDB.table(player.id)
                db.removeData("loginSession")
                player.runCommandAsync(`tp @s 0 300 0`)
                logfor(player.name, `§b§l>> §e登出成功!`)
            }
    }
]