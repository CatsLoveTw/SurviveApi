import * as mc from '@minecraft/server'
import * as ui from '@minecraft/server-ui'
import { checkPoint, cmd, cmd_Dimension, deleteColor, log, logfor } from '../../lib/GametestFunctions'
import { isNum, worldlog } from '../../lib/function'
class currency {
    /**
     * 
     * @param {number} value 
     * @param {number} slot 
     * @param {number} count 
     */
    constructor(value, slot, count) {
        this.value = value
        this.slot = slot
        this.count = count
    }
    transformLore() {
        return ["§e§l現金", `§b§l價值:${this.value}$`]
    }
}

/**
 * 
 * @param {mc.Player} player 
 */
export function playerUI (player) {
    // lore[0] = §e§l現金 lore[1] = §b§l價值:number$
    
    let form = new ui.ActionFormData()
        .title("§e§l銀行系統")
        .body("§e§l若想透過物資賣錢，請前往商店系統販賣。")
        .button("§a§l存入")
        .button("§e§l提取")
        .show(player).then(res => {
            if (res.selection === 0) {
                function save() {
                    
                    /**
                     * @type {mc.EntityInventoryComponent}
                     */
                    let inv = player.getComponent('inventory')
                    /**
                     * @type {currency[]}
                     */
                    let items = []
                    for (let i = 0; i < 36; i++) {
                        try {
                            let item = inv.container.getItem(i)
                            if (item.typeId == 'minecraft:paper') {
                                if (item.getLore()[0] == '§e§l現金') {
                                    let value = deleteColor(item.getLore()[1]).replace("價值:", "").replace("$", "")
                                    items.push(new currency(value, i, item.amount))
                                }
                            }
                        } catch { }
                    }

                    if (items.length == 0) return logfor(player.name, `§c§l>> §e沒有現金可以存入!`)

                    let form = new ui.ActionFormData()
                        .title("§e§l銀行系統 §f- §e存入")
                    for (let currenc of items) {
                        form.button(`§e§l金額 §f- §e${currenc.value}$ §f/ §e1張\n§b§l共擁有 §e${currenc.count} §b張`)
                    }
                    form.button("§7§l返回")
                    form.show(player).then(res => {
                        if (res.selection === items.length) return playerUI(player)
                        if (res.canceled) return;
                        /**
                         * @type {currency}
                         */
                        let currenc = items[res.selection]
                        if (currenc.count == 1) {
                            save2(currenc, 1)
                        } else {
                            let form = new ui.ModalFormData()
                                .title("§e§l銀行系統 §f- §e存入")
                                .textField(`§e§l請輸入存入數量 §f(§b1 §7- §b${currenc.count} 個§f)`, "數量")
                                .toggle("§a§l全部存入")
                                .show(player).then(res => {
                                    if (res.canceled) return;
                                    if (res.formValues[1]) return save2(currenc, currenc.count);
                                    let count = res.formValues[0]
                                    if (count == '' || !isNum(count) || checkPoint(count) || Number(count) < 1 || Number(count) > currenc.count) return logfor(player.name, `§c§l>> §e數量參數錯誤!`)
                                    return save2(currenc, Number(count))
                                })
                        }

                        /**
                         * 
                         * @param {currency} currenc 
                         * @param {number} count
                         */
                        function save2 (currenc, count) {
                            /**
                             * @type {mc.EntityInventoryComponent}
                             */
                            let inv = player.getComponent('inventory')
                            if (currenc.count == 1) {
                                inv.container.setItem(currenc.slot)
                            } else {
                                if (currenc.count - count == 0) {
                                    inv.container.setItem(currenc.slot)
                                } else {
                                    let item = new mc.ItemStack(mc.MinecraftItemTypes.paper, currenc.count - count)
                                    item.nameTag = `§e§l現金 ${currenc.value} $`
                                    item.setLore(currenc.transformLore())
                                    inv.container.setItem(currenc.slot, item)
                                }
                            }

                            player.runCommandAsync(`scoreboard players add @s money ${currenc.value * count}`)
                            logfor(player.name, `§a§l>> §e存入成功!`)
                        }
                    })
                }
                save()
            }
            if (res.selection === 1) {
                /**
                 * @type {mc.EntityInventoryComponent}
                 */
                let inv = player.getComponent('inventory')
                let count = 0
                let slot = -1
                for (let i = 0; i < 36; i++) {
                    try {
                        let item = inv.container.getItem(i)
                        if (item) count++
                        if (!item && slot == -1) slot = i
                    } catch { 
                        if (slot == -1) {
                            slot = i
                        }
                    }
                }
                if (slot == -1) return logfor(player.name, `§c§l>> §e背包已滿!`)
                let form = new ui.ModalFormData()
                    .title("§e§l銀行系統 §f- §e提款")
                    .textField("§b§l提款現金金額為 §e您設定的提款金額 §f/ §e張\n§e請輸入提款金額", "金額")
                    .textField("§e§l請輸入提款現金數量 (1-64)", "數量")
                    .show(player).then(res => {
                        /**
                         * @type {number}
                         */
                        let nowMoney = worldlog.getScoreFromMinecraft(player.name, `money`).score
                        if (res.canceled) return;
                        let money = res.formValues[0]
                        let count = res.formValues[1]
                        if (money == '' || !isNum(money) || checkPoint(money) || Number(money) < 1) return logfor(player.name, `§c§l>> §e金額參數錯誤!`)
                        if (count == '' || !isNum(count) || checkPoint(count) || Number(count) < 1) return logfor(player.name, `§c§l>> §e數量參數錯誤!`)
                        if (Number(count) > 64) return logfor(player.name, `§c§l>> §e目前數量最大僅限64張，請重新輸入!`)
                        let outMoney = Number(money) * Number(count)
                        if (outMoney > nowMoney) return logfor(player.name, `§c§l>> §e金額過大!`)
                        let currenc = new currency(Number(money), slot, Number(count))
                        let item = new mc.ItemStack(mc.MinecraftItemTypes.paper, Number(count))
                        item.nameTag = `§e§l現金 ${currenc.value} $`
                        item.setLore(currenc.transformLore())
                        inv.container.setItem(currenc.slot, item)
                        player.runCommandAsync(`scoreboard players remove @s money ${outMoney}`)
                        player.sendMessage(`§a§l>> §e提取成功!`)
                    })
            }
        })
}