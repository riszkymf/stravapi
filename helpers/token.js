const {createClient} = require("redis");
const asyncRedis = require("async-redis");


class RedisTokenHandler {

    constructor(config){
        let client = createClient({
            url: config.REDIS_URL,
            password: config.REDIS_PASSWORD
        })

        client.on("error",function(error){
            console.error(error.message)
            return
        })

        this.client = client

    }

    async storeAccessToken(hashTokenKey,value){
        return await this.storeToken("ACCESS_TOKEN_"+hashTokenKey,value,0);
    }

    async storeRefreshToken(hashTokenKey,value){
        return await this.storeToken("REFRESH_TOKEN_"+hashTokenKey,value,0);
    }

    async getRefreshToken(hashTokenKey){
        return await this.getToken("REFRESH_TOKEN_"+hashTokenKey)
    }

    async getAccessToken(hashTokenKey){
        return await this.getToken("ACCESS_TOKEN_"+hashTokenKey)
    }

    async deleteAccessToken(hashTokenKey){
        return await this.deleteToken("ACCESS_TOKEN_"+hashTokenKey)
    }

    async deleteRefreshToken(hashTokenKey){
        return await this.deleteToken("REFRESH_TOKEN_"+hashTokenKey)
    }

    async deleteToken(tokenFields){
        this.client.del(tokenFields).then((res)=>{
        }).catch((err)=>{
            console.error(err.message)
        })
    }

    async storeToken(tokenFields,tokenValue,ttl=0) {
        let redisStatus = true
        this.client.set(tokenFields,tokenValue).then((res)=>{
        },(err)=>{
                console.error("REDIS_ERROR : ",err)
                redisStatus = false
        })
        return redisStatus
    }

    async getToken(tokenFields){
        let redisReply = await this.client.get(tokenFields)
        return redisReply
    }

}


module.exports = {
    RedisTokenHandler
}