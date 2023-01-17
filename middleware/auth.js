var jwt = require('jsonwebtoken');
var fs = require('fs');
const utils = require('../helpers/utils');
if(!process.env.APP_ENV){
    require('dotenv').config({ path: '.env' })
}
const secretKey = process.env.JWT_SECRET

const getJWTErrors = (err) =>{
    let message;
    switch(err.name){
        case 'TokenExpiredError':
            message = `42_MINI_TOKEN_ERROR: Your session have expired at ${new Date(err.expiredAt)}`
            break;
        case 'JsonWebTokenError':
            message = `42_MINI_TOKEN_ERROR: Your token is invalid`
            break;
        case 'NotBeforeError':
            message = '42_MINI_TOKEN_ERROR: Your token is not active yet'
            break;
        default:
            message = '42_MINI_TOKEN_ERROR: Unknown token error'
            break;
    }

    return message

}


module.exports = (req, res, next) => {
    req["auth"] = null;
    req["res"] = {}
    if(req.headers.authorization){
        var secretKeyJwt = req.headers.authorization.split(" ")[1].split(',')[0];
    } else {
        req.res.status = 200
        req.res.json = { 
            status: 403,
            message: "Unauthorized Access" 
        };
    }
    if(secretKeyJwt && secretKeyJwt != ''){
        if (!secretKeyJwt) {
            req.res.status = 200
            req.res.json = { message: "Forbidden, can't find token" };
        }
        jwt.verify(secretKeyJwt, secretKey, function (err, decoded) {
            if (err){
                req.res.status = 401;
                req.res.json = {
                    status: 401,
                    message: getJWTErrors(err)
                }
            }
            else{
                req["auth"] = decoded;
                req["hashKey"] = utils.hashString(decoded.access_token)
            }
        })
    }
    if (!(Object.keys(req.res).length === 0)){
        res.status(req.res.status).json(req.res.json)
    } else {
        next()
    }
}