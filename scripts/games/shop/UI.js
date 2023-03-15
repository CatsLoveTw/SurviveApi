import * as ui from '@minecraft/server-ui'
import * as mc from '@minecraft/server'
import { cmd, log, logfor } from '../../lib/GametestFunctions'
import { isNum, worldlog } from '../../lib/function'
import { playerUI } from '../UI/player'


// shopSet 紀錄 物品ID___顯示名稱___物品售出價___物品買入價___物品所屬類別

/**
 * 
 * @param {string} shopSet 
 */
function getData(shopSet) {
    let args = shopSet.split("___")
    let id = args[0]
    let displayName = args[1]
    let value = Number(args[2])
    let buyValue = Number(args[3])
    let type = args[4]
    return new item(id, displayName, value, buyValue, type)
}

/**
 * 
 * @param {string} type 
 * @returns {item[]}
 */
function getShops(type) {
    let shops = []
    for (let shop of worldlog.getScoreboardPlayers('shopSet').disname) {
        let data = getData(shop)
        if (data.type == type) {
            shops.push(data)
        }
    }
    return shops
}

class item {
    /**
     * 
     * @param {string} id 
     * @param {string} displayName 
     * @param {number} value 
     * @param {number} buyValue
     * @param {string} type
     */
    constructor(id, displayName, value, buyValue, type) {
        this.id = id
        this.displayName = displayName
        this.value = value
        this.buyValue = buyValue
        this.type = type
    }

    transfrom() {
        return `${this.id}___${this.displayName}___${this.value}___${this.buyValue}___${this.type}`
    }
}

/**
 * 
 * @param {mc.Player} player 
 * @returns {mc.EntityInventoryComponent}
 */
function getInv(player) {
    return player.getComponent("inventory")
}


/**
 * 
 * @param {mc.Player} player 
 */
export function UI(player) {
    if (player.dimension.id.toLowerCase() != mc.MinecraftDimensionTypes.overworld) return logfor(player.name, `§c§l>> §e商店功能只能在主世界使用!`)
    let types = worldlog.getScoreboardPlayers('shopTypes').disname
    if (types.length == 0) {
        return logfor(player.name, `§c§l>> §e商店還沒有任何物品可以售出或買入，請稍後再試!`)
    }
    let form = new ui.ActionFormData()
        .title('§e§l商店系統')
        .body("§e§l以下是所有的商品類型")
    for (let type of types) {
        form.button("§e§l" + type)
    }
    form.button("§7§l返回")
    form.show(player).then(res => {
        form1()
        function form1() {
            if (res.selection === types.length) return playerUI(player)
            /**
             * @type {string}
             */
            let type = types[res.selection]

            let shops = getShops(type)
            let form = new ui.ActionFormData()
                .title(`§e§l商店系統 §f- §e${type}`)
            for (let shop of shops) {
                form.button(`§e§l${shop.displayName}\n§6§l價格 §7- §6${shop.buyValue} §7| §6售出價 §7- §6${shop.value}`)
            }
            form.button("§7§l返回")
            form.show(player).then(res => {
                if (res.selection === shops.length) return UI(player)

                /**
                 * @type {item}
                 */
                let shop = shops[res.selection]

                let form = new ui.ActionFormData()
                    .title(`§e§l商店系統 §f- §e${shop.displayName}`)
                    .button(`§e§l購買 §7| §6${shop.buyValue} $`)
                    .button(`§b§l售出 §7| §6${shop.value} $`)
                    .button("§7§l返回")
                    .show(player).then(res => {
                        if (res.selection === 2) return form1()

                        if (res.selection === 0) {
                            buyUI(player, shop)
                        }

                        if (res.selection === 1) {
                            sellUI(player, shop)
                        }
                    })
            })
        }
    })
}


/**
 * 
 * @param {mc.Player} player
 * @param {item} currenc 
 * @returns 
 */
function sellUI(player, currenc) {
    let amount = 0
    /**
     * @type {mc.EntityInventoryComponent}
     */
    let getInv = player.getComponent("inventory")
    for (let i = 0; i < 36; i++) {
        try {
            if (getInv.container.getItem(i).typeId == `minecraft:${currenc.id}`) {
                amount += getInv.container.getItem(i).amount
            }
        } catch { }
    }
    if (amount == 0) {
        return logfor(player.name, `§c§l>> §e您的背包內沒有 ${currenc.displayName} §e請稍後再試!`)
    }
    let form = new ui.ModalFormData()
        .title("§e§l賣出物品 §f- " + currenc.displayName)
        .textField(`§l${currenc.value}$/1個 §f(§e§l您目前可以賣出 §b1§f-§b${amount} §e個 ${currenc.displayName}§f)`, `賣出數量`)
        .toggle('§a§l全部賣出', false)
        .show(player).then(res => {
            if (!res || res.canceled) return sellUI(player);
            let money = res.formValues[0].trim()
            let all = res.formValues[1]
            if (money == '' && !all) {
                logfor(player.name, '§c§l>> §e參數輸入錯誤!')
                return sellUI(player)
            }
            if (!isNum(money) && !all) {
                logfor(player.name, `§c§l>> §e參數輸入錯誤!`)
                return sellUI(player)
            }
            if (Number(money) > amount && !all) {
                logfor(player.name, `§c§l>> §e賣出數量不可大於擁有數量!`)
                return sellUI(player)
            }
            if (Number(money) < 1 && !all) {
                logfor(player.name, `§c§l>> §e賣出數量不得小於1!`)
                return sellUI(player)
            }
            if (all) {
                player.runCommandAsync(`clear @s ${currenc.id} 0`)
                player.runCommandAsync(`scoreboard players add @s money ${amount * currenc.value}`)
                logfor(player.name, `§a§l>> §e賣出成功! §f(§e共賣出 §b${amount} §e個§f/§b${amount * currenc.value} §e元§f)`)
                return sellUI(player)
            }
            player.runCommandAsync(`clear @s ${currenc.id} 0 ${money}`)
            player.runCommandAsync(`scoreboard players add @s money ${money * currenc.value}`)
            logfor(player.name, `§a§l>> §e賣出成功! §f(§e共賣出 §b${money} §e個§f/§b${money * currenc.value} §e元§f)`)
            return sellUI(player)
        })
}

/**
 * 
 * @param {mc.Player} player 
 * @param {item} item 
 */
function buyUI(player, item) {
    let getMoney = worldlog.getScoreFromMinecraft(player.name, 'money').score
    let limit = Math.trunc(getMoney / item.buyValue)
    let form = new ui.ModalFormData()
        .title(`§e§l購買物品 §f- ${item.displayName}`)
        .textField(`§e§l輸入購買數量 §f- ${item.buyValue}$/1個 §f(§e最多 §b${limit} §e個 ${item.displayName}§f)`, '數量')
        .show(player).then(res => {
            /**
             * @type {number}
             */
            let amount = res.formValues[0]
            if (!isNum(amount) || amount == '') return logfor(player.name, `§c§l>> §e數量必須為數值!`)
            if (amount < 1 || amount > limit) return logfor(player.name, `§c§l>> §e參數過大或過小!`)
            amount = Number(amount)

            let money = amount * item.buyValue
            player.runCommandAsync(`scoreboard players remove @s money ${money}`)
            player.runCommandAsync(`give @s ${item.id} ${amount}`)
            logfor(player.name, `§a§l>> §e購買成功!`)
        })
}

/**
 * 
 * @param {mc.Player} player 
 */
export function adminUI(player) {
    // shopSet 紀錄 物品ID___顯示名稱___物品售出價___物品買入價___物品所屬類別
    let from = new ui.ActionFormData()
        .title("§e§l商品設定")
        .button("§a§l新增")
        .button("§b§l查看")
        .show(player).then(res => {
            if (res.selection === 0) {
                let form = new ui.ActionFormData()
                    .title('§e§l商品設定 §f- §e新增')
                    .button("§e§l新增種類")
                    .button("§e§l新增商品")
                    .show(player).then(res => {
                        if (res.selection === 0) {
                            let types = worldlog.getScoreboardPlayers('shopTypes').disname
                            let form = new ui.ModalFormData()
                                .title("§e§l新增種類")
                                .textField("§e§l輸入種類", "種類")
                                .show(player).then(res => {
                                    let text = res.formValues[0]
                                    if (text == '') return logfor(player.name, `§c§l>> §e種類不得為空!`)
                                    for (let type of types) {
                                        if (text == type) return logfor(player.name, `§c§l>> §e名稱重複`)
                                    }
                                    cmd(`scoreboard players set "${text}" shopTypes 0`)
                                    return logfor(player.name, `§a§l>> §e新增成功!`)
                                })
                        }

                        if (res.selection === 1) {
                            let types = worldlog.getScoreboardPlayers('shopTypes').disname
                            let shops = worldlog.getScoreboardPlayers('shopSet').disname
                            if (types.length == 0) return logfor(player.name, `§c§l>> §e找不到商品種類!`)
                            let form = new ui.ModalFormData()
                                .title('§e§l新增商品')
                                .textField("§e§l輸入物品ID (例如:diamond_sword)", "ID")
                                .textField("§e§l輸入要顯示的物品名稱", "名稱")
                                .textField("§e§l輸入商品購買價", '價格')
                                .textField("§e§l輸入商品售出價", "價格")
                                .dropdown("§e§l選擇商品種類", types, 0)
                                .show(player).then(res => {
                                    let id = res.formValues[0]
                                    let displayName = res.formValues[1]
                                    let buyValue = res.formValues[2]
                                    let sellValue = res.formValues[3]
                                    let type = types[res.formValues[4]]

                                    // shopSet 紀錄 物品ID___顯示名稱___物品售出價___物品買入價___物品所屬類別
                                    if (id == '' || displayName == '' || buyValue == '' || sellValue == '') return logfor(player.name, `§c§l>> §e參數不可為空!`)
                                    if (!isNum(buyValue) || !isNum(sellValue)) return logfor(player.name, `§c§l>> §e價格必須為數字!`)
                                    for (let shop of shops) {
                                        let data = getData(shop)
                                        if (data.id == id) {
                                            return logfor(player.name, `§c§l>> §e物品ID重複!`)
                                        }
                                    }
                                    cmd(`scoreboard players set "${id}___${displayName}___${sellValue}___${buyValue}___${type}" shopSet 0`)
                                    return logfor(player.name, `§a§l>> §e新增成功!`)
                                })
                        }
                    })
            }

            if (res.selection === 1) {
                form1()
                function form1() {
                    let form = new ui.ActionFormData()
                        .title('§e§l商品設定 §f- §b查看')
                        .button("§e§l查看種類")
                        .button("§e§l查看商品")
                        .show(player).then(res => {
                            if (res.selection === 0) {
                                let types = worldlog.getScoreboardPlayers('shopTypes').disname
                                if (types.length == 0) return logfor(player.name, `§c§l>> §e找不到商品種類!`)
                                form2()
                                function form2() {
                                    let form = new ui.ActionFormData()
                                        .title(`§e§l查看商品種類`)
                                    for (let type of types) {
                                        form.button(`§e§l${type}`)
                                    }
                                    form.button('§7§l返回')
                                    form.show(player).then(res => {
                                        form3()
                                        function form3() {
                                            if (res.selection === types.length) return form1(player)
                                            if (res.canceled) return;
                                            /**
                                             * @type {string}
                                             */
                                            let type = types[res.selection]
                                            let form = new ui.ActionFormData()
                                                .title('§e§l編輯商品種類 §f- §e' + type)
                                                .button("§b§l修改")
                                                .button("§c§l刪除")
                                                .button("§7§l返回")
                                                .show(player).then(res => {
                                                    if (res.selection === 2) return form2()

                                                    if (res.selection === 0) {
                                                        let types = worldlog.getScoreboardPlayers('shopTypes').disname
                                                        let form = new ui.ModalFormData()
                                                            .title("§e§l修改種類")
                                                            .textField("§e輸入新的種類名稱", "種類名稱", type)
                                                            .show(player).then(res => {
                                                                let text = res.formValues[0]
                                                                if (text == '') return logfor(player.name, `§c§l>> §e種類不得為空!`)
                                                                for (let type of types) {
                                                                    if (text == type) return logfor(player.name, `§c§l>> §e名稱重複`)
                                                                }
                                                                cmd(`scoreboard players reset "${type}" shopTypes`)
                                                                // 更改商品所屬種類
                                                                for (let shop of worldlog.getScoreboardPlayers('shopSet').disname) {
                                                                    let data = getData(shop)
                                                                    if (data.type == type) {
                                                                        cmd(`scoreboard players reset "${shop}" shopSet`)
                                                                        data.type = text
                                                                        cmd(`scoreboard players set "${data.transfrom()}" shopSet 0`)
                                                                    }
                                                                }
                                                                cmd(`scoreboard players set "${text}" shopTypes 0`)
                                                                return logfor(player.name, `§a§l>> §e修改成功!`)
                                                            })
                                                    }

                                                    if (res.selection === 1) {
                                                        let form = new ui.MessageFormData()
                                                            .title("§e§l刪除種類確認")
                                                            .body("§c§l請注意，種類刪除會連帶到該種類之商品，是否刪除?")
                                                            .button1("§a§l刪除")
                                                            .button2("§c§l取消")
                                                            .show(player).then(res => {
                                                                if (res.canceled) return
                                                                if (res.selection == 1) {
                                                                    for (let shop of getShops(type)) {
                                                                        cmd(`scoreboard players reset "${shop.transfrom()}" shopSet`)
                                                                    }
                                                                    cmd(`scoreboard players reset "${type}" shopTypes`)

                                                                    logfor(player.name, `§a§l>> §e刪除成功!`)
                                                                }

                                                                if (res.selection === 0) return form3()
                                                            })
                                                    }
                                                })
                                        }
                                    })
                                }
                            }

                            if (res.selection === 1) {
                                form2()
                                function form2() {
                                    let types = worldlog.getScoreboardPlayers('shopTypes').disname
                                    if (types.length == 0) return logfor(player.name, `§c§l>> §e找不到商品種類!`)
                                    let form = new ui.ActionFormData()
                                        .title(`§e§l查看商品 §f- §e選擇種類`)
                                        .body("§e§l請選擇商品所屬種類")
                                    for (let type of types) {
                                        form.button(`§e§l${type}`)
                                    }
                                    form.button('§7§l返回')
                                    form.show(player).then(res => {
                                        if (res.selection === types.length) return form1()
                                        if (res.canceled) return;
                                        let type = types[res.selection]
                                        let shops = getShops(type)
                                        let form = new ui.ActionFormData()
                                            .title("§e§l查看商品")
                                        for (let shop of shops) {
                                            form.button(`§e§l名稱 §7- §e${shop.displayName}\n§bID §7- §b${shop.id}`)
                                        }
                                        form.button('§7§l返回')
                                        form.show(player).then(res => {
                                            if (res.selection === shops.length) return form2()
                                            if (res.canceled) return;
                                            form3()
                                            function form3() {
                                                /**
                                                 * @type {item}
                                                 */
                                                let shop = shops[res.selection]
                                                let form = new ui.ActionFormData()
                                                    .title('§e§l商品查看')
                                                    .body(`§e§l商品名稱 §7- §e${shop.displayName}\n§e商品ID §7- §e${shop.id}\n§e商品價格 §7- §e${shop.buyValue}\n§e商品售出價 §7- §e${shop.value}\n§e商品所屬種類 §7- §e${shop.type}`)
                                                    .button("§b§l修改")
                                                    .button("§c§l刪除")
                                                    .button("§7§l返回")
                                                    .show(player).then(res => {
                                                        if (res.selection === 2) return form2()
                                                        
                                                        if (res.selection === 0) {
                                                            let types = worldlog.getScoreboardPlayers('shopTypes').disname
                                                            let shops = worldlog.getScoreboardPlayers('shopSet').disname
                                                            let form = new ui.ModalFormData()
                                                                .title('§e§l修改商品')
                                                                .textField("§e§l輸入物品ID (例如:diamond_sword)", "ID", shop.id)
                                                                .textField("§e§l輸入要顯示的物品名稱", "名稱", shop.displayName)
                                                                .textField("§e§l輸入商品購買價", '價格', shop.buyValue.toString())
                                                                .textField("§e§l輸入商品售出價", "價格", shop.value.toString())
                                                                .dropdown("§e§l選擇商品種類", types, types.indexOf(shop.type))
                                                                .show(player).then(res => {
                                                                    let id = res.formValues[0]
                                                                    let displayName = res.formValues[1]
                                                                    let buyValue = res.formValues[2]
                                                                    let sellValue = res.formValues[3]
                                                                    let type = types[res.formValues[4]]
                                
                                                                    // shopSet 紀錄 物品ID___顯示名稱___物品售出價___物品買入價___物品所屬類別
                                                                    if (id == '' || displayName == '' || buyValue == '' || sellValue == '') return logfor(player.name, `§c§l>> §e參數不可為空!`)
                                                                    if (!isNum(buyValue) || !isNum(sellValue)) return logfor(player.name, `§c§l>> §e價格必須為數字!`)
                                                                    cmd(`scoreboard players reset "${shop.transfrom()}" shopSet`)
                                                                    cmd(`scoreboard players set "${id}___${displayName}___${sellValue}___${buyValue}___${type}" shopSet 0`)
                                                                    return logfor(player.name, `§a§l>> §e修改成功!`)
                                                                })
                                                        }

                                                        if (res.selection === 1) {
                                                            cmd(`scoreboard players reset "${shop.transfrom()}" shopSet`)
                                                            logfor(player.name, `§a§l>> §e刪除成功!`)
                                                        }
                                                    })
                                            }
                                        })
                                })
                                
                            }}
                        })
                }
            }
        })
}