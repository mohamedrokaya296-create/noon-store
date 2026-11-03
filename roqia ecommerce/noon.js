// ==========================================
// 1. STORAGE HELPER (Centralized LocalStorage)
// ==========================================
const Storage = {
    get: (key) => {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error("Error reading key from LocalStorage:", key, e);
            return [];
        }
    },
    set: (key, data) => {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.error("Error saving key to LocalStorage:", key, e);
        }
    },
};

// Global state
let products = [];
let currentProduct = null;

// ==========================================
// 2. DOM CONTENT LOADED (Router)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("productsContainer")) {
        initProductsPage();
    }
    if (document.getElementById("mainImage")) {
        initProductDetailsPage();
    }
    if (document.getElementById("wishlistContainer")) {
        displayWishlist();
    }
    if (document.getElementById("cartProducts")) {
        displayCart();
    }
    if (document.getElementById("signupForm")) {
        initSignup();
    }
    if (document.getElementById("signinForm")) {
        initSignin();
    }
});

// ==========================================
// 3. HOME / PRODUCTS PAGE LOGIC
// ==========================================
function initProductsPage() {
    const productsContainer = document.getElementById("productsContainer");
    const searchInput = document.getElementById("searchInput");

    fetch("https://dummyjson.com/products?limit=20")
        .then((response) => {
            if (!response.ok) throw new Error("Network response was not ok");
            return response.json();
        })
        .then((data) => {
            products = data.products;
            displayProducts(products);
        })
        .catch((error) => {
            console.error("Fetch error:", error);
            if (productsContainer) {
                productsContainer.innerHTML = `<p>Failed to load products. Please try again.</p>`;
            }
        });

    if (searchInput) {
        searchInput.addEventListener("input", searchProducts);
    }
}

function displayProducts(items) {
    const productsContainer = document.getElementById("productsContainer");
    if (!productsContainer) return;

    productsContainer.innerHTML = "";

    if (items.length === 0) {
        productsContainer.innerHTML = "<p>No products found.</p>";
        return;
    }

    items.forEach((product) => {
        const oldPrice = Math.round(
            product.price / (1 - product.discountPercentage / 100)
        );

        const productCard = document.createElement("div");
        productCard.className = "product-card";

        productCard.innerHTML = `
            <div class="product-image">
                <a href="product-details.html?id=${product.id}">
                    <img src="${product.thumbnail}" alt="${product.title}">
                </a>
                <span class="discount">-${Math.round(product.discountPercentage)}%</span>
                <button class="wishlist-btn">♡</button>
            </div>
            <div class="product-info">
                <span class="brand">${product.brand || "Generic"}</span>
                <h3>
                    <a href="product-details.html?id=${product.id}" style="text-decoration: none; color: inherit;">
                        ${product.title}
                    </a>
                </h3>
                <div class="rating">⭐ ${product.rating}</div>
                <div class="price">
                    <strong>$${product.price}</strong>
                    <span style="text-decoration: line-through; color: #888;">$${oldPrice}</span>
                </div>
                <button class="add-cart-btn">🛒 Add to Cart</button>
            </div>
        `;

        productCard
            .querySelector(".wishlist-btn")
            .addEventListener("click", () => addToWishlistById(product.id));

        productCard
            .querySelector(".add-cart-btn")
            .addEventListener("click", () => addToCartById(product.id));

        productsContainer.appendChild(productCard);
    });
}

function searchProducts() {
    const searchInput = document.getElementById("searchInput");
    if (!searchInput) return;

    const searchValue = searchInput.value.toLowerCase().trim();
    const filteredProducts = products.filter((product) =>
        product.title.toLowerCase().includes(searchValue)
    );

    displayProducts(filteredProducts);
}

// ==========================================
// 4. PRODUCT DETAILS PAGE LOGIC
// ==========================================
function initProductDetailsPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get("id");

    if (!productId) {
        window.location.href = "index.html";
        return;
    }

    fetch(`https://dummyjson.com/products/${productId}`)
        .then((res) => {
            if (!res.ok) throw new Error("Product not found");
            return res.json();
        })
        .then((product) => {
            currentProduct = product;
            renderProductDetails(product);
        })
        .catch((err) => console.error("Error loading product details:", err));
}

function renderProductDetails(product) {
    const mainImage = document.getElementById("mainImage");
    const titleEl = document.getElementById("productTitle");
    const priceEl = document.getElementById("productPrice");
    const descEl = document.getElementById("productDescription");
    const ratingEl = document.getElementById("productRating");
    const brandEl = document.getElementById("productBrand");

    if (mainImage) mainImage.src = product.thumbnail;
    if (titleEl) titleEl.innerText = product.title;
    if (priceEl) priceEl.innerText = "$" + product.price;
    if (descEl) descEl.innerText = product.description;
    if (ratingEl) ratingEl.innerText = "⭐ " + product.rating;
    if (brandEl) brandEl.innerText = product.brand || "Generic";

    if (product.images && product.images.length > 0) {
        displayImages(product.images);
    }
}

function displayImages(images) {
    const thumbnails = document.getElementById("thumbnails");
    const mainImage = document.getElementById("mainImage");
    if (!thumbnails || !mainImage) return;

    thumbnails.innerHTML = "";

    images.forEach((image, index) => {
        const thumbnail = document.createElement("div");
        thumbnail.className = "thumbnail";
        if (index === 0) thumbnail.classList.add("active");

        thumbnail.innerHTML = `<img src="${image}" alt="Product thumbnail">`;

        thumbnail.onclick = function () {
            mainImage.src = image;
            document
                .querySelectorAll(".thumbnail")
                .forEach((item) => item.classList.remove("active"));
            thumbnail.classList.add("active");
        };

        thumbnails.appendChild(thumbnail);
    });
}

// ==========================================
// 5. ADD TO CART & WISHLIST HANDLERS
// ==========================================
function addToCartById(id) {
    const product = products.find((p) => p.id === id) || currentProduct;
    if (!product) return;

    const cart = Storage.get("cart");
    const existingIndex = cart.findIndex((item) => item.id === product.id);

    if (existingIndex > -1) {
        cart[existingIndex].quantity = (cart[existingIndex].quantity || 1) + 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    Storage.set("cart", cart);
    alert("Product added to cart 🛒");
}

function addToWishlistById(id) {
    const product = products.find((p) => p.id === id) || currentProduct;
    if (!product) return;

    const wishlist = Storage.get("wishlist");
    const exists = wishlist.some((item) => item.id === product.id);

    if (exists) {
        alert("Product already in wishlist ❤️");
        return;
    }

    wishlist.push(product);
    Storage.set("wishlist", wishlist);
    alert("Product added to wishlist ❤️");
}

// ==========================================
// 6. WISHLIST PAGE LOGIC
// ==========================================
function displayWishlist() {
    const wishlistContainer = document.getElementById("wishlistContainer");
    if (!wishlistContainer) return;

    const wishlist = Storage.get("wishlist");
    wishlistContainer.innerHTML = "";

    if (wishlist.length === 0) {
        wishlistContainer.innerHTML = `
            <div class="empty">
                <div class="empty-icon">❤️</div>
                <h2>Your Wishlist is Empty</h2>
                <p>Save your favorite products here.</p>
                <a href="index.html">Start Shopping</a>
            </div>
        `;
        return;
    }

    wishlist.forEach((product) => {
        const productCard = document.createElement("div");
        productCard.className = "product-card";

        productCard.innerHTML = `
            <div class="product-image">
                <img src="${product.thumbnail}" alt="${product.title}">
                <button class="remove-btn">🗑️</button>
            </div>
            <div class="product-info">
                <span class="brand">${product.brand || "Generic"}</span>
                <h3>${product.title}</h3>
                <div class="rating">⭐ ${product.rating}</div>
                <div class="price">
                    <strong>$${product.price}</strong>
                </div>
                <button class="add-cart-btn">🛒 Add to Cart</button>
            </div>
        `;

        productCard
            .querySelector(".remove-btn")
            .addEventListener("click", () => removeFromWishlist(product.id));

        productCard
            .querySelector(".add-cart-btn")
            .addEventListener("click", () => addToCartFromWishlist(product.id));

        wishlistContainer.appendChild(productCard);
    });
}

function removeFromWishlist(id) {
    let wishlist = Storage.get("wishlist");
    wishlist = wishlist.filter((product) => product.id !== id);
    Storage.set("wishlist", wishlist);
    displayWishlist();
}

function addToCartFromWishlist(id) {
    const wishlist = Storage.get("wishlist");
    const cart = Storage.get("cart");
    const product = wishlist.find((p) => p.id === id);

    if (!product) return;

    const existingIndex = cart.findIndex((item) => item.id === id);
    if (existingIndex > -1) {
        alert("Product is already in your cart 🛒");
    } else {
        cart.push({ ...product, quantity: 1 });
        Storage.set("cart", cart);
        alert("Product added to cart 🛒");
    }
}

// ==========================================
// 7. CART PAGE & QUANTITY SYSTEM LOGIC
// ==========================================
function displayCart() {
    const cartProducts = document.getElementById("cartProducts");
    if (!cartProducts) return;

    const cart = Storage.get("cart");
    cartProducts.innerHTML = "";

    if (cart.length === 0) {
        cartProducts.innerHTML = `
            <div class="empty">
                <div class="empty-icon">🛒</div>
                <h2>Your Cart is Empty</h2>
                <p>Add some products to your cart.</p>
                <a href="index.html">Start Shopping</a>
            </div>
        `;
        updateSummary([]);
        return;
    }

    cart.forEach((product, index) => {
        const item = document.createElement("div");
        item.className = "cart-item";

        item.innerHTML = `
            <div class="cart-image">
                <img src="${product.thumbnail}" alt="${product.title}">
            </div>
            <div class="cart-info">
                <span class="brand">${product.brand || "Generic"}</span>
                <h3>${product.title}</h3>
                <div class="rating">⭐ ${product.rating}</div>
                <div class="cart-price">$${product.price}</div>
                <div class="quantity">
                    <button class="dec-btn">−</button>
                    <span>${product.quantity || 1}</span>
                    <button class="inc-btn">+</button>
                </div>
            </div>
            <button class="remove-btn">Remove</button>
        `;

        item.querySelector(".dec-btn").addEventListener("click", () => changeQuantity(index, -1));
        item.querySelector(".inc-btn").addEventListener("click", () => changeQuantity(index, 1));
        item.querySelector(".remove-btn").addEventListener("click", () => removeFromCart(index));

        cartProducts.appendChild(item);
    });

    updateSummary(cart);
}

function changeQuantity(index, delta) {
    const cart = Storage.get("cart");
    if (!cart[index]) return;

    cart[index].quantity = (cart[index].quantity || 1) + delta;

    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }

    Storage.set("cart", cart);
    displayCart();
}

function removeFromCart(index) {
    const cart = Storage.get("cart");
    cart.splice(index, 1);
    Storage.set("cart", cart);
    displayCart();
}

function updateSummary(cart) {
    const subtotalElement = document.getElementById("subtotal");
    const shippingElement = document.getElementById("shipping");
    const totalElement = document.getElementById("total");

    if (!subtotalElement || !shippingElement || !totalElement) return;

    const subtotal = cart.reduce(
        (acc, item) => acc + item.price * (item.quantity || 1),
        0
    );
    const shipping = subtotal > 0 ? 50 : 0;
    const total = subtotal + shipping;

    subtotalElement.innerText = "$" + subtotal.toFixed(2);
    shippingElement.innerText = "$" + shipping.toFixed(2);
    totalElement.innerText = "$" + total.toFixed(2);
}

// ==========================================
// 8. AUTHENTICATION LOGIC (SIGNUP & SIGNIN)
// ==========================================
function initSignup() {
    const signupForm = document.getElementById("signupForm");
    const errorEl = document.getElementById("error");

    if (!signupForm) return;

    signupForm.onsubmit = function (event) {
        event.preventDefault();

        const name = document.getElementById("name")?.value.trim();
        const email = document.getElementById("email")?.value.trim();
        const password = document.getElementById("password")?.value;
        const confirmPassword = document.getElementById("confirmPassword")?.value;

        if (errorEl) errorEl.innerHTML = "";

        if (!name || !email || !password || !confirmPassword) {
            if (errorEl) errorEl.innerHTML = "Please fill in all fields.";
            return;
        }

        if (password !== confirmPassword) {
            if (errorEl) errorEl.innerHTML = "Passwords do not match.";
            return;
        }

        if (password.length < 6) {
            if (errorEl) errorEl.innerHTML = "Password must be at least 6 characters.";
            return;
        }

        const user = { name, email, password };
        localStorage.setItem("user", JSON.stringify(user));

        alert("Account created successfully! 🎉");
        window.location.href = "signin.html";
    };
}

function initSignin() {
    const signinForm = document.getElementById("signinForm");
    const errorEl = document.getElementById("error");

    if (!signinForm) return;

    signinForm.onsubmit = function (event) {
        event.preventDefault();

        const email = document.getElementById("email")?.value.trim();
        const password = document.getElementById("password")?.value;

        if (errorEl) errorEl.innerHTML = "";

        if (!email || !password) {
            if (errorEl) errorEl.innerHTML = "Please enter your email and password.";
            return;
        }

        const user = JSON.parse(localStorage.getItem("user"));

        if (!user) {
            if (errorEl) errorEl.innerHTML = "No account found. Please Sign Up first.";
            return;
        }

        if (email === user.email && password === user.password) {
            localStorage.setItem("isLoggedIn", "true");
            alert("Welcome back, " + user.name + " 🎉");
            window.location.href = "index.html";
        } else {
            if (errorEl) errorEl.innerHTML = "Incorrect email or password.";
        }
    };
}