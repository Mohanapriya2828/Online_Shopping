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
