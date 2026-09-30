const KEY= {
	cart:"toyHavenCart", wishlist:"toyHavenWishlist", newsletter:"toyHavenNewsletter", feedback:"toyHavenFeedback", orders:"toyHavenOrders", account:"toyHavenAccount"
};
const money=n=>`LKR ${Number(n).toLocaleString("en-LK")}`;
function get(key, fallback=[]) {
	try {
		return JSON.parse(localStorage.getItem(key))??fallback
	}catch {
		return fallback
	}
}
function put(key, val) {
	localStorage.setItem(key, JSON.stringify(val))
}
function product(id) {
	return PRODUCTS.find(p=>p.id===Number(id))
}
function cart() {
	return get(KEY.cart)
}
function wishlist() {
	return get(KEY.wishlist)
}
function cartItems() {
	return cart().map(x=>( {
		...product(x.id), qty:x.qty
	})).filter(Boolean)
}
function total() {
	return cartItems().reduce((s, x)=>s+x.price*x.qty, 0)
}
function cartCount() {
	return cart().reduce((s, x)=>s+x.qty, 0)
}
function updateCounts() {
	document.querySelectorAll("[data-cart-count]").forEach(x=>x.textContent=cartCount());
	document.querySelectorAll("[data-wishlist-count]").forEach(x=>x.textContent=wishlist().length)
}
function art(p) {
	return `<div class="product-image"><img src="${p.image}" alt="${p.name}"></div>`
}
function card(p) {
	const liked=wishlist().some(x=>x.id===p.id);
	return `<article class="product-card"><div class="card-image">${art(p)}<span class="tag">${p.tag}</span><button class="heart ${liked?"liked":""}" data-wish="${p.id}" aria-label="${liked?"Remove":"Add"} ${p.name} ${liked?"from":"to"} collection">${liked?"♥":"♡"}</button></div><button class="product-detail" data-detail="${p.id}"><span>${p.category}</span><h3>${p.name}</h3><div><strong>${money(p.price)}</strong><small>View details →</small></div></button><button class="add-cart" data-add="${p.id}">Add to Cart +</button></article>`;
}
function bind(scope=document) {
	scope.querySelectorAll("[data-add]").forEach(b=>b.onclick=e=> {
		e.stopPropagation(); add(b.dataset.add)
	});
	scope.querySelectorAll("[data-wish]").forEach(b=>b.onclick=e=> {
		e.stopPropagation(); toggleWish(b.dataset.wish)
	});
	scope.querySelectorAll("[data-detail]").forEach(b=>b.onclick=()=>openModal(b.dataset.detail))
}
function add(id) {
	let c=cart(), i=c.find(x=>x.id===Number(id));
	i?i.qty++:c.push( {
		id:Number(id), qty:1
	});
	put(KEY.cart, c);
	updateCounts();
	toast("Added to cart! 🛒");
	renderCart();
	renderCheckout()
}
function change(id, d) {
	let c=cart(), i=c.find(x=>x.id===Number(id));
	if(!i)return;
	i.qty+=d;
	put(KEY.cart, c.filter(x=>x.qty>0));
	updateCounts();
	renderCart();
	renderCheckout()
}
function clearCart() {
	put(KEY.cart, []);
	updateCounts();
	renderCart();
	renderCheckout()
}
function toggleWish(id) {
	let w=wishlist(), i=w.findIndex(x=>x.id===Number(id));
	if(i>=0) {
		w.splice(i, 1);
		toast("Removed from collection.")
	}else {
		w.push( {
			id:Number(id), status:"Interested"
		});
		toast("Saved to your collection! 💛")
	}
	put(KEY.wishlist, w);
	updateCounts();
	renderProducts();
	renderWishlist()
}
function status(id, s) {
	let w=wishlist(), i=w.find(x=>x.id===Number(id));
	if(i)i.status=s;
	put(KEY.wishlist, w);
	renderWishlist()
}
function renderProducts() {
	const grid=document.getElementById("products-grid");
	if(!grid)return;
	const q=(document.getElementById("product-search")?.value||"").toLowerCase(), cat=document.querySelector(".filter.active")?.dataset.category||"All";
	const arr=PRODUCTS.filter(p=>(cat==="All"||p.category===cat)&&p.name.toLowerCase().includes(q));
	grid.innerHTML=arr.map(card).join("");
	document.getElementById("product-count").textContent=`${arr.length} ${arr.length===1?"product":"products"}`;
	document.getElementById("empty-products")?.classList.toggle("hidden", arr.length>0);
	bind(grid)
}
function renderHome() {
	const grid=document.getElementById("home-products");
	if(grid) {
		grid.innerHTML=PRODUCTS.slice(0, 4).map(card).join("");
		bind(grid)
	}
	renderFeaturedProduct();
}
function renderFeaturedProduct() {
	const host=document.getElementById("featured-product");
	if(!host)return;
	const start=new Date(new Date().getFullYear(), 0, 0);
	const day=Math.floor((new Date()-start)/86400000);
	const p=PRODUCTS[day % PRODUCTS.length];
	host.innerHTML=`<article class="featured-card"><div class="featured-art"><span class="featured-pill">PRODUCT OF THE DAY</span><img src="${p.image}" alt="${p.name}"></div><div class="featured-copy"><span class="kicker">${p.category}</span><h3>${p.name}</h3><p>${p.description}</p><div class="featured-meta"><strong>${money(p.price)}</strong><button class="yellow-btn" data-add="${p.id}">Add to Cart →</button></div></div></article>`;
	bind(host);
}
function openModal(id) {
	const p=product(id), m=document.getElementById("product-modal"), b=document.getElementById("modal-body");
	if(!p||!m)return;
	const liked=wishlist().some(x=>x.id===p.id);
	b.innerHTML=`<div class="modal-product"><img src="${p.image}" alt="${p.name}"><div><span class="kicker">${p.category}</span><h2>${p.name}</h2><p>${p.description}</p><strong class="modal-price">${money(p.price)}</strong><div class="modal-actions"><button class="yellow-btn" data-add="${p.id}">Add to Cart</button><button class="outline-btn" data-wish="${p.id}">${liked?"♥ Saved":"♡ Add to Collection"}</button></div></div></div>`;
	m.classList.add("open");
	m.setAttribute("aria-hidden", "false");
	bind(b)
}
function closeMod(m) {
	if(m) {
		m.classList.remove("open");
		m.setAttribute("aria-hidden", "true")
	}
}
function renderCart() {
	const wrap=document.getElementById("cart-items"), layout=document.getElementById("cart-layout"), empty=document.getElementById("cart-empty");
	if(!wrap)return;
	const items=cartItems(), none=!items.length;
	layout?.classList.toggle("hidden", none);
	empty?.classList.toggle("hidden", !none);
	if(none)return;
	wrap.innerHTML=items.map(x=>`<article class="cart-row">${art(x)}<div><span>${x.category}</span><h3>${x.name}</h3><strong>${money(x.price)}</strong></div><div class="quantity"><button data-q="${x.id}" data-d="-1">−</button><b>${x.qty}</b><button data-q="${x.id}" data-d="1">+</button></div><strong>${money(x.price*x.qty)}</strong></article>`).join("");
	wrap.querySelectorAll("[data-q]").forEach(b=>b.onclick=()=>change(b.dataset.q, Number(b.dataset.d)));
	document.getElementById("cart-summary").innerHTML=`<span class="kicker">ORDER SUMMARY</span><h2>Let's check that.</h2><div class="sum-line"><span>Items</span><b>${cartCount()}</b></div><div class="sum-line"><span>Delivery</span><b>Free</b></div><div class="sum-total"><span>Total</span><b>${money(total())}</b></div><a class="yellow-btn wide" href="checkout.html">Proceed to Checkout →</a><button class="outline-btn wide" id="clear-cart">Clear Cart</button>`;
	document.getElementById("clear-cart").onclick=clearCart
}
function renderCheckout() {
	const layout=document.getElementById("checkout-layout"), empty=document.getElementById("checkout-empty"), summary=document.getElementById("checkout-summary");
	if(!layout)return;
	const items=cartItems(), none=!items.length;
	layout.classList.toggle("hidden", none);
	empty?.classList.toggle("hidden", !none);
	if(none)return;
	summary.innerHTML=`<span class="kicker">ORDER SUMMARY</span><h2>Your picks</h2>${items.map(x=>`<div class="sum-line"><span>$ {
		x.name
	}
	× $ {
		x.qty
	}
	</span><b>$ {
		money(x.price*x.qty)
	}
	</b></div>`).join("")}<div class="sum-total"><span>Final Total</span><b>${money(total())}</b></div>`
}
function renderWishlist() {
	const grid=document.getElementById("wishlist-grid"), empty=document.getElementById("wishlist-empty");
	if(!grid)return;
	const active=document.querySelector(".collection-tab.active")?.dataset.status||"All";
	const arr=wishlist().map(x=>( {
		...product(x.id), status:x.status
	})).filter(Boolean).filter(x=>active==="All"||x.status===active);
	grid.innerHTML=arr.map(p=>`<div class="collection-item">${card(p)}<label class="status-select">Status <select data-status="${p.id}"><option ${p.status==="Interested"?"selected":""}>Interested</option><option ${p.status==="Owned"?"selected":""}>Owned</option><option ${p.status==="Not Interested"?"selected":""}>Not Interested</option></select></label></div>`).join("");
	const hasResults=arr.length>0;
	empty?.classList.toggle("hidden", hasResults);
	if(empty&&!hasResults) {
		empty.querySelector("h2").textContent=active==="All"?"Your collection is waiting.":`No ${active.toLowerCase()} items yet.`;
		empty.querySelector("p").textContent=active==="All"?"Tap the heart on a product to save it here.":"Save a product and give it a status to see it here."
	}
	bind(grid);
	grid.querySelectorAll("[data-status]").forEach(s=>s.onchange=()=>status(s.dataset.status, s.value))
}
function forms() {
	document.getElementById("home-newsletter")?.addEventListener("submit", e=> {
		e.preventDefault(); const f=e.currentTarget, email=f.querySelector("input").value.trim(), m=document.getElementById("home-newsletter-msg"); if(!validEmail(email)) {
			m.textContent="Please enter a valid email."; m.className="form-message error"; return
		}
		let a=get(KEY.newsletter); if(!a.includes(email))a.push(email); put(KEY.newsletter, a); m.textContent="You're on the list! 🎉"; m.className="form-message success"; f.reset()
	});
	document.getElementById("footer-newsletter")?.addEventListener("submit", e=> {
		e.preventDefault(); const f=e.currentTarget, email=f.querySelector("input").value.trim(), m=document.getElementById("footer-message"); if(!validEmail(email)) {
			m.textContent="Enter a valid email."; return
		}
		let a=get(KEY.newsletter); if(!a.includes(email))a.push(email); put(KEY.newsletter, a); m.textContent="Joined! 🎉"; f.reset()
	});
	document.getElementById("feedback-form")?.addEventListener("submit", e=> {
		e.preventDefault(); const f=e.currentTarget; if(!validate(f))return; const d=new FormData(f), a=get(KEY.feedback); a.push( {
			name:d.get("name"), email:d.get("email"), message:d.get("message"), date:new Date().toISOString()
		}); put(KEY.feedback, a); document.getElementById("feedback-success").textContent="Thanks! Your feedback was saved. 💌"; document.getElementById("feedback-success").className="form-message success"; f.reset()
	});
	document.getElementById("checkout-form")?.addEventListener("submit", e=> {
		e.preventDefault(); const f=e.currentTarget; if(!validate(f))return; const d=new FormData(f), orders=get(KEY.orders); orders.push( {
			id:"TH-"+Date.now(), name:d.get("fullName"), email:d.get("email"), address:d.get("address"), payment:d.get("payment"), items:cartItems(), total:total(), date:new Date().toISOString()
		}); put(KEY.orders, orders); clearCart(); const m=document.getElementById("success-modal"); m.classList.add("open"); m.setAttribute("aria-hidden", "false"); f.reset()
	});
	document.getElementById("auth-form")?.addEventListener("submit", e=> {
		e.preventDefault(); const f=e.currentTarget; if(!validate(f))return; const d=new FormData(f); put(KEY.account, {
			email:d.get("email"), name:d.get("name")||"Toy Haven Friend"
		}); const m=document.getElementById("auth-message"); m.textContent="Success! Welcome to Toy Haven. 🎉"; m.className="form-message success"; setTimeout(()=>location.href="index.html", 700)
	})
}
function validEmail(v) {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}
function validate(form) {
	let ok=true;
	form.querySelectorAll("input[required],textarea[required]").forEach(f=> {
		const e=f.parentElement.querySelector(".field-error"); let msg=""; if(!f.value.trim())msg="This field is required."; else if(f.type==="email"&&!validEmail(f.value))msg="Enter a valid email."; else if(f.minLength>0&&f.value.trim().length<f.minLength)msg=`Use at least ${f.minLength} characters.`; if(e)e.textContent=msg; f.classList.toggle("invalid", !!msg); if(msg)ok=false
	});
	return ok
}
function ui() {
	const ham=document.querySelector(".hamburger"), nav=document.querySelector(".nav-links");
	ham?.addEventListener("click", ()=> {
		const o=nav.classList.toggle("open"); ham.setAttribute("aria-expanded", o)
	});
	document.querySelectorAll("[data-close-modal]").forEach(x=>x.onclick=()=>closeMod(x.closest(".modal")));
	document.addEventListener("keydown", e=> {
		if(e.key==="Escape")document.querySelectorAll(".modal.open").forEach(closeMod)
	});
	document.querySelectorAll(".faq-question").forEach(b=>b.onclick=()=> {
		const open=b.closest("article").classList.toggle("open"); b.setAttribute("aria-expanded", open)
	});
	document.querySelectorAll(".filter").forEach(b=>b.onclick=()=> {
		document.querySelectorAll(".filter").forEach(x=>x.classList.remove("active")); b.classList.add("active"); renderProducts()
	});
	document.getElementById("product-search")?.addEventListener("input", renderProducts);
	document.getElementById("clear-filters")?.addEventListener("click", ()=> {
		document.getElementById("product-search").value=""; document.querySelectorAll(".filter").forEach(x=>x.classList.toggle("active", x.dataset.category==="All")); renderProducts()
	});
	document.querySelectorAll(".collection-tab").forEach(b=>b.onclick=()=> {
		document.querySelectorAll(".collection-tab").forEach(x=>x.classList.remove("active")); b.classList.add("active"); renderWishlist()
	});
	const category=new URLSearchParams(location.search).get("category");
	if(category) {
		const b=[...document.querySelectorAll(".filter")].find(x=>x.dataset.category===category);
		if(b) {
			document.querySelectorAll(".filter").forEach(x=>x.classList.remove("active"));
			b.classList.add("active")
		}
	}
	setupSlider()
}
function setupSlider() {
	const slides=[...document.querySelectorAll(".hero-slide")];
	if(!slides.length)return;
	const dots=document.querySelector(".slider-dots"), prev=document.querySelector(".prev"), next=document.querySelector(".next");
	let i=0;
	slides.forEach((_, n)=> {
		const b=document.createElement("button"); b.setAttribute("aria-label", `Show slide ${n+1}`); b.onclick=()=>show(n); dots?.appendChild(b)
	});
	function show(n) {
		i=(n+slides.length)%slides.length;
		slides.forEach((s, k)=>s.classList.toggle("active", k===i));
		dots?.querySelectorAll("button").forEach((b, k)=>b.classList.toggle("active", k===i))
	}
	prev?.addEventListener("click", ()=>show(i-1));
	next?.addEventListener("click", ()=>show(i+1));
	show(0);
	setInterval(()=>show(i+1), 5500)
}
function toast(t) {
	let x=document.getElementById("toast");
	if(!x) {
		x=document.createElement("div");
		x.id="toast";
		x.className="toast";
		document.body.appendChild(x)
	}
	x.textContent=t;
	x.classList.add("show");
	clearTimeout(window.tt);
	window.tt=setTimeout(()=>x.classList.remove("show"), 2200)
}
function setupReveal() {
	const items=document.querySelectorAll(".section-title,.product-card,.category-grid a,.newsletter,.quick-actions,.form-card,.summary,.cart-row,.faq-list article,.featured-card");
	if(!items.length)return;
	items.forEach(x=>x.classList.add("reveal"));
	if(!("IntersectionObserver"in window)) {
		items.forEach(x=>x.classList.add("visible"));
		return
	}
	const observer=new IntersectionObserver(entries=>entries.forEach(entry=> {
		if(entry.isIntersecting) {
			entry.target.classList.add("visible"); observer.unobserve(entry.target)
		}
	}), {
		threshold:.12
	});
	items.forEach(x=>observer.observe(x));
}
document.addEventListener("DOMContentLoaded", ()=> {
	updateCounts(); ui(); forms(); renderHome(); renderProducts(); renderCart(); renderCheckout(); renderWishlist(); setupReveal()
});
if("serviceWorker"in navigator)window.addEventListener("load", ()=>navigator.serviceWorker.register("sw.js").catch(()=> {
}));
