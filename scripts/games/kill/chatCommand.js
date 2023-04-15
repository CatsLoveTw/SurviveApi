import * as mc from '@minecraft/server'
import { cmd, log, logfor } from '../../lib/GametestFunctions'


// 轉帳系統tag 給錢: {"senderTM": {"value": number, "sender": string, "target": string, "startTime": number}}
// 收到錢: {"targetTM": {"value": number, "sender": string, "target": string, "startTime": number}}
// value 轉帳金額 sender 轉帳人 target 收帳者 startTime 開始時間
export const chatCommands = [
    // §
    {
        command: 'kill',
        des: '自殺',
        values: [
            ["kill"],
        ],
        adminOnly: false,
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