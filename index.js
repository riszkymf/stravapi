const express = require('express');
const cors = require('cors')
const bodyParser = require('body-parser');
const {RedisTokenHandler} = require("./helpers/token")
const {StravaHandler} = require("./helpers/strava")
const cookieParser = require('cookie-parser');
const {Routers,ProtectedRouters} = require('./controllers')

if(!process.env.APP_ENV){
    require('dotenv').config({ path: '.env' })
}

const APP_CONFIG = {
    env: process.env.APP_ENV || 'development',
    port: parseInt(process.env.APP_PORT) || '5050'
}

const REDIS_CONFIG = {
    REDIS_URL : process.env.REDIS_URL,
    REDIS_PASSWORD: process.env.REDIS_PASSWORD
}

const TOKENS = {
    ACCESS_TOKEN: process.env.STRAVA_TOKEN,
    REFRESH_TOKEN: process.env.STRAVA_REFRESH_TOKEN
}

const STRAVA_CONFIG = {
    STRAVA_HOST:  process.env.STRAVA_HOST,
    ACCESS_TOKEN: process.env.STRAVA_TOKEN,
    REFRESH_TOKEN: process.env.STRAVA_REFRESH_TOKEN,
    CLIENT_SECRET: process.env.STRAVA_CLIENT_SECRET,
    CLIENT_ID: process.env.STRAVA_CLIENT_ID,
    STRAVA_TIMEOUT: process.env.STRAVA_TIMEOUT||5000,
    OAUTH_REDIRECT: process.env.OAUTH_REDIRECT,
    STRAVA_OAUTH_TARGET: process.env.STRAVA_OAUTH_TARGET
}


const app = express();

app.use(cors())
app.use(bodyParser.json({limit: '5gb'}))
app.use(cookieParser());

Routers.forEach((route)=>{
    app.use('/api',route)
})

ProtectedRouters.forEach((route)=>{
    app.use('/api',route)
})

const {mongoose,mongooseInit} = require("./helpers/mongo");

const serverInit = async () =>{
    // Initialize 

    let redisHandler = new RedisTokenHandler(REDIS_CONFIG)
    await redisHandler.client.connect();
    let middleware = {
        mongoose: mongoose,
        strava: new StravaHandler(redisHandler,STRAVA_CONFIG),
        tokenHandler: redisHandler
    }

    mongooseInit(middleware.mongoose)
    middleware.strava.createInstance()
    return Promise.resolve(middleware)
}
serverInit().then((middleware)=>{

    app.locals.strava = middleware.strava;
    app.locals.mongoose = middleware.mongoose
    app.locals.tokenHandler = middleware.tokenHandler;

    app.listen(APP_CONFIG.port,()=>{
        console.log(`App is running at http://0.0.0.0:${APP_CONFIG.port}`)
    })
}).catch(err=>{
    console.error(err.message)
})







