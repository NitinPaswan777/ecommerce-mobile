"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Plus, X, Upload } from "lucide-react";
import { fetchCategories, createProduct, fetchHomeSections } from "@/lib/api";

const SIZE_CHARTS: Record<string, string[]> = {
  mens_cloth: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'],
  womens_cloth: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  kids_wear: ['22', '24', '26', '28', '30', '32'],
  men_shoes: ['6', '7', '8', '9', '10', '11', '12'],
  women_shoes: ['3', '4', '5', '6', '7', '8'],
  default: ['S', 'M', 'L']
};

export default function AddProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  
  // Form State
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    originalPrice: "",
    sku: "",
    inventory: "",
    categoryId: "",
    tag: "",
    videoUrl: "",
    fastDelivery: false,
    listedFor: "mens_cloth",
    images: [""] as string[],
    colors: [{ name: "", hexCode: "#000000" }],
    sizes: [] as string[],
    variants: [] as any[]
  });

  const generateVariants = () => {
    const newVariants: any[] = [];
    formData.colors.forEach(color => {
      if (!color.name) return;
      formData.sizes.forEach(size => {
        // Check if exists
        const existing = formData.variants.find(v => v.color === color.name && v.size === size);
        if (existing) {
          newVariants.push(existing);
        } else {
          newVariants.push({
            color: color.name,
            size: size,
            sku: `${formData.sku || 'VAR'}-${color.name.substring(0,2).toUpperCase()}-${size}-${Math.floor(Math.random() * 1000000)}`,
            price: formData.price,
            inventory: formData.inventory || "0",
            images: []
          });
        }
      });
    });
    setFormData(prev => ({ ...prev, variants: newVariants }));
  };

  useEffect(() => {
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
  }, []);

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const addArrayItem = (key: 'images' | 'colors' | 'sizes', value: any) => {
    setFormData(prev => ({ ...prev, [key]: [...prev[key], value] }));
  };

  const removeArrayItem = (key: 'images' | 'colors' | 'sizes', index: number) => {
    setFormData(prev => ({ ...prev, [key]: prev[key].filter((_, i) => i !== index) }));
  };

  const updateArrayItem = (key: 'images' | 'colors' | 'sizes', index: number, value: any) => {
    setFormData(prev => {
      const newArr = [...prev[key]];
      newArr[index] = value;
      return { ...prev, [key]: newArr };
    });
  };

  const updateVariant = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const newVariants = [...prev.variants];
      newVariants[index] = { ...newVariants[index], [field]: value };
      return { ...prev, variants: newVariants };
    });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Filter out empty items
      const finalData = {
        ...formData,
        images: formData.images.filter(img => img.trim() !== ""),
        colors: formData.colors.filter(c => c.name.trim() !== ""),
        sizes: formData.sizes.map(s => (typeof s === 'string' ? s : (s as any).name)).filter(s => s.trim() !== ""),
        variants: formData.variants.map(v => ({
          ...v,
          images: Array.isArray(v.images) ? v.images.filter((img: string) => img.trim() !== "") : []
        }))
      };
      
      await createProduct(finalData);
      router.push("/products");
    } catch (error) {
      alert("Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="section-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
           <button onClick={() => router.back()} style={{ color: '#64748b' }}>
              <ArrowLeft size={24} />
           </button>
           <h2 className="section-title">Add New Product</h2>
        </div>
        <button 
          onClick={handleSubmit}
          disabled={loading}
          className="nav-link active" 
          style={{ 
            backgroundColor: 'var(--primary)', 
            color: 'white', 
            borderRadius: '8px', 
            padding: '0.6rem 1.5rem',
            border: 'none',
            opacity: loading ? 0.7 : 1
          }}
        >
          <Save size={18} />
          <span>{loading ? "Saving..." : "Save Product"}</span>
        </button>
      </div>

      <form className="dashboard-grid" style={{ gridTemplateColumns: '2fr 1fr', alignItems: 'start' }}>
        {/* Left Column: General Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="chart-section">
            <h3 className="section-title" style={{ marginBottom: '1.5rem' }}>General Information</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               <div>
                  <label style={labelStyle}>Product Name *</label>
                  <input 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    placeholder="e.g. Premium Leather Jacket" 
                    style={inputStyle} 
                    required 
                  />
               </div>
               <div>
                  <label style={labelStyle}>Description</label>
                  <textarea 
                    name="description" 
                    value={formData.description} 
                    onChange={handleChange} 
                    placeholder="Enter detailed description..." 
                    style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }} 
                  />
               </div>
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={labelStyle}>Base Price (₹) *</label>
                    <input name="price" type="number" value={formData.price} onChange={handleChange} style={inputStyle} required />
                  </div>
                  <div>
                    <label style={labelStyle}>Original Price (₹)</label>
                    <input name="originalPrice" type="number" value={formData.originalPrice} onChange={handleChange} style={inputStyle} />
                  </div>
               </div>
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={labelStyle}>Base SKU *</label>
                    <input name="sku" value={formData.sku} onChange={handleChange} placeholder="PRD-12345" style={inputStyle} required />
                  </div>
                  <div>
                    <label style={labelStyle}>Total Inventory *</label>
                    <input name="inventory" type="number" value={formData.inventory} onChange={handleChange} style={inputStyle} required />
                  </div>
               </div>
            </div>
          </div>

          <div className="chart-section">
            <h3 className="section-title" style={{ marginBottom: '1.5rem' }}>Master Gallery (General Images)</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                 </div>
               ))}
               <button type="button" onClick={() => addArrayItem('images', "")} style={addBtnStyle}>
                  <Plus size={16} /> Add Image
               </button>
            </div>
          </div>

          {/* Variants Management */}
          {formData.variants.length > 0 && (
            <div className="chart-section animate-fade-in">
              <h3 className="section-title" style={{ marginBottom: '1.5rem' }}>Manage Inventory & Prices per Variant</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {formData.variants.map((v, i) => (
                  <div key={i} style={{ padding: '1.5rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.8125rem', color: 'var(--primary)', textTransform: 'uppercase' }}>
                        {v.color} / {v.size}
                      </span>
                      <button type="button" onClick={() => {
                        const newVars = formData.variants.filter((_, idx) => idx !== i);
                        setFormData(prev => ({ ...prev, variants: newVars }));
                      }} style={{ color: '#ef4444' }}><X size={16} /></button>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                      <div>
                        <label style={labelStyle}>SKU</label>
                        <input value={v.sku} onChange={(e) => updateVariant(i, 'sku', e.target.value)} style={smallInputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>Price</label>
                        <input type="number" value={v.price} onChange={(e) => updateVariant(i, 'price', e.target.value)} style={smallInputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>Stock</label>
                        <input type="number" value={v.inventory} onChange={(e) => updateVariant(i, 'inventory', e.target.value)} style={smallInputStyle} />
                      </div>
                    </div>

                    <div>
                      <label style={labelStyle}>Variant Specific Images (Recommended for {v.color})</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {(v.images || []).map((img: string, imgIdx: number) => (
                          <div key={imgIdx} style={{ display: 'flex', gap: '0.5rem' }}>
                            <input 
                              value={img} 
                              onChange={(e) => {
                                const newImgs = [...v.images];
                                newImgs[imgIdx] = e.target.value;
                                updateVariant(i, 'images', newImgs);
                              }} 
                              placeholder="Image URL" 
                              style={smallInputStyle} 
                            />
                            <button type="button" onClick={() => {
                               const newImgs = v.images.filter((_: any, idx: number) => idx !== imgIdx);
                               updateVariant(i, 'images', newImgs);
                            }} style={{ color: '#ef4444' }}><X size={14}/></button>
                          </div>
                        ))}
                        <button type="button" onClick={() => updateVariant(i, 'images', [...(v.images || []), ""])} style={addBtnStyle}>
                          <Plus size={14} /> Add Variant Image
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Categories & attributes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="chart-section">
            <h3 className="section-title" style={{ marginBottom: '1.5rem' }}>Organization</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               <div>
                  <label style={labelStyle}>Category *</label>
                  <select name="categoryId" value={formData.categoryId} onChange={handleChange} style={inputStyle} required>
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
               </div>
               <div>
                  <label style={labelStyle}>Listed For *</label>
                  <select name="listedFor" value={formData.listedFor} onChange={handleChange} style={inputStyle} required>
                    <option value="mens_cloth">Men's Clothing</option>
                    <option value="womens_cloth">Women's Clothing</option>
                    <option value="kids_wear">Kids Wear</option>
                    <option value="men_shoes">Men's Shoes</option>
                    <option value="women_shoes">Women's Shoes</option>
                  </select>
               </div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <input type="checkbox" name="fastDelivery" checked={formData.fastDelivery} onChange={handleChange} id="fast" />
                  <label htmlFor="fast" style={{ fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>Fast Delivery</label>
               </div>
            </div>
          </div>

          <div className="chart-section">
            <h3 className="section-title" style={{ marginBottom: '1rem' }}>1. Select Attributes</h3>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={labelStyle}>Colors</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {formData.colors.map((color, index) => (
                  <div key={index} style={{ display: 'flex', gap: '0.4rem' }}>
                    <input 
                      placeholder="Color Name" 
                      value={color.name} 
                      onChange={(e) => updateArrayItem('colors', index, { ...color, name: e.target.value })} 
                      style={{ ...inputStyle, padding: '0.5rem', fontSize: '0.8125rem' }} 
                    />
                    <input 
                      type="color" 
                      value={color.hexCode} 
                      onChange={(e) => updateArrayItem('colors', index, { ...color, hexCode: e.target.value })} 
                      style={{ width: '30px', height: '34px', padding: '0', border: 'none', cursor: 'pointer' }} 
                    />
                    <button type="button" onClick={() => removeArrayItem('colors', index)} style={{ color: '#ef4444' }}><X size={16}/></button>
                  </div>
                ))}
                <button type="button" onClick={() => addArrayItem('colors', { name: "", hexCode: "#000000" })} style={addBtnStyle}>
                   <Plus size={14} /> Add Color
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={labelStyle}>Sizes</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
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
                        padding: '0.4rem 0.7rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        border: '1px solid var(--border)',
                        backgroundColor: formData.sizes.includes(size) ? 'var(--primary)' : 'white',
                        color: formData.sizes.includes(size) ? 'white' : 'inherit'
                     }}
                   >
                     {size}
                   </button>
                 ))}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
               <h3 className="section-title" style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>2. Generate Variants</h3>
               <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '1rem' }}>This will create combinations of all selected colors and sizes below.</p>
               <button 
                 type="button" 
                 onClick={generateVariants}
                 style={{ 
                   width: '100%', 
                   padding: '0.75rem', 
                   backgroundColor: '#000', 
                   color: '#fff', 
                   borderRadius: '8px', 
                   fontWeight: 700, 
                   fontSize: '0.8125rem',
                   letterSpacing: '0.05em',
                   textTransform: 'uppercase'
                 }}
               >
                 Generate Combinations
               </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
const smallInputStyle = {
  width: '100%',
  padding: '0.4rem 0.6rem',
  borderRadius: '6px',
  border: '1px solid var(--border)',
  backgroundColor: 'white',
  fontSize: '0.8125rem',
  outline: 'none',
};

const labelStyle = {
  display: 'block',
  fontSize: '0.75rem',
  fontWeight: 700,
  color: '#64748b',
  textTransform: 'uppercase' as any,
  marginBottom: '0.5rem',
  letterSpacing: '0.05em'
};

const inputStyle = {
  width: '100%',
  padding: '0.75rem 1rem',
  borderRadius: '8px',
  border: '1px solid var(--border)',
  backgroundColor: 'var(--input)',
  fontSize: '0.9375rem',
  outline: 'none',
  transition: 'border-color 0.2s',
};

const addBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  fontSize: '0.8125rem',
  fontWeight: 600,
  color: 'var(--primary)',
  marginTop: '0.5rem',
  cursor: 'pointer'
};
