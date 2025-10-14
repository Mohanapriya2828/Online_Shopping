function showHomePage(email) {
    document.getElementById("authSection").style.display = "none";
    document.getElementById("homeSection").style.display = "block";
}

function logout() {
    document.getElementById("homeSection").style.display = "none";
    document.getElementById("authSection").style.display = "block";
}

document.getElementById("logoutBtn").addEventListener("click", logout);
document.getElementById("cartBtn").addEventListener("click", () => alert("Cart clicked!"));
document.getElementById("wishlistBtn").addEventListener("click", () => alert("Wishlist clicked!"));

window.showHomePage = showHomePage;
window.logout = logout;
