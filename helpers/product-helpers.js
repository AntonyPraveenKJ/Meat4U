var db=require('../config/connection')
var collection=require('../config/collections')
const { ObjectId } = require('mongodb')
var objectId=require('mongodb').ObjectId
const math=require('mathjs')
const { resolve } = require('mathjs')

module.exports={

    addProduct:(product)=>{
      console.log(product)
      product.price=parseInt(product.price)
      product.offer=parseInt(product.offer)
      product.stock=parseInt(product.stock)
    
     return new Promise(async(resolve,reject)=>{
      let prdct=await db.get().collection(collection.PRODUCT_COLLECTION).findOne({})

      if(product.offer!=""){
        var newPrice=math.round((product.price)*((100-product.offer)/100))
         newPrice=parseInt(newPrice)
       }
 
       let prodObj={
             ID:product.ID,
             name:product.name,
             price:product.price,
             stock:product.stock,
             offer:product.offer,
             offerPrice:newPrice,
             description:product.description,
             category:product.category,
             image:product.image
 
       }
 
 
         db.get().collection(collection.PRODUCT_COLLECTION).insertOne(prodObj).then((data)=>{
             
            resolve(data)
         })
     })
      
    },
    getAllProducts:()=>{
      return new Promise(async(resolve,reject)=>{
        let products= await db.get().collection(collection.PRODUCT_COLLECTION).find().sort({ _id: -1 }).toArray()
         resolve(products)
      })
    },

    deleteProduct:(prodId)=>{
      return new Promise((resolve,reject)=>{
        db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({_id:objectId(prodId)}).then((response)=>{
          resolve(response)
        })
      })
    },

    getProductDetails:(proId)=>{
      return new Promise((resolve,reject)=>{
        db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(proId)}).then((product)=>{
          resolve(product)
        })
      })
    },

    updateProduct:(proId,proDetails)=>{
      proDetails.price=parseInt(proDetails.price)
      proDetails.offer=parseInt(proDetails.offer)
      proDetails.offerPrice=parseInt(proDetails.offerPrice)
      proDetails.stock=parseInt(proDetails.stock)
      
      return new Promise(async(resolve,reject)=>{

        let img=await db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(proId)})
        if(proDetails.image.length==0){
          proDetails.image=img.image
        }
        
      if(proDetails.offer!=0){
        var newPrice=math.round((proDetails.price)*((100-proDetails.offer)/100))
        newPrice=parseInt(newPrice)
       }else{
        var newPrice=0
       }
        db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:ObjectId(proId)},{
          $set:{
            ID:proDetails.ID,
            name:proDetails.name,
            price:proDetails.price,
            stock:proDetails.stock,
            offer:proDetails.offer,
            offerPrice:newPrice,
            description:proDetails.description,
            category:proDetails.category,
            image:proDetails.image
          }
        }).then((response)=>{
          resolve()
        })
      })
    },

    getAllOrderDetails:()=>{
      return new Promise((resolve,reject)=>{
        let orderDetails=db.get().collection(collection.ORDER_COLLECTION).find().sort({_id:-1}).toArray()
        resolve(orderDetails)
      })
    },

    productShipped: (details)=>{
      console.log(details,'haiii')
      return new Promise(async(resolve, reject) => {

       if(details.status=='ship'){
        await db.get().collection(collection.ORDER_COLLECTION).updateOne({_id: objectId(details.orderId)},
        { $set: {status: "shipped" } }).then((response)=>{
          console.log(response)
          resolve({shipped:true})
        })
       }else if(details.status=='out for delivery'){
        await db.get().collection(collection.ORDER_COLLECTION).updateOne({_id: objectId(details.orderId)},
        { $set: {status: "out for delivery" } }).then((response)=>{
          console.log(response)
          resolve({outForDelivery:true})
        })
       }else if(details.status=='delivered'){
        await db.get().collection(collection.ORDER_COLLECTION).updateOne({_id: objectId(details.orderId)},
        { $set: {status: "delivered" } }).then((response)=>{
          console.log(response)
          resolve({delivered:true})
        })
       }
     
      })
     
    },
     


    orderCancelled: (details)=>{
      return new Promise(async(resolve, reject) => {
       console.log(details,'details for cancelling order')
       await db.get().collection(collection.ORDER_COLLECTION).findOne({_id:objectId(details.orderId)}).then(async(payment)=>{
        console.log(payment,'order payment')
        if(payment.paymentMethod=='razorpay'||payment.paymentMethod=='paypal'||payment.paymentMethod=='wallet'){

          console.log('passed to online payment session')
          
                  await db.get().collection(collection.ORDER_COLLECTION).updateOne({_id: objectId(details.orderId)},
                  { $set: {status: "cancelled" } }).then((response)=>{
                    db.get().collection(collection.ORDER_COLLECTION).findOne({_id: objectId(details.orderId)}).then((order)=>{
                      order.products.forEach(element=>{
                        db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(element.item)},
                        {
                          $inc:{stock:element.quantity}
                        }).then((response)=>{
                          db.get().collection(collection.ORDER_COLLECTION).findOne({_id: objectId(details.orderId)}).then((order)=>{
                            console.log(order,'got order')
                            db.get().collection(collection.WALLET_COLLECTION).updateOne({_id:objectId(details.userId)},
                            {
                              $inc:{
                                amount:(order.totalAmount)
                              }
                            })
                          })
                        })
                      })
                    })
                    console.log(response)
                    resolve({status:true})
                  })
                 }else if(payment.paymentMethod=='COD'){
                  console.log('passed to cod session')
                  await db.get().collection(collection.ORDER_COLLECTION).updateOne({_id: objectId(details.orderId)},
                  { $set: {status: "cancelled" } }).then((response)=>{
                    db.get().collection(collection.ORDER_COLLECTION).findOne({_id: objectId(details.orderId)}).then((order)=>{
                      order.products.forEach(element=>{
                        db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(element.item)},
                        {
                          $inc:{stock:element.quantity}
                        })
                      })
          
                 })
                 resolve({status:true})
                })
              }
       })
  
    })
  },

  refundAmount:(details)=>{
    details.qunty=parseInt(details.qunty)
    details.proTotal=parseInt(details.proTotal)
    return new Promise(async(resolve,reject)=>{
       
      console.log(details,'passed')
      
         db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(details.itemId)},
            {
              $inc:{stock:details.qunty}
            }).then(()=>{
            
                db.get().collection(collection.WALLET_COLLECTION).updateOne({_id:objectId(details.userId)},
                {
                  $inc:{
                    amount:(details.proTotal)
                  }
                }).then(()=>{
                  db.get().collection(collection.ORDER_COLLECTION).updateOne(
                    {
                        _id:objectId(details.orderId),
                        "products.item":objectId(details.itemId)
                    },{
                        $set:{
                            "products.$.proStatus":"refunded"
                        }
                    },
                    false,true).then((response)=>{
                        db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:objectId(details.orderId)},{
                            $set:{
                                prostatus:'refunded',
                                status:'cleared'
                            }
                        })

                       
                })
                })
            })
         
      
        
        resolve({status:true})
     
    })
  },

    addBanner:(banner)=>{
     return new Promise((resolve,reject)=>{
      db.get().collection(collection.BANNER_COLLECTION). 
      insertOne({name:banner.name,description:banner.description,image:banner.image}).then((data)=>{
       resolve((data))
    })
     })
  },

    getBanner:()=>{
      return new Promise((resolve,reject)=>{
        let banner=  db.get().collection(collection.BANNER_COLLECTION).find().toArray()
         resolve(banner)
      })
    },



    bannerDetails:(bannerId)=>{
          return new Promise((resolve,reject)=>{
           db.get().collection(collection.BANNER_COLLECTION).findOne({_id:objectId(bannerId)}).then((details)=>{
              resolve(details)
            })
          })
    },


    updateBanner:(bannerId,bannerDetails)=>{
      return new Promise(async(resolve,reject)=>{
      await  db.get().collection(collection.BANNER_COLLECTION).updateOne({_id:objectId(bannerId)},{
          $set:{
          name:bannerDetails.name,
          description:bannerDetails.description,
          image:bannerDetails.image
          }
        }).then(()=>{
          resolve()
        })
      })
    },


  homeBanner:(banner)=>{
    return new Promise((resolve,reject)=>{
     db.get().collection(collection.HOMEPAGEBANNER_COLLECTION). 
     insertOne({image:banner.image}).then((data)=>{
      resolve((data))
   })
    })
 },

    mainBanner:(homeId)=>{
      return new Promise((resolve,reject)=>{
       db.get().collection(collection.HOMEPAGEBANNER_COLLECTION).findOne({_id:objectId(homeId)}).then((mainBanner)=>{
          resolve(mainBanner)
        })
      })
},

updateHomeBanner:(bannerId,bannerDetails)=>{
  return new Promise(async(resolve,reject)=>{
  await  db.get().collection(collection.HOMEPAGEBANNER_COLLECTION).updateOne({_id:objectId(bannerId)},{
      $set:{
      image:bannerDetails.image
      }
    }).then(()=>{
      resolve()
    })
  })
},


getHomeBanner:()=>{
  return new Promise((resolve,reject)=>{
    let mainBanner=  db.get().collection(collection.HOMEPAGEBANNER_COLLECTION).find().toArray()
     resolve(mainBanner)
  })
},


monthlyBanner:(banner)=>{
  return new Promise((resolve,reject)=>{
   db.get().collection(collection.MONTHLYBANNER_COLLECTION). 
   insertOne({month:banner.month,offer:banner.offer,image:banner.image}).then((data)=>{
    resolve((data))
 })
  })
},

getMonthlyBanner:()=>{
  return new Promise((resolve,reject)=>{
    let monthlyBanner=  db.get().collection(collection.MONTHLYBANNER_COLLECTION).find().toArray()
     resolve(monthlyBanner)
  })
},

monthlyBannerDetails:(monthlyId)=>{
  return new Promise((resolve,reject)=>{
   db.get().collection(collection.MONTHLYBANNER_COLLECTION).findOne({_id:objectId(monthlyId)}).then((monthlyDetails)=>{
      resolve(monthlyDetails)
    })
  })
},

updateMonthlyBanner:(monthlyId,monthlyBannerDetails)=>{
  return new Promise(async(resolve,reject)=>{
  await  db.get().collection(collection.MONTHLYBANNER_COLLECTION).updateOne({_id:objectId(monthlyId)},{
      $set:{
      month:monthlyBannerDetails.month,
      offer:monthlyBannerDetails.offer,
      image:monthlyBannerDetails.image
      }
    }).then(()=>{
      resolve()
    })
  })
},



daySalesReport:(dt)=>{
  return new Promise(async(resolve,reject)=>{
    let dayCollection=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
         {
          $match:{status:{$nin:['cancelled']}}
         },
         {
          $unwind:'$products'
         },
         {
          $project:{
            totalAmount:1,
            date:1,
            status:1,
            paymentMethod:1,
            _id:1,
            item:'$products.item',
            quantity:"$products.quantity"
          }
         },
         {
          $lookup:{
            from:collection.PRODUCT_COLLECTION,
            localField:'item',
            foreignField:'_id',
            as:'product'
          }
         },
         {
          $project:{
            date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
            totalAmount:1,
            status:1,
            item:1,
            quantity:1,
            _id:1,
            paymentMethod:1,
            product:{$arrayElemAt:['$product',0]}
          }
         },
         {
          $match:{
            date:dt
          }
         },
         {
          $group:{
            _id:"$item",
            quantity:{$sum:'$quantity'},
            total:{$sum:{$multiply:['$quantity','$product.price']}},
            name: { "$first": "$product.name" },
            date: { "$first": "$date" },
            price: { "$first": "$product.price" }
        }
         }
    ]).toArray()
    resolve(dayCollection)
  })
},

countOrder:(dt)=>{
  return new Promise(async(resolve,reject)=>{
    let countOrder=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
      {
        $match:{
          status:{$nin:['cancelled']}
        }
      },
      {
        $project:{
          _id:1,
          date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
      }
      },
      {
        $match:{date:dt}
      },
      {
        $count:'date'
      }
    ]).toArray()
    resolve(countOrder)
  })
},


monthSalesReport:(dt)=>{
  return new Promise(async(resolve,reject)=>{
    let monthSales= await db.get().collection(collection.ORDER_COLLECTION).aggregate([
      {
        $match:{
          status:{$nin:['cancelled']}
        }
      },
      {
        $project:{
          _id:1,
          date:{$dateToString:{format: "%Y-%m",date: "$date"}},
          newdate:{$dateToString:{format:"%Y-%m-%d",date:"$date"}},
          totalAmount:1
        }
      },
      {
        $match:{
          date:dt
        }
      },
      {
        $group:{
          _id:"$newdate",
          count:{$sum:1},
          total:{$sum:'$totalAmount'}
        }
      }
    ]).toArray()
    resolve(monthSales) 
  })
},

countOrderMonthly:(dt)=>{
  return new Promise(async(resolve,reject)=>{
    let countOrder=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
      {
        $match:{
          status:{$nin:['cancelled']}
        }
      },
      {
        $project:{
          _id:1,
          date:{$dateToString:{format:"%Y-%m",date:"$date"}}
        }
      },
      {
        $match:{
          date:dt
        }
      },
      {
        $count:'date'
      }
    ]).toArray()
    resolve(countOrder)
  })
},

paymentGraph:()=>{
  return new Promise(async(resolve,reject)=>{
      let paymentGrph=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
        {
          $project:{
              date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
              totalAmount:1,
              paymentMethod:1
          }
        },
        {
          $group:{
              _id:'$paymentMethod',
              TotalAmount:{$sum:'$totalAmount'}
          }
        }
      ]).toArray()
     
      resolve(paymentGrph)
  })
},


totalOrders:()=>{
  return new Promise((resolve,reject)=>{
  let total=  db.get().collection(collection.ORDER_COLLECTION).countDocuments()
  resolve(total)
  })
},

totalUsers:()=>{
  return new Promise((resolve,reject)=>{
    let total=db.get().collection(collection.USER_COLLECTION).countDocuments()
    resolve(total)
  })
},

totalProducts:()=>{
  return new Promise((resolve,reject)=>{
    let total=db.get().collection(collection.PRODUCT_COLLECTION).countDocuments()
    resolve(total)
  })
},

totalRevenue:()=>{
  return new Promise(async(resolve,reject)=>{
  let total=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
      {
        $match:{
          status:{$nin:['cancelled']}
        }
      },
      {
        $project:{
         totalAmount:1
        }
      },
      {
        $group:{
          _id:null,
          total:{$sum:'$totalAmount'}
        }
      }
    ]).toArray()
    resolve(total[0].total)
  })
},

salesGrph:()=>{
  return new Promise(async(resolve,reject)=>{
      let sales=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
          {
             $project:{
              date:1,
              totalAmount:1
             } 
          },
          {
              $group:{
                  _id:{$dateToString: { format: "%Y-%m-%d", date: "$date" }},
                  TotalAmount:{$sum:'$totalAmount'},
                  count:{$sum:1}
              }
          },
          { $sort : { _id: 1 } }
      ]).toArray()
     
      resolve(sales)
  })
},

addCoupon:(couponDetials)=>{
  let response={};
  return new Promise(async(resolve,reject)=>{
    
      let coupon=await db.get().collection(collection.COUPON_COLLECTION).findOne({code:couponDetials.code})
       console.log(coupon);
      if(coupon){
          response.status=true
          response.couponExist=true
          console.log("coupon is exist");
          resolve(response)
      }else{

          db.get().collection(collection.COUPON_COLLECTION).insertOne(couponDetials).then((result)=>{
      
              response.status=false
              console.log('coupon is created');
              resolve(result)
          }).catch((err)=>{
              console.error(err)
          })
          resolve({status:false})
      }

  })
},

getCoupon:()=>{
  return new Promise(async(resolve,reject)=>{
    let coupon=await db.get().collection(collection.COUPON_COLLECTION).find().toArray()
    resolve(coupon)
  })
},

editCoupon:(couponId)=>{
       
  return new Promise(async(resolve,reject)=>{
      let coupon=await db.get().collection(collection.COUPON_COLLECTION).findOne({_id:ObjectId(couponId)})
       
      resolve(coupon)
  })
},

updateCoupon:(couponDetails)=>{

  return new Promise(async(resolve,reject)=>{
    console.log(couponDetails,'got right hereee')
      let data=await db.get().collection(collection.COUPON_COLLECTION).updateOne({code:couponDetails.code},
          {
              $set:{
                  name: couponDetails.name,
                  code: couponDetails.code,
                  offer: couponDetails.offer,
                  expiryDate: couponDetails.expiryDate,
                  minAmount: couponDetails.minAmount,
                  maxAmount: couponDetails.maxAmount
              }
          })
          console.log(data,'solveddd')
          resolve(data)
  })
},



deleteCoupon:(couponId)=>{

  return new Promise((resolve,reject)=>{
      let coupon=db.get().collection(collection.COUPON_COLLECTION).deleteOne({_id:ObjectId(couponId)})
  
      resolve(coupon)
  
  })
}
   
}

