let userToken = null;
let currentUserId = null;


async function signup() {
  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;
  try {
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({email, password, returnSecureToken:true})
    });
    const data = await res.json();
    if(data.error) throw data.error;
    userToken = data.idToken;
    currentUserId = data.localId;
    window.currentUserId = currentUserId;
    window.userToken = userToken;
    showHomePage(email);
  } catch(err) {
    alert("Signup failed: " + err.message || err.message);
  }
}

async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  try {
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`, {
      method:"POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({email,password,returnSecureToken:true})
    });
    const data = await res.json();
    if(data.error) throw data.error;
    userToken = data.idToken;
    currentUserId = data.localId;
    window.currentUserId = currentUserId;
    window.userToken = userToken;
    showHomePage(email);
  } catch(err) {
    alert("Login failed: "+err.message||err.message);
  }
}

async function googleLogin() {
  const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=token&scope=email%20profile`;
  const popup = window.open(oauthUrl,"googleLogin","width=500,height=600");
  const pollTimer = setInterval(async function(){
    try{
      if(popup.location.hash){
        clearInterval(pollTimer);
        const hash = popup.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get("access_token");
        popup.close();
        if(!accessToken) throw new Error("No token");
        const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${API_KEY}`,{
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body: JSON.stringify({
            postBody: `access_token=${accessToken}&providerId=google.com`,
            requestUri: REDIRECT_URI,
            returnSecureToken:true
          })
        });
        const data = await res.json();
        if(data.error) throw data.error;
        userToken = data.idToken;
        currentUserId = data.localId;
        window.currentUserId = currentUserId;
        window.userToken = userToken;
        showHomePage(data.email);
      }
    } catch(err){ console.error(err); }
  }, 500);
}


function logout() {
  userToken = null;
  currentUserId = null;
  document.getElementById("homeSection").style.display="none";
  document.getElementById("authSection").style.display="block";
}

async function showHomePage(email){
  document.getElementById("authSection").style.display = "none";
  document.getElementById("homeSection").style.display = "block"; 

  try {
    const res = await fetch(`https://firestore.googleapis.com/v1/projects/firestore-demo-4daa4/databases/(default)/documents/users/${currentUserId}`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const data = await res.json();
    const role = data.fields.role.stringValue;

    if(role === "admin"){
      document.getElementById("adminSection").style.display = "block";
      if(document.getElementById("productList")) document.getElementById("productList").style.display = "none";
    } else {
      document.getElementById("adminSection").style.display = "none";
      renderSidebar();
    }
  } catch(err) {
    console.error("Error fetching user role:", err);
    alert("Failed to get user role.");
  }
}



document.addEventListener("DOMContentLoaded", ()=>{
  const loginBtn = document.getElementById("loginBtn");
  if(loginBtn) loginBtn.addEventListener("click", login);
  const signupBtn = document.getElementById("signupBtn");
  if(signupBtn) signupBtn.addEventListener("click", signup);
  const googleBtn = document.getElementById("googleBtn");
  if(googleBtn) googleBtn.addEventListener("click", googleLogin);
  const googleBtn2 = document.getElementById("googleBtn2");
  if(googleBtn2) googleBtn2.addEventListener("click", googleLogin);
  const logoutBtn = document.getElementById("logoutBtn");
  if(logoutBtn) logoutBtn.addEventListener("click", logout);

  const showSignup = document.getElementById("showSignup");
  if(showSignup) showSignup.addEventListener("click", ()=>{
    document.getElementById("loginForm").style.display="none";
    document.getElementById("signupForm").style.display="block";
  });
  const showLogin = document.getElementById("showLogin");
  if(showLogin) showLogin.addEventListener("click", ()=>{
    document.getElementById("signupForm").style.display="none";
    document.getElementById("loginForm").style.display="block";
  });
});

window.userToken = userToken;
window.currentUserId = currentUserId;
window.login = login;
window.signup = signup;
window.googleLogin = googleLogin;
window.logout = logout;
window.showHomePage = showHomePage;
