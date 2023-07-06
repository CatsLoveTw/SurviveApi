/// <reference path="./lib/db/index.d.ts" />

import { WorldDB_Table } from "./lib/db/WorldDB"



// 設定預設值等內容

/**
 * @type {DefaultValue[]}
 * @description 設定 {@linkcode WorldDB_Table.getData()} 預設內容 沒有則為null
 */
export const defaultValue = [
    {
        dbName: "playerDB",
        values: [
            {
                key: "realname",
                value: "",
                score: 0
            },
            {
                key: "dynamic_message",
                value: [],
                score: 0
            },
            {
                key: "homes",
                value: [],
                score: 0
            }
        ]
    }
]