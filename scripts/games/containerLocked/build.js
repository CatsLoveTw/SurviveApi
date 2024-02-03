import * as mc from "@minecraft/server"
import * as ui from "@minecraft/server-ui"
import { playerDB } from "../../config"
import { getAdmin } from "../land/land"
import { checkInLand_Pos } from "../land/build"
import { cmd_Dimension } from "../../lib/GametestFunctions"
import Event from "../../system/eventBuild"


/**
 * 取得周圍的方塊
 * @param {mc.Vector3} center 
 * @param {mc.Dimension} dimension
 */
function getBlocksFromCenter(center, dimension) {
    let signs = []
    center.x++
    let block1 = dimension.getBlock(center)
    center.x--
    center.x--
    let block2 = dimension.getBlock(center)
    center.x++
    center.z++
    let block3 = dimension.getBlock(center)
    center.z--
    center.z--
    let block4 = dimension.getBlock(center)
    center.z++
    center.y++
    let block5 = dimension.getBlock(center)

    if (block1) signs.push(block1)
    if (block2) signs.push(block2)
    if (block3) signs.push(block3)
    if (block4) signs.push(block4)
    if (block5) signs.push(block5)

    return signs
}

/**
 * 取得告示牌所附著之方塊
 * @param {mc.Vector3} signPosition 
 * @param {mc.Dimension} dimension 
 * @param {boolean} isContainer 限制目標方塊是否為已列入`containers`之容器，預設 `true`
 * @returns 若找不到限制/目標方塊回傳 `undefined`、選取之方塊不是告示牌回傳本身座標 `mc.Vector3`
 */
function getTargetBlockFromSign (signPosition, dimension, isContainer = true) {
    let blockPosition = signPosition
    let signBlock = dimension.getBlock(signPosition)
    if (!signBlock) return undefined;

    let BlockState = signBlock.permutation.getAllStates()
    if (BlockState["ground_sign_direction"] != undefined) {
        blockPosition.y -= 1

        if (isContainer && !containers.includes(dimension.getBlock(blockPosition).typeId)) {
            return undefined
        }

        return dimension.getBlock(blockPosition)
    }

    let facing_direction = BlockState["facing_direction"]

    if (facing_direction == 3) blockPosition.z--; // South
    if (facing_direction == 2) blockPosition.z++; // North
    if (facing_direction == 5) blockPosition.x--; // East
    if (facing_direction == 4) blockPosition.x++; // West

    if (isContainer && !containers.includes(dimension.getBlock(blockPosition).typeId)) {
        return undefined
    }
    return dimension.getBlock(blockPosition)
}


/**
 * 獲取選取告示牌之鎖定資料
 * @param {mc.Block} block
 * @returns `undefined` 此方塊不為告示牌 | `null` 告示牌並未記載鎖定內容
 * 
 * `prefix` 為告示牌前綴 (【已上鎖】或【更多使用者】)\
 * `users` 告示牌所記載之有權力使用容器者\
 * `text` 告示牌記載內容
 */
function getSignData (block) {
    if (!block.typeId.includes("sign") || block.typeId.includes("hanging")) return undefined;

    /**
     * @type {String[]}
     */
    let Users = []
    let Prefix = ""
    /**
     * @type {mc.BlockSignComponent}
     */
    let component = block.getComponent("sign");

    if (!component) return undefined;
    let text = component.getText();
    if (!text) return null;
    if (!text.startsWith("【已上鎖】") && !text.startsWith("【更多使用者】")) return null;
    let signUsers = text.split("\n")
    for (let i in signUsers) {
        if (Number(i) == 0) {
            Prefix = signUsers[i];
            continue;
        }
        if (signUsers[i] == '') continue
        Users.push(signUsers[i])
    }
    
    return {
        prefix: Prefix,
        users: Users,
        text,
        component
    }
}


/**
 * 確認玩家是否有權限使用/更改容器
 * @param {mc.Player} player 
 * @param {mc.Block} block 玩家所點擊之告示牌 / 容器
 */
function checkPlayerPermission (player, block) {
    let checkPermission = false;
    let checkExist = false;
    let totalUsers = []
    let owner = ""
    let targetContainer = getTargetBlockFromSign(block.location, block.dimension)
    if (!targetContainer) {
        let containerLocation = getTargetBlockFromSign(block.location, block.dimension, false).location
        let blocks = getBlocksFromCenter(containerLocation, block.dimension)
    
        for (let sign of blocks) {
            let component = sign.getComponent("sign");
            if (!component) continue;
            let text = component.getText();
            if (!text) continue;
            if (!text.startsWith("【已上鎖】") && !text.startsWith("【更多使用者】")) continue;
            checkExist = true;
        }

        return {
            signExist: checkExist,
            containerExist: false,
            hasPermission: checkPermission,
            isOwner: false
        }
    }
    
    let targetContainers_Pos = getExtendChest(targetContainer)
    /**
     * @type {mc.Block[]}
     */
    let targetContainers = []
    if (!targetContainers_Pos) targetContainers = [targetContainer] // 該方塊並非箱子
    else {
        for (let cn of targetContainers_Pos) {
            targetContainers.push(block.dimension.getBlock(cn))
        }
    }

    for (const targetContainer of targetContainers) {
        let containerLocation = targetContainer.location
        let blocks = getBlocksFromCenter(containerLocation, block.dimension)
        for (let sign of blocks) {
            /**
             * @type {mc.BlockSignComponent}
             */
            let component = sign.getComponent("sign");

            if (!component) continue;

            // 檢查告示牌是否附著於目標容器(若參數方塊為容器)上
            if (containers.includes(block.typeId)) {
                let container = getTargetBlockFromSign(sign.location, sign.dimension, true)
                if (container.typeId == "minecraft:chest") {
                    let containers = getExtendChest(container)
                    let check = false
                    for (let container of containers) {
                        if (container.x != block.x) continue
                        if (container.y != block.y) continue
                        if (container.z != block.z) continue
                        check = true
                    }
                    if (!check) continue;
                } else {
                    if (container.x != block.x) continue
                    if (container.y != block.y) continue
                    if (container.z != block.z) continue
                }
                // 若座標不同則代表告示牌指定容器和點擊的容器不相同。
            }


            let text = component.getText();
            if (!text) continue;
            if (!text.startsWith("【已上鎖】") && !text.startsWith("【更多使用者】")) continue;
            let users = text.split("\n")
            checkExist = true;

            // 取得 OWNER
            if (text.startsWith("【已上鎖】")) {
                owner = users[1]
            }

            for (let user of users) {
                if (text == "【已上鎖】") continue;
                if (text == "【更多使用者】") continue;
                totalUsers.push(user)
                if (player.name == user) {
                    checkPermission = true
                    break;
                }
            }
        }
    }
    
    let isOwner = (owner == player.name) ? true : false
    // 告示牌上沒有記載玩家名稱 但有前綴
    if (totalUsers.length == 0) return {
        signExist: false,
        containerExist: true,
        hasPermission: checkPermission,
        isOwner
    }

    return {
        signExist: checkExist,
        containerExist: true,
        hasPermission: checkPermission,
        isOwner
    }
}



/**
 * 取得構成大箱子的兩個方塊或一個小箱子
 * @param {mc.Block} block 其中一個箱子
 * @returns {null | {x: number, y: number, z: number}[]}`null` 參數方塊不是箱子
 */
function getExtendChest (block) {
    if (block.typeId != "minecraft:chest") return null
    let faceDirection = block.permutation.getAllStates()["minecraft:cardinal_direction"]

    
    let pos1 = block.location // 界線 (最小值)
    let pos2 = block.location // 界線 (最大值)
    // 找到箱子的界線 | pos1
    while (true) {
        if (faceDirection == "south" || faceDirection == "north") {
            // 變動 x 座標
            let checkBlock = block.dimension.getBlock(pos1)
            if (checkBlock.typeId != "minecraft:chest") break;
            // 箱子面向方向不同
            if (checkBlock.permutation.getAllStates()["minecraft:cardinal_direction"] != faceDirection) break;
            
            else pos1.x--
        } else {
            // 變動 z 座標
            let checkBlock = block.dimension.getBlock(pos1)
            if (checkBlock.typeId != "minecraft:chest") break;
            // 箱子面向方向不同
            if (checkBlock.permutation.getAllStates()["minecraft:cardinal_direction"] != faceDirection) break;
            
            else pos1.z--
        }
    }

    // 找到箱子的界線 | pos2
    while (true) {
        if (faceDirection == "south" || faceDirection == "north") {
            // 變動 x 座標
            let checkBlock = block.dimension.getBlock(pos2)
            if (checkBlock.typeId != "minecraft:chest") break;
            // 箱子面向方向不同
            if (checkBlock.permutation.getAllStates()["minecraft:cardinal_direction"] != faceDirection) break;
            
            pos2.x++
        } else {
            // 變動 z 座標
            let checkBlock = block.dimension.getBlock(pos2)
            if (checkBlock.typeId != "minecraft:chest") break;
            // 箱子面向方向不同
            if (checkBlock.permutation.getAllStates()["minecraft:cardinal_direction"] != faceDirection) break;
            
            pos2.z++
        }
    }
    // console.warn(JSON.stringify(pos1), JSON.stringify(pos2));
    let chests = [] // [[箱子1, 箱子2], [箱子1]]

    if (faceDirection == "south" || faceDirection == "north") {
        // 變動 x 座標
        while (true) {
            pos1.x++
            if (pos1.x >= pos2.x) break;
            let getBlock = block.dimension.getBlock(pos1)
            let inv = getBlock.getComponent("inventory")
            if (inv.container.size == 27) {
                // 確認為小箱子
                chests.push([{x: pos1.x, y: pos1.y, z: pos1.z}])
            } else {
                // 大箱子
                chests.push([{x: pos1.x, y: pos1.y, z: pos1.z}, {x: pos1.x+1, y: pos1.y, z: pos1.z}])
                pos1.x++
            }
        }
    } else {
        // 變動 z 座標
        while (true) {
            pos1.z++
            if (pos1.z >= pos2.z) break;
            let getBlock = block.dimension.getBlock(pos1)
            let inv = getBlock.getComponent("inventory")
            if (inv.container.size == 27) {
                // 確認為小箱子
                chests.push([{x: pos1.x, y: pos1.y, z: pos1.z}])
            } else {
                // 大箱子
                chests.push([{x: pos1.x, y: pos1.y, z: pos1.z}, {x: pos1.x, y: pos1.y, z: pos1.z+1}])
                pos1.z++
            }
        }
    }

    for (let i in chests) {
        for (let j in chests[i]) {
            if (chests[i][j].x != block.location.x) continue
            if (chests[i][j].y != block.location.y) continue
            if (chests[i][j].z != block.location.z) continue

            return chests[i]
        }
    }
}



/**
 * blockFace: `South z+1, North z-1, East x+1, West x-1, Up y+1, Down return;`
 * @param {mc.Player} player 
 * @param {mc.Block} block 
 * @param {mc.Direction} blockFace 
 * @param {mc.ContainerSlot}
 */
function createLockedContainer(player, block, blockFace, getPlayerSlot) {
    // 確認是否沒有人設定
    let per = checkPlayerPermission(player, block)

    if (per.containerExist && per.signExist) {
        if (!per.isOwner) {
            return player.sendMessage("§c§l>> §e無法鎖定該箱子!")
        }
    }

    let blockLocation = block.location
    if (blockFace == "South") blockLocation.z++;
    if (blockFace == "North") blockLocation.z--;
    if (blockFace == "East") blockLocation.x++;
    if (blockFace == "West") blockLocation.x--;
    if (blockFace == "Up") blockLocation.y++;
    
    if (player.dimension.getBlock(blockLocation).typeId != "minecraft:air") {
        return; // 不可覆蓋告示牌
    }

    let wallSign = getPlayerSlot.getItem().typeId.replace("minecraft:", "").toLowerCase();
    if (blockFace != "Up") {
        if (wallSign.startsWith("oak")) wallSign = "wall" + wallSign.replace("oak", "");
        else wallSign = wallSign.split("_")[0] + "_wall_" + wallSign.split("_")[1]
    } else {
        if (wallSign.startsWith("oak")) wallSign = "standing" + wallSign.replace("oak", "")
        else wallSign = wallSign.split("_")[0] + "_standing_" + wallSign.split("_")[1]
    }
    player.dimension.runCommand(`setblock ${blockLocation.x} ${blockLocation.y} ${blockLocation.z} ${wallSign}`)

    const Sign = player.dimension.getBlock(blockLocation);
    // 調整告示牌擺放
    if (blockFace != "Up") {
        let facing_direction = 3 // South
        if (blockFace == "North") facing_direction = 2;
        if (blockFace == "West") facing_direction = 4;
        if (blockFace == "East") facing_direction = 5;

        Sign.setPermutation(Sign.permutation.withState("facing_direction", facing_direction))
    }

    /**
     * @type {mc.BlockSignComponent}
     */
    const component = Sign.getComponent("sign");
    // 偵測是否為擴充名單
    let checkExist = false;

    /**
     * @type {mc.Block[]}
     */
    let containers = []
    if (block.typeId == "minecraft:chest") {
        getExtendChest(block).forEach(e => containers.push(block.dimension.getBlock(e)))
    } else containers = [block]


    for (let block of containers) {
        let containerSigns = getBlocksFromCenter(block.location, block.dimension);
        for (let sign of containerSigns) {
            /**
             * @type {mc.BlockSignComponent}
             */
            let component2 = sign.getComponent("sign");

            if (!component2) continue;

            let text = component2.getText();
            if (!text) continue;
            if (!text.startsWith("【已上鎖】")) continue;

            checkExist = true;
            component.setText(`【更多使用者】`)
        }
    }

    if (!checkExist) {
        component.setText(`【已上鎖】\n${player.name}`)
    }
    component.setWaxed(); // 不可更改告示牌
    

    if (getPlayerSlot.getItem().amount == 1) return getPlayerSlot.setItem();
    let newItem = getPlayerSlot.getItem()
    newItem.amount--
    getPlayerSlot.setItem(newItem)
}

const containers = ["minecraft:chest"]

// 上鎖容器
Event.on("beforeItemUseOn", events => {
    const { source: player, block, blockFace } = events
    /**
     * @type {mc.EntityInventoryComponent}
     */
    const getInv = player.getComponent("inventory");
    const getPlayerSlot = getInv.container.getSlot(player.selectedSlot)

    if (!getPlayerSlot.getItem()) return;
    if (getPlayerSlot.getItem().typeId.indexOf("_sign") == -1) return;
    if (getPlayerSlot.getItem().typeId.indexOf("hanging") != -1) return;
    if (player.isSneaking) return;
    if (blockFace == "Down") return;


    const db = playerDB.table(player.id), InLandExist = db.getData("inLandData")
    if (InLandExist && typeof InLandExist.value == "object") {
        let landData = InLandExist.value
        if (!landData.inLand.per.container && !getAdmin(player)) {
            if (!landData.inLand.per.build) {
                events.cancel = true
                return;
            }
        }
    }
    let landData = checkInLand_Pos(block.location.x, block.location.z, player.dimension.id)
    if (landData) {
        let getPer = { "container": false, "build": false }
        // 偵測公共權限
        if (landData.permission.container) {
            getPer.container = true
        }
        if (landData.permission.build) {
            getPer.container = true
        }
        // 偵測設定權限
        if (!landData.Public && landData.users) {
            for (let user of landData.users) {
                if (user.username == player.name) {
                    getPer.container = user.permission.container
                    getPer.build = user.permission.build
                }
            }
        }
        if (!getPer.container && !getPer.build && !getAdmin(player)) {
            events.cancel = true
            return;
        }
    }



    if (!containers.includes(block.typeId)) return;
    
    events.cancel = true
    
    mc.system.runTimeout(() => {
        createLockedContainer(player, block, blockFace, getPlayerSlot)
    }, 1)
})

// 偵測上鎖
Event.on("beforePlayerInteractWithBlock", events => {
    const { player, block } = events;
    
    if (!containers.includes(block.typeId)) return;
    
    let per = checkPlayerPermission(player, block)
    if (!per.hasPermission && per.containerExist && per.signExist) {
        events.cancel = true;
        return player.sendMessage("§c§l>> §e無法使用該容器!")
    }
})

// 新增使用者
Event.on("beforeItemUseOn", events => {
    const { source: player, block } = events;
    let signData = getSignData(block)
    if (!signData) return;
    let Users = signData.users
    let Prefix = signData.prefix
    let text = signData.text
    let component = signData.component
    let keyData = checkPlayerPermission(player, block)
    if (!keyData.containerExist) return;

    let havePermission = keyData.isOwner
    if (!havePermission) return player.sendMessage(`§c§l>> §e您無法更改使用者!`);

    mc.system.runTimeout(async () => {
        let hasOWNER = false
        let form = new ui.ActionFormData()
            .title(`§e§l使用者設定 §f| §b${Users.length}§f/§b3`)
        for (let i in Users) {
            if (Number(i) == 0 && text.startsWith("【已上鎖】")) {
                form.button(`§l§f[§eOWNER§f]\n§b${Users[i]}`)
                hasOWNER = true
            } else form.button(Users[i])
        }
        if (Users.length < 3) form.button("§a§l新增使用者")
        let response = await form.show(player);
        if (response.canceled) return;
        if (response.selection == Users.length) {
            let form = new ui.ModalFormData()
                .title("§a§l新增使用者")
                .textField("§e§l使用者名稱", "名稱")
            let response = await form.show(player);
            if (response.canceled) return;
            let name = response.formValues[0];
            if (!name) return player.sendMessage("§c§l>> §e名稱不得為空!");
            if (Users.length > 0) {
                component.setText(`${Prefix}\n${Users.join("\n")}\n${name}`);
            } else component.setText(`${Prefix}\n${name}`);
        } else {
            if (hasOWNER && response.selection === 0) return player.sendMessage("§c§l>> §e無法修改擁有者")
            let user = Users[response.selection];
            let form = new ui.ActionFormData()
                .title("§e§l修改使用者 §f| §b" + user)
            form.button("§b§l修改")
            form.button("§c§l刪除")
            let response2 = await form.show(player)
            if (response2.canceled) return;
            if (response2.selection == 0) {
                let form = new ui.ModalFormData()
                    .title("§b§l修改使用者")
                    .textField("§e§l使用者名稱", "名稱", user)
                let response = await form.show(player)
                if (response.canceled) return;
                let name = response.formValues[0]
                if (!name) return player.sendMessage("§c§l>> §e名稱不得為空!");
                Users.splice(Users.indexOf(user), 1, name)
                component.setText(`${Prefix}\n${Users.join("\n")}`)
            } else if (response2.selection == 1) {
                Users.splice(Users.indexOf(user), 1)
                component.setText(`${Prefix}\n${Users.join("\n")}`)
            }
        }
    }, 1)
})

// 上鎖防破壞偵測 
Event.on("beforePlayerBreakBlock", events => {
    const { block, player } = events

    let blockPer = checkPlayerPermission(player, block)

    if (blockPer.containerExist && blockPer.signExist && !blockPer.isOwner) {
        events.cancel = true

        if (block.getComponent("sign")) {
            let text = block.getComponent("sign").getText()
            mc.system.runTimeout(() => {
                block.getComponent("sign").setText(text)
            }, 1)
        }

        return player.sendMessage(`§c§l>> §e您無法破壞該方塊!`);
    }
})

// 主要鎖遭破壞時其餘隨之消失
Event.on("beforePlayerBreakBlock", events => {
    const { block, player } = events
    
    let signData = getSignData(block)
    if (!signData) return;
    let blockPer = checkPlayerPermission(player, block)
    if (!blockPer.containerExist || !blockPer.signExist || !blockPer.isOwner) return; // 確認玩家是否有權破壞
    if (signData.prefix != "【已上鎖】") return // 確認是否為主要鎖

    let targetBlock = getTargetBlockFromSign(block.location, block.dimension, true)
    if (!targetBlock) return;

    let Signs = getBlocksFromCenter(targetBlock.location, targetBlock.dimension)
    
    let isDestroyed = false
    for (let sign of Signs) {
        let keySign = getSignData(sign)
        if (!keySign) continue // 代表不是告示牌或該告示牌沒有記載鎖的內容
        if (keySign.prefix == "【已上鎖】") continue // 確認是否不為主要鎖

        let location = sign.location
        mc.system.runTimeout(() => {
            cmd_Dimension(`setblock ${location.x} ${location.y} ${location.z} air destroy`, sign.dimension.id) // 破壞
        }, 1)
        isDestroyed = true
    }
    if (isDestroyed) {
        player.sendMessage(`§3§l>> §e由於告示牌拆除導致未指定「容器鎖設定者」 因此其餘「容器鎖告示牌」拆除。`);
    }

    return;
})