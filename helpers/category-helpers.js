var db=require('../config/connection')
var collection=require('../config/collections')
const { ObjectId } = require('mongodb')
const bodyParser = require('body-parser')
var objectId=require('mongodb').ObjectId
const math=require('mathjs')
const { resolve } = require('mathjs')
const { response } = require('../app')

module.exports={

    addCategory:(catDetails)=>{
        return new Promise(async(resolve,reject)=>{
            
            let catNameExt=await db.get().collection(collection.CATEGORY_COLLECTION).findOne({category_name:catDetails.category_name})
          if(catNameExt){
            db.get().collection(collection.CATEGORY_COLLECTION).updateOne({category_name:catDetails.category_name},{
                $set:{
                    category_name:catDetails.category_name,
                    description:catDetails.description
                }
            }).then((response)=>{
                resolve(response)
            })
          }else{
            db.get().collection(collection.CATEGORY_COLLECTION).insertOne({category_name:catDetails.category_name,description:catDetails.description}).then((response)=>{
               resolve(response)
            })
        }
      
        })
    },

    
    getCategoryList:()=>{
        return new Promise((resolve,reject)=>{
        
             db.get().collection(collection.CATEGORY_COLLECTION).find().sort({_id:-1}).toArray().then((data)=>{
 
               resolve(data)
            })

        })
      
    },

    addCategoryOffer:(offerDetails)=>{

        db.get().collection(collection.CATEGORYOFFER_COLLECTION).insertOne(offerDetails)
        return new Promise(async(resolve,reject)=>{
            let categoryItems= await db.get().collection(collection.PRODUCT_COLLECTION).aggregate([
               {
                $match:{
                      category:offerDetails.category    
                }
               }
            ]).toArray()
            resolve(categoryItems)
    })
    },

    updateCategoryOffer:(proId,offPrice,catOffer,proOffer)=>{
        return new Promise(async(resolve,reject)=>{
            console.log(proId,offPrice,catOffer,proOffer,'haiiiii')
           
            let newOffer=0
            if(catOffer>proOffer){
                newOffer=catOffer
            }else if(proOffer==0){
                newOffer=catOffer
            }
            else{
                newOffer=proOffer
            }
            let updateOffer=db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(proId)},{
                $set:{
                    offerPrice:""+offPrice,
                    offer:""+newOffer
                }
            })
            resolve(updateOffer)
        })
    },

    getCatOfferDetails:()=>{
        return new Promise((resolve,reject)=>{
            let offer=db.get().collection(collection.CATEGORYOFFER_COLLECTION).find().toArray()
            resolve(offer)
        })
    },

    getCategoryOffer:(category)=>{
        return new Promise(async(resolve,reject)=>{
            let categoryItems= await db.get().collection(collection.PRODUCT_COLLECTION).aggregate([
               {
                $match:{
                      category:category    
                }
               }
            ]).toArray()
            resolve(categoryItems)
    })
    },

    removeCategoryOffer:(catId)=>{
        return new Promise((resolve,reject)=>{
              let updateOffer=db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(catId)},{
                $set:{
                    offerPrice:0,
                    offer:0
                }
            })
            resolve(updateOffer)
        })
    },

    getStatus:(Category)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CATEGORYOFFER_COLLECTION).deleteOne({category:Category})    
                    resolve({status:true})
        })
    },

    removeCategory:(catDetails)=>{
        return new Promise(async(resolve,reject)=>{
            let response={}
           let proExt=await db.get().collection(collection.PRODUCT_COLLECTION).findOne({category:catDetails.catName})
                if(proExt){
                    console.log('product exist')
                    response.proExt=true
                    resolve(response)
                    console.log('problem solved')
                }else{
                    db.get().collection(collection.CATEGORY_COLLECTION).deleteOne({_id:objectId(catDetails.catId)}).then((response)=>{
                        response.removeCategory=true
                        resolve(response)
                    })
                }
          
          
        })
    }
}