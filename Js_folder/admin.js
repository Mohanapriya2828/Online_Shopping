document.addEventListener("DOMContentLoaded", () => {
  const addProductBtn = document.getElementById("addProductBtn");
  const productFormContainer = document.getElementById("productFormContainer");
  const productForm = document.getElementById("productForm");
  const productListContainer = document.getElementById("adminProductList");

  if (addProductBtn) {
    addProductBtn.addEventListener("click", () => {
      productFormContainer.style.display = "block";
    });
  }

  if (productForm) {
    productForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!window.userToken) {
        alert("Unauthorized! Please login first.");
        return;
      }

      const product = {
        fields: {
          productId: { stringValue: document.getElementById("productId").value },
          title: { stringValue: document.getElementById("title").value },
          description: { stringValue: document.getElementById("description").value },
          price: { integerValue: parseInt(document.getElementById("price").value) },
          qty: { integerValue: parseInt(document.getElementById("qty").value) },
          subCatId: { stringValue: document.getElementById("subCatId").value },
          catId: { stringValue: document.getElementById("catId").value },
          imageUrl: { stringValue: document.getElementById("imageUrl").value },
          isActive: { booleanValue: document.getElementById("isActive").checked },
          reviewCount: { integerValue: parseInt(document.getElementById("reviewCount").value) },
          createdAt: { timestampValue: new Date().toISOString() },
          updatedAt: { timestampValue: new Date().toISOString() }
        }
      };

      try {
        const res = await fetch(`https://firestore.googleapis.com/v1/projects/firestore-demo-4daa4/databases/(default)/documents/products?documentId=${product.fields.productId.stringValue}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${window.userToken}`
          },
          body: JSON.stringify(product)
        });
        const data = await res.json();
        if (data.error) throw data.error;
        alert("Product added successfully!");
        productForm.reset();
        productFormContainer.style.display = "none";
        fetchProducts();
      } catch (err) {
        console.error(err);
        alert("Failed to add product.");
      }
    });
  }

  async function fetchProducts() {
    if (!window.userToken) return;
    try {
      const res = await fetch(`https://firestore.googleapis.com/v1/projects/firestore-demo-4daa4/databases/(default)/documents/products`, {
        headers: { Authorization: `Bearer ${window.userToken}` }
      });
      const data = await res.json();
      if (!data.documents) return;
      renderProducts(data.documents);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch products.");
    }
  }

  function renderProducts(products) {
    productListContainer.innerHTML = "";
    products.forEach((doc) => {
      const p = doc.fields;
      const div = document.createElement("div");
      div.className = "product-item";
      div.innerHTML = `
        <h4>${p.title.stringValue} (ID: ${p.productId.stringValue})</h4>
        <p>${p.description.stringValue}</p>
        <p>Price: ₹${p.price.integerValue} | Qty: ${p.qty.integerValue}</p>
        <p>Category: ${p.catId.stringValue} | SubCategory: ${p.subCatId.stringValue}</p>
        <p>Active: ${p.isActive.booleanValue} | Reviews: ${p.reviewCount.integerValue}</p>
        <img src="${p.imageUrl.stringValue}" width="100"/>
        <button class="editBtn">Edit</button>
        <button class="deleteBtn">Delete</button>
      `;
      div.querySelector(".editBtn").addEventListener("click", () => editProduct(doc.name, p));
      div.querySelector(".deleteBtn").addEventListener("click", () => deleteProduct(doc.name));
      productListContainer.appendChild(div);
    });
  }

  async function editProduct(docName, fields) {
    if (!window.userToken) return;
    const newTitle = prompt("Enter new title:", fields.title.stringValue);
    if (!newTitle) return;
    const updatePayload = { fields: { ...fields, title: { stringValue: newTitle }, updatedAt: { timestampValue: new Date().toISOString() } } };
    try {
      const res = await fetch(`https://firestore.googleapis.com/v1/${docName}?updateMask.fieldPaths=title&updateMask.fieldPaths=updatedAt`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${window.userToken}` },
        body: JSON.stringify(updatePayload)
      });
      const data = await res.json();
      if (data.error) throw data.error;
      alert("Product updated!");
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert("Failed to update product.");
    }
  }

  async function deleteProduct(docName) {
    if (!window.userToken) return;
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await fetch(`https://firestore.googleapis.com/v1/${docName}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${window.userToken}` }
      });
      alert("Product deleted!");
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert("Failed to delete product.");
    }
  }

  fetchProducts();
});
