declare interface DefaultValue {
    dbName: string,
    values: DefaultValueSetting[]
}

declare interface DefaultValueSetting {
    /**
     * 設定`null`(不特別定義)則為全部
     */
    tableName?: string | null,
    key: string,
    value: string | number | any[] | {},
    score?: number
}