const {apiAccount} = require("./account")
const {apiActivity} = require("./activity")
const {apiHealth} = require("./health")
const {apiSync,apiSyncProtected} = require("./sync")
const auth = require("../middleware/auth")

/**
 * Configure router auth middleware
 * 
 */


module.exports = {
    Routers : [
        apiHealth,
        apiSync,
    ],
    ProtectedRouters:[
        apiSyncProtected,
        apiAccount,
        apiActivity,
    ]
}