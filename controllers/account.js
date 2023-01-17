const express = require('express');
const auth = require('../middleware/auth');
const {buildResponse} = require("../helpers/responseHandler")


const apiAccount = express.Router();

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

apiAccount.use(auth)

apiAccount.get('/account/:id',async (req,res)=>{
    let Account = req.app.locals.mongoose.appModel.Account;
    let row = await Account.findById(req.params.id)
    let result = buildResponse(200,{
        data:row
    })
    res.status(200).json(result)
})

apiAccount.get('/accounts', async (req,res)=>{
    let mongoose = req.app.locals.mongoose;
    let Accounts = mongoose.appModel.Account;
    let result;
    try {
        let queryOpts = mongoose.appHelper.queryParser(req.query)
        let rows = await Accounts.find(queryOpts)
        result =buildResponse(200,{
            data: rows
        })
    } catch (error) {
        result = buildResponse(200,{
            message: error.message
        })
    }

    res.status(200).json(result)

})

module.exports = {
    apiAccount
}