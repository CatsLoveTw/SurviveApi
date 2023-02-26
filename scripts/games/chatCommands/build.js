import * as mc from '@minecraft/server'
import * as ui from '@minecraft/server-ui'
import { log, cmd, logfor } from '../../lib/GametestFunctions.js'

import * as chatCommands from './export.js'

/**
 * 
 * @param {string} prefix 
 */
export function build(prefix) {
    // 
    mc.world.events.beforeChat.subscribe(events => {
        const { sender: player, message } = events;
        if (message.startsWith(prefix)) {
            events.cancel = true
            let commandtext = message.slice(prefix.length).trim()
            let command = commandtext.split(" ")[0]
            try {
                let getCommand = chatCommands[command].chatCommands[0]
                if (getCommand.command) {
                    const error = () => {
                        return logfor(player.name, `§e§l>> §c指令語法錯誤，請參閱 -help ${command}`)
                    }
                    try {
                        return getCommand.run(player, message, error)
                    } catch (e) { log(e) }
                }
            } catch {
                logfor(player.name, `§e§l>> §c找不到該指令`)
            }
        }
    })
}