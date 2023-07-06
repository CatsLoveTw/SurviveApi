import * as mc from '@minecraft/server'
import * as ui from '@minecraft/server-ui'
import { log, cmd, cmd_async } from '../../lib/GametestFunctions.js'
import * as builds from './titleraw.js'


export function build () {
    function addBoard (ID, Display) {
        cmd_async(`scoreboard objectives add "${ID}" dummy ${Display}`)
    }
    const boards = {
        "timeD": "天數",
        "timeH": "小時",
        "timeM": "分種",
        "time": "秒鐘"
    }
    try {
        for (let board in boards) {
            addBoard(board, boards[board])
        }
    } catch {}
    builds.build()
}