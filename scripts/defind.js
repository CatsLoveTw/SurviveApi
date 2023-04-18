// 該檔案僅供定義class等功能。 (我真的傻...忘了class的存在)

class tpaSettingUpdateSuccessful {
    /**
     * 
     * @param {boolean} old 
     * @param {string | undefined} newTag 
     */
    constructor (old, newTag) {
        this.run = true
        this.old = old
        this.newTag = newTag
    }
}
class tpaSettingUpdateError {
    constructor () {
        this.run = false
    }
}
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
     * 使用該功能前，請確認 banlist 是否不是 undefined 若是 將回傳undefined
     * @returns 
     */
    transformToTag () {
        if (!this.banlist) return undefined
        let json = {
            "tpaSetting": {
                "dontDistrub": this.Distrub, 
                "sec": this.sec,
                "banlist": this.banlist
            }
        }
        return JSON.stringify(json)
    }
    /**
     * 取得tag內的tpaSetting內容 若沒有內容，將回傳undefined
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
     * 
     * @param {string} tag 
     * @returns 
     */
    check_old_and_updateTag (tag) {
        let data = this.getDataFromTag(tag)
        if (tag.includes('tpaSetting') && !data) {
            return new tpaSettingUpdateSuccessful(true, new tpaSetting(60, false, [], false).transformToTag())
        }
        if (!data) return new tpaSettingUpdateError()
        if (data.old) {
            return new tpaSettingUpdateSuccessful(true, new tpaSetting(data.sec, data.Distrub, [], false).transformToTag())
        } else {
            return new tpaSettingUpdateSuccessful(false, new tpaSetting(data.sec, data.Distrub, data.banlist, data.old).transformToTag())
        }
    }
}