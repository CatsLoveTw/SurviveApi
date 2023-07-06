type MinecraftDimensionType = "minecraft:overworld" | "minecraft:nether" | "minecraft:the_end"
declare interface BackLocation {
    back: {
        x: number,
        y: number,
        z: number,
        dimension: MinecraftDimensionType
    }
}
