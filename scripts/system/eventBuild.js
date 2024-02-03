import { world, system } from "@minecraft/server"

export class eventBuild {
    constructor() {
        this.listeners = [];
    };

    addListener(event, callback, once) {
        this.listeners.push({ eventName: event, callback, once });
    };

    removeListener(event) {
        const index = this.listeners.findIndex(element => element.eventName === event);
        this.listeners.splice(index, 1);
    };

    removeAllListener() {
        this.listeners = [];
    };

    totalListener(event) {
        return event ? this.listeners.filter(element => element.eventName === event) : this.listeners;
    };

    on(event, callback) {
        this.addListener(event, callback, false);
    };

    once(event, callback) {
        this.addListener(event, callback, true);
    };

    emit(event, ...args) {
        this.listeners.forEach(element => {
            if(element.eventName !== event) return;
            element.callback(...args);
            if(element.once) return this.removeListener(element.eventName);
        });
    };
};

/**
 * @type {import("./eventDefine").eventBuild}
 */
const Event = new eventBuild()

world.beforeEvents.chatSend.subscribe(data => Event.emit("beforeChatSend", data))
world.beforeEvents.itemUseOn.subscribe(data => Event.emit("beforeItemUseOn", data))
world.beforeEvents.playerInteractWithBlock.subscribe(data => Event.emit("beforePlayerInteractWithBlock", data))
world.beforeEvents.playerPlaceBlock.subscribe(data => Event.emit("beforePlayerPlaceBlock", data))
world.beforeEvents.playerBreakBlock.subscribe(data => Event.emit("beforePlayerBreakBlock", data))

world.afterEvents.entityDie.subscribe(data => Event.emit("afterEntityDie", data))
world.afterEvents.playerPlaceBlock.subscribe(data => Event.emit("afterPlayerPlaceBlock", data))
world.afterEvents.playerBreakBlock.subscribe(data => Event.emit("afterPlayerBreakBlock", data))
world.afterEvents.itemUse.subscribe(data => Event.emit("afterItemUse", data))
world.afterEvents.playerJoin.subscribe(data => Event.emit("afterPlayerJoin", data))
world.afterEvents.worldInitialize.subscribe(data => Event.emit("afterWorldInitialize", data))

system.runInterval(() => Event.emit("onTick"), 1)
system.runInterval(() => Event.emit("onFiveTick"), 5)
system.runInterval(() => Event.emit("onOneSecond"), 20)


export default Event