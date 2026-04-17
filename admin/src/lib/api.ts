const API_URL = "http://localhost:5000/api";

export async function fetchAdminStats() {
    const res = await fetch(`${API_URL}/admin/stats`);
    if (!res.ok) throw new Error("Failed to fetch stats");
    return res.json();
}

export async function fetchAdminProducts() {
    const res = await fetch(`${API_URL}/admin/products`);
    if (!res.ok) throw new Error("Failed to fetch products");
    return res.json();
}

export async function fetchAdminOrders() {
    const res = await fetch(`${API_URL}/admin/orders`);
    if (!res.ok) throw new Error("Failed to fetch orders");
    return res.json();
}

export async function fetchCategories() {
    const res = await fetch(`${API_URL}/admin/categories`);
    if (!res.ok) throw new Error("Failed to fetch categories");
    return res.json();
}

export async function createProduct(data: any) {
    const res = await fetch(`${API_URL}/admin/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Failed to create product");
    return res.json();
}

export async function fetchSingleProduct(id: string) {
    const res = await fetch(`${API_URL}/products/${id}`);
    if (!res.ok) throw new Error("Failed to fetch product");
    return res.json();
}

export async function updateProduct(id: string, data: any) {
    const res = await fetch(`${API_URL}/admin/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Failed to update product");
    return res.json();
}

export async function deleteProduct(id: string) {
    const res = await fetch(`${API_URL}/admin/products/${id}`, {
        method: "DELETE"
    });
    if (!res.ok) throw new Error("Failed to delete product");
    return res.json();
}

export async function bulkUploadProducts(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_URL}/admin/products/bulk`, {
        method: "POST",
        body: formData
    });
    if (!res.ok) throw new Error("Failed to process bulk upload");
    return res.json();
}
export async function fetchSiteConfig() {
    const res = await fetch(`${API_URL}/admin/site-config`);
    if (!res.ok) throw new Error("Failed to fetch site config");
    return res.json();
}

export async function fetchHomeSections() {
    const res = await fetch(`${API_URL}/admin/sections`);
    if (!res.ok) throw new Error("Failed to fetch sections");
    return res.json();
}
