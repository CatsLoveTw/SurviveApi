import * as mc from '@minecraft/server'
import * as ui from '@minecraft/server-ui'
import { getRandomIntInclusive, worldlog } from '../../lib/function.js'
import { log, cmd, logfor, addSign } from '../../lib/GametestFunctions.js'
import { playerDB } from '../../config.js'

const rtpTime = 30

export const chatCommands = [
    {
        command: 'sendmessage',
        des: '發送動態訊息',
        values: [
            ["<訊息>"]
        ],
        adminOnly: false,
        loginOnly: true,
        run:
            /**
            @param {mc.Player} player
            @param {string} message
            */
            function (player, message, error) {
                const args = message.split(" ")
                addSign(args[1], player, 60)
            }
    }
]