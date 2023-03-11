import * as mc from '@minecraft/server'
import * as ui from '@minecraft/server-ui'
import { worldlog } from '../../lib/function.js'
import { log, cmd } from '../../lib/GametestFunctions.js'
import * as land from './land.js'
import { getLandData } from './UI.js'


export function build() {
    function addBoard(ID, Display) {
        cmd(`scoreboard objectives add "${ID}" dummy ${Display}`)
    }
    const boards = {
        "lands": "領地",
        "lands_nether": "地獄領地",
        "lands_end": "終界領地",
        "land_squ": "已建造格數",
        "land_land": "已建造領地數",
        "land_squ_max": "最大格數",
        "land_land_max": "最大領地數"
    }
    try {
        for (let board in boards) {
            addBoard(board, boards[board])
        }
    } catch { }
    land.build()
}

/**
 * 
 * @param {mc.Player} player 
 */
export function checkInLand(player) {
    let index = 0
    if (player.dimension.id.toLowerCase() == mc.MinecraftDimensionTypes.nether) {
        index = 1
    }
    if (player.dimension.id.toLowerCase() == mc.MinecraftDimensionTypes.theEnd) {
        index = 2
    }
    let landSelection = ['lands', 'lands_nether', 'lands_end']
    for (let land of worldlog.getScoreboardPlayers(landSelection[index]).disname) {
        let data = getLandData(land)
        let playerPos = player.location
        let x1 = Math.max(Number(data.pos.x[1]), Number(data.pos.x[2]))
        let x2 = Math.min(Number(data.pos.x[1]), Number(data.pos.x[2]))
        let z1 = Math.max(Number(data.pos.z[1]), Number(data.pos.z[2]))
        let z2 = Math.min(Number(data.pos.z[1]), Number(data.pos.z[2]))
        if (Math.floor(playerPos.x) <= x1 && Math.floor(playerPos.x) >= x2) {
            if (Math.floor(playerPos.z) <= z1 && Math.floor(playerPos.z) >= z2) {
                return data;
            }
        }
    }
    return false;
}