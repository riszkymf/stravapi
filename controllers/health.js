const express = require('express');


const apiHealth = express.Router();

apiHealth.get('/health',function(req,res){
    res.status(200).json({message: "Ok", status: 200})
})

module.exports = {apiHealth}