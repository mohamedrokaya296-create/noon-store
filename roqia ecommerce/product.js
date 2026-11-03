function initProductDetailsPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get("id");

    if (!productId) {
        window.location.href = "index.html";
        return;
    }

    fetch(`https://dummyjson.com/products/${productId}`)
        .then((res) => res.json())
        .then((product) => {
            currentProduct = product;
            renderProductDetails(product);
        })
        .catch((err) => {
            console.error("Error fetching product details:", err);
            const titleEl = document.getElementById("productTitle");
            if (titleEl) titleEl.innerText = "An error occurred while loading the product.";
        });
}

function renderProductDetails(product) {
    const mainImage = document.getElementById("mainImage");
    if (mainImage) {
        mainImage.src = (product.images && product.images.length > 0) ? product.images[0] : product.thumbnail;
    }

    if (typeof displayImages === "function" && product.images) {
        displayImages(product.images);
    }

    const titleEl = document.getElementById("productTitle");
    const priceEl = document.getElementById("productPrice");
    const descEl = document.getElementById("productDescription");
    const ratingEl = document.getElementById("productRating");
    const brandEl = document.getElementById("productBrand");

    if (titleEl) titleEl.innerText = product.title;
    if (priceEl) priceEl.innerText = product.price + " USD";
    if (descEl) descEl.innerText = product.description;
    if (ratingEl) ratingEl.innerText = "Rating: ⭐ " + product.rating;
    if (brandEl) brandEl.innerText = "Brand: " + (product.brand || "N/A");
}

document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("mainImage")) {
        initProductDetailsPage();
    }
});