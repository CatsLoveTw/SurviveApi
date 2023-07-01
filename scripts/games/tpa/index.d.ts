declare type TpaRequire = {
    tpaReq: {
        /**
         * 發送者
         */
        "source": string,
        /**
         * 對方
         */
        "reqName": string,
        /**
         * tpa代號:
         * - `0` 要求發送者傳送至對方
         * - `1` 要求對方傳送至發送者
         */
        "tpa": number,
        /**
         * 傳送(請求)訊息
         */
        "message": string,
        /**
         * 邀請時間上限
         */
        "duration": number,
        /**
         * 邀請開始時間，使用{@linkcode Date.getTime()}
         */
        "startTime": number
    }
}

declare type TpaRequired = {
    tpaReqed: {
        /**
         * 發送者
         */
        "source": string,
        /**
         * 對方
         */
        "reqName": string,
        /**
         * tpa代號:
         * - `0` 要求發送者傳送至對方
         * - `1` 要求對方傳送至發送者
         */
        "tpa": number,
        /**
         * 傳送(請求)訊息
         */
        "message": string,
        /**
         * 邀請時間上限
         */
        "duration": number,
        /**
         * 邀請開始時間，使用{@linkcode Date.getTime()}
         */
        "startTime": number
    }
}

declare type TpaSettingJSON = {
    "tpaSetting": {
        "dontDistrub": boolean, 
        "sec": number,
        "banlist": string[]
    }
}