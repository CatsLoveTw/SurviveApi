import * as mc from "@minecraft/server";

const cmd = function(command) {
    return mc.world.getDimension("overworld").runCommandAsync(command)
};

const cmd_Dimension = (command, dimension) => {
    return mc.world.getDimension(dimension).runCommandAsync(command)
}
  
const logfor = function(playername,message) {
    let okay_message = message.toString().replaceAll('\"',"''").replaceAll('\\',"/")
    mc.world.getDimension("overworld").runCommandAsync(`tellraw "${playername}" {"rawtext":[{"text":"${okay_message}"}]}`)
};
const logforTarget = function(Target,message) {
    let okay_message = message.toString().replaceAll('\"',"''").replaceAll('\\',"/")
    mc.world.getDimension("overworld").runCommandAsync(`tellraw ${Target} {"rawtext":[{"text":"${okay_message}"}]}`)
}

const titlefor = function(playername,message) {
    let okay_message = message
    mc.world.getDimension("overworld").runCommandAsync(`titleraw "${playername}" actionbar {"rawtext":[{"text":"${okay_message}"}]}`)
}

const titlelog = function(message) {
    let okay_message = message
    mc.world.getDimension("overworld").runCommandAsync(`titleraw @a actionbar {"rawtext":[{"text":"${okay_message}"}]}`)
}

const log = function(message) {
    let okay_message = message.toString().replaceAll('\"',"''").replaceAll('\\',"/")
    mc.world.getDimension("overworld").runCommandAsync(`tellraw @a {"rawtext":[{"text":"${okay_message}"}]}`)
}

const addSign = function(message, player, tick) {
    player.addTag(JSON.stringify({ "news": message, tick: 0, maxtick: tick }))
}

const removeSign = function(message, player) {
    for (let tag of player.getTags()) {
        if (tag.startsWith('{"news":')) {
            let msg = JSON.parse(tag)
            if (msg.news == message) {
                player.removeTag(tag)
            }
        }
    }
}

const getSign = function(player) {
    let all = []
    for (let tag of player.getTags()) {
        if (tag.startsWith('{"news":')) {
            all.push(tag)
        }
    }
    return all
}


export {cmd, cmd_Dimension, logfor, logforTarget, log, titlefor, titlelog, addSign, removeSign, getSign}