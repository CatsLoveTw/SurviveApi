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

/**
 * 
 * @param {number} x
 * @param {number} z
 * @param {string} dimeID
 */
export function checkInLand_Pos(x, z, dimeID) {
    let index = 0
    if (dimeID == mc.MinecraftDimensionTypes.nether) {
        index = 1
    }
    if (dimeID == mc.MinecraftDimensionTypes.theEnd) {
        index = 2
    }
    let landSelection = ['lands', 'lands_nether', 'lands_end']
    for (let land of worldlog.getScoreboardPlayers(landSelection[index]).disname) {
        let data = getLandData(land)
        let x1 = Math.max(Number(data.pos.x[1]), Number(data.pos.x[2]))
        let x2 = Math.min(Number(data.pos.x[1]), Number(data.pos.x[2]))
        let z1 = Math.max(Number(data.pos.z[1]), Number(data.pos.z[2]))
        let z2 = Math.min(Number(data.pos.z[1]), Number(data.pos.z[2]))
        // log(`x:${x} x1:${x1} x2:${x2} z:${z} z1:${z1} z2:${z2}`)
        if (Math.floor(Number(x)) <= x1 && Math.floor(Number(x)) >= x2) {
            // log('test1')
            if (Math.floor(Number(z)) <= z1 && Math.floor(Number(z)) >= z2) {
                // log('test2')
                return data;
            }
        }
    }
    return false;
}

/**
 * 
 * @param {number} x
 * @param {number} z
 * @param {string} dimeID
 * @param {number} near
 */
export function checkNearLand_Pos(x, z, dimeID, near) {
    let index = 0
    if (dimeID == mc.MinecraftDimensionTypes.nether) {
        index = 1
    }
    if (dimeID == mc.MinecraftDimensionTypes.theEnd) {
        index = 2
    }
    let landSelection = ['lands', 'lands_nether', 'lands_end']
    for (let land of worldlog.getScoreboardPlayers(landSelection[index]).disname) {
        let data = getLandData(land)
        let x1 = Math.max(Number(data.pos.x[1]), Number(data.pos.x[2]))
        let x2 = Math.min(Number(data.pos.x[1]), Number(data.pos.x[2]))
        let z1 = Math.max(Number(data.pos.z[1]), Number(data.pos.z[2]))
        let z2 = Math.min(Number(data.pos.z[1]), Number(data.pos.z[2]))
        for (let i = Math.min(Number(x1), Number(x2)); i <= Math.max(Number(x1), Number(x2)); i++) {
            for (let j = Math.min(Number(z1), Number(z2)); j <= Math.max(Number(z1), Number(z2)); j++) {
                let checkX = Math.abs(i - x)
                let checkZ = Math.abs(j - z)
                if (checkX <= near && checkZ <= near) {
                    return true
                }
            }
        }
    }
    return false;
}