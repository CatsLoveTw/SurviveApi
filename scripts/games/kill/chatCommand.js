import * as mc from '@minecraft/server'
import { cmd, log, logfor } from '../../lib/GametestFunctions'

export const chatCommands = [
    // §
    {
        command: 'kill',
        des: '自殺',
        values: [
            ["<空>"],
        ],
        adminOnly: false,
        loginOnly: true,
        run:
            /**
            @param {mc.Player} player
            @param {string} message
            */
            function (player, message, error) {
                player.runCommandAsync('kill @s')
                logfor(player.name, '§a§l>> §b自殺成功!')
            }
    }
]