import { system, world } from "@minecraft/server"
import * as mc from '@minecraft/server'
import { worldlog } from "../lib/function"
import { cmd, log, logfor } from "../lib/GametestFunctions"
import { tpaSetting } from "../defind"

mc.system.runInterval(() => {
    for (let player of mc.world.getAllPlayers()) {
        for (let tag of player.getTags()) {
            if (tag.includes("tpaSetting")) {
                let check = new tpaSetting().check_old_and_updateTag(tag)
                if (check.old) {
                    player.removeTag(tag)
                    player.addTag(check.newTag)
                    logfor(player.name, `§a§l>> §e已成功更新您的TPA設定!`)
                } 
            }
        }
    }
}, 60)