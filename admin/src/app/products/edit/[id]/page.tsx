"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Plus, X, Save } from "lucide-react";
import Link from "next/link";
import { fetchCategories, fetchSingleProduct, updateProduct, fetchHomeSections } from "@/lib/api";

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    originalPrice: "",
    sku: "",
    inventory: "100",
    categoryId: "",
    tag: "",
    videoUrl: "",
    listedFor: "mens_cloth",
    images: [""] as string[],
    colors: [{ name: "", hexCode: "#000000" }],
    sizes: [] as string[],
    fastDelivery: true
  });


  useEffect(() => {
    // Load categories first
    fetchCategories().then(setCategories).catch(console.error);

    // Fetch available sections for the dropdown
    const loadTags = async () => {
      try {
        const sections = await fetchHomeSections();
        const combined = sections.map((s: any) => s.title);
        setAvailableTags(combined);
      } catch (err) {
        console.error("Failed to fetch tags", err);
      }
    };
    loadTags();

    // Load product data
    fetchSingleProduct(id).then(product => {
      setFormData({
        name: product.name,
        description: product.description || "",
        price: String(product.price),
        originalPrice: product.originalPrice ? String(product.originalPrice) : "",
        sku: product.sku || "",
        inventory: String(product.inventory),
        categoryId: product.categoryId,
        tag: product.tag || "",
        videoUrl: product.videoUrl || "",
        listedFor: product.listedFor || "mens_cloth",
        images: product.images?.length > 0 ? product.images.map((img: any) => img.url) : [""],
        colors: product.colors?.length > 0 ? product.colors.map((c: any) => ({ name: c.name, hexCode: c.hexCode })) : [{ name: "", hexCode: "#000000" }],
        sizes: product.sizes?.length > 0 ? product.sizes.map((s: any) => s.name) : [],
        fastDelivery: product.fastDelivery
      });

      setLoading(false);
    }).catch(err => {
      console.error(err);
      alert("Failed to load product");
      router.push("/products");
    });
  }, [id, router]);

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const updateArrayItem = (key: 'images' | 'sizes', index: number, value: string) => {
    const newArr = [...formData[key]];
    newArr[index] = value;
    setFormData(prev => ({ ...prev, [key]: newArr }));
  };

  const addArrayItem = (key: 'images' | 'sizes', defaultValue: string) => {
    setFormData(prev => ({ ...prev, [key]: [...prev[key], defaultValue] }));
  };

  const removeArrayItem = (key: 'images' | 'sizes' | 'colors', index: number) => {
    const newArr = [...formData[key]];
    newArr.splice(index, 1);
    setFormData(prev => ({ ...prev, [key]: newArr }));
  };

  const updateColor = (index: number, field: 'name' | 'hexCode', value: string) => {
    const newColors = [...formData.colors];
    newColors[index] = { ...newColors[index], [field]: value };
    setFormData(prev => ({ ...prev, colors: newColors }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      const finalData = {
        ...formData,
        images: formData.images.filter(img => img.trim() !== ""),
        colors: formData.colors.filter(c => c.name.trim() !== ""),
        sizes: formData.sizes.filter(s => s.trim() !== "")
      };
      await updateProduct(id, finalData);
      router.push("/products");
    } catch (err) {
      console.error(err);
      alert("Failed to update product");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !formData.name) return <div className="page-container">Loading Product...</div>;

  return (
    <div className="page-container">
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link href="/products" style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
          <ChevronLeft size={20} />
        </Link>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Edit Product</h1>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem', alignItems: 'start' }}>
        {/* Main Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'var(--bg-card)', padding: '2rem', borderRadius: '1rem', border: '1px solid var(--border)' }}>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={labelStyle}>Product Title *</label>
                  <input name="name" value={formData.name} onChange={handleChange} required placeholder="e.g. Premium Cotton T-Shirt" style={inputStyle} />
               </div>

               <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={labelStyle}>Description *</label>
                  <textarea name="description" value={formData.description} onChange={handleChange} required rows={6} placeholder="Describe your product..." style={textareaStyle} />
               </div>

               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={labelStyle}>Selling Price (₹) *</label>
                    <input name="price" type="number" value={formData.price} onChange={handleChange} required style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>MRP / Original Price (₹)</label>
                    <input name="originalPrice" type="number" value={formData.originalPrice} onChange={handleChange} style={inputStyle} />
                  </div>
               </div>

               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={labelStyle}>SKU *</label>
                    <input name="sku" value={formData.sku} onChange={handleChange} required style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Inventory Quantity *</label>
                    <input name="inventory" type="number" value={formData.inventory} onChange={handleChange} required style={inputStyle} />
                  </div>
               </div>

               {/* Media */}
               <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <label style={labelStyle}>Images (URLs) *</label>
                  {formData.images.map((img, index) => (
                    <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input 
                            value={img} 
                            onChange={(e) => updateArrayItem('images', index, e.target.value)} 
                            placeholder="https://example.com/image.jpg" 
                            style={inputStyle} 
                            />
                            <button type="button" onClick={() => removeArrayItem('images', index)} style={{ color: '#ef4444' }}><X size={20}/></button>
                        </div>
                        {img && (
                            <div style={{ width: '80px', height: '100px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                                <img src={img} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                        )}
                    </div>
                  ))}
                  <button type="button" onClick={() => addArrayItem('images', "")} style={addBtnStyle}>
                     <Plus size={16} /> Add Another Image
                  </button>
               </div>

               <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={labelStyle}>Video URL (Optional)</label>
                  <input name="videoUrl" value={formData.videoUrl} onChange={handleChange} placeholder="https://example.com/video.mp4" style={inputStyle} />
               </div>
        </div>

        {/* Sidebar Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                   <label style={labelStyle}>Category *</label>
                   <select name="categoryId" value={formData.categoryId} onChange={handleChange} required style={inputStyle}>
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                   </select>
                </div>
                <div>
                   <label style={labelStyle}>Tag (Home Section)</label>
                   <select name="tag" value={formData.tag} onChange={handleChange} style={inputStyle}>
                     <option value="">No Tag</option>
                     {availableTags.map(tag => (
                       <option key={tag} value={tag}>{tag}</option>
                     ))}
                   </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <input type="checkbox" name="fastDelivery" checked={formData.fastDelivery} onChange={handleChange} id="fast" style={{ width: '1.25rem', height: '1.25rem', accentColor: 'var(--accent)' }} />
                    <label htmlFor="fast" style={{ fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer' }}>Fast Delivery Available</label>
                </div>
            </div>

            <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <label style={labelStyle}>Variants (Colors)</label>
                {formData.colors.map((c, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.5rem' }}>
                    <input value={c.name} onChange={(e) => updateColor(i, 'name', e.target.value)} placeholder="Color Name" style={inputStyle} />
                    <input type="color" value={c.hexCode} onChange={(e) => updateColor(i, 'hexCode', e.target.value)} style={{ width: '40px', padding: '0', border: 'none', background: 'none', height: '40px' }} />
                    <button type="button" onClick={() => removeArrayItem('colors', i)} style={{ color: '#ef4444' }}><X size={20}/></button>
                  </div>
                ))}
                <button type="button" onClick={() => setFormData(p => ({ ...p, colors: [...p.colors, { name: "", hexCode: "#000000" }] }))} style={addBtnStyle}>
                   <Plus size={16} /> Add Color
                </button>
            </div>

            <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <label style={labelStyle}>Available Sizes</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                   {(SIZE_CHARTS[formData.listedFor as keyof typeof SIZE_CHARTS] || SIZE_CHARTS.default).map(size => (
                     <button 
                       key={size}
                       type="button"
                       onClick={() => {
                          const newSizes = formData.sizes.includes(size) 
                            ? formData.sizes.filter(s => s !== size)
                            : [...formData.sizes, size];
                          setFormData(prev => ({ ...prev, sizes: newSizes }));
                       }}
                       style={{
                          padding: '0.5rem 0.75rem',
                          borderRadius: '6px',
                          fontSize: '0.8125rem',
                          fontWeight: 700,
                          border: '1px solid var(--border)',
                          backgroundColor: formData.sizes.includes(size) ? 'var(--accent)' : 'white',
                          color: formData.sizes.includes(size) ? 'white' : 'inherit',
                          cursor: 'pointer'
                       }}
                     >
                       {size}
                     </button>
                   ))}
                </div>
            </div>

            <button type="submit" disabled={loading} style={submitBtnStyle}>
                <Save size={20} /> {loading ? "Updating..." : "Update Product"}
            </button>
        </div>
      </form>
    </div>
  );
}

const SIZE_CHARTS: Record<string, string[]> = {
  mens_cloth: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'],
  womens_cloth: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  kids_wear: ['22', '24', '26', '28', '30', '32'],
  men_shoes: ['6', '7', '8', '9', '10', '11', '12'],
  women_shoes: ['3', '4', '5', '6', '7', '8'],
  default: ['S', 'M', 'L']
};

const labelStyle = { fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' };
const inputStyle = { width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem', background: 'var(--bg-app)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' };
const textareaStyle = { ...inputStyle, resize: 'vertical' };
const addBtnStyle = { display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' };
const submitBtnStyle = { width: '100%', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '0.75rem', padding: '1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', cursor: 'pointer', transition: 'all 0.2s' };
