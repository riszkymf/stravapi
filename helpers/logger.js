const { v4: uuidv4 } = require('uuid'),
      logError = require('debug')('LOG_ERROR'),
      logInfo  = require('debug')('LOG_INFO'),
      logDebug = require('debug')('LOG_DEBUG');


var m = new Date();
var dateString = m.getUTCFullYear() + "/" + (m.getUTCMonth() + 1) + "/" + m.getUTCDate() + " " + m.getUTCHours() + ":" + m.getUTCMinutes() + ":" + m.getUTCSeconds();      

module.exports = {

    logError: (err) =>{
        var trackId = uuidv4();
        logError(dateString + " : " + trackId + " " + JSON.stringify(err))
        return {
            "error" : {
                "trackId": trackId
            }
        }
    },

    logInfo: (args,sessionId) => {
        if(!sessionId){
            var sessionId = uuidv4();
        }
        logInfo(dateString + " : " + sessionId + " " + JSON.stringify(args))
    },
    logDebug: (args,sessionId) => {
        if(!sessionId){
            var sessionId = uuidv4();
        }
        logDebug(dateString + " : " + sessionId + " " + JSON.stringify(args))
    },

}
