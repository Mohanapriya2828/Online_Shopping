const BASE_URL = "https://firestore.googleapis.com/v1/projects/firestore-demo-4daa4/databases/(default)/documents";
const PAGE_SIZE = 6;

let allProducts = [];
let currentPage = 1;
let filteredProducts = [];

document.addEventListener("DOMContentLoaded", async () => {
  const categoriesList = document.getElementById("categoriesList");
  const productList = document.getElementById("productList");
  const pagination = document.getElementById("pagination");

  const categories = await fetchCategories();
  renderCategories(categories);

  allProducts = await fetchAllProducts();
  filteredProducts = [...allProducts];
  renderProducts();

  function renderCategories(categories) {
    categoriesList.innerHTML = "";
    categories.forEach(cat => {
      const li = document.createElement("li");
      li.className = "category-item";
      li.textContent = cat.fields.name.stringValue;
      li.dataset.id = cat.fields.catId.stringValue;

      const subList = document.createElement("ul");
      subList.className = "subcategory-list";

      li.addEventListener("click", async () => {
        const isOpen = subList.style.display === "block";
        document.querySelectorAll(".subcategory-list").forEach(s => s.style.display = "none");
        subList.style.display = isOpen ? "none" : "block";

        filteredProducts = allProducts.filter(p => p.catId === li.dataset.id);
        currentPage = 1;
        renderProducts();

        const subcats = await fetchSubcategories(li.dataset.id);
        subList.innerHTML = "";
        subcats.forEach(sub => {
          const subLi = document.createElement("li");
          subLi.textContent = sub.fields.name.stringValue;
          subLi.addEventListener("click", (e) => {
            e.stopPropagation();
            filteredProducts = allProducts.filter(
              p => p.subCatId === sub.fields.subCatId.stringValue
            );
            currentPage = 1;
            renderProducts();
          });
          subList.appendChild(subLi);
        });
      });

      categoriesList.appendChild(li);
      categoriesList.appendChild(subList);
    });
  }

  function renderProducts() {
    productList.innerHTML = "";
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const currentProducts = filteredProducts.slice(start, end);

    if (currentProducts.length === 0) {
      productList.innerHTML = "<p>No products found.</p>";
      pagination.innerHTML = "";
      return;
    }

    currentProducts.forEach(prod => {
      const card = document.createElement("div");
      card.className = "product-card";
      card.innerHTML = `
        <img src="${prod.image}" alt="${prod.title}">
        <h4>${prod.title}</h4>
        <p>₹${prod.price}</p>
      `;
      productList.appendChild(card);
    });

    renderPagination();
  }

  function renderPagination() {
    const totalPages = Math.ceil(filteredProducts.length / PAGE_SIZE);
    pagination.innerHTML = "";
    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement("button");
      btn.textContent = i;
      if (i === currentPage) btn.disabled = true;
      btn.addEventListener("click", () => {
        currentPage = i;
        renderProducts();
      });
      pagination.appendChild(btn);
    }
  }

  async function fetchCategories() {
    const res = await fetch(`${BASE_URL}/categories`);
    const data = await res.json();
    return data.documents || [];
  }

  async function fetchSubcategories(catId) {
    const res = await fetch(`${BASE_URL}/subcategories`);
    const data = await res.json();
    return (data.documents || []).filter(sub => sub.fields.parentCatId.stringValue === catId);
  }

  async function fetchAllProducts() {
    const res = await fetch(`${BASE_URL}/products`);
    const data = await res.json();
    return (data.documents || []).map(doc => ({
      catId: doc.fields.catId.stringValue,
      subCatId: doc.fields.subCatId.stringValue,
      title: doc.fields.title.stringValue,
      price: doc.fields.price.integerValue || doc.fields.price.doubleValue,
      image: doc.fields.imageUrl.stringValue
    }));
  }
});
