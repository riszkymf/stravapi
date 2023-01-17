const jwt = require('jsonwebtoken');
const crypto = require('crypto');

if(!process.env.APP_ENV){
    require('dotenv').config({ path: '.env' })
}

const JWT_SECRET = process.env.JWT_SECRET;
module.exports = {

    createJWT(object){
        object['authIssuedAt'] = Math.floor(Date.now() / 1000);
        const generateToken = jwt.sign(object, JWT_SECRET);

        return generateToken;
    },
    hashString(string){
        const result = crypto.createHash('md5').update(string).digest('hex');
        return result;
    }


}