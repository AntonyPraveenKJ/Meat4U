var express = require('express');
var router = express.Router();
let userHelpers = require('../helpers/user-helpers')
var Handlebars = require('handlebars');
const productHelpers = require('../helpers/product-helpers');
let categoryHelpers=require('../helpers/category-helpers')
const math=require('mathjs')
const multer=require("../helpers/multer");

 
const fs = require("fs-extra");
 

/* GET admin login page. */
router.get('/', function(req, res, next) {
  if (req.session.adminLoggedIn) {
    res.redirect('/admin/adminhome')
    
  }else{
    let adminEmailval = req.session.adminEmailval
    res.render('admin/adminlogin', { adminEmailval, 'adminloginErr' : req.session.adminloginErr, title: 'Admin Login' ,home:true, link1: '/stylesheets/login.css' , script: '/javascripts/loginValidation.js'});
    req.session.adminloginErr = false
  }
});

router.post('/', function(req, res, next) {

  userHelpers.adminLogin(req.body).then((response)=>{
    
    if (response.status) {
      req.session.adminLoggedIn = true
      req.session.admin = response.admin
      res.redirect('/admin/adminhome')
    }else {
      req.session.adminloginErr = true
      req.session.adminEmailval = req.body.Email
      res.redirect('/admin')
    }
  })
});


/* GET Admin Home Page. */
let verify2 = ((req,res,next)=>{ 
  if (req.session.adminLoggedIn){    
    next()
  }else{
    res.redirect('/admin')
  }
})
router.get('/adminhome',verify2,async(req, res, next)=> {
  let paymentGrph=await productHelpers.paymentGraph()
  let sales=await productHelpers.salesGrph()
  let orders=await productHelpers.totalOrders()
  let users=await productHelpers.totalUsers()
  let products=await productHelpers.totalProducts()
  let revenue=await productHelpers.totalRevenue()
  res.render('admin/admin-home' ,{ admin:true,paymentGrph,sales,orders,users,products,revenue,title: 'Admin Home' , link1: '/stylesheets/admin-home.css' });
});


router.get('/users-details', function(req, res, next) {
 
  userHelpers.getAllUsers().then((users)=>{
    if (req.session.adminLoggedIn) {
      let addtoast = req.session.toast2
    res.render('admin/users-details' ,{ addtoast, admin:true, title: 'Users Details' , users , link1: '/stylesheets/users-details.css',link2: '/stylesheets/admin-header.css' ,script: '/javascripts/delete-user-confirm.js'});
    req.session.toast2 = false
    }else{
      res.redirect('/admin')
    }
})
 
});

router.post('/users-details', function(req, res, next) {
  userHelpers.getFindUsers(req.body).then((usersFind)=>{
    
    res.render('admin/users-details' ,{ admin:true, title: 'Users Details' , usersFind ,link2:'/stylesheets/admin-header.css', link1: '/stylesheets/users-details.css' ,script: '/javascripts/delete-user-confirm.js',script2:'/javascripts/deletePopup.js'});
  })
 
});

router.get('/block-user/:id/:status', async (req, res) =>{
console.log(req.params)
   if (req.session.adminLoggedIn) {
     await userHelpers.blockUser(req.params.id,req.params.status).then((response)=>{
      res.redirect('/admin/users-details')
 })
     } else {
    res.redirect('admin/users-details')
  }
  
});

router.get('/view-products',function(req,res,next){
  productHelpers.getAllProducts().then((products)=>{
    res.render('admin/view-products',{admin:true,products,link2:'/stylesheets/admin-header.css',link1:'/stylesheets/view-products.css'},)
  })
 });

router.get('/product-category',function(req,res,next){
  productHelpers.getAllProducts().then((products)=>{
    res.render('admin/category',{admin:true,products,link2:'/stylesheets/admin-header.css',link1:'/stylesheets/view-products.css'},)
  })
 });



router.get('/add-product',async function(req,res){
 let options= await categoryHelpers.getCategoryList()
  res.render('admin/add-product',{admin:true,options,link2:'/stylesheets/admin-header.css',link1:'/stylesheets/view-products.css'})
});


router.post('/add-product',multer.array('image',4),(req,res,next)=>{
 console.log(req.files)
  const filename=req.files.map(function(file){
    return file.filename
})

req.body.image=filename

  productHelpers.addProduct(req.body).then(()=>{
    res.redirect('/admin/add-product')
  })
   });

router.get('/product-details',function(req,res,next){
  productHelpers.getAllProducts().then((products)=>{
    res.render('admin/product-details',{admin:true,products,link2:'/stylesheets/admin-header.css',link1:'/stylesheets/view-products.css'},)
  })
 
});

router.get('/delete-product/:id',(req,res)=>{
  let proId=req.params.id
  productHelpers.deleteProduct(proId).then((response)=>{
    res.redirect('/admin/view-products')
  })
});

router.get('/edit-product/:id',async(req,res)=>{
  let product=await productHelpers.getProductDetails(req.params.id)
  console.log(product)
  res.render('admin/edit-product',{admin:true,product,link2:'/stylesheets/admin-header.css',link1:'/stylesheets/view-products.css'})
});

router.post('/edit-product/:id',multer.array('image',4),(req,res)=>{
  console.log(req.files)
  const filename=req.files.map(function(file){
    return file.filename
})

req.body.image=filename
let id=req.params.id
  productHelpers.updateProduct(id,req.body).then(()=>{
    res.redirect('/admin/view-products')
  })
});


router.get('/product-category',(req,res)=>{
  res.render('admin/category',{admin:true,link2:'/stylesheets/admin-header.css',link1:'/stylesheets/view-products.css'});
});

router.get('/order-list',verify2,(req,res,next)=>{
  productHelpers.getAllOrderDetails().then((orderDetails)=>{
    res.render('admin/orders',{admin:true,orderDetails,link2:'/stylesheets/admin-header.css',link1:'/stylesheets/view-products.css'})
  });

  router.get('/view-order-details/:id',async(req,res)=>{
    console.log(req.params,'hello')
    let products= await userHelpers.getOrderProducts(req.params)
      res.render('admin/order-products',{admin:true,products,link1:'/stylesheets/view-products.css',link2:'/stylesheets/admin-header.css'})
  })
});

router.post('/change-order-status',async(req,res,next)=>{
  await productHelpers.productShipped(req.body).then((response)=>{
  res.json(response)
  })
});

router.post('/refund-amount',(req,res)=>{
  productHelpers.refundAmount(req.body).then((response)=>{
    res.json(response)
  })
});


router.post('/addCategory',(req,res)=>{
  console.log(req.body)
   categoryHelpers.addCategory(req.body)
     res.render('admin/category',{admin:true,link2:'/stylesheets/admin-header.css',link1:'/stylesheets/view-products.css'})
  });

router.get('/categorylist',async(req,res)=>{
  let categoryDetails=   await categoryHelpers.getCategoryList()
   res.render('admin/category-list',{admin:true,categoryDetails,link2:'/stylesheets/admin-header.css',link1:'/stylesheets/view-products.css'},)
});
    
  router.post('/category/:id',async(req,res)=>{
    await  categoryHelpers.addCategory(req.body).then(()=>{
     res.render('admin/add-product',{admin:true,link2:'/stylesheets/admin-header.css',link1:'/stylesheets/view-products.css'})
     })
  });

  router.post('/remove-category',async(req,res)=>{
   await categoryHelpers.removeCategory(req.body).then((response)=>{
    res.json(response)
   })
  });

  router.get('/backToCategory',(req,res)=>{
    res.redirect('/admin/product-category')
  })


  router.get('/banner-details',(req,res)=>{
    res.render('admin/banner',{admin:true,link2:'/stylesheets/admin-header.css',link1:'/stylesheets/view-products.css'})
  });

  router.post('/add-Banner',multer.array('image',1),(req,res,next)=>{
    console.log(req.files)
     const filename=req.files.map(function(file){
       return file.filename
   })
   
   req.body.image=filename
   
     productHelpers.addBanner(req.body).then(()=>{
       res.redirect('/admin/edit-banner')
     })
      });


  router.get('/edit-banner',async(req,res)=>{
    let monthlyBanner=await productHelpers.getMonthlyBanner()
    let mainBanner=await productHelpers.getHomeBanner()
    let banner=await productHelpers.getBanner()
    res.render('admin/banner-details',{admin:true,banner,mainBanner,monthlyBanner,link2:'/stylesheets/admin-header.css',link1:'/stylesheets/view-products.css'})
  });


router.get('/update-banner/:id',async(req,res)=>{
  let details= await productHelpers.bannerDetails(req.params.id)
res.render('admin/update-banner',{admin:true,details,link2:'/stylesheets/admin-header.css',link1:'/stylesheets/view-products.css'})
});

router.post('/add-new-banner/:id',multer.array('image',1),(req,res)=>{
  console.log(req.files)
  const filename=req.files.map(function(file){
    return file.filename
})

req.body.image=filename
let id=req.params.id
  productHelpers.updateBanner(id,req.body).then(()=>{
    res.redirect('/admin/edit-banner')
  })
});

router.post('/add-main-banner',multer.array('image',1),(req,res,next)=>{
  console.log(req.files)
   const filename=req.files.map(function(file){
     return file.filename
 })
 
 req.body.image=filename
 
   productHelpers.homeBanner(req.body).then(()=>{
     res.redirect('/admin/edit-banner')
   })
    });


router.get('/update-main-banner/:id',async(req,res)=>{
  let mainBanner= await productHelpers.mainBanner(req.params.id)
res.render('admin/update-banner',{admin:true,mainBanner,link2:'/stylesheets/admin-header.css',link1:'/stylesheets/view-products.css'})
});

router.post('/add-home-banner/:id',multer.array('image',1),(req,res)=>{
  console.log(req.files)
  const filename=req.files.map(function(file){
    return file.filename
})

req.body.image=filename
let id=req.params.id
  productHelpers.updateHomeBanner(id,req.body).then(()=>{
    res.redirect('/admin/edit-banner')
  })
});

router.post('/add-monthly-banner',multer.array('image',1),(req,res,next)=>{
  console.log(req.files)
   const filename=req.files.map(function(file){
     return file.filename
 })
 
 req.body.image=filename
 
   productHelpers.monthlyBanner(req.body).then(()=>{
     res.redirect('/admin/edit-banner')
   })
    });


router.get('/update-monthlybanner/:id',async(req,res)=>{
  let monthlyDetails= await productHelpers.monthlyBannerDetails(req.params.id)
res.render('admin/update-banner',{admin:true,monthlyDetails,link2:'/stylesheets/admin-header.css',link1:'/stylesheets/view-products.css'})
});


router.post('/get-monthly-banner/:id',multer.array('image',1),(req,res)=>{
  console.log(req.files)
  const filename=req.files.map(function(file){
    return file.filename
})

req.body.image=filename
let id=req.params.id
  productHelpers.updateMonthlyBanner(id,req.body).then(()=>{
    res.redirect('/admin/edit-banner')
  })
});



router.get('/offer',async(req,res)=>{
  let options= await categoryHelpers.getCategoryList()
  res.render('admin/offer-details',{admin:true,options,link2:'/stylesheets/admin-header.css',link1:'/stylesheets/view-products.css'})
});

router.post('/catagory-offer',async(req,res)=>{
  let offer=req.body.offer
  if(req.body.category!=""){
    let catOfferPrice=0
    let category=await categoryHelpers.addCategoryOffer(req.body)
   
    if(category!=""){
      for(let i=0;i<category.length;i++){
       let catOffer=parseInt(offer)
       let proOffer=parseInt(category[i].offer)
       let proPrice=parseInt(category[i].price)
        console.log('catOffer :'+offer,'proOffer :'+category[i].offer)
        if(category[i].offer!="NaN"){
          console.log('hai')
         
          if(catOffer >= proOffer){
            console.log('this')
            catOfferPrice=math.round((proPrice)*((100-catOffer)/100))
          }else{
           console.log('that')
            catOfferPrice=math.round((proPrice)*((100-proOffer)/100))
           }
        }else if(category[i].offer==="NaN"&&category[i].price!=""){
          console.log('hoiii')
          catOfferPrice=math.round((proPrice)*((100-catOffer)/100))
        }
        await categoryHelpers.updateCategoryOffer(category[i]._id,catOfferPrice,catOffer,proOffer)
      }
    }
  }
res.redirect('/admin/offer')

});

router.get('/categoryOffer-details',async(req,res)=>{
 let catOffer=await categoryHelpers.getCatOfferDetails()
 res.render('admin/catOffer-details',{admin:true,catOffer,link2:'/stylesheets/admin-header.css',link1:'/stylesheets/view-products.css'})
});

router.post('/remove-category-offer',async(req,res)=>{
 let category= await categoryHelpers.getCategoryOffer(req.body.category)
  for(let i=0;i<category.length;i++){
    await categoryHelpers.removeCategoryOffer(category[i]._id)
  }
  await categoryHelpers.getStatus(req.body.category).then((response)=>{
    res.json(response)
  })
  
});


router.get('/sales-report',(req,res)=>{
 res.render('admin/sales',{admin:true,link2:'/stylesheets/admin-header.css',link1:'/stylesheets/view-products.css'})
});

router.post('/day-sales',async(req,res)=>{
  let dt=req.body.day
  let daySalesList=await productHelpers.daySalesReport(dt)
  let sum=0
  for(let i=0;i<daySalesList.length;i++){
    sum=sum+daySalesList[i].quantity
  }
  let totalPrice=0
  for(let i=0;i<daySalesList.length;i++){
    totalPrice=totalPrice+daySalesList[i].total
  }
  let countOrder=await productHelpers.countOrder(dt)
  res.render('admin/day-sales-report',{admin:true,daySalesList,countOrder,sum,totalPrice,link2:'/stylesheets/admin-header.css',link1:'/stylesheets/view-products.css'})
});



router.post('/month-sales-report',async(req,res)=>{
  let dt=req.body.month
  let monthSalesList=await productHelpers.monthSalesReport(dt)
  let quantity=0
  for(let i=0;i<monthSalesList.length;i++){
    quantity=quantity+monthSalesList[i].count
  }
  let orderCount=0
  for(let i=0;i<monthSalesList.length;i++){
    orderCount=orderCount+monthSalesList[i].total
  }

  let countOrder=await productHelpers.countOrderMonthly(dt)

  res.render('admin/monthly-sales-report',{admin:true,monthSalesList,countOrder,quantity,orderCount,link2:'/stylesheets/admin-header.css',link1:'/stylesheets/view-products.css'})
});


router.get('/getCoupon',async(req,res)=>{
  res.render('admin/coupon',{admin:true,link2:'/stylesheets/admin-header.css',link1:'/stylesheets/view-products.css'})
});



router.post('/postCoupon',(req,res)=>{
  productHelpers.addCoupon(req.body).then((response)=>{
    if(response.status){
      res.redirect('/admin/coupon-details')
      console.log('success')
    }else{
      res.redirect('/admin/getCoupon')
    }
  })
});

router.get('/coupon-details',async(req,res)=>{
  let coupon=await productHelpers.getCoupon()
  res.render('admin/coupon-details',{admin:true,coupon,link2:'/stylesheets/admin-header.css',link1:'/stylesheets/view-products.css'})
});

router.get('/editCoupon/:id',async(req,res)=>{
  let Id=req.params.id
  let coupon= await productHelpers.editCoupon(Id)
  res.render('admin/edit-coupon',{admin:true,coupon,link2:'/stylesheets/admin-header.css',link1:'/stylesheets/view-products.css'})
});

router.post('/editCoupon/:id',(req,res)=>{
  console.log(req.body,'passedddd')
  productHelpers.updateCoupon(req.body).then(()=>{
    res.redirect('/admin/coupon-details')
  })
});

router.get('/deleteCoupon/:id',(req,res)=>{
  let Id=req.params.id
  productHelpers.deleteCoupon(Id).then(()=>{
    res.redirect('/admin/coupon-details')
  })
});

router.get('/logout', function(req, res, next) {
  req.session.adminLoggedIn = false
  res.redirect('/admin');
}); 

module.exports = router;