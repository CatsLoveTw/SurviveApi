import * as mc from '@minecraft/server'
import * as ui from '@minecraft/server-ui'
import { log, cmd, logfor } from '../../lib/GametestFunctions.js'
import { prefix } from '../../config.js'
import * as chatCommands from './export.js'
import { checkAccountActive, checkLogin } from '../../system/account/functions.js'


export function build() {
    // 
    mc.world.beforeEvents.chatSend.subscribe(events => {
        const { sender: player, message } = events;
        if (message.startsWith(prefix)) {
            events.cancel = true
            let commandtext = message.slice(prefix.length).trim()
            let command = commandtext.split(" ")[0]
            try {
                let getCommand = chatCommands[command.toLowerCase()].chatCommands[0]
                if (getCommand.loginOnly && (!checkLogin(player) && checkAccountActive())) {
                    return logfor(player.name, `§c§l>> §e您還沒有權限可以使用該指令!`)
                } 
                if (getCommand.command && !getCommand.adminOnly) {
                    const error = () => {
                        return logfor(player.name, `§e§l>> §c指令語法錯誤，請參閱 -help ${command}`)
                    }
                    try {
                        return getCommand.run(player, message, error)
                    } catch (e) { log(e) }
                }
                if (getCommand.command && getCommand.adminOnly) {
                    if (player.hasTag("admin")) {
                        const error = () => {
                            return logfor(player.name, `§e§l>> §c指令語法錯誤，請參閱 -help ${command}`)
                        }
                        try {
                            return getCommand.run(player, message, error)
                        } catch (e) { log(e) }
                    } else {
                        return logfor(player.name, `§3§l>> §c找不到該指令`)
                    }
                }
            } catch {
                logfor(player.name, `§3§l>> §c找不到該指令`)
            }
        }
    })
}