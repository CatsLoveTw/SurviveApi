import * as mc from '@minecraft/server'
import { worldlog } from '../../lib/function'
import { cmd, log, logfor } from '../../lib/GametestFunctions'


export function build () {
    function addBoard(ID, Display) {
        cmd(`scoreboard objectives add ${ID} dummy "${Display}"`)
    }
    const boards = {
        "shopSet": "商品自訂義",
        "shopTypes": "商品類別"
    }
    try {
        for (let board in boards) {
            addBoard(board, boards[board])
        }
    } catch { }
}