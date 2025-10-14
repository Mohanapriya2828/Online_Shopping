async function signup() {
  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;

  try {
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true })
    });

    const data = await res.json();

    if (data.error) {
      alert("Signup failed: " + data.error.message);
      return;
    }

    createUserDocument(data.localId, data.idToken, email, "user");
    showMessage('signupMessage', 'Registration successful!');
    showHomePage(email);

  } catch (err) {
    console.error(err);
    alert("Signup error: " + err.message);
  }
}

async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true })
    });

    const data = await res.json();

    if (data.error) {
      alert("Login failed: " + data.error.message);
      return;
    }

    showMessage('loginMessage', 'Login successful!');
    showHomePage(email);

  } catch (err) {
    console.error(err);
    alert("Login error: " + err.message);
  }
}

async function googleLogin() {
  const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=token&scope=email%20profile`;
  const popup = window.open(oauthUrl, "googleLogin", "width=500,height=600");

  const pollTimer = setInterval(async function () {
    try {
      if (popup.location.hash) {
        clearInterval(pollTimer);
        const hash = popup.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get("access_token");
        popup.close();

        if (!accessToken) throw new Error("No access token found.");
        const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${API_KEY}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            postBody: `access_token=${accessToken}&providerId=google.com`,
            requestUri: REDIRECT_URI,
            returnSecureToken: true
          })
        });

        const data = await res.json();
        if (data.error) throw data.error;

        createUserDocument(data.localId, data.idToken, data.email, "user");
        showMessage('loginMessage', 'Login successful!');
        showHomePage(data.email);
      }
    } catch (err) {
      console.error(err);
    }
  }, 500);
}

function showMessage(elementId, message) {
  const msgEl = document.getElementById(elementId);
  if (msgEl) {
    msgEl.textContent = message;
    msgEl.style.color = "green";
  }
}

function showHomePage(email) {
  document.getElementById("authSection").style.display = "none";
  document.getElementById("homeSection").style.display = "block";
  const heading = document.getElementById("welcomeText");
  if (heading) heading.textContent = `Welcome, ${email}`;

  if (window.renderSidebar) window.renderSidebar();
}

function logout() {
  document.getElementById("homeSection").style.display = "none";
  document.getElementById("authSection").style.display = "block";
}

function viewCart() {
  alert("Cart clicked! Implement cart view here.");
}

function viewWishlist() {
  alert("Wishlist clicked! Implement wishlist view here.");
}

document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("loginBtn");
  if (loginBtn) loginBtn.addEventListener("click", login);

  const signupBtn = document.getElementById("signupBtn");
  if (signupBtn) signupBtn.addEventListener("click", signup);

  const googleBtn = document.getElementById("googleBtn");
  if (googleBtn) googleBtn.addEventListener("click", googleLogin);

  const googleBtn2 = document.getElementById("googleBtn2");
  if (googleBtn2) googleBtn2.addEventListener("click", googleLogin);

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) logoutBtn.addEventListener("click", logout);

  const showSignup = document.getElementById("showSignup");
  if (showSignup) showSignup.addEventListener("click", () => {
    document.getElementById("loginForm").style.display = "none";
    document.getElementById("signupForm").style.display = "block";
  });

  const showLogin = document.getElementById("showLogin");
  if (showLogin) showLogin.addEventListener("click", () => {
    document.getElementById("signupForm").style.display = "none";
    document.getElementById("loginForm").style.display = "block";
  });

  const cartBtn = document.getElementById("cartBtn");
  if (cartBtn) cartBtn.addEventListener("click", viewCart);

  const wishlistBtn = document.getElementById("wishlistBtn");
  if (wishlistBtn) wishlistBtn.addEventListener("click", viewWishlist);
});

window.signup = signup;
window.login = login;
window.googleLogin = googleLogin;
window.showMessage = showMessage;
window.showHomePage = showHomePage;
window.logout = logout;
window.viewCart = viewCart;
window.viewWishlist = viewWishlist;
