const API_KEY = "AIzaSyDx3LbqE6byaBLkQPs_srsmfvMoJI_1db0";
const PROJECT_ID = "firestore-demo-4daa4";
const CLIENT_ID = "84889073913-89jmfbdpj75t9p4pv0rigljne6oc5rp2.apps.googleusercontent.com"; 
const REDIRECT_URI = "http://127.0.0.1:5500/"; 

async function signup() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

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

  alert("Signup successful. UID: " + data.localId);
  createUserDocument(data.localId, data.idToken, email, "user");
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
  alert("Login successful. UID: " + data.localId);
}

document.getElementById("googleBtn").addEventListener("click", async () => {
  const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=token&scope=email%20profile`;
  const popup = window.open(oauthUrl, "googleLogin", "width=500,height=600");
  const pollTimer = setInterval(async function() {
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
        alert("Google login UID: " + data.localId);
        createUserDocument(data.localId, data.idToken, data.email, "user");
      }
    } catch (err) {
      
    }
  }, 500);
});

async function createUserDocument(uid, idToken, email, role) {
  const res = await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users?documentId=${uid}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${idToken}`
    },
    body: JSON.stringify({
      fields: {
        uid: { stringValue: uid },
        email: { stringValue: email },
        role: { stringValue: role },
        createdAt: { timestampValue: new Date().toISOString() }
      }
    })
  });
  const data = await res.json();
  console.log("Firestore user created:", data);
}
