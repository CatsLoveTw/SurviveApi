/// <reference path="../../games/back/index.d.ts" />
/// <reference path="../../games/titleraw/index.d.ts" />
/// <reference path="../../games/home/index.d.ts" />
/// <reference path="../../games/land/index.d.ts" />
/// <reference path="../../games/tpa/index.d.ts" />
/// <reference path="../../system/account/index.d.ts" />

import { WorldDB_Table } from "./WorldDB";

/**
 * 玩家資料庫表格
 */
export class playerWorldDB_Table extends WorldDB_Table {
    constructor (dbName: "playerDB", tableName: string) {
        super(dbName, tableName)
        /**
         * @type {"playerDB"}
         */
        this.dbName = dbName;
        /**
         * @type {string}
         */
        this.tableName = tableName;
    }
    
    getData(key: string): {value: string | number | {} | Array, score: number} | null;
    getData(key: "realname"): {value: string, score: number} | null;
    getData(key: "dynamic_message"): {value: dynamic_message[], score: number} | null;
    getData(key: "backLocation"): {value: BackLocation, score: number} | null;
    getData(key: "homes"): {value: HomeData[], score: number} | null;
    getData(key: "homeShare"): {value: HomeShare, score: number} | null;
    getData(key: "homeShared"): {value: HomeShared, score: number} | null;
    getData(key: "landCreating"): {value: import("../../games/land/index").LandCreateJSON, score: number} | null;
    getData(key: "inLandData"): {value: import("../../games/land/index").InLand, score: number} | null;
    getData(key: "tpaRequire"): {value: TpaRequire, score: number} | null;
    getData(key: "tpaRequired"): {value: TpaRequired, score: number} | null;
    getData(key: "tpaSetting"): {value: TpaSettingJSON, score: number} | null;
    getData(key: "loginSession"): {value: LoginSessionJSON, score: number} | null;

    setData(key: string, value: string | number | {} | any[], score?: number): void;
    setData(key: "realname", value: string, score?: number): void;
    setData(key: "dynamic_message", value: dynamic_message[], score?: number): void;
    setData(key: "backLocation", value: BackLocation, score?: number): void;
    setData(key: "homes", value: HomeData[], score?: number): void;
    setData(key: "homeShare", value: HomeShare, score?: number): void;
    setData(key: "homeShared", value: HomeShared, score?: number): void;
    setData(key: "landCreating", value: import("../../games/land/index").LandCreateJSON, score?: number): void;
    setData(key: "inLandData", value: import("../../games/land/index").InLand, score?: number): void;
    setData(key: "tpaRequire", value: TpaRequire, score?: number): void;
    setData(key: "tpaRequired", value: TpaRequired, score?: number): void;
    setData(key: "tpaSetting", value: TpaSettingJSON, score?: number): void;
    setData(key: "loginSession", value: LoginSessionJSON, score?: number): void;

    removeData(key: string): boolean;
    removeData(key: "realname"): boolean;
    removeData(key: "backLocation"): boolean;
    removeData(key: "homeShare"): boolean;
    removeData(key: "homeShared"): boolean;
    removeData(key: "landCreating"): boolean;
    removeData(key: "inLandData"): boolean;
    removeData(key: "tpaRequire"): boolean;
    removeData(key: "tpaRequired"): boolean;
    removeData(key: "tpaSetting"): boolean;
    removeData(key: "loginSession"): boolean;
}