import * as mc from "@minecraft/server";
import { defaultValue, playerDB } from "../../config";
import { WorldDB } from "../../lib/db/WorldDB";
import Event from "../eventBuild";

mc.system.runInterval(() => {
    for (let player of mc.world.getAllPlayers()) {
        const db = playerDB.table(player.id)
        for (const value of defaultValue) {
            if (value.dbName != "playerDB") continue;

            for (const val of value.values) {
                if (val.tableName && val.tableName != player.id) continue;
                const data = db.getData(val.key)
                if (data && data.value) continue;
                
                const score = val.score ? val.score : 0
                db.setData(val.key, val.value, score)
            }
        }


        db.setData("realname", player.name, 0)
    }
}, 50)