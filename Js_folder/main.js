document.addEventListener("DOMContentLoaded", async () => {
  const categoriesList = document.getElementById("categoriesList");
  const productsContainer = document.getElementById("productsContainer");

  const categories = await fetchCategories();

  categories.forEach(cat => {
    const catLi = document.createElement("li");
    catLi.className = "category-item";
    catLi.textContent = cat.name;
    catLi.style.cursor = "pointer";

    const subUl = document.createElement("ul");
    subUl.style.display = "none";
    subUl.style.paddingLeft = "15px";

    catLi.addEventListener("click", async () => {
      subUl.style.display = subUl.style.display === "none" ? "block" : "none";

      if (subUl.childElementCount === 0) {
        const subcategories = await fetchSubcategories(cat.catId);
        subcategories.forEach(sub => {
          const subLi = document.createElement("li");
          subLi.textContent = sub.name;
          subLi.style.cursor = "pointer";
          subLi.addEventListener("click", async (e) => {
            e.stopPropagation();
            const products = await fetchProducts(sub.subCatId);
            renderProducts(products);
          });
          subUl.appendChild(subLi);
        });
      }
    });

    catLi.appendChild(subUl);
    categoriesList.appendChild(catLi);
  });

  function renderProducts(products) {
    productsContainer.innerHTML = "";
    if (!products.length) {
      productsContainer.innerHTML = "<p>No products found.</p>";
      return;
    }
    products.forEach(prod => {
      const card = document.createElement("div");
      card.className = "product-card";
      card.innerHTML = `
        <img src="${prod.image}" alt="${prod.title}">
        <h4>${prod.title}</h4>
        <p>₹${prod.price}</p>
      `;
      productsContainer.appendChild(card);
    });
  }

  async function fetchCategories() {
    const res = await fetch(`${window.BASE_URL}/categories`);
    const data = await res.json();
    return (data.documents || []).map(doc => ({
      catId: doc.fields.catId.stringValue,
      name: doc.fields.name.stringValue
    }));
  }

  async function fetchSubcategories(catId) {
    const res = await fetch(`${window.BASE_URL}/subcategories`);
    const data = await res.json();
    return (data.documents || [])
      .filter(doc => doc.fields.parentCatId.stringValue === catId)
      .map(doc => ({
        subCatId: doc.fields.subCatId.stringValue,
        name: doc.fields.name.stringValue
      }));
  }

  async function fetchProducts(subCatId) {
    const res = await fetch(`${window.BASE_URL}/products`);
    const data = await res.json();
    return (data.documents || [])
      .filter(doc => doc.fields.subCatId.stringValue === subCatId)
      .map(doc => ({
        title: doc.fields.title.stringValue,
        price: doc.fields.price.integerValue || doc.fields.price.doubleValue,
        image: doc.fields.imageUrl.stringValue
      }));
  }
});
