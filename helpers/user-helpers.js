let db = require('../config/connection')
let collection = require('../config/collections')
const bcrypt = require('bcrypt')
const { response } = require('../app')
let objectId = require('mongodb').ObjectId
const Razorpay = require('razorpay')
require('dotenv')
var instance = new Razorpay({
    key_id:process.env.RAZORPAY_KEY_ID,
    key_secret:process.env.RAZORPAY_SECERET_ID
});
const otp=require('../config/otpLogin')
const accountSid = process.env.ACCOUNT_SID;
const authToken = process.env.AUTH_TOKEN;
const serviceId=process.env.SERVICE_ID
const client = require('twilio')(accountSid, authToken);

const paypal = require('paypal-rest-sdk');
 
paypal.configure({
  'mode': 'sandbox', //sandbox or live
  'client_id': process.env.PAYPAL_CLIENT_ID,
  'client_secret': process.env.PAYPAL_CLIENT_SECRET
});

const math=require('mathjs')

module.exports = {
    doSignup:(userData) => {
        return new Promise(async(resolve,reject) =>{
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({Email:userData.Email})
            if(user){
                response.emailExists=true
                resolve(response)
            }else{
                response.emailExists=false
                userData.Password = await bcrypt.hash(userData.Password,10)
                db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) =>{
                    resolve(data)
                })
            }
           
        })
        
    },
    doLogin:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            let loginStatus = false
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({Email:userData.Email})
            if (user) {
                bcrypt.compare(userData.Password,user.Password).then((status)=>{
                    if (status && user.status) {
                        console.log('login success');
                        response.user = user
                        response.status = true
                        resolve(response)
                    }else{
                        console.log('login failed');
                        resolve({status:false})
                    }
                })
            }else{
                console.log('login failed');
                resolve({status:false})
            }
        })
    },
   

    getAllUsers:()=>{
        return new Promise(async(resolve,reject)=>{
            
            let users = await db.get().collection(collection.USER_COLLECTION).find().toArray()
            resolve(users)
        })
    },
    deleteUser:(userID)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.USER_COLLECTION).deleteOne({_id:objectId(userID)}).then((response)=>{
                resolve(response)
            })
        })
    },
    getOneUser:(userID)=>{
        return new Promise((resolve,reject)=>{
            
            db.get().collection(collection.USER_COLLECTION).findOne({_id:objectId(userID)}).then((user)=>{
                resolve(user)
            })
            
        })
    },


     blockUser:(userID,status)=>{
        console.log(userID,status,'hello')
        return new Promise((resolve,reject)=>{
            if(status == 'true'){
               console.log('true');
            db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(userID)},{$set:{status:false}}).then((response)=>{
                resolve(response);
            })
        }else{
           console.log('false');
            db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(userID)},{$set:{status:true}}).then((response)=>{
                resolve(response);
            })
        }
    })
     },
   



    adminLogin:(adminData)=>{
        return new Promise(async(resolve,reject)=>{
            let loginStatus = false
            let response = {}
            let admin = await db.get().collection(collection.ADMIN_COLLECTION).findOne({Email:adminData.Email})
           
            if (admin) {
                if(adminData.Password == admin.Password){
                  
                        console.log('login success');
                        response.admin = admin
                        response.status = true
                        resolve(response)
                    }else{
                        console.log('login failed');
                        resolve({status:false})
                    }
                }else{
                    console.log('login failed');
                    resolve({status:false})
                }
            
        })
    },


    getFindUsers:(searchData)=>{
        return new Promise(async(resolve,reject)=>{
            
            let usersFind = await db.get().collection(collection.USER_COLLECTION).find({Name:searchData.Name}).toArray()
            resolve(usersFind)
        })
    },


    addUser:(userData) => {
        return new Promise(async(resolve,reject) =>{
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({Email:userData.Email})
            if(user){
                response.emailExists=true
                resolve(response)
            }else{
                response.emailExists=false
                userData.Password = await bcrypt.hash(userData.Password,10)
                db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) =>{
                    resolve(data.insertedId,response)
                })
            }
           
        })
        
    },

    addToCart:(proId,userID,total)=>{
        let proObj={
            item:objectId(proId),
            quantity:1,
            proStatus:'',
            total:total
        }
         return new Promise(async(resolve,reject)=>{
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userID)})
            console.log(userCart)
            if(userCart){
                let proExist=userCart.products.findIndex(product=> product.item==proId)
               
              if(proExist!=-1){
                db.get().collection(collection.CART_COLLECTION).updateOne({user:objectId(userID),'products.item':objectId(proId)},
                {
                    $inc:{'products.$.quantity':1}
                }).then(()=>{
                    resolve()
                })
              }else{
                
                 db.get().collection(collection.CART_COLLECTION).updateOne({user:objectId(userID)},
                 {
                    
                        $push:{products:proObj}
                    
                 }).then((response)=>{
                    resolve()
                 })
                }
            }else{
                let cartObj={
                    user:objectId(userID),
                    products:[proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response)=>{
                    resolve();
                })
            }
        })
    },

    getCartProducts:(userID)=>{
        return new Promise(async(resolve,reject)=>{
            let cartItems=await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match:{user:objectId(userID)}
                },

                {
                    $unwind:'$products'
                },

                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity',
                        proStatus:'$products.proStatus'
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
                        proStatus:1,item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                    }
                }
              
            ]).toArray()
            
            resolve(cartItems)
        })
    },

    getCartCount:(userID)=>{
        return new Promise(async(resolve,reject)=>{
            let count=0
          
         let cart= await   db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userID)})
         if(cart){
             count=cart.products.length
         }
         resolve(count)
        })
    },

    changeProductQuantity:(details)=>{
        details.count=parseInt(details.count)
        details.quantity=parseFloat(details.quantity)
        return new Promise(async(resolve,reject)=>{
            if(details.count==-1 && details.quantity==1){
                console.log('entered here')
             
                    db.get().collection(collection.CART_COLLECTION).updateOne({_id:objectId(details.cart)},
                    {
                     $pull:{products:{item:objectId(details.product)}}
                    }).then((response)=>{
                     resolve({removeProduct:true})
                     console.log('product removed due to low quantity')
                    })
              
                
             }else{
            db.get().collection(collection.CART_COLLECTION).updateOne({_id:objectId(details.cart),'products.item':objectId(details.product)},
            {
                $inc:{'products.$.quantity':details.count}
            }).then((response)=>{
                console.log(response);
                resolve({status:true})
            })
        }
        })
    },

    removeProductFromCart:(details)=>{
       
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CART_COLLECTION).updateOne({_id:objectId(details.cart)},
            {
             $pull:{products:{item:objectId(details.product)}}
            }).then((response)=>{
                console.log(response)
             resolve({removeProductCart:true})
            })
        })

    },

    getProSubTotalAmount:(userID)=>{
        console.log(userID,': userId')
         return new Promise(async(resolve,reject)=>{
            try{
                let subTotal=await db.get().collection(collection.CART_COLLECTION).aggregate([
                    {
                        $match:{user:objectId(userID)}
                    },
    
                    {
                        $unwind:'$products'
                    },
    
                    {
                        $project:{
                            item:'$products.item',
                            quantity:'$products.quantity'
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
                            item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                        }
                    },
                    {
    
                         $group:{
                             _id:null,
                            subTotal:{$sum:{$multiply:['$quantity','$product.offerPrice']}}
                        }
    
                    }
                  
                ]).toArray()
                console.log(subTotal[0].subTotal);
                
                resolve(subTotal[0].subTotal)
                console.log('passed from here')
          
            }catch{
                 resolve({proNotRemoved:true})
            }
            
        }) 
 
     },

    getSubTotalAmount:(userID)=>{
       console.log(userID,': userId')
        return new Promise(async(resolve,reject)=>{
           
            let subTotal=await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match:{user:objectId(userID)}
                },

                {
                    $unwind:'$products'
                },

                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
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
                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                    }
                },
                {

                     $group:{
                         _id:null,
                        subTotal:{$sum:{$multiply:['$quantity','$product.offerPrice']}}
                    }

                }
              
            ]).toArray()
            console.log(subTotal[0].subTotal);
            
            resolve(subTotal[0].subTotal)
            console.log('passed from here')
        })

    },

    getTotal:(userID)=>{
        return new Promise(async(resolve,reject)=>{
            let total=await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match:{user:objectId(userID)}
                },

                {
                    $unwind:'$products'
                },

                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
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
                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                    }
                },
                {

                     $project:{
                          total:{$multiply:['$quantity','$product.offerPrice']}
                    
                    }

                }
              
            ]).toArray()
            console.log(total[0].total);
            
            resolve(total[0].total)
        })

    },

    placeOrder:(order,products,total)=>{
           return new Promise((resolve,reject)=>{
            console.log(order,products,total,'got all of these')

               let status=order['payment-method']==='COD'?'placed':'pending'
               let orderObj={

                deliveryDetails:{
                    name:order.name,
                    mobile:order.mobile,
                    address:order.address,
                    pincode:order.pincode
                },
                userID:objectId(order.userId),
                paymentMethod:order['payment-method'],
                products:products,
                coupon:order.couponCode,
                totalAmount:total,
                status:status,
                prostatus:'',
                date:new Date(),
                
               }
              db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response)=>{
                db.get().collection(collection.CART_COLLECTION).deleteOne({user:objectId(order.userId)})
                products.forEach(element=>{
                    db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(element.item)},
                    {
                        $inc:{stock:-(element.quantity)}
                    })
                });

                if(order.couponCode!=""){
                    console.log('if coupon applied')
                db.get().collection(collection.USEDCOUPON_COLLECTION).findOne({_id:objectId(order.userId)}).then((user)=>{
                    if(user){
                        console.log('if user')
                        db.get().collection(collection.USEDCOUPON_COLLECTION).updateOne({_id:objectId(order.userId)},{
                           $set:{
                            usedCode:order.couponCode
                           }
                        })
                    }else{
                        console.log('if no user')
                        db.get().collection(collection.USEDCOUPON_COLLECTION).insertOne({_id:objectId(order.userId),usedCode:order.couponCode})
                    }
                })
            }
                resolve(response.insertedId)
               })

           })
    },

    getCartProductList:(userID)=>{
        return new Promise (async(resolve,reject)=>{
            let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userID)})
            resolve(cart.products)
        })
    },

    getUserOrders:(userID)=>{
        return new Promise(async(resolve,reject)=>{
            let orders=await db.get().collection(collection.ORDER_COLLECTION).find({userID:objectId(userID)}).sort({_id:-1}).toArray()
            resolve(orders)
        })
    },

    getOrderProducts:(orderId)=>{
        return new Promise( async(resolve,reject)=>{
            console.log(orderId,'passed')
            let total=0;
            let orderItems=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match:{_id:objectId(orderId)}
                },

                {
                    $unwind:'$products'
                },

                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity',
                        proStatus:'$products.proStatus',
                        date:{$dateToString: { format: "%Y-%m-%d", date: "$date" }},
                        status:'$status',
                        userId:'$userID'
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
                       userId:1,proStatus:1,status:1,date:1,item:1,quantity:1,product:{$arrayElemAt:['$product',0]},
                    }
                },
                {
                    $addFields:{
                        total:{$multiply:['$quantity','$product.price']},
                    }
                }
             ]).toArray()
            console.log(orderItems,'ordered products')
            
            resolve(orderItems,total)
    
        })
    },

    cancelOrder:(orderId,status)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:objectId(orderId)},{$set:{status:"cancelled"}})
              
        })
    },

    returnPorduct:(details,userId)=>{
        console.log(details);
       return new Promise((resolve,reject)=>{
         db.get().collection(collection.ORDER_COLLECTION).updateOne(
            {
                _id:objectId(details.orderId),
                "products.item":objectId(details.itemId)
            },{
                $set:{
                    "products.$.proStatus":"returned"
                }
            },
            false,true).then((response)=>{
                db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:objectId(details.orderId)},{
                    $set:{
                        prostatus:'returned'
                    }
                })
            console.log(response,'update')
            resolve({returned:true})
         })
            
        
        })
        },


    generateRazorpay:(orderId,total)=>{
        return new Promise((resolve,reject)=>{
           
            var options = {
                amount: total*100,  // amount in the smallest currency unit
                currency: "INR",
                receipt: ""+orderId
              };
              instance.orders.create(options, function(err, order) {
                if(err){
                    console.log(err)
                }else{
                    resolve(order)
                }
               
              
              });
        })
},
verifyPayment:(details)=>{
    return new Promise(async(resolve,reject)=>{
        const {
            createHmac
          } = await import('node:crypto');

          let hmac = createHmac('sha256', 'sIiRmGaAUF5JEmlZybcohazU');

          hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]']);
          hmac=hmac.digest('hex')
          if(hmac==details['payment[razorpay_signature]']){
            resolve()
          }else{
            reject()
          }

    })
},

changePaymentStatus:(orderId)=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:objectId(orderId)},{
            $set:{
                status:'placed'
            }
        }).then(()=>{
            resolve()
        })
    })
},

generatePaypal:(orderId,totalRate)=>{
    return new Promise((resolve,reject)=>{
        console.log(orderId,totalRate,'paypal details passed')
        const create_payment_json = {
            "intent": "sale",
            "payer": {
                "payment_method": "paypal"
            },
            "redirect_urls": {
                "return_url": `http://localhost:3000/login/order-success/${orderId}/${totalRate}`,
                "cancel_url": "http://localhost:3000/cancel"
            },
            "transactions": [{
                "item_list": {
                    "items": [{
                        "name": "Red Sox Hat",
                        "sku": "001",
                        "price":totalRate,
                        "currency": "USD",
                        "quantity": 1
                    }]
                },
                "amount": {
                    "currency": "USD",
                    "total":totalRate
                },
                "description": "Hat for the best team ever"
            }]
        };
        paypal.payment.create(create_payment_json, function (error, payment) {
            if (error) {
                console.log('Payment Error');
                throw error;
            } else {
               console.log(payment,'Payment Passed');
               for(let i = 0;i < payment.links.length;i++){
                if(payment.links[i].rel === 'approval_url'){
                 resolve(payment.links[i].href);
             }
         }
            }
          });
         
    })
},

verifyPaypal:(payerId,paymentId,orderId,userId,totalRate)=>{
    const execute_payment_json = {
        "payer_id": payerId,
        "transactions": [{
            "amount": {
                "currency": "USD",
                "total": totalRate
            }
        }]
      };

      return new Promise((resolve,reject)=>{
        paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
            if (error) {
                console.log(error.response);
                throw error;
            } else {
                console.log(JSON.stringify(payment));
                db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:objectId(orderId)},{
                    $set:{
                        status:'placed'
                    }
                })
                resolve()
            }
        });
      })
},

confirmPayment:(orderId,userId)=>{
    return new Promise((resolve,reject)=>{
        
    })
},

addAddress:(userDetails)=>{
    return new Promise((resolve,reject)=>{
        let addressObj={
            name:userDetails.name,
            place:userDetails.address,
            mobile:userDetails.mobile,
            pincode:userDetails.pincode,
            userId:userDetails.userId
        }
        db.get().collection(collection.ADDRESS_COLLECTION).insertOne(addressObj).then((response)=>{
            
            resolve(response)
        })
    })
},


addToWishlist:(proId,userID)=>{
    let proObj={
        item:objectId(proId),
       
    }
     return new Promise(async(resolve,reject)=>{
        let userWishlist = await db.get().collection(collection.WISHLIST_COLLECTION).findOne({user:objectId(userID)})
        console.log(userWishlist)
        if(userWishlist){
            let proExist=userWishlist.products.findIndex(product=> product.item==proId)
           
          if(proExist!=-1){
            db.get().collection(collection.WISHLIST_COLLECTION).updateOne({user:objectId(userID),'products.item':objectId(proId)},
            {
              $pull:{products:{item:objectId(proId)}}
            }).then(()=>{
                resolve()
            })
          }else{
            
             db.get().collection(collection.WISHLIST_COLLECTION).updateOne({user:objectId(userID)},
             {
                
                    $push:{products:proObj}
                
             }).then((response)=>{
                resolve()
             })
            }
        }else{
            let wishObj={
                user:objectId(userID),
                products:[proObj]
            }
            db.get().collection(collection.WISHLIST_COLLECTION).insertOne(wishObj).then((response)=>{
                resolve();
            })
        }
    })
},


getWishlistProducts:(userId)=>{
    return new Promise(async(resolve,reject)=>{
       let wishlistItems=await db.get().collection(collection.WISHLIST_COLLECTION).aggregate([
        {
            $match:{user:objectId(userId)}
        },

        {
            $unwind:'$products'
        },

        {
            $project:{
                item:'$products.item',
                quantity:'$products.quantity'
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
                item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
            }
        }
        ]).toArray()

        resolve(wishlistItems)
    })
},


getWishlistCount:(userID)=>{
    return new Promise(async(resolve,reject)=>{
        let count=0
      
     let wish= await   db.get().collection(collection.WISHLIST_COLLECTION).findOne({user:objectId(userID)})
     if(wish){
         count=wish.products.length
     }
     resolve(count)
    })
},

removeProductFromWishlist:(details)=>{
       
    return new Promise((resolve,reject)=>{
        db.get().collection(collection.WISHLIST_COLLECTION).updateOne({_id:objectId(details.wishlist)},
        {
         $pull:{products:{item:objectId(details.product)}}
        }).then((response)=>{
            console.log(response)
         resolve({removeProductWishlist:true})
        })
    })

},


getProfileDetails:(userId)=>{
    return new Promise(async(resolve,reject)=>{
        console.log(userId,'got here')
        let profDetails= await db.get().collection(collection.USER_COLLECTION).find({_id:objectId(userId)}).toArray()
        resolve(profDetails)
       })
},


getDetails:(userId)=>{
    return new Promise((resolve,reject)=>{
        console.log(userId,':userId')
        db.get().collection(collection.USER_COLLECTION).findOne({_id:objectId(userId)}).then((user)=>{
         resolve(user)
        })
       })
},

editProfile:(userId,userDetails)=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(userId)},{
            $set:{
                Name:userDetails.Name,
                Email:userDetails.Email,
                Address:userDetails.Address,
                Number:userDetails.Number
            }
        }).then((response)=>{
            console.log(response)
            resolve(response)
        })
    })
},

changePassword:(userId,passDetails)=>{
    return new Promise (async(resolve,reject)=>{
       passDetails.Password=await bcrypt.hash(passDetails.Password,10)
       db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(userId)},{
        $set:{
            Password:passDetails.Password
        }
       }).then((response)=>{
        resolve(response)
       })
    })
},

addDeliveryAddress:(addDetails,userId)=>{
return new Promise(async(resolve,reject)=>{
    console.log(addDetails,'hellooo')
    let addObj={
        name:addDetails.name,
        address:addDetails.address,
        mobile:addDetails.mobile,
        pincode:addDetails.pincode,
        userId:userId
    }

   await db.get().collection(collection.ADDRESS_COLLECTION).insertOne(addObj).then((response)=>{
    resolve(response)
   })
    
})
},

getSavedAddress:(userId)=>{
    return new Promise(async(resolve,reject)=>{
       let address=await db.get().collection(collection.ADDRESS_COLLECTION).find({userId:userId}).toArray()
       resolve(address)
    })
},

selectAddress:(addressId)=>{
    return new Promise(async(resolve,reject)=>{
        await db.get().collection(collection.ADDRESS_COLLECTION).findOne({_id:objectId(addressId)}).then((response)=>{
            resolve(response)
        })
    })
},

removeAddress:(details)=>{
       
    return new Promise((resolve,reject)=>{
        console.log(details.addId,'hai')
        db.get().collection(collection.ADDRESS_COLLECTION).deleteOne({_id:objectId(details.addId)}).then((response)=>{
            console.log(response,'true')
         resolve({removedAddress:true})
        })
    })

},

doOtp:(userData)=>{
    let response={};
  
    return new Promise(async(resolve,reject)=>{

     
        let user= await db.get().collection(collection.USER_COLLECTION).findOne({Number:userData.mobile})
        if(user){
            if(user.status){
                await db.get().collection(collection.MOBILENO_COLLECTION).updateOne({_id:objectId('63456faf74d87b7115f19c72')},{
                    $set:{
                        mobile:userData.mobile
                    }
                });

                response.status=true;
                response.user=user;
                client.verify.services(serviceId).verifications.create({ to: `+91${userData.mobile}`, channel: "sms" }).then((verification)=>{})
                //  console.log(response);
                 resolve(response)
            }else{
                console.log("blocked user");
                resolve(response)
            }
        }else{
           response.status=false
           resolve(response) 
        }
    })
},

getMobileno:()=>{
   return new Promise((resolve,reject)=>{
    db.get().collection(collection.MOBILENO_COLLECTION).findOne({_id:objectId('63456faf74d87b7115f19c72')}).then((response)=>{
        resolve((response))
    })
   })
},

resendOtp:(userData)=>{
    let response={};
    return new Promise(async(resolve,reject)=>{
        let user= await db.get().collection(collection.USER_COLLECTION).findOne({Number:userData.mobile})
        if(user){
            if(user.status){
                 response.user=user;
                client.verify.services(serviceId).verifications.create({ to: `+91${userData.mobile}`, channel: "sms" }).then((verification)=>{})
                //  console.log(response);
                 resolve({status:true})
            }else{
                console.log("blocked user");
                resolve({Nouser:true})
            }
        }else{
           
           resolve({noError:true}) 
        }
    })
},

doOtpConfirm:(confimrOtp,userData)=>{

    return new Promise((resolve,reject)=>{
        console.log(confimrOtp,userData,'kittiii')
        client.verify.services(serviceId).verificationChecks.create({
            to: `+91${userData.Number}`,
            code: confimrOtp.otp,
          }).then((data)=>{
            if(data.status=='approved'){
                resolve({status:true})
            }else{
                resolve({status:false})
            }
          })
    })
},


applyCoupon:(Details,userId,date,amount)=>{

   
    return new Promise(async(resolve,reject)=>{
        console.log(Details,amount,date,'details passed')
        let response={}
       let user=await db.get().collection(collection.USEDCOUPON_COLLECTION).findOne({_id:objectId(userId)})

              if(user){
                console.log(user,'user ')
                   if(user.usedCode==Details.coupon){
                      console.log('already used code')
                  response.verifyUsedCoupon=true
                  resolve(response)
              }
            }else{
        let validCoupon=await db.get().collection(collection.COUPON_COLLECTION).findOne({code:Details.coupon})
            if(validCoupon){
              console.log('valid coupon')
              const expdate= new Date(validCoupon.expiryDate)
               console.log(expdate,': expiry date')
              response.Data=validCoupon
    
              
    
                if(expdate >= date)
                {
                  console.log('valid date')
                    response.dateValid=true
                    resolve(response)
    
                    if(amount>=validCoupon.minAmount){
                         console.log('valid minAmount')
                        response.verifyMinAmount=true
                        resolve(response)
    
                            if(amount<=validCoupon.maxAmount)
                            {
                              console.log('valid maxAmount')
                                response.verifyMaxAmount=true
                                resolve(response)
                               }else{
                                  console.log('invalid maxAmount')
                                response.invalidMaxAmount=true
                                response.maxAmountMsg='your maximum purchase should be'+validCoupon.maxAmount
                                resolve(response)
                            }
                    }else{
                        console.log('invalid minAmount')
                        response.invalidMinAmount=true
                        response.minAmountMsg='your minimum purchase should be'+validCoupon.minAmount
                        resolve(response)
                    }
                }else{
                    console.log('invalid date')
                response.dateInvalid=true
                response.dateInvalidMessage="Date is expired"
                resolve(response)
                }
            }else{
                console.log('invalid coupon')
                response.invalidCoupon=true
                response.invalidMessage="This coupon is invalid"
                resolve(response)
            }

            if(response.dateValid && response.verifyMinAmount && response.verifyMaxAmount){
                console.log(response,'coupon applied')
                response.verifying=true
                resolve(response)
                console.log('response verified true: resolved')
             }
             
            
        }
          
          
         
       
        })       
                  
},

    checkoutCoupon:(couponCode)=>{
         console.log(couponCode,': applied coupon')
         return new Promise(async(resolve,reject)=>{
            let coupon=await db.get().collection(collection.COUPON_COLLECTION).findOne({code:couponCode})
            resolve(coupon)
         })
    },

    getWallet:(userId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.WALLET_COLLECTION).findOne({_id:objectId(userId)}).then((response)=>{
                resolve(response)
            })
        })
    },


    changeWalletPaymentStatus:(orderId,total,userId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:objectId(orderId)},
            {
                $set:{
                    status:'placed'
                }
            }).then((result)=>{
                db.get().collection(collection.ORDER_COLLECTION).findOne({_id:objectId(orderId)}).then((order)=>{
                    db.get().collection(collection.WALLET_COLLECTION).updateOne({_id:objectId(userId)},
                    {
                        $inc:{amount:-(order.totalAmount)}
                    }).then((data)=>{
                        resolve(data)
                    })
                })
            })
        })
    },

    doWallet:(userId)=>{
        return new Promise((resolve,reject)=>{
            console.log(userId,'userId from signup')
            db.get().collection(collection.WALLET_COLLECTION).insertOne({_id:userId,amount:0}).then((data)=>{
                resolve(data)
            })
        })
    },

    getChicken:(catName)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).sort({category:catName.category}).then(()=>{
                resolve({chicken:true})
            })

        })
    }

}
   

