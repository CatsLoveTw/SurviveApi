import * as mc from "@minecraft/server"
import * as ui from "@minecraft/server-ui"
import { WorldDB, functions, playerWorldDB } from "../../lib/db/WorldDB"
import { defaultValue, playerDB } from "../../config"

/**
 * 
 * @param {mc.Player} player 
 */
export function dbUI(player) {
    let form = new ui.ActionFormData()
        .title("記分板資料庫 - 選擇資料庫")
    
    const databases = mc.world.scoreboard.getObjectives().filter(value => value.id.includes("DB"))
    for (let database of databases) {
        form.button(database.id)
    }

    form.show(player).then(res => {
        if (res.canceled || res.selection == undefined) return;

        let database = databases[res.selection]

        let db = new WorldDB(database.id);
        
        let form = new ui.ActionFormData()
            .title("記分板資料庫 - 選擇表格 | " + database.id)
        const tables = db.getTables();
        for (let table of tables) {
            if (database.id.toLowerCase() != "playerdb") {
                form.button("表格\n" + table)
            } else {
                let data = db.table(table)
                form.button(`玩家名稱: ${data.getData("realname").value}\n玩家ID: ${table}`)
            }
        }

        form.show(player).then(res => {
            if (res.canceled) return;
            const table = db.table(tables[res.selection])
            function seleKey() {
                let form = new ui.ActionFormData()
                    .title(`記分板資料庫 - 選擇key | ${table.tableName}`)
                const keys = table.getKeys();
                for (const key of keys) {
                    const data = functions.getTableData(database.id, tables[res.selection])
                    const filter = data.filter(value => value.key == key)[0]

                    let value = filter.value
                    if (value.length >= 20) value = value.slice(0, 19) + "..."
                    form.button(`key: ${key}\nvalue: ${value}`)
                }

                form.show(player).then(res => {
                    if (res.canceled || res.selection == undefined) return dbUI(player);
                    operator()
                    function operator() {
                        /**
                         * @type {string}
                         */
                        const key = keys[res.selection]
                        let form = new ui.ActionFormData()
                            .title(`記分板資料庫 - 操作 | ${key}`)

                        /**
                         * @type {false | string | number | {} | any[]}
                         */
                        let hasDefault = false
                        let res1 = defaultValue.filter(value => value.dbName == database.id)
                        if (res1.length > 0) {
                            res1.forEach(value => {
                                let res2 = value.values.filter(value => value.tableName == table.tableName || !value.tableName)
                                if (res2.length > 0) {
                                    let res3 = res2.filter(value => value.key == key)
                                    if (res3.length > 0) {
                                        hasDefault = res3[0].value
                                    }
                                }
                            })
                        }

                        if (!hasDefault) form.button("刪除")
                        else form.button("恢復至預設")

                        form.button("修改")
                        form.button("返回")
                        form.show(player).then(res => {
                            if (res.canceled || res.selection === 2) return seleKey();

                            if (res.selection === 0) {
                                if (hasDefault == false) {
                                    table.removeData(key)
                                } else {
                                    table.setData(key, hasDefault)
                                }
                                seleKey()
                                return player.sendMessage(`>> 修改成功!`)
                            } else if (res.selection === 1) {
                                const data = functions.getTableData(database.id, table.tableName)
                                const filter = data.filter(value => value.key == key)[0]
                                let form = new ui.ModalFormData()
                                    .title(`記分板資料庫`)
                                    .textField(`key: ${key}\nvalue:`, "value", filter.value)
                                    .textField(`score:`, "score", filter.score.toString())
                                    .show(player).then(res => {
                                        if (res.canceled) return operator();
                                        const value = res.formValues[0];
                                        const score = Number(res.formValues[1]);

                                        table.setData(key, value, score)
                                        seleKey()
                                        return player.sendMessage(">> 修改成功!")
                                    })
                            }
                        })
                    }
                })
            }
            seleKey()
        })
    })
}