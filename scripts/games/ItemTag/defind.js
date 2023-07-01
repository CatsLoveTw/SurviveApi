export class ItemTag {
    /**
     * 
     * @param {string} playerName 
     */
    constructor (playerName) {
        this.playerName = playerName
    }
    
    /**
     * 
     * @param {string[] | undefined} join 
     * @returns 
     */
    transfromToLore (join) {
        class transformError {
            constructor () {
                this.error = true
                this.lore = undefined
            }
            /**
             * 
             * @param {string} playerName 
             * @returns 
             */
            fix (playerName) {
                return new ItemTag(playerName).transfromToLore(join)
            } 
        }
        class transformSuccessful {
            /**
             * 
             * @param {string[]} lore 
             */
            constructor (lore) {
                this.error = false
                /**
                 * @type {string[]}
                 */
                this.lore = lore
            }
        }
        if (!this.playerName) return new transformError();
        let array = [`§e§l個人標籤 §7- §b${this.playerName}`]
        if (join) {
            for (let i in join) {
                array.push(join[i])
            }
        }
        return new transformSuccessful(array)
    }
    
    /**
     * 
     * @param {string[]} lore 
     */
    getDataFromLore (lore) {
        let data = lore[0]
        if (!data) return false;
        if (!data.includes(`§e§l個人標籤 §7- `)) return false;
        return new ItemTag(data.replace("§e§l個人標籤 §7- §b", ""))
    }
}