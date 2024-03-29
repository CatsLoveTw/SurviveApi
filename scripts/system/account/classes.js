/// <reference path="./index.d.ts" />

import * as mc from '@minecraft/server'
import { worldlog } from '../../lib/function';
import { getAccountData } from './functions';

export class loginSession {
    
    /**
     * @param {number} id 帳戶ID
     * @param {string} name 玩家名稱
     * @param {string} omid 玩家OMID
     * @param {string} password 帳戶密碼
     */
    constructor (id, name, omid, password) {
        this.id = id;
        this.name = name;
        this.omid = omid;
        this.password = password;
    }

    /**
     * 將class內容轉換為TAG
     * @deprecated 已停止使用，請使用 {@linkcode loginSession.toJSON()}
     */
    transformTag() {
        let json = {
            "loginSession": {
                id: this.id,
                name: this.name,
                omid: this.omid,
            }
        }
        return JSON.stringify(json)
    }

    /**
     * 將class轉換為物件
     * @returns {LoginSessionJSON}
     */
    toJSON() {
        let json = {
            "loginSession": {
                id: this.id,
                name: this.name,
                omid: this.omid
            }
        }
        return json
    }

    /**
     * 將tag轉換為Data
     * @param {string} tag 
     * @deprecated tagJSON已被淘汰，請使用 {@linkcode loginSession.transformData}
     */
    static transformDataFromTag (tag) {
        if (tag.startsWith('{"loginSession":')) {
            let data = JSON.parse(tag)

            if (data.loginSession.id == -1) {
                return new loginSession(-1, '', '', '')
            }
            return getAccountData(data.loginSession.id)
        }
        return false
    }

    /**
     * 將JSON轉換為LoginSession
     * @param {LoginSessionJSON} json 
     */
    static transformData (json) {
        if (typeof json != "object") return false;
        if (!json.loginSession) return false;
        if (json.loginSession.id == -1) return new loginSession(-1, '', '', '')
        return getAccountData(json.loginSession.id)
    }
}