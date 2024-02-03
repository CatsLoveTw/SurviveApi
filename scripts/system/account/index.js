import { cmd, log } from '../../lib/GametestFunctions.js'
import { worldlog } from '../../lib/function.js'
import Event from '../eventBuild.js'
import './login.js'
import * as mc from '@minecraft/server'

// 偵測WebSocket是否斷開連接
cmd(`scoreboard players set connect websocketcheck 0`)
mc.system.runInterval(() => {
    let ch1 = worldlog.getScoreFromMinecraft('connect', 'websocketcheck')
    if (!ch1) {
        cmd(`scoreboard players set connect websocketcheck 0`)
    }
    if (ch1.score == 1) {
        cmd(`scoreboard players set connect websocketcheck 0`)
        mc.system.runTimeout(() => {
            let check = worldlog.getScoreFromMinecraft('connect', 'websocketcheck')
            if (check.score == 0) {
                log('§l§eWebSocket §7> §c已斷開連接!')
            }
        }, 100)
    }
}, 101)