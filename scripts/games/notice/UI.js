import * as mc from '@minecraft/server'
import * as ui from '@minecraft/server-ui'
import { worldlog } from '../../lib/function'
import { cmd, log, logfor } from '../../lib/GametestFunctions'



/**
 * 
 * @param {string} notice 
 */
export function getNoticeData (notice) {
    //title:.___.message:
    let args = notice.split('.___.')
    let title = args[0].replace("title:", "")
    let message = args[1].replace("message:", '')
    return {
        title: title,
        message: message
    }
} 

/**
 * 
 * @param {{title: string, message: string}} noticeData 
 */
function transfromNotice (noticeData) {
    let title = noticeData.title
    let message = noticeData.message
    return `title:${title}.___.message:${message}`
}

/**
 * 
 * @param {mc.Player} player 
 */
export function adminUI (player) {
    let notices = worldlog.getScoreboardPlayers('notice').disname
    let form = new ui.ActionFormData()
        .title("§e§l新增公告")
        .button("§a§l新增")
    for (let notice of notices) {
        let getData = getNoticeData(notice)
        let message = getData.message
        if (message.length > 20) {
            message = message.slice(0, 20)
            message += '...'
        }
        form.button(`§e§l標題 §f- §e${getData.title}\n§e內容 §f- §e${message}`)
    }
    form.show(player).then(res => {
        if (res.selection === 0) {
            let form = new ui.ModalFormData()
            .title("§e§l新增公告")
            .textField('§e§l編輯標題', '標題')
            .textField('§e§l編輯內容', '內容')
            .show(player).then(res => {
                let title = res.formValues[0].trim()
                let message = res.formValues[1].trim()
                if (title == '' || message == '') return logfor(player.name, `§c§l>> §e標題或內容不可為空!`)
                cmd(`scoreboard players set "title:${title}.___.message:${message}" notice 0`)
                for (let player of mc.world.getAllPlayers()) {
                    player.runCommandAsync(`tellraw @s {"rawtext":[{"text":"§f§l---§e伺服器公告新增§f---\n§e標題 §7- §f${title}\n§e內容 §7- §f${message}"}]}`)
                }
                return logfor(player.name, `§a§l>> §e新增成功!`)
            })
        }

        if (res.canceled) return;
        /**
         * @type {string}
         */
        let notice = notices[res.selection-1]
        let getData = getNoticeData(notice)
        let form = new ui.ModalFormData()
            .title("§e§l編輯公告 §f- §e" + getData.title)
            .textField('§e§l編輯標題', '標題', getData.title)
            .textField('§e§l編輯內容', '內容', getData.message)
            .toggle('§c§l刪除', false)
            .show(player).then(res => {
                let title = res.formValues[0].trim()
                let message = res.formValues[1].trim()
                let deleteCheck = res.formValues[2]
                if (deleteCheck) {
                    cmd(`scoreboard players reset "${notice}" notice`)
                    return logfor(player.name, `§a§l>> §e刪除成功!`)
                }
                if (title == '' || message == '') return logfor(player.name, `§c§l>> §e標題或內容不可為空!`)
                cmd(`scoreboard players reset "${notice}" notice`)
                getData.message = message
                getData.title = title
                cmd(`scoreboard players set "${transfromNotice(getData)}" notice 0`)
                for (let player of mc.world.getAllPlayers()) {
                    player.runCommandAsync(`tellraw @s {"rawtext":[{"text":"§f§l---§e伺服器公告更改§f---\n§e標題 §7- §f${title}\n§e內容 §7- §f${message}"}]}`)
                }
                return logfor(player.name, `§a§l>> §e設定成功!`)
            })
    })
}