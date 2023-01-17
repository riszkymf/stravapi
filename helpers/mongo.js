const { logDebug, logError, logInfo } = require("./logger");
const { Schemas } = require("./schema");
const mongoose = require("mongoose");

if (!process.env.APP_ENV) {
    require("dotenv").config({ path: ".env" });
}

const DB_CONFIG = {
    host: process.env.MONGO_HOST,
    user: process.env.MONGO_USER,
    password: process.env.MONGO_PASS,
    protocol: process.env.MONGO_PROTOCOL,
    opts: process.env.MONGO_OPTS,
    dbName: process.env.MONGO_DB_NAME,
};

const mongoUri = (config) => {
    return `${config.protocol}://${config.user}:${config.password}@${config.host}/${config.dbName}?${config.opts}`;
};

let dbUri = mongoUri(DB_CONFIG);

mongoose.connect(dbUri);
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error: "));
db.once("open", function () {
    console.log("successfully connected");
});

const SchemaOperator = {
    _operators: {
        eq: "$eq",
        gt: "$gt",
        gte: "$gte",
        in: "$gte",
        lt: "$lt",
        lte: "$lte",
        ne: "$ne",
        nin: "$nin",
        regex: "$regex",
        like: "$regex"
    },
    _valueGetters:{
        like: (value)=>{return new RegExp(value,'i')},
        default: (value)=>{return value}
    },
    _group: {
        search: "$and",
        search_any: "or"
    },

    normalizeOperations(filterParams){
        let result = {};
        for(let operator of Object.keys(filterParams)){
            /**
             * Convert operator from LHR Bracket to mongoose.
             * If it doesn't exist skip.
             * Use _valueGetter to return value if exist 
             */
            let operatorName = this._operators?.[operator]
            let filter = {}
            if(operatorName){
                let getter = this._valueGetters[operator] ?? this._valueGetters.default
                let value = filterParams[operator]
                filter = {
                    [operatorName]: getter(value)
                }
            }
            Object.assign(result,filter);
        }
        return result
    },

    parseKeyValue(allowedFields,queryFilter){
        let parsedFilter = {};
        let fields = Object.keys(queryFilter).filter((field)=>{
            return allowedFields.includes(field)
        });
        fields.forEach((field)=>{
            let filter = this.normalizeOperations(queryFilter[field])
            if(Object.keys(filter).length > 0){
                Object.assign(parsedFilter,{
                    [field]: filter
                })
            }
        })
        return parsedFilter
    },
    filterBuild(modelAllowedFields,objQuery){
        return this.parseKeyValue(modelAllowedFields,objQuery);
    }
}
const queryParameterParser = (query) => {
    let queryOptsDefault = {
        page: {
            sanitize(value) {
                return parseInt(value) ? value : 1;
            },
        },
        limit: {
            sanitize(value) {
                return parseInt(value) ? value : 15;
            },
        },
        sort: {
            sanitize(value) {
                let enums = {
                    asc: 1,
                    ascending: 1,
                    desc: -1,
                    descending: -1
                }
                let lowerValue = String(value).toLowerCase();
                return Object.keys(enums).includes(lowerValue) ? enums[lowerValue] : -1;
            },
        },

        sortField:{
            sanitize(value){
            return (value) ? value:"createdAt";
        }
    }
    };
    let querySanitized = {};
    for(let key of Object.keys(queryOptsDefault)){
        let sanitizedValue = queryOptsDefault[key].sanitize(query[key])
        Object.assign(querySanitized,{
            [key]: sanitizedValue
        })
    }

    let skipValue = (querySanitized.page - 1) * querySanitized.limit;

    return{
        skip: (skipValue >= 0) ? skipValue:0 ,
        limit: querySanitized.limit,
        sort: Object.assign({
            [querySanitized.sortField]: querySanitized.sort,
            createdAt: querySanitized.sort
        })
    }
};

const mongooseInit = (mongoose) => {
    mongoose.appModel = {};
    mongoose.appHelper = {
        queryParser: queryParameterParser,
        queryFilterParser: SchemaOperator
    }
    Schemas.forEach((el) => {
        mongoose.appModel[el.SchemaName] = mongoose.model(el.SchemaName, el.Schema);
        mongoose.appModel[el.SchemaName].allowedFields = el.SchemaAllowedFilter
    });
};

module.exports = {
    mongoose: mongoose,
    mongooseInit: mongooseInit,
};
