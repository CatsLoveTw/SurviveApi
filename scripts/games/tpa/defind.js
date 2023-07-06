/// <reference path="./index.d.ts" />

import { isNum } from "../../lib/function"

export class tpaSetting {
    /**
     * 若沒有數值，可以選擇不填入。
     * @param {number} sec tpa時長 
     * @param {boolean} Distrub 請勿打擾
     * @param {string[]} banlist 黑名單玩家名稱列表
     * @param {boolean} old 確認標籤是否為舊版 (無黑名單功能)
     */
    constructor (sec, Distrub, banlist, old) {
        this.sec = sec
        this.Distrub = Distrub
        this.banlist = banlist
        this.old = old
    }

    /**
     * 使用該功能前，請確認`banlist`是否不是`undefined`，若是，將回傳`undefined`
     * @returns {TpaSettingJSON}
     */
    toJSON () {
        if (!this.banlist) return undefined
        let json = {
            "tpaSetting": {
                "dontDistrub": this.Distrub, 
                "sec": this.sec,
                "banlist": this.banlist
            }
        }
        return json
    }
    /**
     * @deprecated Tag字串轉物件方式已被淘汰，請改用 {@linkcode tpaSetting.getDataFromJSON()}
     * @description 取得tag內的tpaSetting內容 若沒有內容，將回傳undefined
     * @param {string} tag 
     * @returns 
     */
    getDataFromTag (tag) {
        let old = false
        let banlist = undefined
        let data = JSON.parse(tag).tpaSetting
        if (!data) return undefined
        if (!data.banlist || !Array.isArray(data.banlist)) {
            old = true
        } else {
            banlist = data.banlist
        };
        return new tpaSetting(data.sec, data.dontDistrub, banlist, old)
    }

    /**
     * 將JSON轉換為Class 若沒有，將回傳`undefined`
     * @param {TpaSettingJSON} json 
     */
    static getDataFromJSON (json) {
        let old = false;
        let banlist = undefined;
        
        if (!json.tpaSetting) return undefined;
        if (typeof json != "object") return undefined;
        if (!json.tpaSetting.banlist || !Array.isArray(json.tpaSetting.banlist)) {
            old = true;
        } else {
            banlist = json.tpaSetting.banlist
        }
        
        function transformBoolean (text) {
            if (text == "true") return true;
            return false;
        }

        let newBanList = []
        for (let value of banlist) {
            if (isNum(value)) newBanList.push(String(value))
            else newBanList.push(value)
        }
        const sec = json.tpaSetting.sec, distrub = transformBoolean(json.tpaSetting.dontDistrub)
        return new tpaSetting(sec, distrub, newBanList, old)
    }
    /**
     * 
     * @param {TpaSettingJSON} json
     * @returns 
     */
    static check_old_and_update (json) {
        class tpaSettingUpdateSuccessful {
            /**
             * 
             * @param {boolean} old 
             * @param {TpaSettingJSON | undefined} newJSON
             */
            constructor (old, newJSON) {
                this.run = true
                this.old = old
                this.newJSON = newJSON
            }
        }
        class tpaSettingUpdateError {
            constructor () {
                this.run = false
            }
        }

        if (typeof json != "object") return new tpaSettingUpdateError()
        
        let data = tpaSetting.getDataFromJSON(json)
        if (!data) {
            return new tpaSettingUpdateSuccessful(true, new tpaSetting(60, false, [], false).toJSON())
        }
        
        if (data.old) {
            return new tpaSettingUpdateSuccessful(true, new tpaSetting(data.sec, data.Distrub, [], false).toJSON())
        } else {
            return new tpaSettingUpdateSuccessful(false, new tpaSetting(data.sec, data.Distrub, data.banlist, data.old).toJSON())
        }
    }
}