const qs = require("qs")
const express = require('express');
const apiActivity = express.Router();
const auth = require("../middleware/auth")
const {buildResponse} = require("../helpers/responseHandler")


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

apiActivity.use(auth)


apiActivity.get('/activity/:id',async (req,res)=>{
    let Activity = req.app.locals.mongoose.appModel.Activity;
    let row = await Activity.findById(req.params.id)
    let result = buildResponse(200,{
        data: row
    })
    res.status(200).json(result)
})


apiActivity.delete('/activity/:id',async (req,res)=>{
    let Activity = req.app.locals.mongoose.appModel.Activity;
    let result;
    try{
        await Activity.deleteOne({_id: req.params.id})
        let result = buildResponse(200,{
            message: "Ok"
        })
        res.status(200).json(result)
    }
    catch(err){
        result = buildResponse(200,{
            message: err.message
        })

    }
    res.status(200).json(result)
})

apiActivity.get('/activities', async (req,res)=>{
    let qFilter = {}
    let rows,result;
    let mongoose = req.app.locals.mongoose;
    let Activity = mongoose.appModel.Activity;
    let queryOpts = mongoose.appHelper.queryParser(req.query)
    let queryRaw = qs.parse(req.query)
    try {
        if(queryRaw.search){
            let filterParser = mongoose.appHelper.queryFilterParser
            qFilter = filterParser.filterBuild(Activity.allowedFields,queryRaw.search); 
        }
    
        if(Object.keys(qFilter).length > 0){
            rows = await Activity.find(qFilter,null,queryOpts)
        } else {
            rows = await Activity.find(queryOpts)
        }
        result = buildResponse(200,{
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
    apiActivity
}