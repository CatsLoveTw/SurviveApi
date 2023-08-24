import * as mc from "@minecraft/server"
import * as ui from "@minecraft/server-ui"
import { playerDB } from "../../config"
import { getAdmin } from "../land/land"
import { checkInLand_Pos } from "../land/build"


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

    if (block1) signs.push(block1)
    if (block2) signs.push(block2)
    if (block3) signs.push(block3)
    if (block4) signs.push(block4)

    return signs
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
    let blocks = getBlocksFromCenter(block.location, block.dimension)
    let checkUserExist = false
    let checkUser = false
    for (let sign of blocks) {
        /**
         * @type {mc.BlockSignComponent}
         */
        let component2 = sign.getComponent("sign");

        if (!component2) continue;

        let text = component2.getText();
        if (!text) continue;
        if (!text.startsWith("【已上鎖】") && !text.startsWith("【更多使用者】")) continue;
        checkUserExist = true
        let users = text.split("\n")
        for (let user of users) {
            if (player.name == user) {
                checkUser = true
                break;
            }
        }
    }
    if (!checkUser && checkUserExist) {
        return player.sendMessage("§c§l>> §e無法鎖定該箱子!")
    }

    let blockLocation = block.location
    if (blockFace == "South") blockLocation.z++;
    if (blockFace == "North") blockLocation.z--;
    if (blockFace == "East") blockLocation.x++;
    if (blockFace == "West") blockLocation.x--;
    if (blockFace == "Up") blockLocation.y++;

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
    let chestSigns = getBlocksFromCenter(block.location, block.dimension);
    for (let sign of chestSigns) {
        /**
         * @type {mc.BlockSignComponent}
         */
        let component2 = sign.getComponent("sign");

        if (!component2) continue;

        let text = component2.getText();
        if (!text) continue;
        if (!text.startsWith("【已上鎖】")) continue;

        checkExist = true;
        component.setText("【更多使用者】")
    }
    if (!checkExist) {
        component.setText(`【已上鎖】\n${player.name}`)
    }
    component.setWaxed();

    if (getPlayerSlot.getItem().amount == 1) return getPlayerSlot.setItem();
    let newItem = getPlayerSlot.getItem()
    newItem.amount--
    getPlayerSlot.setItem(newItem)
}

const containers = ["minecraft:chest"]

// 上鎖容器
mc.world.beforeEvents.itemUseOn.subscribe(events => {
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
mc.world.beforeEvents.itemUseOn.subscribe(events => {
    const { source: player, block } = events;
    
    if (!containers.includes(block.typeId)) return;
    
    let checkPermission = false;
    let checkExist = false;
    let blocks = getBlocksFromCenter(block.location, block.dimension)
    
    for (let sign of blocks) {
        /**
         * @type {mc.BlockSignComponent}
         */
        let component = sign.getComponent("sign");

        if (!component) continue;

        let text = component.getText();
        if (!text) continue;
        if (!text.startsWith("【已上鎖】") && !text.startsWith("【更多使用者】")) continue;
        let users = text.split("\n")
        checkExist = true;
        for (let user of users) {
            if (player.name == user) {
                checkPermission = true
                break;
            }
        }
    }
    if (!checkPermission && checkExist) {
        events.cancel = true;
        return player.sendMessage("§c§l>> §e無法使用該箱子!")
    }
})

// 新增使用者
mc.world.beforeEvents.itemUseOn.subscribe(events => {
    const { source: player, block } = events;

    if (!block.typeId.includes("sign") || block.typeId.includes("hanging")) return;
    /**
     * @type {String[]}
     */
    let Users = []
    let Prefix = ""
    /**
     * @type {mc.BlockSignComponent}
     */
    let component = block.getComponent("sign");

    if (!component) return;

    let text = component.getText();
    if (!text) return;
    if (!text.startsWith("【已上鎖】") && !text.startsWith("【更多使用者】")) return;
    let signUsers = text.split("\n")
    for (let i in signUsers) {
        if (Number(i) == 0) {
            Prefix = signUsers[i];
            continue;
        }
        Users.push(signUsers[i])
    }

    if (!Users.includes(player.name)) return player.sendMessage(`§c§l>> §e您無法更改使用者!`);

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
            component.setText(`${Prefix}\n${Users.join("\n")}\n${name}`);
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
