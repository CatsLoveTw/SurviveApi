import * as mc from '@minecraft/server'
import { worldlog } from '../../lib/function'
import { cmd, cmd_async, log, logfor } from '../../lib/GametestFunctions'


export function build () {
    function addBoard(ID, Display) {
        cmd_async(`scoreboard objectives add ${ID} dummy "${Display}"`)
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