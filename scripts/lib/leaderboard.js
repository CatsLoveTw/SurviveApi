import { world } from "@minecraft/server";
import * as ui from "@minecraft/server-ui";
import {cmd, log, logfor} from '../lib/GametestFunctions.js'
import { isNum, randomInt, worldlog } from '../lib/function.js'

// | 或 §

function getScore (player, scoreName) {
    return worldlog.getScoreFromMinecraft(player, scoreName).score
}
export function leaderboard (scoreObjid, rank) {
    // 已完成 不須修改
    let adminplayer = []
    // for (let player of world.getPlayers()) {
    //     if (player.hasTag('admin')) {
    //         adminplayer.push(player.name)
    //     }
    // }


    let obj1 = world.scoreboard.getObjective(scoreObjid).getParticipants()
    let playername = []
    let playerscore = []
   // log (`obj1 ${obj1.length}`)
    for (let name of obj1) {
        if (name.type === 1) {
        let planame = name.getEntity().nameTag
        let score = getScore(planame, scoreObjid)
        //if (Number(score) != 0) {
        playername.push(planame)
        playerscore.push(score)
       // }
        } else {
        let score = 0
        let planame = name.displayName

        if (planame.includes('</?>')) {
            // log(`admin = ${adminplayer} planame = ${planame.replace('</?>', '')}`)
            if (!adminplayer.includes(planame.replace('</?>', ''))) {
            score = getScore(planame, scoreObjid)
            planame = name.displayName.replace('</?>', '')
            //log (`planame = ${planame.replace('</?>', '')} score = ${score}`)
            }
        } else {
        score = getScore (planame, scoreObjid)
        }
        //if (Number(score) != 0) {
        playername.push(planame)
        playerscore.push(score)
        //}

    }
    }
    let namerank = []
    let namescore = []
    let removeindex = []
    let errornumber = 0
    let run = 0
   // log (`rank :${rank} leng:${playername.length}`)
    if (rank > playername.length) {
        run = playername.length
    } else {run = rank}
   // log (`run ${run}`)
    for (let i = 0; i < run; i++) {
        let max = -1
        let maxindex 
        for (let j =0; j <= playerscore.length-1; j++) {
           // log (`j=` + j)
            //log (`error = ` + errornumber + `playerscore = ` + playerscore[j] + `playername = ` + playername[j])
            if (removeindex.includes(j)) {
                errornumber++
            } else {
            if (Number(playerscore[j]) > max) {
                max = playerscore[j]
                maxindex = j
               // log (`max = ${maxindex}, max = ${playerscore[j]}`)
            }
            }
            //log (`j = ${j} length` + playerscore.length-1)
          //  log (`number = ${j}, playerscore = ${playerscore.length -1}, boolen ${Number(j) == playerscore.length-1}`)
            if (Number(j) == playerscore.length - 1) {
                //log (`number = ${j}, playerscore = ${playerscore.length -1}, boolen ${Number(j) == playerscore.length-1}`)
                namerank.push(playername[maxindex])
                namescore.push(playerscore[maxindex])
                removeindex.push(maxindex)
               // log (`name: ${playername[maxindex]}`)
            }
        
        }
    }
    
    if (namerank.length == 0) {
        return false
    } else {
    return [namerank, namescore, removeindex, errornumber]
    }
}