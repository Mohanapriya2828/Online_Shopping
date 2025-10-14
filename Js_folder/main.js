document.addEventListener("DOMContentLoaded", async () => {
    const sidebar = document.getElementById("sidebar");
    const productList = document.getElementById("productList");

    async function fetchCategories() {
        try {
            const res = await fetch(`${window.BASE_URL}/categories`);
            const data = await res.json();
            console.log("Categories:", data);
            return data.documents || [];
        } catch (err) {
            console.error("Error fetching categories:", err);
            return [];
        }
    }

    async function fetchSubcategories(catId) {
        try {
            const res = await fetch(`${window.BASE_URL}/subcategories`);
            const data = await res.json();
            const docs = data.documents || [];
            return docs.filter(doc => doc.fields.parentCatId.stringValue === catId && doc.fields.isActive.booleanValue);
        } catch (err) {
            console.error("Error fetching subcategories:", err);
            return [];
        }
    }

    async function fetchProducts(subCatId) {
        try {
            const res = await fetch(`${window.BASE_URL}/products`);
            const data = await res.json();
            const docs = data.documents || [];
            return docs.filter(doc => doc.fields.subCatId.stringValue === subCatId && doc.fields.isActive.booleanValue);
        } catch (err) {
            console.error("Error fetching products:", err);
            return [];
        }
    }

    function renderProducts(products) {
        productList.innerHTML = "";
        if (!products.length) {
            productList.innerHTML = "<p>No products found</p>";
            return;
        }
        products.forEach(prod => {
            const f = prod.fields;
            const div = document.createElement("div");
            div.className = "product-card";
            div.innerHTML = `
                <img src="${f.imageUrl?.stringValue || 'https://via.placeholder.com/150'}" alt="${f.title?.stringValue}">
                <h4>${f.title?.stringValue}</h4>
                <p>Price: ₹${f.price?.integerValue || f.price?.doubleValue || 0}</p>
                <p>Rating: ${f.averageRating?.doubleValue || 0} ⭐ (${f.reviewCount?.integerValue || 0})</p>
            `;
            productList.appendChild(div);
        });
    }

    async function renderSidebar() {
        const categories = await fetchCategories();
        sidebar.innerHTML = "";

        if (!categories.length) {
            sidebar.innerHTML = "<p>No categories found</p>";
            return;
        }

        for (let cat of categories) {
            if (!cat.fields.isActive.booleanValue) continue;

            const catDiv = document.createElement("div");
            catDiv.className = "category";
            catDiv.innerHTML = `<h3>${cat.fields.name.stringValue}</h3>`;

            const subList = document.createElement("ul");
            const subcategories = await fetchSubcategories(cat.fields.catId.stringValue);

            if (!subcategories.length) {
                subList.innerHTML = "<li>No subcategories</li>";
            } else {
                subcategories.forEach(sub => {
                    const li = document.createElement("li");
                    li.textContent = sub.fields.name.stringValue;
                    li.style.cursor = "pointer";
                    li.addEventListener("click", () => renderProductsForSub(sub.fields.subCatId.stringValue));
                    subList.appendChild(li);
                });
            }

            catDiv.appendChild(subList);
            sidebar.appendChild(catDiv);
        }
    }

    async function renderProductsForSub(subCatId) {
        const products = await fetchProducts(subCatId);
        renderProducts(products);
    }
    await renderSidebar();

});
