const mongoClient = require('mongodb').MongoClient

const state = {
    db:null
}

module.exports.connect = function(callback){
    const url = 'mongodb+srv://antonypraveenkj:BSi4Kso3mxUoivdk@cluster0.u6z4azy.mongodb.net/meat4u?retryWrites=true&w=majority'
    const dbname = 'meat4u'

    mongoClient.connect(url,(err,data) => {
        if (err){
            return callback(err)
        }
        state.db = data.db(dbname)
        callback()
    })
    
}
module.exports.get=function(){
    return state.db
}
