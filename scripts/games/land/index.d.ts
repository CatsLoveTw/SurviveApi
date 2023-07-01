import { Land } from "./defind";

declare interface landPosition {
    x: {
        1: string,
        2: string
    },
    z: {
        1: string,
        2: string
    }
}

/**
 * 以上的String皆是布林值轉變為字串\
 * build 建造權限\
 * container 容器權限\
 * portal 傳送點設置權限\
 * fly 飛行權限\
 * tnt 爆炸防禦權限
 */
declare class landPermission {
    build: string;
    container: string;
    portal: string;
    fly: string;
    tnt: string;
}

/**
 * username 玩家名稱
 */
declare interface landUser {
    username: string,
    permission: landUserPermission
}

declare interface landUserPermission {
    build: string,
    container: string,
    portal: string,
    fly: string
}

declare type landDimension = 'overworld' | 'nether' | 'end'


declare type LandCreateJSON = {
    "landCreate": {
        "dime": landDimension,
        "at": number,
        "name": string,
        "step": number,
        "admin": boolean
    }
}

declare type InLand = {
    inLand: {
        dime: "over" | "nether" | "end",
        land: Land,
        per: landUserPermission
    }
}


declare class LandData {
    name: string
    pos: landPosition
    UID: string
    player: string | false
    permission: landPermission
    users: false | landUser[]
    Public: boolean
    old: boolean
}