import * as mc from "@minecraft/server"
import { eventBuild } from "./eventBuild"

type Listener = {
    event: string,
    callback: (...eventCallback: any) => void,
    once: boolean
}

type eventType = 
"beforeChatSend" |
"beforeItemUseOn" |
"beforePlayerInteractWithBlock" |
"beforePlayerPlaceBlock" |
"beforePlayerBreakBlock" |
"afterEntityDie" |
"afterPlayerPlaceBlock" |
"afterPlayerBreakBlock" |
"afterItemUse" |
"afterPlayerJoin" |
"afterWorldInitialize" |
"onTick" |
"onFiveTick" |
"onOneSecond"



export class eventBuild extends eventBuild {
    listeners: Listener[];
    removeListener(event: eventType): void;
    removeAllListener(): void;
    addListener(event: eventType, callback: (...eventCallback: any) => void, once: boolean): void;
    totalListener(event?: eventType): Listener[]
    on(event: eventType, callback: (...eventCallback: any) => void): void
    once(event: eventType, callback: (...eventCallback: any) => void): void
    emit(event: eventType, ...args: (...eventCallback: any) => void): void


    on(event: "beforeChatSend", callback: (arg: mc.ChatSendBeforeEvent) => void): void;
    on(event: "beforeItemUseOn", callback: (arg: mc.ItemUseOnBeforeEvent) => void): void;
    on(event: "beforePlayerInteractWithBlock", callback: (arg: mc.PlayerInteractWithBlockBeforeEvent) => void): void;
    on(event: "beforePlayerPlaceBlock", callback: (arg: mc.PlayerPlaceBlockBeforeEvent) => void): void;
    on(event: "beforePlayerBreakBlock", callback: (arg: mc.PlayerBreakBlockBeforeEvent) => void): void;
    on(event: "afterEntityDie", callback: (arg: mc.EntityDieAfterEvent) => void): void;
    on(event: "afterPlayerPlaceBlock", callback: (arg: mc.PlayerPlaceBlockAfterEvent) => void): void;
    on(event: "afterPlayerBreakBlock", callback: (arg: mc.PlayerBreakBlockAfterEvent) => void): void;
    on(event: "afterItemUse", callback: (arg: mc.ItemUseAfterEvent) => void): void;
    on(event: "afterPlayerJoin", callback: (arg: mc.PlayerJoinAfterEvent) => void): void;
    on(event: "afterWorldInitialize", callback: (arg: mc.WorldInitializeAfterEvent) => void): void;
    on(event: "onTick", callback: () => void): void;
    on(event: "onFiveTick", callback: () => void): void;
    on(event: "onOneSecond", callback: () => void): void;
    
};
