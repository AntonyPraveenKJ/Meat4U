
function myFunc() {
    emailValidate()
    passwordValidate()
    if (emailValidate() == false || passwordValidate() == false) {
        return false
    }else {
        return true
    }
    
}

function emailValidate() {
    
    let email = document.querySelector('#exampleInputEmail1').value
    let emailError  = document.querySelector('.emailError')
    let regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    let emailVal = email.match(regex)
    if (emailVal == ' ' || emailVal == null) {
        emailError.innerHTML = 'Email is not valid!'
        emailError.style.display = 'block'
        return false
    }else if(!emailVal){
        emailError.innerHTML = 'Email is not valid!'
        emailError.style.display = 'block'
        return false
    }else{
        emailError.style.display='none'
        return true
    }
}

function passwordValidate() {
    let password = document.querySelector("#exampleInputPassword1").value
    let passError = document.querySelector(".passError")
    let regex2 =  /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{2,16}$/
    let passVal = password.match(regex2)
    if (password == '' || password == null || password == ' ') {
        passError.innerHTML='Password is not valid!'
        passError.style.display="block"
        return  false
    }else {
        passError.style.display='none'
        return true
    }
}

const toastLiveExample = document.getElementById('liveToast')
const toast = new bootstrap.Toast(toastLiveExample)
toast.show()

