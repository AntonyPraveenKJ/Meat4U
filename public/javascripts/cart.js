


		function addCart(proId){
			$.ajax({
				url:'/login/addtocart/'+proId,
				method:'get',
				success:(response)=>{
                    if(response.status){
                          alert("Product Added to CART!")
                        let count=$('#cart-count').html() 
                        count=parseInt(count)+1
                        $("#cart-count").html(count)
                    }
					
				}
			})
		}



        function changeQuantity(cartId,proId,userID,count){
            let quantity=parseInt(document.getElementById(proId).innerHTML)
            count=parseInt(count)

            $.ajax({
                url:'change-product-quantity',
                data:{
                    cart:cartId,
                    product:proId,
                    user:userID,
                    count:count,
                    quantity:quantity
                },
                method:'post',
                success:(response)=>{
                    if(response.removeProduct){
                        console.log('time for alert')
                      alert("Product Removed From Cart")
                      location.reload()
                    }else if(response.proNotRemoved){
                       document.getElementById('buttonError').innerHTML='There is only one product in cart; Use remove button'
                    }else{
                        console.log(response)
                        document.getElementById(proId).innerHTML = quantity+count
                        document.getElementById('subTotal').innerHTML= response.subTotal
                    }
                     }
            })
        }


        function removeFrmCart(cartId,proId){
            $.ajax({
                url:'remove-product-from-cart',
                data:{
                    cart:cartId,
                    product:proId,
                },
                method:'post',
                success:(response)=>{
                    if(response.removeProductCart){
                        alert("Are You Sure You Want To Remove This Product From Cart?")
                        location.reload()
                    }
                }

            })
        }



        function changeStatus(orderId,status){
            $.ajax({
                url:'/admin/change-order-status',
                data:{
                    orderId:orderId,
                    status:status
                },
                method:'post',
                success:(response)=>{
                    if(response.shipped){
                        alert("Confirm Status Shipped")
                        location.reload()
                     }else if(response.outForDelivery){
                        alert("Confirm Status Out For Delivery")
                        location.reload()
                     }else if(response.delivered){
                        alert("Confirm Status Delivered")
                        location.reload()
                     }
                    
                }
               })
             }




        function cancelOrder(orderId,status,userId){
            $.ajax({
                url:'/login/cancel-order',
                data:{
                    orderId:orderId,
                    status:status,
                    userId:userId
                },
                method:'post',
                success:(response)=>{
                    if(response.status){
                       
                        alert("Confirm You Want to Cancel this Order!!")
                        location.reload()
                     }
                    
                }
               
               
                   
                
            })
        }



    function wishlist(proId){
        $.ajax({
            url:'/login/add-wishlist/'+proId,
            method:'get',
            success:(response)=>{
                if(response.status){
                      alert("Product Added to Wishlist!")
                    let count=$('#wishlist-count').html() 
                    count=parseInt(count)+1
                    $("#wishlist-count").html(count)
                }
                
            }
        })
    }

    function addtoCart(proId){
        $.ajax({
            url:'/login/add-to-cart/'+proId,
            method:'get',
            success:(response)=>{
                if(response.status){
                      alert("Product Added to CART!")
                    let count=$('#cart-count').html() 
                    count=parseInt(count)+1
                    $("#cart-count").html(count)
                }
                
            }
        })
    }

    function removeFrmWishlist(wishId,proId){
        $.ajax({
            url:'remove-product-from-wishlist',
            data:{
                wishlist:wishId,
                product:proId,
            },
            method:'post',
            success:(response)=>{
                if(response.removeProductWishlist){
                    alert("Are You Sure You Want To Remove This Product From Wishlist?")
                    location.reload()
                }
            }

        })
    }


    function removeFrmAddress(addressId,userId){
        $.ajax({
            url:'remove-address',
            data:{
             addId:addressId,
             userId:userId
            },
           
            method:'post',
            success:(response)=>{
                if(response.removedAddress){
                    alert("Are You Sure You Want To Remove This Address?")
                    location.reload()
                }
            }

        })
    }

    function deleteOffer(category){
       $.ajax({
        url:'/admin/remove-category-offer',
        data:{
            category:category
        },
        method:'post',
        success:(response)=>{
              if(response.status){
                alert('Do you want to delete this Offer??')
                location.reload()
              }
        }
       })
    }




    // otp validation

    
function myFunc3() {
    mobileValiate3()
    if (
        mobileValiate3() == false
    ) {
        return false;
    } else {
        return true;
    }
}
function mobileValiate3() {
    let mobile = document.querySelector("#mobNumber").value;
    let mobileError = document.querySelector("#mobileerror");
    let regex = /^(\\d{1,3}?)?\d{10}$/
    let mobileVal = mobile.match(regex);
    if (mobile == " " || !mobileVal) {
        mobileError.innerHTML = "Please enter a valid mobile number!";
        mobileError.style.display = "block";
        return false;
    }else{
        mobileError.style.display = "none";
        return true
    }
}

// coupon

function applyCoupon(event){
    event.preventDefault()
    let coupon=document.getElementById('couponName').value
     console.log(coupon);
    alert(coupon,"==+++++++")
    $.ajax({
        url:'/login/applyCoupon',
        data:{ coupon },
        method:'post',
        success:(response)=>{
            if(response.verifying)
            {
                alert(response.TotalAmount +'++++++++====')
                document.getElementById('discountRate').innerHTML='₹'+response.TotalAmount   
            }else if(response.verifyUsedCoupon){
                document.getElementById('error').innerHTML='Coupon Already Used!!'
            }else{
                alert(response.Total+"=========")
                document.getElementById('subTotal').innerHTML='₹'+ response.Total
               

                if(response.invalidCoupon){
                    document.getElementById('error').innerHTML=response.invalidMessage 
                }
                else if(response.dateInvalid)
                {
                    document.getElementById('error').innerHTML=response.dateInvalidMessage
                }
                else if(response.invalidMinAmount)
                {
                    document.getElementById('error').innerHTML=response.minAmountMsg
                }
                else if(response.invalidMaxAmount)
                {
                    document.getElementById('error').innerHTML=response.maxAmountMsg
                }
                else if(response.noCoupon){
                    document.getElementById('error').innerHTML='invalid coupon details'
                }
                
            } 
        }
    })
}



function removeCategory(catId,catName){
    $.ajax({
        url:'/admin/remove-category',
        data:{
            catId:catId,
            catName:catName
        },
        method:'post',
        success:(response)=>{
           if(response.proExt){
            console.log('find cat error id')
            document.getElementById('catExt'+catName).innerHTML='Cannot delete this category because product exist under this category!!'
           } else if( response.removeCategory){
            alert('Are you sure you want to delete this category?')
            location.reload()
           }
        }
    })
}


window.onload = function() {
    window.setTimeout(setDisabled, 30000);
}


function setDisabled() {
    document.getElementById('resendOtp').disabled = false;
}


function countdown() {
    var seconds = 30;
    function tick() {
      var counter = document.getElementById("counter");
      seconds--;
      counter.innerHTML =
        "0:" + (seconds < 10 ? "0" : "") + String(seconds);
      if (seconds > 0) {
        setTimeout(tick, 1000);
      }else{
        document.getElementById("counter").innerHTML = "";
      }
    }
    tick();
  }
  countdown();


  function resendMobileOtp(mobNo){
      $.ajax({
        url:'/login/resendOtp',
        data:{
          mobile:mobNo
        },
        method:'post',
        success:(response)=>{
            if(response.status){
                 signUpData=response.user
                 location.reload()
            }
        }
      })
  }


function returnProduct(orderId,itemId){
    $.ajax({
        url:'/login/return-product',
        data:{
            orderId:orderId,
            itemId:itemId
        },
        method:'post',
        success:(response)=>{
            if(response.returned){
                alert('Are you sure you want to return this product?')
                location.reload()
            }
        }
    })
}


function refundMoney(orderId,userId,total,quantity,itemId){
    $.ajax({
        url:'/admin/refund-amount',
        data:{
            orderId:orderId,
            userId:userId,
            proTotal:total,
            qunty:quantity,
            itemId:itemId
        },
        method:'post',
        success:(response)=>{
             if(response.status){
                alert('The amount of this product is successfully refunded to the user wallet!!')
                 location.reload()
             }
        }
    })
}

function getDaySalesReport(date){
    $.ajax({
        url:'/admin/day-sales-report',
        data:{
            date:date
        },
        method:'post',
        success:(response)=>{

        }
    })
}