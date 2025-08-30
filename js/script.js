// Global variable to store all products
let products = [];

// --- UTILITY FUNCTIONS ---
function showToast(message) {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
    }, 100);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 500);
    }, 3000);
}

const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(price);
};

// --- PRODUCT & DATA FUNCTIONS ---
async function fetchProducts() {
    try {
        const res = await fetch("http://localhost:3000/api/products");
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        products = await res.json();
        return products;
    } catch (error) {
        console.error("Failed to fetch products:", error);
        return [];
    }
}

function displayProducts(productsToDisplay) {
    const productListContainer = document.getElementById('product-list');
    if (!productListContainer) return;

    if (productsToDisplay.length === 0) {
        productListContainer.innerHTML = '<p>No products found.</p>';
        return;
    }

    productListContainer.innerHTML = productsToDisplay.map(product => `
        <div class="product-card">
            <img src="${product.image}" alt="${product.name}" width="150">
            <h3>${product.name}</h3>
            <p>${formatPrice(product.price)}</p>
            <a href="product.html?id=${product.id}" class="btn">View</a>
            <button onclick="addToCart(${product.id})" class="btn">Add to Cart</button>
        </div>
    `).join('');
}

function filterAndSortProducts() {
    const filterDropdown = document.getElementById('category-filter');
    const sortDropdown = document.getElementById('sort-filter');
    const searchInput = document.getElementById('searchInput');

    let filteredProducts = products;
    let searchTerm = '';
    let selectedCategory = '';
    let sortOrder = 'default';

    if (searchInput) {
        searchTerm = searchInput.value.toLowerCase();
    }
    if (filterDropdown) {
        selectedCategory = filterDropdown.value;
    }
    if (sortDropdown) {
        sortOrder = sortDropdown.value;
    }

    if (searchTerm) {
        filteredProducts = filteredProducts.filter(product =>
            product.name.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm)
        );
    }
    
    if (selectedCategory !== 'all' && selectedCategory !== '') {
        filteredProducts = filteredProducts.filter(product => product.category === selectedCategory);
    }

    if (sortOrder === 'low-to-high') {
        filteredProducts.sort((a, b) => a.price - b.price);
    } else if (sortOrder === 'high-to-low') {
        filteredProducts.sort((a, b) => b.price - a.price);
    }

    displayProducts(filteredProducts);
}

function setupFilters() {
    const filterDropdown = document.getElementById('category-filter');
    const sortDropdown = document.getElementById('sort-filter');

    if (filterDropdown) {
        filterDropdown.addEventListener('change', filterAndSortProducts);
    }
    if (sortDropdown) {
        sortDropdown.addEventListener('change', filterAndSortProducts);
    }
}

function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            filterAndSortProducts();
        });
    }
}

async function loadProducts() {
    const productListContainer = document.getElementById('product-list');
    if (!productListContainer) return;

    await fetchProducts();
    filterAndSortProducts();
}

async function loadProductDetails() {
    const productDetailsContainer = document.getElementById('product-details');
    if (!productDetailsContainer) return;

    const fetchedProducts = await fetchProducts();
    const urlParams = new URLSearchParams(window.location.search);
    const productId = parseInt(urlParams.get('id'));

    const product = fetchedProducts.find(p => p.id === productId);

    if (product) {
        productDetailsContainer.innerHTML = `
            <div class="product-card">
                <img src="${product.image}" alt="${product.name}" width="200">
                <h2>${product.name}</h2>
                <p>Price: ${formatPrice(product.price)}</p>
                <p>${product.description}</p>
                <button onclick="addToCart(${product.id})" class="btn">Add to Cart</button>
            </div>
        `;
    } else {
        productDetailsContainer.innerHTML = '<p>Product not found.</p>';
    }
}

// --- CART & ORDER FUNCTIONS ---
function addToCart(productId) {
    const token = localStorage.getItem('token');
    if (!token) {
        showToast("Please log in to add items to your cart.");
        return;
    }

    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    const productToAdd = products.find(p => p.id === productId);
    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...productToAdd, quantity: 1 });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    showToast("Product added to cart!");
}

async function loadCart() {
    const cartContainer = document.getElementById('cart-items');
    const cartTotalContainer = document.getElementById('cart-total');
    if (!cartContainer || !cartTotalContainer) return;

    if (products.length === 0) {
        await fetchProducts();
    }
    
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    let total = 0;

    if (cart.length === 0) {
        cartContainer.innerHTML = '<p>Your cart is empty.</p>';
        cartTotalContainer.innerHTML = '';
        return;
    }

    cartContainer.innerHTML = cart.map(item => {
        total += item.price * item.quantity; 
        
        return `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}" width="100">
                <div>
                    <h3>${item.name}</h3>
                    <p>${formatPrice(item.price)}</p>
                    <p>
                        <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                        Quantity: ${item.quantity}
                        <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                    </p>
                </div>
                <button class="btn" onclick="removeFromCart(${item.id})">Remove</button>
            </div>
        `;
    }).join('');

    cartTotalContainer.innerHTML = `<h3>Total: ${formatPrice(total)}</h3>`;
}

function removeFromCart(productId) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    cart = cart.filter(item => item.id !== productId);
    localStorage.setItem("cart", JSON.stringify(cart));
    loadCart();
    showToast("Item removed from cart!");
}

function updateQuantity(productId, change) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    const item = cart.find(i => i.id === productId);

    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            cart = cart.filter(i => i.id !== productId);
        }
        localStorage.setItem("cart", JSON.stringify(cart));
        loadCart();
    }
}

async function handleCheckout(paymentMethod) {
    const name = document.getElementById('name').value;
    const address = document.getElementById('address').value;
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const checkoutBtn = document.getElementById('cod-btn');

    if (cart.length === 0) {
        showToast("Your cart is empty. Please add items before checking out.");
        return;
    }

    const token = localStorage.getItem('token');
    
    const orderData = {
        customerName: name,
        shippingAddress: address,
        items: cart,
        paymentMethod: paymentMethod
    };

    try {
        if (checkoutBtn) {
            checkoutBtn.textContent = "Processing...";
            checkoutBtn.classList.add('loading');
        }

        const res = await fetch('http://localhost:3000/api/checkout', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(orderData)
        });

        const data = await res.json();
        
        if (res.ok) {
            showToast(data.message);
            localStorage.removeItem('cart');
            window.location.href = 'orders.html';
        } else {
            showToast(data.message);
        }
    } catch (error) {
        console.error("Checkout failed:", error);
        showToast("An error occurred during checkout.");
    } finally {
        if (checkoutBtn) {
            checkoutBtn.textContent = "Cash on Delivery";
            checkoutBtn.classList.remove('loading');
        }
    }
}

function setupCheckoutPage() {
    const codBtn = document.getElementById('cod-btn');
    const qrBtn = document.getElementById('qr-btn');
    const qrSection = document.getElementById('qr-code-section');
    const confirmBtn = document.getElementById('confirm-payment-btn');
    const checkoutForm = document.getElementById('checkout-form');
    
    if (codBtn && qrBtn) {
        checkoutForm.addEventListener('submit', (e) => e.preventDefault());

        codBtn.addEventListener('click', () => {
            if (!checkoutForm.checkValidity()) {
                showToast("Please fill in all required fields.");
                return;
            }
            qrSection.style.display = 'none';
            handleCheckout('Cash on Delivery');
        });

        qrBtn.addEventListener('click', () => {
            if (!checkoutForm.checkValidity()) {
                showToast("Please fill in all required fields.");
                return;
            }
            qrSection.style.display = 'block';
        });

        confirmBtn.addEventListener('click', () => {
            handleCheckout('QR Payment');
        });
    }
}

// --- AUTHENTICATION & NAVIGATION ---
async function handleRegister(event) {
    event.preventDefault();
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;

    try {
        const res = await fetch('http://localhost:3000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        const data = await res.json();
        if (res.ok) {
            showToast(data.message);
            window.location.href = 'login.html';
        } else {
            showToast(data.message);
        }
    } catch (error) {
        console.error("Registration failed:", error);
        showToast("An error occurred during registration.");
    }
}

async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('log-email').value;
    const password = document.getElementById('log-password').value;

    try {
        const res = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (res.ok) {
            localStorage.setItem('token', data.token);
            showToast(data.message);
            window.location.href = 'index.html';
        } else {
            showToast(data.message);
        }
    } catch (error) {
        console.error("Login failed:", error);
        showToast("An error occurred during login.");
    }
}

function handleLogout() {
    localStorage.removeItem('token');
    showToast('You have been logged out.');
    window.location.href = 'index.html';
}

function updateNav() {
    const mainNav = document.getElementById('main-nav');
    if (!mainNav) return;

    const token = localStorage.getItem('token');
    if (token) {
        mainNav.innerHTML = `
            <a href="index.html">Home</a>
            <a href="products.html">Products</a>
            <a href="cart.html">Cart</a>
            <a href="orders.html">My Orders</a>
            <a href="profile.html">Profile</a>
            <a href="#" onclick="handleLogout()">Logout</a>
            <div class="search-container">
                <input type="text" id="searchInput" placeholder="Search products...">
            </div>
        `;
    } else {
        mainNav.innerHTML = `
            <a href="index.html">Home</a>
            <a href="products.html">Products</a>
            <a href="cart.html">Cart</a>
            <a href="login.html">Login</a>
            <a href="register.html">Register</a>
            <div class="search-container">
                <input type="text" id="searchInput" placeholder="Search products...">
            </div>
        `;
    }
}

function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            filterAndSortProducts();
        });
    }
}

async function loadUserOrders() {
    const ordersContainer = document.getElementById('orders-container');
    if (!ordersContainer) return;

    const token = localStorage.getItem('token');
    if (!token) {
        ordersContainer.innerHTML = '<p>Please log in to view your orders.</p>';
        return;
    }

    try {
        const res = await fetch('http://localhost:3000/api/orders', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const orders = await res.json();
        
        if (res.ok && orders.length > 0) {
            ordersContainer.innerHTML = orders.map(order => `
                <div class="order-card">
                    <h3>Order ID: ${order.orderId}</h3>
                    <p>Status: ${order.status}</p>
                    <p>Total: ${formatPrice(order.totalPrice)}</p>
                    <p>Date: ${new Date(order.createdAt).toLocaleDateString()}</p>
                    <div class="order-items">
                        <h4>Items:</h4>
                        <ul>
                            ${order.items.map(item => `<li>${item.name} (x${item.quantity}) - ${formatPrice(item.price)}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            `).join('');
        } else {
            ordersContainer.innerHTML = '<p>No orders found.</p>';
        }
    } catch (error) {
        console.error("Failed to load orders:", error);
        ordersContainer.innerHTML = '<p>Failed to load orders. Please try again.</p>';
    }
}

async function loadUserProfile() {
    const profileContainer = document.getElementById('profile-container');
    if (!profileContainer) return;

    const token = localStorage.getItem('token');
    if (!token) {
        profileContainer.innerHTML = '<p>Please log in to view your profile.</p>';
        return;
    }

    try {
        const res = await fetch('http://localhost:3000/api/profile', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const userProfile = await res.json();
        
        if (res.ok) {
            profileContainer.innerHTML = `
                <div class="profile-card">
                    <h3>Name: ${userProfile.name}</h3>
                    <p>Email: ${userProfile.email}</p>
                </div>
            `;
        } else {
            profileContainer.innerHTML = `<p>${userProfile.message}</p>`;
        }
    } catch (error) {
        console.error("Failed to load user profile:", error);
        profileContainer.innerHTML = '<p>Failed to load profile. Please try again.</p>';
    }
}

// --- PAGE INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    updateNav();
    setupSearch();

    if (document.getElementById('product-list')) {
        loadProducts();
        setupFilters();
    }
    
    if (document.getElementById('cart-items')) {
        loadCart();
    }
    
    if (document.getElementById('product-details')) {
        loadProductDetails();
    }

    if (document.getElementById('checkout-form')) {
        const token = localStorage.getItem('token');
        if (!token) {
            showToast("You must be logged in to checkout.");
            window.location.href = 'login.html';
            return;
        }
        setupCheckoutPage();
    }

    if (document.getElementById('orders-container')) {
        loadUserOrders();
    }

    if (document.getElementById('profile-container')) {
        loadUserProfile();
    }

    if (document.getElementById('register-form')) {
        const registerForm = document.getElementById('register-form');
        registerForm.addEventListener('submit', handleRegister);
    }
    
    if (document.getElementById('login-form')) {
        const loginForm = document.getElementById('login-form');
        loginForm.addEventListener('submit', handleLogin);
    }
});