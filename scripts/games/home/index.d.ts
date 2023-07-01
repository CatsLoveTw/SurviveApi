/// <reference path="../land/index.d.ts" />


declare type HomePosition = {
    x: number,
    y: number,
    z: number
}

declare type HomeDimension = "over" | "nether" | "end"


declare interface HomeScoreData {
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

declare type HomeData = {
    home: {
        name: string, 
        pos: HomePosition,
        land: import("../land/index").LandData,
        dime: HomeDimension
    }
}


declare type HomeShare = {
    "homeShare": {
        /**
         * 分享者
         */
        "source": string,
        /**
         * 被分享者
         */
        "sharedName": string,
        /**
         * 持續時間
         */
        "duration": number,
        /**
         * 開始時間，使用{@linkcode Date.getTime()}
         */
        "startTime": number,
        /**
         * 分享的傳送點內容
         */
        "homeData": HomeData
    }
}

declare type HomeShared = {
    "homeShared": {
        /**
         * 分享者
         */
        "source": string,
        /**
         * 被分享者
         */
        "sharedName": string,
        /**
         * 持續時間
         */
        "duration": number,
        /**
         * 開始時間，使用{@linkcode Date.getTime()}
         */
        "startTime": number,
        /**
         * 分享的傳送點內容
         */
        "homeData": HomeData
    }
}