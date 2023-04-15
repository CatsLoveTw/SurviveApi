import * as mc from '@minecraft/server'
import * as ui from '@minecraft/server-ui'
import { isNum, worldlog } from '../../lib/function'
import { checkPoint, cmd, log, logfor } from '../../lib/GametestFunctions'

export function UI (player) {
    let form = new ui.ModalFormData()
        .title("§e§l排行榜系統")
        .textField("§e§l輸入要查看排名範圍 §7(§f1-指定名次§7)", "排名", "10")
        .toggle("§b§l移除金錢為0的玩家", false)
        .show(player).then(res => {
            if (res.canceled) return;
            let rank = res.formValues[0]
            let deleteZero = res.formValues[1]
            if (!isNum(rank) || rank < 1 || checkPoint(rank)) return logfor(player.name, `§c§l>> §e名次參數錯誤!`)
            let get = worldlog.getLeaderboard('money_save', Number(rank), deleteZero)
            let text = ''
            if (get.length == 0) return logfor(player.name, `§c§l>> §e找不到您所篩選的玩家!`);
            text += `§e§l共找到 §b${get.length} §e位玩家的排行~\n`
            for (let leader of get) {
                let name = leader.name.replace(/___/g, '')
                if (name == player.name) text += `§a您目前是第 §b${leader.rank} §a名\n`
            }
            
            for (let leader of get) {
                let name = leader.name.replace(/___/g, '')
                if (name == player.name) {
                    text += `§a§l第${leader.rank}名 §f| §a金錢 §b${leader.score} §a$ §7- §a${name}`
                } else {
                    if (leader.rank == 1) text += `§e§l第${leader.rank}名 §f| §e金錢 §b${leader.score} §e$ §7- §e${name}`
                    if (leader.rank == 2) text += `§g§l第${leader.rank}名 §f| §g金錢 §b${leader.score} §g$ §7- §g${name}`
                    if (leader.rank == 3) text += `§6§l第${leader.rank}名 §f| §6金錢 §b${leader.score} §6$ §7- §6${name}`
                    if (leader.rank > 3) text += `§l第${leader.rank}名 §f| §f金錢 §b${leader.score} §f$ §7- §f${name}`
                }
            }
            let form = new ui.ActionFormData()
                .title("§e§l排行榜系統 §f- §e結果")
                .body(text)
                .button("§7§l返回")
                .button("§7§l退出")
                .show(player).then(res => {
                    if (res.selection === 0) return UI(player)
                })
        })
}