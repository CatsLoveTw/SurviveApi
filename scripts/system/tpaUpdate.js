import { system, world } from "@minecraft/server"
import * as mc from '@minecraft/server'
import { worldlog } from "../lib/function"
import { cmd, log, logfor } from "../lib/GametestFunctions"
import { tpaSetting } from "../games/tpa/defind"
import { playerDB } from "../config"

mc.system.runInterval(() => {
    for (let player of mc.world.getAllPlayers()) {
        const db = playerDB.table(player.id), tpaSet = db.getData("tpaSetting")
        if (tpaSet && tpaSet.value) {
            let check = tpaSetting.check_old_and_update(tpaSet.value)
            if (check.run && check.old) {
                db.setData("tpaSetting", check.newJSON)
                logfor(player.name, `§a§l>> §e已成功更新您的TPA設定!`)
            } 
        }
    }
}, 60)