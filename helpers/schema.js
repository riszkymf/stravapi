const {Schema} = require("mongoose");

const accountSchema = new Schema({
    _id: Number,
    username: {
        type: String,
        index: true
    },
    firstname: String,
    lastname: String,
    city: String,
    state: String,
    country: String,
    sex: String,
    premium: Boolean,
    strava_created_at: Date,
    strava_updated_at: Date,
    last_sync: Date,
    last_loggedin: Date,
    createdAt: Date
})

const activitySchema = new Schema({
    _id: Number,
    createdAt: Date,
    external_id: String,
    upload_id: Number,
    athlete: {
        _id: false,
        id: {
            type: Number,
            index: true
        },
        username: {
            type: String,
            index: true
        },
        firstname: {
            type: String,
            index: true
        },
        lastname: {
            type: String,
            index: true
        }


    },
    name: String,
    distance: Number,
    moving_time: Number,
    elapsed_time: Number,
    total_elevation_gain: Number,
    elev_high: Number,
    elev_low: Number,
    sport_type: {
        type: String,
        index: true
    },
    start_date: Date,
    start_date_local: Date,
    timezone: String,
    start_latlng: [Number],
    end_latlng: [Number],
    achievement_count: Number,
    kudos_count: Number,
    comment_count: Number,
    athlete_count: Number,
    photo_count: Number,
    total_photo_count: Number,
    map: {
        _id: false,
        id: String,
        polyline: String,
        summary_polyline: String
    },
    trainer: Boolean,
    commute: Boolean,
    manual: Boolean,
    private: Boolean,
    flagged: Boolean,
    workout_type: Number,
    upload_id_str: String,
    average_speed: Number,
    max_speed: Number,
    has_kudoed: Boolean,
    hide_from_home: Boolean,
    gear_id: String,
    kilojoules: Number,
    average_watts: Number,
    device_watts: Boolean,
    max_watts: Number,
    weighted_average_watts: Number,
    description: String,
    photos: {
        count: Number,
        _id: false,
        primary: {
            _id: false,
            id: Number,
            source: Number,
            unique_id: String,
            urls: String
        }
    },
    gear: {
        _id: false,
        id: Number,
        resource_state: Number,
        primary: Boolean,
        name: String,
        distance: Number
    },
    calories: Number,
    segment_efforts: {
        _id: false,
        id: Number,
    },
    device_name: String,
    embed_token: String,
    splits_metric: [{
        _id: false,
        distance: Number,
        elapsed_time: Number,
        elevation_difference: Number,
        moving_time: Number,
        split: Number,
        average_speed: Number,
        pace_zone: Number
    }],
    splits_standard: [{
        _id: false,
        distance: Number,
        elapsed_time: Number,
        elevation_difference: Number,
        moving_time: Number,
        split: Number,
        average_speed: Number,
        pace_zone: Number
    }],
    laps: {
        _id: false,
        id: Number
    },
    best_efforts: {
        id: Number,
        _id: false
    }
})

const SchemaFilter = {
    /**
     * LHS Filter format
     * 
     * {
     *    search:{
     *          [key]: {
     *              operator: value
     *          }
     *      },
     *    searchAny:{
     *          [key]: {
     *              operator: value
     *     }
     *   }
     * }
     * 
     */

    Activity: {
        allowedFields:[
            "sport_type",
            "name",
            "athlete.id",
            "athlete.username",
            "athlete.firstname",
            "athlete.lastname"
        ]
    },
    Account: {
        allowedFields: []
    }
}

const SchemaConverter = {
    Account:{
        convert(stravaObj){
            var now = new Date();
            let result = {
                _id: stravaObj.id,
                strava_created_at: stravaObj.created_at,
                strava_updated_at: stravaObj.updated_at,
                last_loggedin: now,
                createdAt: now
            }
            Object.assign(result,stravaObj)
            return result
        }
    },
    Activity:{
        convert(stravaObj){
            let result = {
                _id: stravaObj.id
            }
            Object.assign(result,stravaObj)
            return result
        }
    }
}


const Schemas = [
    {
        SchemaName: "Account",
        Schema: accountSchema,
        SchemaAllowedFilter: SchemaFilter.Account.allowedFields
    },
    {
        SchemaName: "Activity",
        Schema: activitySchema,
        SchemaAllowedFilter: SchemaFilter.Activity.allowedFields
    }
]


module.exports = {
    Schemas: Schemas,
    SchemaConverter: SchemaConverter
}