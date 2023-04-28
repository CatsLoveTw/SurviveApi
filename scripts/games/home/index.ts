interface HomeScoreData {
    name: string,
    pos: {
        x: {
            1: number,
            2: number,
        },
        z: {
            1: number,
            2: number,
        };
    };
    UID: string,
    player: string,
}