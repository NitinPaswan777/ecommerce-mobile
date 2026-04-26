const API_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000") + "/api";

const getHeaders = (isMultipart = false) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
    const headers: any = {};
    if (!isMultipart) {
        headers["Content-Type"] = "application/json";
    }
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
};

export async function loginAdmin(data: any) {
    const res = await fetch(`${API_URL}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Login failed");
    return result;
}

export async function fetchAdminStats() {
    const res = await fetch(`${API_URL}/admin/stats`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Failed to fetch stats");
    return res.json();
}

export async function fetchAdminProducts() {
    const res = await fetch(`${API_URL}/admin/products`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Failed to fetch products");
    return res.json();
}

export async function fetchAdminOrders() {
    const res = await fetch(`${API_URL}/admin/orders`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Failed to fetch orders");
    return res.json();
}

export async function fetchCategories() {
    const res = await fetch(`${API_URL}/admin/categories`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Failed to fetch categories");
    return res.json();
}

export async function createProduct(data: any) {
    const res = await fetch(`${API_URL}/admin/products`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Failed to create product");
    return res.json();
}

export async function fetchSingleProduct(id: string) {
    const res = await fetch(`${API_URL}/products/${id}`); // Public API
    if (!res.ok) throw new Error("Failed to fetch product");
    return res.json();
}

export async function updateProduct(id: string, data: any) {
    const res = await fetch(`${API_URL}/admin/products/${id}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Failed to update product");
    return res.json();
}

export async function deleteProduct(id: string) {
    const res = await fetch(`${API_URL}/admin/products/${id}`, {
        method: "DELETE",
        headers: getHeaders()
    });
    if (!res.ok) throw new Error("Failed to delete product");
    return res.json();
}

export async function bulkUploadProducts(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_URL}/admin/products/bulk`, {
        method: "POST",
        headers: getHeaders(true),
        body: formData
    });
    if (!res.ok) throw new Error("Failed to process bulk upload");
    return res.json();
}
export async function fetchBanners() {
    const res = await fetch(`${API_URL}/admin/banners`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Failed to fetch banners");
    return res.json();
}

export async function createBanner(data: any) {
    const res = await fetch(`${API_URL}/admin/banners`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Failed to create banner");
    return res.json();
}

export async function updateBanner(id: string, data: any) {
    const res = await fetch(`${API_URL}/admin/banners/${id}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Failed to update banner");
    return res.json();
}

export async function deleteBanner(id: string) {
    const res = await fetch(`${API_URL}/admin/banners/${id}`, {
        method: "DELETE",
        headers: getHeaders()
    });
    if (!res.ok) throw new Error("Failed to delete banner");
    return res.json();
}

export async function fetchSiteConfig() {
    const res = await fetch(`${API_URL}/admin/site-config`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Failed to fetch site config");
    return res.json();
}

export async function updateSiteConfig(data: any) {
    const res = await fetch(`${API_URL}/admin/site-config`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Failed to update site config");
    return res.json();
}

export async function uploadAdminFile(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_URL}/admin/upload`, {
        method: "POST",
        headers: getHeaders(true),
        body: formData
    });
    if (!res.ok) throw new Error("Failed to upload file");
    return res.json();
}

export async function fetchHomeSections() {
    const res = await fetch(`${API_URL}/admin/sections`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Failed to fetch sections");
    return res.json();
}
