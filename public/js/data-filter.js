let products={
    data:[
      {
        productName:"Drum Stick",
        category:"chicken",
        price:"120/-",
        image:"chicken-meat-1376682.jpg"
      },
      {
        productName:"Mutton Leg Piece",
        category:"mutton",
        price:"450/-",
        image:"Baby_Goat_Leg_d0411078-6c52-4212-a4c8-f1ef568662a9.jpg"
      },
      {
        productName:"Full Duck",
        category:"duck",
        price:"350/-",
        image:"whole-duck-fresh-duck-meat-3261911.jpg"
      },
      {
        productName:"Pearl Spot",
        category:"fish",
        price:"550/-",
        image:"pearl-spot-fish-known-karimeen-260nw-1793757871.webp"
      },
      {
        productName:"Lollipop",
        category:"chicken",
        price:"100/-",
        image:"10000929_9-fresho-chicken-lollipop-antibiotic-residue-free.webp"
      },
      {
        productName:"Full Chicken",
        category:"chicken",
        price:"95/-",
        image:"jk-sloan-9zLa37VNL38-unsplash.jpg"
      },
      {
        productName:"Pork Meat",
        category:"Pork",
        price:"300/-",
        image:"Pork20Curry20Cut.jpg"
      },
      {
        productName:"Pork Meat without Fat",
        category:"Pork",
        price:"400/-",
        image:"pork-meat-1514878673-3554494.jpeg"
      },
      {
        productName:"Sardine",
        category:"fish",
        price:"120/-",
        image:"sardine.jpg"
      },
      {
        productName:"Hams",
        category:"Pork",
        price:"1200/-",
        image:"4-pork-ham-sliced-500x500.jpg"
      },
      {
        productName:"Duck Currycut",
        category:"duck",
        price:"370/-",
        image:"duck_cury_cut_1_1.jpg"
      },
      {
        productName:"Marakel",
        category:"Fish",
        price:"120/-",
        image:"mackerel_1__1.jpg"
      }
    ]
};

for(let i of products.data){
    let card=document.createElement("div");

    card.classList.add("card",i.category, "hide");

    let imgContainer=document.createElement("div");

    imgContainer.classList.add("image-container");

    let image=document.createElement("img");
    image.setAttribute("src",i.image);
    imgContainer.appendChild(image);
    card.appendChild(imgContainer);

    let container=document.createElement("div");
    container.classList.add("container");

    let name=document.createElement("h5");
    name.classList.add("product-name");
    name.innerText= i.productName.toUpperCase();
    container.appendChild(name);

    let price=document.createElement("h6");
    price.innerText="Rs" + i.price;
    container.appendChild(price);

    card.appendChild(container);

    document.getElementById("products").appendChild("card");
}

function filterProduct(value){
    let buttons=document.querySelectorAll(".button-value");
    buttons.forEach((button)=>{
        if (value.toUpperCase() == button.innerText.toUpperCase()){
            button.classList.add("active");
        }else{
            button.classList.remove("active");
        }
    });

    let elements= document.querySelectorAll(".card");

    elements.forEach((element)=>{
        if(value ==  "all"){
            element.classList.remove("hide");
        }else{
            if(element.classList.contains(value)){
                element.classList.remove("hide");
            }else{
                element.classList.add("hide");
            }
        }
    })
}


document.getElementById("search").addEventListener
("click",()=> {
    let searchInput = document.getElementById("search-input").value;

    let elements=document.querySelectorAll(".product-name");

    let cards = document.querySelectorAll(".card");

    elements.forEach((element,index)=>{
        if(element.innerText.includes(searchInput.toUpperCase())){
            cards[index].classList.remove("hide");
        }else{
            cards[index].classList.add("hide");
        }
    })
})

window.onload = () => {
 filterProduct("all");
}