import * as mc from '@minecraft/server'
import { worldlog } from '../../lib/function'
import { cmd } from '../../lib/GametestFunctions'

// 掉落物/經驗清除

let clearTick = 0
let clearSec = 0
const setMax = 400
let clearmsg = false 
let clearTime = 60 + 1
mc.system.runInterval(() => {
    clearTick++
    let getItems = 0
    for (let item of mc.world.getDimension("overworld").getEntities({type: 'minecraft:item'})) {
        getItems++
    }
    for (let orb of mc.world.getDimension("overworld").getEntities({type: "minecraft:xp_orb"})) {
        getItems++
    }
    if (getItems < setMax) {
            const score = worldlog.getScoreboardPlayers("menu").disname
            for (let i in score) {
                if (score[i].startsWith("§e§l掉落物上限 §7-")) {
                    cmd(`scoreboard players reset "${score[i]}" menu`)
                }
                if (score[i].startsWith("§e§l掉落物清除倒數計時 §7-")) {
                    cmd (`scoreboard players reset "${score[i]}" menu`)
                    log ("§3§l>> §c掉落物數量未達上限,計時重製!")
                    clearSec = 0
                    clearmsg = false
                }
            }
            
            cmd(`scoreboard players set "§e§l掉落物上限 §7- §b${getItems}§f/§b${setMax}" menu -3`)
                
        } else {
            if (clearmsg == false) {
                let leftMin = 0
                let leftSec = clearTime - 1
                let testSec = Math.trunc(leftSec/60)
                for (let i=0; i < testSec; i++) {
                    leftMin ++
                    leftSec -= 60
                }
                if (leftSec < 10) {
                    leftSec = "0" + leftSec
                }
                if (leftMin < 10) {
                    leftMin = "0" + leftMin
                }
                mc.world.sendMessage(`§3§l>> §a掉落物將於 §b${leftMin}§f:§b${leftSec} §a後清除!`)
                clearmsg = true
            }
            try {cmd(`scoreboard players reset "§e§l掉落物上限 §7- §b${getItems - 1}§f/§b${setMax}" menu`)} catch {}
        }
    if (clearTick%20 == 0) {
        if (getItems >= setMax) {
        clearSec++

        const score = worldlog.getScoreboardPlayers("menu").disname
        for (let i in score) {
            if (score[i].startsWith("§e§l掉落物清除倒數計時 §7-")) {
                cmd(`scoreboard players reset "${score[i]}" menu`)
            }
            if (score[i].startsWith("§e§l掉落物倒數計時 §7-")) {
                cmd(`scoreboard players reset "${score[i]}" menu`)
            }
        }
       
        // 設定記分板
        let leftSec = clearTime - clearSec
        let leftMin = 0
        let testSec = Math.trunc(leftSec/60)
        for (let i=0; i < testSec; i++) {
            leftMin ++
            leftSec -= 60
    }
        if (leftSec < 10) {
            leftSec = "0" + leftSec
        }
        if (leftMin < 10) {
            leftMin = "0" + leftMin
        }
        cmd(`scoreboard players set "§e§l掉落物清除倒數計時 §7- §b${leftMin}§f:§b${leftSec}" menu -3`)
        let warringSecs = [60, 30, 10, 5, 3, 2, 1]
        let warringSec = []
        for (let sec of warringSecs) {
            warringSec.push(clearTime - sec)
        }
        if (warringSec.includes(clearSec)) {
            mc.world.sendMessage(`§3§l>> §e掉落物清除倒數計時 §f${clearTime - clearSec} §es!`)
        }
        if (clearSec == clearTime) {
            clearSec = 0
            let item = 0
            try {
            for (let entity of mc.world.getDimension("overworld").getEntities()) {
                if (entity.typeId == "minecraft:item") {
                    item += 1
                    entity.kill()
                }
                if (entity.typeId == 'minecraft:xp_orb') {
                    item += 1
                    entity.kill()
                }
            }
        } catch {}
        try {
            mc.world.sendMessage(`§3§l>> §e本次清除了 §b${item} §e個掉落物/經驗!`)
            cmd(`scoreboard players reset "§e§l掉落物清除倒數計時 §7- §b00§f:§b00" menu`)
            clearmsg = false
        } catch {}
        }
    }
    }
}, 1)