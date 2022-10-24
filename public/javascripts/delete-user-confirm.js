function confirmDelete(name) {
   return confirm(name)
}

const toastLiveExample = document.getElementById('liveToast')
const toast = new bootstrap.Toast(toastLiveExample)
toast.show()