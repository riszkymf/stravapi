const axios = require("axios");
const URL = require('url').URL;

class StravaHandler {

    constructor(tokenHandler,config){
        this.tokenHandler = tokenHandler
        this.clientId = parseInt(config.CLIENT_ID)
        this.clientSecret = config.CLIENT_SECRET
        this.config = config
        this.baseHeaders = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };
    }

    configUser(hashToken){
        this.hashTokenKey = hashToken;
    }

    async createInstance(){
        try{
            this.stravaInstance = axios.create({
                baseURL: this.config.STRAVA_HOST,
                headers: this.baseHeaders
            })
            await this.setInterceptorRefreshToken()
        } catch(err){
            return Promise.reject(err)
        }
        return Promise.resolve()

    }

    async setInterceptorRefreshToken(){
        
        this.stravaInstance.interceptors.request.use(
            async config => {
                const accessToken = await this.tokenHandler.getAccessToken(this.hashTokenKey);
                config.headers = Object.assign(this.baseHeaders,{
                    Authorization: "Bearer " + accessToken
                })
                return config
            },
            err => {
                return Promise.reject(err)
            }
        )


        this.stravaInstance.interceptors.response.use(
            (response) => {
                return response
            },
            async (err) => {
                console.error(err.response.data.errors)
                const originalReq = err?.config ?? {};
                if( err.response.status === 401 && !originalReq._isRetryRequest ){
                        originalReq._isRetryRequest = true;
                        await this.refreshToken();
                        return this.stravaInstance(originalReq)
                    }
                return Promise.reject(err)
            }
        )
    }

    async refreshToken(){
        delete this.stravaInstance.defaults.headers.Authorization;
        let refreshToken = await this.tokenHandler.getRefreshToken(this.hashTokenKey)
        let params = {
            client_id: this.clientId,
            client_secret: this.clientSecret,
            grant_type: 'refresh_token',
            refresh_token: refreshToken
        }


        let response = await axios.post(this.config.STRAVA_HOST + '/oauth/token',params)
        let tokens = {
            accessToken: response.data.access_token,
            refreshToken: response.data.refresh_token
        }
        let newAccessToken = await this.updateToken(tokens.accessToken,tokens.refreshToken)
        if(!newAccessToken){
            return Promise.reject("Failed to store new tokens")
        }
        await this.tokenHandler.deleteAccessToken(this.hashTokenKey)
        await this.tokenHandler.deleteRefreshToken(this.hashTokenKey)
        return newAccessToken
    }

    async updateToken(accessToken,refreshToken){
        let changeToken = await this.tokenHandler.storeAccessToken(this.hashTokenKey,accessToken)
        if(!changeToken){
            return false
        }
        changeToken = await this.tokenHandler.storeRefreshToken(this.hashTokenKey,refreshToken)
        if(!changeToken){
            return false
        }
        Object.assign(this.token,{accessToken: accessToken, refreshToken: refreshToken})
        return accessToken
    }

    async getLoggedInAthlete(){
        try {
            let response = await this.stravaInstance.get('/athlete')
            return response
        } catch (error) {
            console.error(error.message);
            return error
        } 
    }

    async getActivityById(activityId){
        let response;
        try {
            response = await this.stravaInstance.get('/activities',{
                params: {
                    id: activityId
                }
            })
        } catch (error) {
            console.error(error.message);
            return error
        } 
        return response
    }

    async getAthleteActivities(params){
        let response;
        try {
            response = await this.stravaInstance.get('/athlete/activities',{
                params: params
            })
        } catch (error) {
            console.error(error);
            return error
        } 
        return response
    }

    authorize(){
        const uri = new URL(this.config.STRAVA_HOST + "/oauth/authorize");
        uri.searchParams.append("client_id", this.clientId);
        uri.searchParams.append("response_type", 'code');
        uri.searchParams.append("approval_prompt", 'force');
        uri.searchParams.append("scope", 'activity:read_all');
        uri.searchParams.append("redirect_uri", this.config.OAUTH_REDIRECT);

        return uri.href;
    }

    async getAuthorizationToken(authorizationCode){
        try {
            let response = await axios.post(this.config.STRAVA_HOST + "/oauth/token",{
                client_id: this.clientId,
                client_secret: this.clientSecret,
                code: authorizationCode,
                grant_type: 'authorization_code'
            })
            return response

        } catch (error) {
            console.error(error.message)
            return error
        }
    }

    async deauthorizeToken(accessToken){
        try {
            let response = axios.post(this.config.STRAVA_HOST + "/oauth/deauthorize",{
                access_token: accessToken
            })
            return response.data
        } catch (error) {
            console.error(error.message)
            return error
        }
    }



}


module.exports = {
    StravaHandler: StravaHandler
}