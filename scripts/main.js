import { world, system } from "@minecraft/server"
import * as mc from "@minecraft/server"
import { log } from './lib/GametestFunctions.js'
import * as chatCommnad from './games/chatCommands/build.js'
import * as land from './games/land/build.js'
import * as titleraw from './games/titleraw/build.js'
import * as tpa from './games/tpa/build.js'
import * as bank from './games/bank/build.js'
import * as home from './games/home/build.js'
import * as menu from './games/menu/build.js'
import * as rtp from './games/rtp/build.js'
import * as death from './games/death/build.js'
import * as notice from './games/notice/build.js'
import * as adminSetting from './games/UI/adminSetting/build.js'
import * as shop from './games/shop/build.js'
import * as money_leaderboard from './games/money_leaderboard/build.js'
import * as test from './games/test/build.js'
import "./games/containerLocked/build.js"
import "./games/ban/build.js"
import "./system/import.js"
import "./system/account/index.js"






system.beforeEvents.watchdogTerminate.subscribe(event => {
    event.cancel = true
})

// system.runInterval() 類似於tickEvent

// build
chatCommnad.build()
land.build()
titleraw.build()
tpa.build()
bank.build()
home.build()
menu.build()
rtp.build()
death.build()
notice.build()
adminSetting.build()
shop.build()
money_leaderboard.build()
test.build()