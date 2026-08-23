fetch("http://localhost:3000/api/vr-admin", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ action: "test" })
})
.then(async res => {
  console.log("Status:", res.status);
  console.log("Body:", await res.text());
})
.catch(console.error);
