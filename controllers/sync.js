const qs = require("qs")
const express = require('express');
const utils = require("../helpers/utils")
const {buildResponse} = require("../helpers/responseHandler")
const {SchemaConverter} = require("../helpers/schema");
const auth = require("../middleware/auth");


/**
 * Filtering and Sorting method.
 * 
 * Get Parameter construction:
 * {
 *   page: default (1),
 *   limit: default (15),
 *   sort: [asc, desc] default asc
 *   sortField: default createdAt
 *  }
 * 
 */

const apiSyncProtected = express.Router();
const apiSync = express.Router()

apiSyncProtected.use(auth)

apiSync.get('/connect',async (req,res)=>{
    let strava = req.app.locals.strava;
    let response = strava.authorize()
    res.status(200).json(
        buildResponse(200,{
            data: {
                redirect_uri: response
            }
        }))
})

apiSync.get('/auth/callback',async(req,res)=>{
    let authorizationCode = req.query.code;
    let strava = req.app.locals.strava;
    let Account = req.app.locals.mongoose.appModel.Account
    let result;
    try {
        let resp = await strava.getAuthorizationToken(authorizationCode)
        let sanitizedAccount = SchemaConverter.Account.convert(resp.data.athlete)
        await Account.findOneAndUpdate(
            { _id: sanitizedAccount._id },
            { $setOnInsert: sanitizedAccount },
            { upsert: true, new:true, runValidators:true}
        )
        await Account.findOneAndUpdate(
            { _id: sanitizedAccount._id },
            {last_loggedin: sanitizedAccount.last_loggedin},
            { upsert: true, new:true, runValidators:true}
        )
        let jwtPayload = {
            access_token: resp.data.access_token,
            refresh_token: resp.data.refresh_token,
            account_id: resp.data.athlete.id,
            token_type: resp.data.token_type,
            expires_at: resp.data.expires_at
        }
        let jwtToken = utils.createJWT(jwtPayload)
        strava.configUser(jwtPayload.access_token)
        await strava.tokenHandler.storeAccessToken(strava.hashTokenKey,jwtPayload.access_token)
        await strava.tokenHandler.storeRefreshToken(strava.hashTokenKey,jwtPayload.refresh_token)
        result = buildResponse(200,{
            data:{
                access_token: jwtToken,
                account_id: jwtPayload.account_id
            },
            message: "Ok"
        })

    } catch (error) {
        result = buildResponse(500,{
            message: error.message
        })
    }
    res.status(200).json(result)
})

apiSyncProtected.get('/sync',async(req,res)=>{
    let strava = req.app.locals.strava;
    let accessToken = req.auth.access_token
    let accountId = req.auth.account_id
    let result;
    try {
        strava.configUser(accessToken)
        let Activity = req.app.locals.mongoose.appModel.Activity;
        let Account = req.app.locals.mongoose.appModel.Account;
        let now = new Date()
        let timeFilter = new Date(now.getFullYear(), now.getMonth(), now.getDate()-3)
        let response = await strava.getAthleteActivities({
            after: timeFilter/1000,
            page: 1,
            per_page: 65
        })
        if(response.data.length > 0){
            let account = await Account.findById(accountId)

            for(let activity of response.data){
                Object.assign(activity,{
                    athlete:{
                        username: account.username,
                        firstname: account.firstname,
                        lastname: account.lastname
                    }
                })

                let sanitizedInput = SchemaConverter.Activity.convert(activity);
                await Activity.findOneAndUpdate(
                    { _id: sanitizedInput._id },
                    { $setOnInsert: sanitizedInput },
                    { upsert: true, new:true, runValidators:true}
                )
            }    
        }

        
        result = buildResponse(200,{
            data: {
                activities: response.data
            }
        })
    } catch (error) {
        result = buildResponse(500,{message: error.message})
    }

    res.status(200).json(result)
})

apiSyncProtected.get('/disconnect',async (req,res)=>{
    let strava = req.app.locals.strava;
    let hashKey = req.auth.hashKey
    let accessToken = req.auth.access_token;
    let result
    try {
        await strava.tokenHandler.deleteAccessToken(hashKey)
        await strava.tokenHandler.deleteRefreshToken(hashKey)
        let response = strava.deauthorizeToken(accessToken)
        result = buildResponse(200,{
            data: response.data
        })
    } catch (error) {
        result = buildResponse(500,{
            message: error.message
        })
    }

    res.status(200).json(result)
})

module.exports = {
    apiSync,
    apiSyncProtected
}