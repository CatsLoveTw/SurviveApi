import * as mc from '@minecraft/server'
import { cmd, log, logfor } from '../../lib/GametestFunctions'
import { checkAccountActive, login } from './functions'

export const chatCommands = [
    // §
    {
        command: 'login',
        des: '登入帳戶 (特殊)',
        values: [
            ["<帳號OMID>"],
            ["<帳號密碼>"]
        ],
        adminOnly: false,
        run:
            /**
            @param {mc.Player} player
            @param {string} message
            */
            function (player, message, error) {
                if (!checkAccountActive()) return logfor(player.name, "§c§l>> §e無法使用該系統!")
                let args = message.split(" ")
                let omid = args[1]
                let password = args[2]
                if (!omid || omid == '') {
                    return error()
                }
                if (!password || password == '') {
                    return error()
                }

                login(player, omid, password)
            }
    }
]