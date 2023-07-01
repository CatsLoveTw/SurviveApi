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
    if (!allHome || allHome.value.length == 0) db.setData("homes", homeData, 0)
    if (allHome) {
        allHome.value.push(homeData)
        db.setData("homes", allHome.value, allHome.score)
    }
}
