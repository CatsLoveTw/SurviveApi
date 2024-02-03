import { world } from "@minecraft/server";
import * as ui from "@minecraft/server-ui";
import {cmd, log, logfor} from '../lib/GametestFunctions.js'
import { isNum, randomInt, worldlog } from '../lib/function.js'

// | 或 §

function getScore (player, scoreName) {
    return worldlog.getScoreFromMinecraft(player, scoreName).score
}

/**
 * 
 * @param {string} scoreObjid 
 * @param {number} rank 
 * @param {boolean} deleteZero 
 * @returns 
 */
export function leaderboard (scoreObjid, rank, deleteZero) {
    let scoreboard = world.scoreboard.getObjective(scoreObjid)

    let returnData = []

    let scores = []
    let names = []
    for (let participant of scoreboard.getParticipants()) {
        let score = scoreboard.getScore(participant)
        let displayName = participant.displayName
        names.push(displayName)
        scores.push(score)
    }

    let run = rank
    if (rank > names.length) run = names.length;
    for (let i = 0; i < run; i++) {
        if (scores.length == 0) break;
        let max = Math.max(...scores)
        if (deleteZero && max == 0) break;
        let len = 0
        let deleteIndexes = []
        for (let j in scores) {
            if (scores[j] === max) {
                len++
                let rank = i + 1
                let score = scores[j]
                let name = names[j]
                deleteIndexes.push(j)
                returnData.push({rank, score, name})
            }
        }
        let removeLen = 0
        for (let index of deleteIndexes) {
            index = Number(index) - removeLen
            removeLen++
            scores.splice(index, 1)
            names.splice(index, 1)
        }
    }
    return returnData
}