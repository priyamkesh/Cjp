import { db } from "./firebase.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const REPO = "cjpproducts/cjpproducts.github.io";
const grid = document.getElementById("products");
const cartBtn = document.getElementById("cartBtn");
const cartDrawer = document.getElementById("cartDrawer");
const cartItemsEl = document.getElementById("cartItems");
const cartCount = document.getElementById("cartCount");
const subtotalEl = document.getElementById("subtotal");
const checkoutBtn = document.getElementById("checkoutBtn");
const checkoutModal = document.getElementById("checkoutModal");

let PRODUCTS = [];
let CART = JSON.parse(localStorage.getItem("cjp_cart")||"[]");

function saveCart(){ localStorage.setItem("cjp_cart", JSON.stringify(CART)); updateCartUI(); }
function updateCartUI(){
  cartCount.textContent = CART.reduce((s,i)=>s+i.qty,0);
  cartItemsEl.innerHTML = "";
  let total = 0;
  CART.forEach((it,idx)=>{
    total += it.price * it.qty;
    const div = document.createElement("div");
    div.className="cart-item";
    div.innerHTML = `<img src="${it.image}" alt=""><div style="flex:1"><div>${it.title}</div><div class="muted">${it.size} · ₹${it.price}</div><div class="qty"><button data-dec="${idx}">-</button><span>${it.qty}</span><button data-inc="${idx}">+</button><button data-del="${idx}" style="margin-left:auto">Remove</button></div></div>`;
    cartItemsEl.appendChild(div);
  });
  subtotalEl.textContent = "₹"+total;
  checkoutBtn.disabled = CART.length===0;
}
cartItemsEl.addEventListener("click", e=>{
  const dec = e.target.getAttribute("data-dec");
  const inc = e.target.getAttribute("data-inc");
  const del = e.target.getAttribute("data-del");
  if(dec!==null){ CART[dec].qty = Math.max(1, CART[dec].qty-1); saveCart(); }
  if(inc!==null){ CART[inc].qty++; saveCart(); }
  if(del!==null){ CART.splice(del,1); saveCart(); }
});

cartBtn.onclick = ()=> cartDrawer.classList.toggle("open");
document.getElementById("closeCart").onclick = ()=> cartDrawer.classList.remove("open");

function parseIssue(issue){
  const body = issue.body || "";
  const get = (label)=>{
    const re = new RegExp(`###\s*${label}[\s\S]*?\n([\s\S]*?)(?=\n###|$)`, "i");
    const m = body.match(re);
    return m ? m[1].trim() : "";
  };
  const title = (body.match(/###\s*Product Title\s*
([\s\S]*?)(?=
###|$)/i)?.[1] || issue.title.replace("[PRODUCT]:","")).trim();
  const desc = get("Description");
  const sizesRaw = get("Sizes and Prices");
  const category = get("Category");
  const images = [];
  const imgRe = /!\[.*?\]\((https?:\/\/[^)]+)\)/g;
  let m; while((m=imgRe.exec(body))!==null){ images.push(m[1]); }
  // also parse images section plain urls
  get("Images").split("
").forEach(l=>{ const u=l.match(/https?:\/\/\S+/); if(u) images.push(u[0]); });

  const sizes = sizesRaw.split("
").map(l=>l.trim()).filter(l=>l.includes(":")).map(l=>{
    const [s,p] = l.split(":");
    return { size:s.trim().toUpperCase(), price: parseInt(p.replace(/[^0-9]/g,""))||0 };
  });

  return {
    id: issue.number,
    title,
    desc,
    category,
    images: images.length? images : ["https://via.placeholder.com/600?text=CJP"],
    sizes: sizes.length? sizes : [{size:"OS", price:0}]
  };
}

async function loadProducts(){
  grid.innerHTML = "<p class='muted'>Loading products from GitHub Issues...</p>";
  try{
    const res = await fetch(`https://api.github.com/repos/${REPO}/issues?state=open&per_page=100`);
    const issues = await res.json();
    PRODUCTS = issues.filter(i=>!i.pull_request && (i.labels.some(l=>l.name.toLowerCase()==="product") || i.title.includes("[PRODUCT]"))).map(parseIssue);
    renderProducts();
  }catch(e){
    grid.innerHTML = "<p>Failed to load products. Make sure repo is public.</p>";
    console.error(e);
  }
}

function renderProducts(){
  grid.innerHTML="";
  PRODUCTS.forEach(p=>{
    const activeSize = p.sizes[0];
    const card = document.createElement("div");
    card.className="card";
    card.innerHTML = `
      <img src="${p.images[0]}" alt="${p.title}">
      <div class="p">
        <div style="display:flex;justify-content:space-between;gap:8px"><strong>${p.title}</strong><span class="badge">${p.category||"Merch"}</span></div>
        <div class="muted" style="margin:6px 0 8px">${p.desc.slice(0,80)}${p.desc.length>80?"...":""}</div>
        <div class="sizes" data-id="${p.id}"></div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px">
          <div class="price" id="price-${p.id}">₹${activeSize.price}</div>
          <button class="btn" data-add="${p.id}">Add to Cart</button>
        </div>
      </div>`;
    grid.appendChild(card);
    const sizesEl = card.querySelector(".sizes");
    p.sizes.forEach((sz,idx)=>{
      const b = document.createElement("button");
      b.className="size-btn"+(idx===0?" active":"");
      b.textContent = `${sz.size}`;
      b.onclick = ()=>{
        sizesEl.querySelectorAll(".size-btn").forEach(x=>x.classList.remove("active"));
        b.classList.add("active");
        card.querySelector(`#price-${p.id}`).textContent = "₹"+sz.price;
        card.dataset.size = sz.size;
        card.dataset.price = sz.price;
      };
      sizesEl.appendChild(b);
    });
    card.dataset.size = activeSize.size;
    card.dataset.price = activeSize.price;
    card.querySelector("[data-add]").onclick = ()=>{
      const size = card.dataset.size;
      const price = parseInt(card.dataset.price);
      const existing = CART.find(i=>i.id===p.id && i.size===size);
      if(existing) existing.qty++; else CART.push({id:p.id,title:p.title,size,price,qty:1,image:p.images[0]});
      saveCart(); cartDrawer.classList.add("open");
    };
  });
}

checkoutBtn.onclick = ()=>{ document.getElementById("checkoutModal").classList.add("open"); };

document.getElementById("placeOrder").onclick = async ()=>{
  const data = {
    name: val("c_name"), phone: val("c_phone"), whatsapp: val("c_whatsapp"),
    address: val("c_address"), pincode: val("c_pincode"),
    items: CART, total: CART.reduce((s,i)=>s+i.price*i.qty,0),
    payment: document.querySelector('input[name="pay"]:checked').value,
    createdAt: serverTimestamp(), status:"PLACED"
  };
  if(!data.name || !data.phone || !data.address){ alert("Fill required fields"); return; }
  try{
    await addDoc(collection(db,"orders"), data);
    CART=[]; saveCart(); checkoutModal.classList.remove("open");
    alert("Order placed! Cash on Delivery confirmed.");
    if(data.payment==="prepaid"){ window.open(`https://wa.me/${918345890843}?text=${encodeURIComponent("Hi CJP, I want to prepay for order: "+data.name)}`,"_blank"); }
  }catch(e){ console.error(e); alert("Failed to place order"); }
};
function val(id){ return document.getElementById(id).value.trim(); }

updateCartUI();
loadProducts();
