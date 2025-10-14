async function signup() {
  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;

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
}

async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

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
  document.getElementById("loginForm").style.display = "none";
  document.getElementById("signupForm").style.display = "none";
  document.getElementById("homepage").style.display = "block";

  const heading = document.querySelector("#homepage h2");
  if (heading) heading.textContent = `Welcome, ${email}`;
}

function logout() {
  document.getElementById("homepage").style.display = "none";
  document.getElementById("loginForm").style.display = "block";
  document.getElementById("signupForm").style.display = "none";
}

function viewCart() {
  alert("Cart clicked! Implement cart view here.");
}

function viewWishlist() {
  alert("Wishlist clicked! Implement wishlist view here.");
}

window.signup = signup;
window.login = login;
window.googleLogin = googleLogin;
window.showMessage = showMessage;
window.showHomePage = showHomePage;
window.logout = logout;
window.viewCart = viewCart;
window.viewWishlist = viewWishlist;
