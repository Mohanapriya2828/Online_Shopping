const PAGE_SIZE = 6;
let allProducts = [];
let filteredProducts = [];
let currentPage = 1;

async function fetchCategories(){
  const res = await fetch(`${BASE_URL}/categories`);
  const data = await res.json();
  return data.documents||[];
}

async function fetchSubcategories(catId){
  const res = await fetch(`${BASE_URL}/subcategories`);
  const data = await res.json();
  return (data.documents||[]).filter(s=>s.fields.parentCatId.stringValue===catId);
}

async function fetchAllProducts(){
  const res = await fetch(`${BASE_URL}/products`);
  const data = await res.json();
  return (data.documents||[]).map(d=>({
    catId: d.fields.catId.stringValue,
    subCatId: d.fields.subCatId.stringValue,
    title: d.fields.title.stringValue,
    price: d.fields.price.integerValue||d.fields.price.doubleValue,
    image: d.fields.imageUrl.stringValue,
    rating: d.fields.averageRating?.doubleValue||0,
    stock: d.fields.qty.integerValue||0,
    productId: d.fields.productId.stringValue
  }));
}

async function addToCart(productId) {
  if (!window.currentUserId) return alert("Login first");

  const documentId = "CART-" + Date.now();

  try {
    const res = await fetch(`${BASE_URL}/carts?documentId=${documentId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fields: {
          cartId: { stringValue: documentId },
          productId: { stringValue: productId },
          quantity: { integerValue: 1 },
          userId: { stringValue: window.currentUserId },
          addedAt: { timestampValue: new Date().toISOString() }
        }
      })
    });

    if (!res.ok) {
      const errData = await res.json();
      console.error("Error adding to cart:", errData);
      return alert("Failed to add to cart");
    }

    alert("Added to cart!");
  } catch (err) {
    console.error(err);
    alert("Error adding to cart");
  }
}

async function fetchCart(){
  if(!window.currentUserId) return [];
  const res = await fetch(`${BASE_URL}/carts`);
  const data = await res.json();
  return (data.documents || []).filter(c => c.fields.userId.stringValue === window.currentUserId);
}

async function renderCart(){
  const cartItems = await fetchCart();
  let cartContainer = document.getElementById("cartContainer");
  if(!cartContainer){
    cartContainer = document.createElement("div");
    cartContainer.id = "cartContainer";
    cartContainer.style.position = "fixed";
    cartContainer.style.right = "10px";
    cartContainer.style.top = "60px";
    cartContainer.style.width = "300px";
    cartContainer.style.maxHeight = "400px";
    cartContainer.style.overflowY = "auto";
    cartContainer.style.backgroundColor = "#fff";
    cartContainer.style.border = "1px solid #ccc";
    cartContainer.style.padding = "10px";
    cartContainer.style.zIndex = "1000";
    document.body.appendChild(cartContainer);
  }
  cartContainer.innerHTML = "<h3>Your Cart</h3>";
  if(cartItems.length === 0){
    cartContainer.innerHTML += "<p>Cart is empty</p>";
    return;
  }
  cartItems.forEach(item => {
    cartContainer.innerHTML += `
      <p>Product ID: ${item.fields.productId.stringValue} | Quantity: ${item.fields.quantity.integerValue}</p>
    `;
  });
}


async function addToWishlist(productId){
  if(!window.currentUserId) return alert("Login first");

  const docId = "W-" + Date.now();
  const payload = {
    fields: {
      wishId: { stringValue: docId },
      productId: { stringValue: productId },
      userId: { stringValue: window.currentUserId },
      addedAt: { timestampValue: new Date().toISOString() }
    }
  };

  const res = await fetch(`${BASE_URL}/wishlists?documentId=${docId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if(res.ok) alert("Added to wishlist!");
  else {
    const err = await res.json();
    console.error(err);
    alert("Failed to add to wishlist");
  }
}


function renderPagination(){
  const totalPages = Math.ceil(filteredProducts.length/PAGE_SIZE);
  const pagination = document.getElementById("pagination");
  pagination.innerHTML="";
  for(let i=1;i<=totalPages;i++){
    const btn = document.createElement("button");
    btn.textContent=i;
    if(i===currentPage) btn.disabled=true;
    btn.addEventListener("click", ()=>{
      currentPage=i;
      renderProducts();
    });
    pagination.appendChild(btn);
  }
}

function renderProducts(){
  const productList = document.getElementById("productList");
  productList.innerHTML="";
  const start = (currentPage-1)*PAGE_SIZE;
  const end = start+PAGE_SIZE;
  const current = filteredProducts.slice(start,end);
  if(current.length===0){
    productList.innerHTML="<p>No products found.</p>";
    return;
  }
  current.forEach(p=>{
    const card = document.createElement("div");
    card.className="product-card";
    card.innerHTML=`
      <img src="${p.image}" alt="${p.title}">
      <h4>${p.title}</h4>
      <p>Price: ₹${p.price}</p>
      <p>Rating: ${p.rating} ⭐ | Stock: ${p.stock}</p>
      <button onclick="addToCart('${p.productId}')">Add to Cart</button>
      <button onclick="addToWishlist('${p.productId}')">Add to Wishlist</button>
    `;
    productList.appendChild(card);
  });
  renderPagination();
}

async function renderSidebar(){
  const categories = await fetchCategories();
  const categoriesList = document.getElementById("categoriesList");
  categoriesList.innerHTML="";
  allProducts = await fetchAllProducts();
  filteredProducts = [...allProducts];
  renderProducts();

  categories.forEach(cat=>{
    const li = document.createElement("li");
    li.className="category-item";
    li.textContent=cat.fields.name.stringValue;
    li.dataset.id = cat.fields.catId.stringValue;

    const subList = document.createElement("ul");
    subList.className="subcategory-list";
    subList.style.display="none";

    li.addEventListener("click", async ()=>{
      const isOpen = subList.style.display==="block";
      document.querySelectorAll(".subcategory-list").forEach(s=>s.style.display="none");
      subList.style.display = isOpen ? "none" : "block";

      filteredProducts = allProducts.filter(p=>p.catId===li.dataset.id);
      currentPage=1;
      renderProducts();

      const subcats = await fetchSubcategories(li.dataset.id);
      subList.innerHTML="";
      subcats.forEach(sub=>{
        const subLi = document.createElement("li");
        subLi.textContent=sub.fields.name.stringValue;
        subLi.addEventListener("click", e=>{
          e.stopPropagation();
          filteredProducts = allProducts.filter(p=>p.subCatId===sub.fields.subCatId.stringValue);
          currentPage=1;
          renderProducts();
        });
        subList.appendChild(subLi);
      });
    });

    categoriesList.appendChild(li);
    categoriesList.appendChild(subList);
  });
}

document.addEventListener("DOMContentLoaded", ()=>{
  renderSidebar();
});

async function renderCart() {
  if (!window.currentUserId) return alert("Login first");

  const res = await fetch(`${BASE_URL}/carts`);
  const data = await res.json();
  const carts = (data.documents || []).filter(c => c.fields.userId.stringValue === window.currentUserId);

  const cartItems = document.getElementById("cartItems");
  cartItems.innerHTML = "";

  if (carts.length === 0) {
    cartItems.innerHTML = "<p>Your cart is empty.</p>";
  } else {
    carts.forEach(c => {
      const prodId = c.fields.productId.stringValue;
      const quantity = c.fields.quantity.integerValue;

      const prod = allProducts.find(p => p.productId === prodId);
      if (prod) {
        const div = document.createElement("div");
        div.className = "cart-item";
        div.innerHTML = `
          <p><strong>${prod.title}</strong> - ₹${prod.price} x ${quantity}</p>
        `;
        cartItems.appendChild(div);
      }
    });
  }

  document.getElementById("cartContainer").style.display = "block";
}

document.addEventListener("DOMContentLoaded", () => {
  const cartBtn = document.getElementById("cartBtn");
  const cartContainer = document.getElementById("cartContainer");
  const closeCartBtn = document.getElementById("closeCartBtn");

  cartBtn.addEventListener("click", async () => {
    if (!window.currentUserId) {
      alert("Login first to view cart!");
      return;
    }
    cartContainer.style.display = "block";
    const cartItemsDiv = document.getElementById("cartItems");
    cartItemsDiv.innerHTML = "<p>Loading cart...</p>";

    const cartData = await fetchCart(window.currentUserId);
    if (cartData.length === 0) {
      cartItemsDiv.innerHTML = "<p>Your cart is empty.</p>";
      return;
    }

    cartItemsDiv.innerHTML = "";
    cartData.forEach(item => {
      const div = document.createElement("div");
      div.style.borderBottom = "1px solid #ccc";
      div.style.padding = "5px 0";
      div.innerHTML = `
        <p>Product ID: ${item.fields.productId.stringValue}</p>
        <p>Quantity: ${item.fields.quantity.integerValue}</p>
        <p>Added At: ${new Date(item.fields.addedAt.timestampValue).toLocaleString()}</p>
      `;
      cartItemsDiv.appendChild(div);
    });
  });

  closeCartBtn.addEventListener("click", () => {
    cartContainer.style.display = "none";
  });
});
document.getElementById("cartBtn").addEventListener("click", () => {
  if (!window.currentUserId) {
    alert("Login first to view cart!");
    return;
  }
  renderCart(); 
});

