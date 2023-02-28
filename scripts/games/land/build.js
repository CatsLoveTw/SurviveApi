import * as mc from '@minecraft/server'
import * as ui from '@minecraft/server-ui'
import { log, cmd } from '../../lib/GametestFunctions.js'
import * as land from './land.js'


export function build () {
    function addBoard (ID, Display) {
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
    } catch {}
    land.build()
}