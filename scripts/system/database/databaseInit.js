import { defaultValue } from "../../config_DB";
import { WorldDB } from "../../lib/db/WorldDB";

for (let val of defaultValue) {
    if (val.dbName == "playerDB") continue;
    const database = new WorldDB(val.dbName)
    for (let value of val.values) {
        if (!value.tableName) continue;
        const table = database.table(value.tableName)
        const score = value.score ? value.score : 0
        table.setData(value.key, value.value, score)
    }
}