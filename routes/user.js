const { response } = require('express');
var express = require('express');
var router = express.Router();
let userHelpers = require('../helpers/user-helpers')
const productHelpers = require('../helpers/product-helpers');
let categoryHelpers=require('../helpers/category-helpers')
var Handlebars = require('handlebars');
const math=require('mathjs')


/* GET user login page. */


router.get('/', function(req, res, next) {
  
  if (req.session.userloggedIn) {
    res.redirect('/login/userhome')
  }else{
    let signupSuccess = req.session.toast
    let emailval = req.session.emailval
    res.render('user/userlogin', { signupSuccess, emailval, 'blockErr':req.session.blockErr,'loginErr':req.session.loginErr, title: 'Login' ,home:true, link1: '/stylesheets/login.css' , script: '/javascripts/loginValidation.js'});
    req.session.loginErr = false
    req.session.toast = false
    req.session.blockErr=false
  }
  
});

router.post('/',(req,res)=>{
  userHelpers.doLogin(req.body).then((response)=>{
      if(response.status==true){
       req.session.userloggedIn = true
      req.session.user = response.user
      res.redirect('/login/userhome')
      }else {
      req.session.emailval = req.body.Email
      req.session.loginErr = true
      res.redirect('/login')
     }
  })
  
})

/*OTP Login*/

router.get('/OtpLogin',(req,res)=>{
  res.render('user/otplogin',{"blockErr":req.session.blockErr,home:true,link1: '/stylesheets/login.css'})
  req.session.blockErr=false
});


let signUpData;
router.post('/otpLogin',(req,res)=>{
   userHelpers.doOtp(req.body).then((response)=>{
    if(response.status){
      console.log('heyyyy')
        signUpData=response.user
        res.redirect('/login/confirmOtp')
    }else{
      console.log('haiii')
        req.session.blockErr=true
        res.redirect('/login/otpLogin')
    }
})
});

router.post('/resendOtp',(req,res)=>{
  userHelpers.resendOtp(req.body).then((response)=>{
    res.json(response)
  })
})

router.get('/confirmOtp',async(req,res)=>{
  let mobileNo=await userHelpers.getMobileno()
  res.render('user/confirmOtp',{"otpErr":req.session.otpErr,mobileNo,home:true,link1: '/stylesheets/login.css'})
  req.session.otpErr=false
})


router.post('/confirmOtp',(req,res)=>{
  userHelpers.doOtpConfirm(req.body,signUpData).then((response)=>{
    if(response.status){
      console.log('here')
        req.session.userloggedIn=true
        req.session.user=signUpData
        res.redirect('/login/userhome')
    }else{
      console.log('there')
        req.session.otpErr=true
        res.redirect('/login/confirmOtp')
    }
  })
});










/* GET Signup Page. */
router.get('/signup', function(req, res, next) {
  signupName = req.session.signupName
  signupEmail = req.session.signupEmail
  res.render('user/signup', { signupName,signupEmail,'emailExists':req.session.emailExists, title: 'Signup' ,home:true, link1: '/stylesheets/signupValidate.css' , ajax: 'https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js' , script: '/javascripts/signupValidation.js'});
  req.session.emailExists = false
});

router.post('/signup', function(req, res, next) {
  req.body.status=true;
  req.body.date=new Date();
    userHelpers.doSignup(req.body).then((response) =>{
      if (response.emailExists) {
        req.session.emailExists=true
        req.session.signupName = req.body.Name
        req.session.signupEmail = req.body.Email
        res.redirect('/login/signup')
      }else if({acknowledged:true}){
        req.session.toast = true
        req.session.userId=response.insertedId
        userHelpers.doWallet(req.session.userId).then(()=>{
          res.redirect('/login')
        })
       }
     
    })
    
});

let verify = ((req,res,next)=>{ 
  if (req.session.userloggedIn){    
    next()
  }else{
    res.redirect('/login')
  }
});


/* GET User Home Page. */
router.get('/userhome',verify, async function(req, res, next) {
  let cartCount=null
  if (req.session.userloggedIn) {
    let user = req.session.user
    let wishlistCount =await userHelpers.getWishlistCount(req.session.user._id)
    let cartCount =await userHelpers.getCartCount(req.session.user._id)
    let mainBanner=await productHelpers.getHomeBanner()
     let banner=await productHelpers.getBanner()
     let monthlyBanner=await productHelpers.getMonthlyBanner()
    res.render('user/user-home',{ user, cartCount,banner,mainBanner,monthlyBanner,wishlistCount, title: 'User Home' , link3:'/bootstrap/css/bootstrap.min.css', link4:'/css/main.css' })
    } else {
    res.redirect('/login')
  }
  
});



router.get('/viewproducts',verify,async(req,res,next)=>{
  let options= await categoryHelpers.getCategoryList()
  let wishlistCount =await userHelpers.getWishlistCount(req.session.user._id)
  let cartCount =await userHelpers.getCartCount(req.session.user._id)
  productHelpers.getAllProducts().then((products)=>{
    res.render('user/view-products',{user:true, products,options,cartCount,wishlistCount,title: 'Products',link3:'/bootstrap/css/bootstrap.min.css', link4:'/css/main.css'})
  })
});


router.get('/viewproducts',verify, function(req, res, next) {
  if (req.session.userloggedIn) {
    let user = req.session.user
   res.render('user/view-products',{ user, title: 'Products' , link3:'/bootstrap/css/bootstrap.min.css', link4:'/css/main.css' })
  } else {
    res.redirect('/login')
  }
  
});

router.get('/productdetail/:id',verify,async(req,res,next)=>{
  let cartCount =await userHelpers.getCartCount(req.session.user._id)
  let product=await productHelpers.getProductDetails(req.params.id)
  res.render('user/product-detail',{user:true,product,cartCount,link3:'/bootstrap/css/bootstrap.min.css', link4:'/css/main.css'})
});

router.get('/about',verify,async(req,res,next)=>{
  let monthlyBanner=await productHelpers.getMonthlyBanner()
  res.render('user/about-page',{user:true, monthlyBanner,link3:'/bootstrap/css/bootstrap.min.css', link4:'/css/main.css'})
})


router.get('/cart',verify,async(req,res,next)=>{
  let wishlistCount =await userHelpers.getWishlistCount(req.session.user._id)
  let cartCount =await userHelpers.getCartCount(req.session.user._id)
  let products=await userHelpers.getCartProducts(req.session.user._id)
  console.log(products);
  res.render('user/cart',{user:true,user:req.session.user._id, products,cartCount,wishlistCount, link3:'/bootstrap/css/bootstrap.min.css', link4:'/css/main.css'})
});

router.get('/addtocart/:id',verify,async(req,res,next)=>{
   console.log("api call")
  let proId=req.params.id;
  let userID=req.session.user._id
  userHelpers.addToCart(proId,userID).then(()=>{
    res.json({status:true})
  })
});

router.post('/change-product-quantity',(req,res)=>{
  userHelpers.changeProductQuantity(req.body).then(async(response)=>{
    
      response.subTotal=await userHelpers.getProSubTotalAmount(req.body.user)
      res.json(response)
      console.log('response passed')
     })
})

router.post('/remove-product-from-cart',(req,res,next)=>{
  userHelpers.removeProductFromCart(req.body).then((response)=>{
    res.json(response)
  })
});



router.get('/place-order',verify,async(req,res,next)=>{
  let addressFind=await userHelpers.getSavedAddress(req.session.user._id)
  let total=await userHelpers.getSubTotalAmount(req.session.user._id)
  res.render('user/checkout',{user:true,user:req.session.user,total,addressFind,link3:'/bootstrap/css/bootstrap.min.css', link4:'/css/main.css'})
});

router.post('/place-order',async(req,res)=>{
  let products=await userHelpers.getCartProductList(req.body.userId)
  let totalPrice=await userHelpers.getSubTotalAmount(req.body.userId)
  let coupon=await userHelpers.checkoutCoupon(req.body.couponCode)

  if(coupon){
    console.log('got the coupon')
    let discountAmount=(totalPrice*parseInt(coupon.offer)/100)
    let amount=math.round(totalPrice-discountAmount)

    if(req.body['payment-method']==='COD'){
      userHelpers.placeOrder(req.body,products,amount).then(()=>{
        res.json({codSuccess:true})
      })
    }else if(req.body['payment-method']==='razorpay'){
      userHelpers.placeOrder(req.body,products,amount).then((orderId)=>{
        console.log(orderId,':orderId')
        userHelpers.generateRazorpay(orderId,amount).then((response)=>{
          response.razorpay=true
          res.json(response)
        })
        
      })
    }else if(req.body['payment-method']==='paypal'){
      userHelpers.placeOrder(req.body,products,amount).then((orderId)=>{
        console.log(orderId,':orderId')
        userHelpers.generatePaypal(orderId,amount).then((response)=>{
          res.json({link :response,paypal:true})
        })
        
      })
    
  }else if(req.body['payment-method']==='wallet'){
    
    userHelpers.placeOrder(req.body,products,amount).then(async(orderId)=>{
      let walletAmount=await userHelpers.getWallet(req.session.user._id)
    
    if(walletAmount.amount>amount){
      userHelpers.changeWalletPaymentStatus(orderId,totalPrice,req.session.user._id).then((response)=>{
        response.wallet=true
        res.json(response)
      })
    }else{
      console.log('insufficient amount in wallet')
      response.walletErr=true
      res.json(response)
    }
  })
}
}else{
    console.log('no coupon got')
    userHelpers.placeOrder(req.body,products,totalPrice).then(async(orderId)=>{
    
      if(req.body['payment-method']==='COD'){
        res.json({codSuccess:true})
      }else if(req.body['payment-method']==='wallet'){
            let walletAmount=await userHelpers.getWallet(req.session.user._id)
            
            if(walletAmount.amount>totalPrice){
              userHelpers.changeWalletPaymentStatus(orderId,totalPrice,req.session.user._id).then((response)=>{
                response.wallet=true
                res.json(response)
              })
            }else{
              console.log('insufficient amount in wallet')
              response.walletErr=true
              res.json(response)
            }
      }else if(req.body['payment-method']==='razorpay'){
          userHelpers.generateRazorpay(orderId,totalPrice).then((response)=>{
            response.razorpay=true
           res.json(response)
           })
        }else if(req.body['payment-method']==='paypal'){
          userHelpers.generatePaypal(orderId,totalPrice).then((response)=>{
            
            console.log(response)
            res.json({link :response,paypal:true})
        })
        
      
      
    }
       
   
  })
  }

});

router.get('/order-success',(req,res)=>{
  res.render('user/order-success',{user:true ,user:req.session.user,link1:'/stylesheets/order.css',link3:'/bootstrap/css/bootstrap.min.css', link4:'/css/main.css'})
});

router.get('/orders',verify,async(req,res)=>{
  let orders=await userHelpers.getUserOrders(req.session.user._id)
  res.render('user/orders',{user:req.session.user,orders,link1:'/stylesheets/order.css',link3:'/bootstrap/css/bootstrap.min.css', link4:'/css/main.css'})
});

router.get('/view-order-products/:id',verify,async(req,res,next)=>{
  let orderItems= await userHelpers.getOrderProducts(req.params.id)
  res.render('user/ordered-products',{user:req.session.user,orderItems,link1:'/stylesheets/order.css',link3:'/bootstrap/css/bootstrap.min.css', link4:'/css/main.css'})
});



router.post('/cancel-order',verify,async(req,res,next)=>{
  console.log(req.body,'passed from here')
  await productHelpers.orderCancelled(req.body).then((response)=>{
  res.json(response)
  
 })

});

router.post('/return-product',verify,async(req,res,next)=>{
await userHelpers.returnPorduct(req.body,req.session.user._id).then((response)=>{
  res.json(response)
})
})

router.post('/verify-payment',(req,res)=>{
console.log(req.body)
userHelpers.verifyPayment(req.body).then(()=>{
  userHelpers.changePaymentStatus(req.body['order[receipt]']).then(()=>{
    console.log("Payment Successfull")
    res.json({status:true})
  })
}).catch((err)=>{
  console.log(err)
  res.json({status:false,errMsg:''})
})
});

router.get('/order-success/:id/:total',verify,async(req,res,next)=>{
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;
  let orderId=req.params.id
  let userId=req.session.user._id
  let total=req.params.total
 
 
 await  userHelpers.verifyPaypal(payerId,paymentId,orderId,userId,total).then(()=>{
    console.log('payment success')
    res.render('user/order-success',{user:true ,user:req.session.user,link1:'/stylesheets/order.css',link3:'/bootstrap/css/bootstrap.min.css', link4:'/css/main.css'})
  })
})

router.get('/cancel', (req, res) =>{
console.log('payment cancelled ')
})










  router.get('/wishlist',verify,async(req,res,next)=>{
    let wishlistCount =await userHelpers.getWishlistCount(req.session.user._id)
    let cartCount =await userHelpers.getCartCount(req.session.user._id)
    let products=await userHelpers.getWishlistProducts(req.session.user._id)
    res.render('user/wishlist',{user:true,products,cartCount,wishlistCount,link3:'/bootstrap/css/bootstrap.min.css', link4:'/css/main.css'})
  });


  router.get('/add-wishlist/:id',(req,res)=>{
     let proId=req.params.id
     let userId=req.session.user._id
     userHelpers.addToWishlist(proId,userId).then(()=>{
      res.json({status:true})
     })
  });

  router.post('/remove-product-from-wishlist',(req,res,next)=>{
    userHelpers.removeProductFromWishlist(req.body).then((response)=>{
      res.json(response)
    })
  });


  router.get('/my-profile',verify,async(req,res,next)=>{
    console.log(req.session.user._id,'got')
    let profile=await userHelpers.getProfileDetails(req.session.user._id)
    res.render('user/profile',{user:true,profile,link3:'/bootstrap/css/bootstrap.min.css', link4:'/css/main.css'})
  });

 
router.get('/edit-profile',verify,async(req,res,next)=>{
  let profile=await userHelpers.getDetails(req.session.user._id)
  res.render('user/edit-profile',{user:true,profile,link3:'/bootstrap/css/bootstrap.min.css', link4:'/css/main.css'})
});

router.post('/edit-profile-details/:id',verify,(req,res,next)=>{
  userHelpers.editProfile(req.params.id,req.body).then((response)=>{
    res.redirect('/login/my-profile')
  })
 });

 router.get('/change-password',verify,async(req,res,next)=>{
  let profile=await userHelpers.getDetails(req.session.user._id)
  res.render('user/change-password',{user:true,profile,link3:'/bootstrap/css/bootstrap.min.css', link4:'/css/main.css',script:'/javascripts/signupValidation.js'})
 });

 router.post('/edit-password/:id',verify,(req,res,next)=>{
 userHelpers.changePassword(req.params.id,req.body).then((response)=>{
 res.redirect('/login/my-profile')
  })
 });


 router.get('/add-address',verify,(req,res,next)=>{
  res.render('user/add-address',{user:true,link3:'/bootstrap/css/bootstrap.min.css', link4:'/css/main.css'})
 });

 router.post('/add-address',verify,(req,res,next)=>{
  userHelpers.addDeliveryAddress(req.body,req.session.user._id).then((response)=>{
    res.redirect('/login/my-profile')
  })
 });

 router.get('/select-user-address/:id',verify,async(req,res,next)=>{
  let addressFind=await userHelpers.getSavedAddress(req.session.user._id)
  let total=await userHelpers.getSubTotalAmount(req.session.user._id)
  userHelpers.selectAddress(req.params.id).then((address)=>{
    res.render('user/checkout',{user:true,user:req.session.user,total,address,addressFind,link3:'/bootstrap/css/bootstrap.min.css', link4:'/css/main.css'})
  })
 });

 
router.post('/remove-address',verify,(req,res,next)=>{
  userHelpers.removeAddress(req.body).then((response)=>{
    res.json(response)
  })
});

router.get('/address-list',verify,async(req,res,next)=>{
  let addressFind=await userHelpers.getSavedAddress(req.session.user._id)
res.render('user/address-list',{user:true,user:req.session.user,addressFind,link3:'/bootstrap/css/bootstrap.min.css', link4:'/css/main.css'})
});

router.get('/viewProduct-wishlist/:id',verify,async(req,res,next)=>{
  let cartCount =await userHelpers.getCartCount(req.session.user._id)
  let product=await productHelpers.getProductDetails(req.params.id)
  res.render('user/product-detail',{user:true,product,cartCount,link3:'/bootstrap/css/bootstrap.min.css', link4:'/css/main.css'})
});

router.get('/coupon-available',verify,async(req,res,next)=>{
  let coupon=await productHelpers.getCoupon()
  res.render('user/coupon',{user:true,coupon,link3:'/bootstrap/css/bootstrap.min.css', link4:'/css/main.css'})
})

router.post('/applyCoupon',async(req,res)=>{
  let user=req.session.user._id

  let total=await userHelpers.getSubTotalAmount(user)
  const date=new Date()

  if(req.body.coupon==null){
    res.json({noCoupon:true,total})
  }else{
    await userHelpers.applyCoupon(req.body,user,date,total).then((response)=>{
      console.log(response,'applied coupon details')
      if(response.verifying){
        console.log('discounted')
        let discountAmount=(total*parseInt(response.Data.offer)/100)
        let amount=total-discountAmount
        response.subAmount=Math.round(discountAmount)
        response.TotalAmount=Math.round(amount)
        res.json(response)
      }else{
        console.log('not discounted')
        console.log(total)
        response.Total=total
        res.json(response)
      }
    })
   
  }

});

router.get('/get-wallet',verify,async(req,res,next)=>{
  let wallet=await userHelpers.getWallet(req.session.user._id)
  res.render('user/wallet',{user:true,wallet,link3:'/bootstrap/css/bootstrap.min.css', link4:'/css/main.css'})
});


router.get('/chicken',verify,(req,res,next)=>{
  userHelpers.getChicken(req.body).then(()=>{
    res.json(response)
  })
})



router.get('/logout', function(req, res, next) {
  req.session.userloggedIn = false
  res.redirect('/login')
});


module.exports = router;

