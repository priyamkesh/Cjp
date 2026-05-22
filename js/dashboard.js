import { auth, provider, db, ADMIN_EMAILS } from "./firebase.js";
import { signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const userInfo = document.getElementById("userInfo");
const ordersEl = document.getElementById("orders");

loginBtn.onclick = async ()=>{ await signInWithPopup(auth, provider); };
logoutBtn.onclick = ()=> signOut(auth);

onAuthStateChanged(auth, async (user)=>{
  if(!user){ userInfo.textContent="Not signed in"; ordersEl.innerHTML=""; loginBtn.style.display="inline-block"; logoutBtn.style.display="none"; return; }
  loginBtn.style.display="none"; logoutBtn.style.display="inline-block";
  userInfo.textContent = user.email;
  if(!ADMIN_EMAILS.includes(user.email)){ ordersEl.innerHTML="<p>Access denied. Not an admin.</p>"; return; }
  const q = query(collection(db,"orders"), orderBy("createdAt","desc"));
  const snap = await getDocs(q);
  ordersEl.innerHTML = "";
  snap.forEach(doc=>{
    const o = doc.data();
    const div = document.createElement("div");
    div.className="card"; div.style.padding="12px"; div.style.marginBottom="12px";
    div.innerHTML = `<strong>#${doc.id.slice(0,6)}</strong> · ${o.name} · ${o.phone} · ₹${o.total} · ${o.payment.toUpperCase()}<br><span class="muted">${o.address}, ${o.pincode} | WA: ${o.whatsapp}</span><div style="margin-top:8px">${o.items.map(i=>`${i.title} (${i.size}) x${i.qty}`).join(", ")}</div>`;
    ordersEl.appendChild(div);
  });
});
