import * as mc from '@minecraft/server'
import * as ui from '@minecraft/server-ui'
import { worldlog } from '../../lib/function.js'
import { log, cmd, logfor, getSign, removeSign, transformToString, cmd_async } from '../../lib/GametestFunctions.js'
import * as land from './land.js'
import { getLandData } from './defind.js'

export function build() {
    function addBoard(ID, Display) {
        cmd_async(`scoreboard objectives add "${ID}" dummy ${Display}`)
    }
    const boards = {
        "lands": "領地",
        "lands_nether": "地獄領地",
        "lands_end": "終界領地",
        "land_squ": "已建造格數",
        "land_land": "已建造領地數",
        "land_squ_max": "最大格數",
        "land_land_max": "最大領地數",
        "land_squ_save": "暫存領地格數",
        "land_land_save": "暫存領地數量"
    }
    try {
        for (let board in boards) {
            addBoard(board, boards[board])
        }
    } catch { }
    land.build()
    
    mc.system.runInterval(() => {
        for (let player of mc.world.getAllPlayers()) {
            let squ = worldlog.getScoreFromMinecraft(player.name, 'land_squ_save')
            let land = worldlog.getScoreFromMinecraft(player.name, 'land_land_save')
            if (squ) {
                cmd_async(`scoreboard players reset "${player.name}" land_squ_save`)
                player.runCommandAsync(`scoreboard players add @s land_squ ${squ.score}`)
                logfor(player.name, `§3§l>> §e偵測到您的領地被管理員刪除，已經歸還您 §b${squ.score.toString().replace("-", "")} §e格領地格數。`)
            }
            if (land) {
                cmd_async(`scoreboard players reset "${player.name}" land_land_save`)
                player.runCommandAsync(`scoreboard players add @s land_land ${land.score}`)
                logfor(player.name, `§3§l>> §e偵測到您的領地被管理員刪除，已經歸還您 §b${land.score.toString().replace("-", "")} §e個領地數。`)
            }
        }
    }, 100)
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
        let data = getLandData(land).update()
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
        let data = getLandData(land).update()
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
        let data = getLandData(land).update()
        let x1 = Math.max(Number(data.pos.x[1]), Number(data.pos.x[2]))
        let x2 = Math.min(Number(data.pos.x[1]), Number(data.pos.x[2]))
        let z1 = Math.max(Number(data.pos.z[1]), Number(data.pos.z[2]))
        let z2 = Math.min(Number(data.pos.z[1]), Number(data.pos.z[2]))
        for (let i = Math.min(Number(x1), Number(x2)); i <= Math.max(Number(x1), Number(x2)); i++) {
            for (let j = Math.min(Number(z1), Number(z2)); j <= Math.max(Number(z1), Number(z2)); j++) {
                let checkX = Math.abs(i - x)
                let checkZ = Math.abs(j - z)
                if (checkX <= near && checkZ <= near) {
                    return data;
                }
            }
        }
    }
    return false;
}