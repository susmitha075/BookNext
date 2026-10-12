
"use strict";

// --------------------------------------
// 1. BOOK DATA
// --------------------------------------

const books = [
    {
        id: 1,
        title: "The Alchemist",
        author: "Paulo Coelho",
        category: "Fiction",
        price: 399,
        cover: "#e8d3ad",
        coverInk: "#664628"
    },
    {
        id: 2,
        title: "Atomic Habits",
        author: "James Clear",
        category: "Self-Help",
        price: 499,
        cover: "#dce7d6",
        coverInk: "#245c46"
    },
    {
        id: 3,
        title: "Clean Code",
        author: "Robert C. Martin",
        category: "Technology",
        price: 650,
        cover: "#d4dff0",
        coverInk: "#243e68"
    },
    {
        id: 4,
        title: "The Silent Patient",
        author: "Alex Michaelides",
        category: "Mystery",
        price: 449,
        cover: "#d9d1e8",
        coverInk: "#44375d"
    },
    {
        id: 5,
        title: "Rich Dad Poor Dad",
        author: "Robert T. Kiyosaki",
        category: "Business",
        price: 350,
        cover: "#f0d9ad",
        coverInk: "#704a19"
    },
    {
        id: 6,
        title: "Ikigai",
        author: "Hector Garcia",
        category: "Self-Help",
        price: 299,
        cover: "#d7e8e4",
        coverInk: "#285f56"
    },
    {
        id: 7,
        title: "The Great Gatsby",
        author: "F. Scott Fitzgerald",
        category: "Fiction",
        price: 275,
        cover: "#ecd5cf",
        coverInk: "#843f3a"
    },
    {
        id: 8,
        title: "The Pragmatic Programmer",
        author: "David Thomas",
        category: "Technology",
        price: 699,
        cover: "#cfd8dd",
        coverInk: "#304957"
    },
    {
        id: 9,
        title: "Think and Grow Rich",
        author: "Napoleon Hill",
        category: "Business",
        price: 325,
        cover: "#e6d9b9",
        coverInk: "#665222"
    },
    {
        id: 10,
        title: "Gone Girl",
        author: "Gillian Flynn",
        category: "Mystery",
        price: 399,
        cover: "#d6dbe9",
        coverInk: "#343d63"
    },
    {
        id: 11,
        title: "Deep Work",
        author: "Cal Newport",
        category: "Self-Help",
        price: 425,
        cover: "#d8d8c5",
        coverInk: "#444b30"
    },
    {
        id: 12,
        title: "The Hobbit",
        author: "J. R. R. Tolkien",
        category: "Fiction",
        price: 375,
        cover: "#d5e1bd",
        coverInk: "#3f5b30"
    }
];

// --------------------------------------
// 2. DOM ELEMENTS
// --------------------------------------

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const categoryFilter = document.getElementById("categoryFilter");
const bookGrid = document.getElementById("bookGrid");
const resultsInfo = document.getElementById("resultsInfo");

const cartPanel = document.getElementById("cartPanel");
const wishlistPanel = document.getElementById("wishlistPanel");
const cartItems = document.getElementById("cartItems");
const wishlistItems = document.getElementById("wishlistItems");

const checkoutSection = document.getElementById("checkoutSection");
const checkoutForm = document.getElementById("checkoutForm");
const checkoutItems = document.getElementById("checkoutItems");

const confirmationSection =
    document.getElementById("confirmationSection");

const toast = document.getElementById("toast");

// --------------------------------------
// 3. SAVED SHOPPING DATA
// --------------------------------------

function loadSavedData(key, fallback) {
    try {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : fallback;
    } catch (error) {
        return fallback;
    }
}

let cart = loadSavedData("booknest-cart", []);
let wishlist = loadSavedData("booknest-wishlist", []);

// Buy Now uses a temporary checkout list so it doesn't replace
// the customer's existing shopping cart.
let checkoutDraft = null;

function saveShoppingData() {
    try {
        localStorage.setItem("booknest-cart", JSON.stringify(cart));
        localStorage.setItem(
            "booknest-wishlist",
            JSON.stringify(wishlist)
        );
    } catch (error) {
        showToast("Unable to save shopping data in this browser.");
    }
}

// Remove invalid or unavailable book IDs from saved data.
cart = cart
    .filter(item =>
        item &&
        books.some(book => book.id === Number(item.id)) &&
        Number.isInteger(Number(item.qty)) &&
        Number(item.qty) > 0
    )
    .map(item => ({
        id: Number(item.id),
        qty: Math.min(Number(item.qty), 99)
    }));

wishlist = [...new Set(
    wishlist
        .map(Number)
        .filter(id => books.some(book => book.id === id))
)];

saveShoppingData();

// --------------------------------------
// 4. HELPER FUNCTIONS
// --------------------------------------

function getBook(id) {
    return books.find(book => book.id === Number(id));
}

function formatPrice(price) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
    }).format(price);
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

let toastTimer;

function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}

function cartQuantity() {
    return cart.reduce((total, item) => total + item.qty, 0);
}

function currentCheckoutItems() {
    return checkoutDraft !== null ? checkoutDraft : cart;
}

function calculateSubtotal(items) {
    return items.reduce((total, item) => {
        const book = getBook(item.id);
        return total + (book ? book.price * item.qty : 0);
    }, 0);
}

function calculateDelivery(items) {
    const subtotal = calculateSubtotal(items);

    if (subtotal === 0) return 0;

    // Demo rule: free delivery on orders of ₹999 or more.
    return subtotal >= 999 ? 0 : 49;
}

function calculateTotal(items) {
    return calculateSubtotal(items) + calculateDelivery(items);
}

// --------------------------------------
// 5. SEARCH AND CATEGORY FILTER
// --------------------------------------

function renderBooks() {
    const query = searchInput.value.trim().toLowerCase();
    const category = categoryFilter.value;

    const filteredBooks = books.filter(book => {
        const matchesSearch =
            book.title.toLowerCase().includes(query) ||
            book.author.toLowerCase().includes(query) ||
            book.category.toLowerCase().includes(query);

        const matchesCategory =
            category === "All" || book.category === category;

        return matchesSearch && matchesCategory;
    });

    resultsInfo.textContent =
        `${filteredBooks.length} book(s) found`;

    if (filteredBooks.length === 0) {
        bookGrid.innerHTML = `
            <p class="empty-message">
                No books found. Try another title, author, or category.
            </p>
        `;
        return;
    }

    bookGrid.innerHTML = filteredBooks.map(book => {
        const isSaved = wishlist.includes(book.id);

        return `
            <article class="book-card">
                <div class="book-cover"
                     style="--cover:${book.cover};
                            --cover-ink:${book.coverInk}">
                    <div>
                        <div class="cover-title">
                            ${escapeHTML(book.title)}
                        </div>
                        <div class="cover-author">
                            ${escapeHTML(book.author)}
                        </div>
                    </div>
                </div>

                <div class="book-info">
                    <p class="book-category">
                        ${escapeHTML(book.category)}
                    </p>
                    <h3>${escapeHTML(book.title)}</h3>
                    <p class="book-author">
                        by ${escapeHTML(book.author)}
                    </p>
                    <p class="book-price">
                        ${formatPrice(book.price)}
                    </p>

                    <div class="book-buttons">
                        <button class="button primary"
                                data-action="add-cart"
                                data-id="${book.id}">
                            Add to Cart
                        </button>

                        <button class="icon-button"
                                data-action="toggle-wishlist"
                                data-id="${book.id}"
                                aria-label="${isSaved ? "Remove from" : "Add to"} wishlist"
                                title="${isSaved ? "Remove from wishlist" : "Add to wishlist"}">
                            ${isSaved ? "♥" : "♡"}
                        </button>

                        <button class="button secondary buy-button"
                                data-action="buy-now"
                                data-id="${book.id}">
                            Buy Now →
                        </button>
                    </div>
                </div>
            </article>
        `;
    }).join("");
}

searchInput.addEventListener("input", renderBooks);

searchBtn.addEventListener("click", () => {
    renderBooks();
    document.getElementById("catalog").scrollIntoView({
        behavior: "smooth"
    });
});

searchInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        renderBooks();
    }
});

categoryFilter.addEventListener("change", renderBooks);

// --------------------------------------
// 6. ADD TO CART
// --------------------------------------

function addToCart(id, quantity = 1) {
    const book = getBook(id);

    if (!book) return;

    const existingItem = cart.find(item => item.id === book.id);

    if (existingItem) {
        if (existingItem.qty + quantity > 99) {
            showToast("Maximum quantity is 99 per book.");
            return;
        }

        existingItem.qty += quantity;
    } else {
        cart.push({
            id: book.id,
            qty: quantity
        });
    }

    saveShoppingData();
    renderCart();
    showToast(`${book.title} added to your cart.`);
}

// --------------------------------------
// 7. WISHLIST
// --------------------------------------

function toggleWishlist(id) {
    const book = getBook(id);

    if (!book) return;

    if (wishlist.includes(book.id)) {
        wishlist = wishlist.filter(itemId => itemId !== book.id);
        showToast("Removed from your wishlist.");
    } else {
        wishlist.push(book.id);
        showToast(`${book.title} saved to your wishlist.`);
    }

    saveShoppingData();
    renderBooks();
    renderWishlist();
}

// --------------------------------------
// 8. CART AND WISHLIST DISPLAY
// --------------------------------------

function renderCart() {
    const subtotal = calculateSubtotal(cart);
    const delivery = calculateDelivery(cart);

    document.getElementById("cartCount").textContent = cartQuantity();
    document.getElementById("cartPanelCount").textContent =
        `(${cartQuantity()} items)`;

    document.getElementById("cartSubtotal").textContent =
        formatPrice(subtotal);

    document.getElementById("deliveryCost").textContent =
        formatPrice(delivery);

    document.getElementById("cartTotal").textContent =
        formatPrice(subtotal + delivery);

    if (cart.length === 0) {
        cartItems.innerHTML = `
            <p class="empty-message">
                Your cart is empty. Add a book to get started!
            </p>
        `;
        return;
    }

    cartItems.innerHTML = cart.map(item => {
        const book = getBook(item.id);

        return `
            <div class="line-item">
                <div>
                    <h3>${escapeHTML(book.title)}</h3>
                    <p>${formatPrice(book.price)} per book</p>
                </div>

                <div class="qty-control">
                    <button data-action="decrease"
                            data-id="${book.id}"
                            aria-label="Decrease quantity">−</button>
                    <span>${item.qty}</span>
                    <button data-action="increase"
                            data-id="${book.id}"
                            aria-label="Increase quantity">+</button>
                </div>

                <div class="line-item-actions">
                    <strong>${formatPrice(book.price * item.qty)}</strong>
                    <button class="remove-button"
                            data-action="remove-cart"
                            data-id="${book.id}">Remove</button>
                </div>
            </div>
        `;
    }).join("");
}

function renderWishlist() {
    document.getElementById("wishlistCount").textContent =
        wishlist.length;

    document.getElementById("wishlistPanelCount").textContent =
        `(${wishlist.length})`;

    if (wishlist.length === 0) {
        wishlistItems.innerHTML = `
            <p class="empty-message">
                Your wishlist is empty. Save books you love!
            </p>
        `;
        return;
    }

    wishlistItems.innerHTML = wishlist.map(id => {
        const book = getBook(id);

        return `
            <div class="line-item">
                <div>
                    <h3>${escapeHTML(book.title)}</h3>
                    <p>${escapeHTML(book.author)}</p>
                </div>
                <strong>${formatPrice(book.price)}</strong>
                <div class="line-item-actions">
                    <button class="button primary"
                            data-action="wishlist-add-cart"
                            data-id="${book.id}">Add to Cart</button>
                    <button class="remove-button"
                            data-action="toggle-wishlist"
                            data-id="${book.id}">Remove</button>
                </div>
            </div>
        `;
    }).join("");
}

// --------------------------------------
// 9. CART AND WISHLIST BUTTON ACTIONS
// --------------------------------------

bookGrid.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const id = Number(button.dataset.id);
    const action = button.dataset.action;

    if (action === "add-cart") {
        addToCart(id);
    }

    if (action === "toggle-wishlist") {
        toggleWishlist(id);
    }

    if (action === "buy-now") {
        const book = getBook(id);

        if (!book) return;

        checkoutDraft = [{ id: book.id, qty: 1 }];
        showCheckout();
    }
});

cartItems.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const id = Number(button.dataset.id);
    const item = cart.find(cartItem => cartItem.id === id);

    if (!item) return;

    switch (button.dataset.action) {
        case "increase":
            if (item.qty < 99) {
                item.qty++;
            } else {
                showToast("Maximum quantity is 99 per book.");
            }
            break;

        case "decrease":
            item.qty--;

            if (item.qty <= 0) {
                cart = cart.filter(cartItem => cartItem.id !== id);
            }
            break;

        case "remove-cart":
            cart = cart.filter(cartItem => cartItem.id !== id);
            showToast("Book removed from cart.");
            break;
    }

    saveShoppingData();
    renderCart();
});

wishlistItems.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const id = Number(button.dataset.id);

    if (button.dataset.action === "toggle-wishlist") {
        toggleWishlist(id);
    }

    if (button.dataset.action === "wishlist-add-cart") {
        addToCart(id);
    }
});

document.getElementById("cartBtn").addEventListener("click", () => {
    cartPanel.hidden = false;
    wishlistPanel.hidden = true;
    cartPanel.scrollIntoView({ behavior: "smooth", block: "start" });
});

document.getElementById("wishlistBtn").addEventListener("click", () => {
    wishlistPanel.hidden = false;
    cartPanel.hidden = true;
    wishlistPanel.scrollIntoView({ behavior: "smooth", block: "start" });
});

document.getElementById("closeCart").addEventListener("click", () => {
    cartPanel.hidden = true;
});

document.getElementById("closeWishlist").addEventListener("click", () => {
    wishlistPanel.hidden = true;
});

// --------------------------------------
// 10. CHECKOUT
// --------------------------------------

function showCheckout() {
    const items = currentCheckoutItems();

    if (items.length === 0) {
        showToast("Please add a book before checkout.");
        return;
    }

    confirmationSection.hidden = true;
    checkoutSection.hidden = false;
    cartPanel.hidden = true;
    wishlistPanel.hidden = true;

    renderCheckoutSummary();

    checkoutSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

function renderCheckoutSummary() {
    const items = currentCheckoutItems();

    checkoutItems.innerHTML = items.map(item => {
        const book = getBook(item.id);

        return `
            <div class="checkout-book">
                <span>${escapeHTML(book.title)} × ${item.qty}</span>
                <strong>${formatPrice(book.price * item.qty)}</strong>
            </div>
        `;
    }).join("");

    document.getElementById("checkoutSubtotal").textContent =
        formatPrice(calculateSubtotal(items));

    document.getElementById("checkoutDelivery").textContent =
        formatPrice(calculateDelivery(items));

    document.getElementById("checkoutTotal").textContent =
        formatPrice(calculateTotal(items));
}

document.getElementById("checkoutBtn").addEventListener("click", () => {
    checkoutDraft = null;
    showCheckout();
});

checkoutForm.addEventListener("submit", event => {
    event.preventDefault();

    const items = currentCheckoutItems();

    if (items.length === 0) {
        showToast("Your order has no books.");
        return;
    }

    if (!checkoutForm.reportValidity()) {
        return;
    }

    const formData = new FormData(checkoutForm);

    const customerName = String(formData.get("customerName")).trim();
    const customerEmail = String(formData.get("customerEmail")).trim();
    const paymentMethod = String(formData.get("paymentMethod"));

    // This order number is for the demo only.
    const orderId = "BN" + Date.now().toString().slice(-8);
    const total = calculateTotal(items);
    const itemCount = items.reduce((sum, item) => sum + item.qty, 0);

    document.getElementById("confirmationMessage").textContent =
        `Thank you, ${customerName}! Your demo order ${orderId} contains ` +
        `${itemCount} book(s), totaling ${formatPrice(total)}. ` +
        `Demo payment option: ${paymentMethod}. ` +
        `Your order details have not been sent to ${customerEmail} ` +
        `or to a bookstore server.`;

    // Buy Now orders do not remove existing cart contents.
    if (checkoutDraft === null) {
        cart = [];
        saveShoppingData();
        renderCart();
    }

    checkoutDraft = null;
    checkoutForm.reset();

    checkoutSection.hidden = true;
    confirmationSection.hidden = false;

    confirmationSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
});

document.getElementById("continueShopping").addEventListener("click", () => {
    confirmationSection.hidden = true;
    document.getElementById("catalog").scrollIntoView({
        behavior: "smooth"
    });
});

// --------------------------------------
// 11. INITIAL PAGE SETUP
// --------------------------------------

document.getElementById("currentYear").textContent =
    new Date().getFullYear();

renderBooks();
renderCart();
renderWishlist();
