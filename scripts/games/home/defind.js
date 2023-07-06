/// <reference path="./index.d.ts" />

import { Player } from "@minecraft/server"
import { playerDB } from "../../config"

export class Home {
    /**
     * 
     * @param {string} name 
     * @param {HomePosition} pos 
     * @param {LandData} land 
     * @param {HomeDimension} dimension 
     */
    constructor (name, pos, land, dimension) {
        this.name = name
        this.pos = pos
        this.land = land
        this.dime = dimension
    }

    /**
     * 
     * @returns {HomeData}
     */
    toJSON () {
        return {
            home: {
                name: this.name,
                pos: this.pos,
                land: this.land,
                dime: this.dime
            }
        }
    }    
}


/**
 * 新增傳送點
 * @param {Player} player 
 * @param {HomeData} homeData 
 */
export function addHome (player, homeData) {
    const db = playerDB.table(player.id)
    let allHome = db.getData("homes")
    if (!allHome || allHome.value.length == 0) db.setData("homes", [homeData], 0)
    if (allHome) {
        allHome.value.push(homeData)
        db.setData("homes", allHome.value, allHome.score)
    }
}

/**
 * 刪除傳送點
 * @param {Player} player 
 * @param {HomeData} homeData 
 */
export function removeHome (player, homeData) {
    const db = playerDB.table(player.id)
    let allHome = db.getData("homes")
    if (!allHome || allHome.value.length == 0) return false;

    for (const home of allHome.value) {
        if (home.home.name != homeData.home.name) continue;
        if (home.home.dime != homeData.home.dime) continue;
        if (home.home.pos.x != homeData.home.pos.x) continue;
        if (home.home.pos.y != homeData.home.pos.y) continue;
        if (home.home.pos.z != homeData.home.pos.z) continue;
        allHome.value.splice(allHome.value.indexOf(home), 1)
        db.setData("homes", allHome.value, allHome.score);
        return true;
    }
}
