

module.exports = {

    buildResponse(statusCode,{data,message,errors}){
        return{
            status: statusCode,
            data: data,
            message: message,
            errors: errors
        }
    }

}