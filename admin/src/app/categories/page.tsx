"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit, FolderPlus, Image as ImageIcon, Search, Upload, X, ChevronRight, LayoutGrid } from "lucide-react";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", image: "", isFeatured: false });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/admin/categories");
      if (res.ok) setCategories(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("http://localhost:5000/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const { url } = await res.json();
        setFormData(prev => ({ ...prev, image: url }));
      }
    } catch (err) {
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingCategory 
      ? `http://localhost:5000/api/admin/categories/${editingCategory.id}` 
      : "http://localhost:5000/api/admin/categories";
    const method = editingCategory ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowModal(false);
        setEditingCategory(null);
        setFormData({ name: "", image: "", isFeatured: false });
        fetchCategories();
      }
    } catch (err) {
      alert("Failed to save category");
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm("Delete this category? This might affect products.")) return;
    try {
       const res = await fetch(`http://localhost:5000/api/admin/categories/${id}`, { method: "DELETE" });
       if (res.ok) fetchCategories();
    } catch (err) {
      alert("Delete failed");
    }
  };

  if (loading) return <div className="page-container">Loading Categories...</div>;

  return (
    <div className="page-container">
      {/* Content Header */}
      <div className="animate-fade-in" style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.04em', marginBottom: '0.5rem' }}>Management</h1>
          <p style={{ color: '#64748b', fontSize: '0.9375rem', fontWeight: 500 }}>Organize and curate your store's product categories.</p>
        </div>
        <button 
          onClick={() => { setEditingCategory(null); setFormData({ name: "", image: "", isFeatured: false }); setShowModal(true); }}
          style={{ 
            backgroundColor: '#0f172a', 
            color: 'white', 
            padding: '12px 24px', 
            borderRadius: '14px', 
            fontSize: '0.875rem', 
            fontWeight: 800, 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px',
            boxShadow: '0 10px 20px -5px rgba(15, 23, 42, 0.3)',
            transition: 'all 0.2s'
          }}
        >
          <FolderPlus size={18} />
          <span>New Category</span>
        </button>
      </div>

      {/* Categories Grid */}
      <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
        {categories.map((cat) => (
          <div key={cat.id} className="chart-section" style={{ padding: '0', overflow: 'hidden', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', transition: 'transform 0.3s' }}>
            <div style={{ width: '100%', height: '180px', backgroundColor: '#f1f5f9', position: 'relative' }}>
               {cat.image ? (
                 <img src={cat.image} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
               ) : (
                 <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ImageIcon size={48} color="#cbd5e1" />
                 </div>
               )}
               <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0) 60%, rgba(0,0,0,0.4))' }}></div>
               <div style={{ position: 'absolute', top: '15px', right: '15px', display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => { setEditingCategory(cat); setFormData({ name: cat.name, image: cat.image || "", isFeatured: !!cat.isFeatured }); setShowModal(true); }}
                    style={{ backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(4px)', padding: '10px', borderRadius: '12px', color: '#0f172a', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    onClick={() => deleteCategory(cat.id)}
                    style={{ backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(4px)', padding: '10px', borderRadius: '12px', color: '#ef4444', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                  >
                    <Trash2 size={16} />
                  </button>
               </div>
               <div style={{ position: 'absolute', bottom: '15px', left: '20px' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: 'rgba(0,0,0,0.3)', padding: '2px 8px', borderRadius: '4px' }}>
                    {cat._count?.products || 0} Products
                  </span>
               </div>
            </div>
            <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div>
                  <h3 style={{ fontWeight: 800, color: '#1e293b', fontSize: '1.125rem' }}>{cat.name}</h3>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>/{cat.slug}</p>
               </div>
               <ChevronRight size={20} color="#cbd5e1" />
            </div>
          </div>
        ))}
      </div>

      {/* PROFESSIONAL MODAL OVERLAY */}
      {/* 
          IMPORTANT: This modal is handled with explicit absolute viewport coordinates 
          to bypass any potential parent stacking context issues from animations.
      */}
      {showModal && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          backgroundColor: 'rgba(15, 23, 42, 0.4)', 
          backdropFilter: 'blur(8px)',
          zIndex: 100000, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          overflow: 'hidden'
        }}>
           <div 
             className="animate-fade-in" 
             style={{ 
               width: '100%',
               maxWidth: '460px', 
               backgroundColor: '#ffffff', 
               borderRadius: '32px', 
               boxShadow: '0 40px 100px -20px rgba(15, 23, 42, 0.4)',
               overflow: 'hidden',
               margin: '20px'
             }}
           >
              {/* Header */}
              <div style={{ padding: '32px 40px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                 <div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#1e293b', letterSpacing: '-0.03em', margin: 0 }}>
                       {editingCategory ? "Edit Category" : "Build Collection"}
                    </h2>
                    <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '4px', fontWeight: 500 }}>
                       Define the personality of your collection.
                    </p>
                 </div>
                 <button onClick={() => setShowModal(false)} style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e293b' }}>
                    <X size={20} />
                 </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSubmit} style={{ padding: '0 40px 40px' }}>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* Name Input */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                       <label style={{ fontSize: '0.7rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Name Your Category</label>
                       <input 
                         required
                         type="text" 
                         value={formData.name}
                         onChange={(e) => setFormData({...formData, name: e.target.value})}
                         placeholder="e.g. Minimalist Home"
                         style={{ 
                           width: '100%', 
                           padding: '16px 20px', 
                           backgroundColor: '#f8fafc', 
                           border: '2px solid #f1f5f9', 
                           borderRadius: '16px',
                           fontSize: '1rem',
                           fontWeight: 600,
                           color: '#1e293b',
                           outline: 'none',
                           transition: 'all 0.2s'
                         }}
                       />
                    </div>

                    {/* Image Upload Area */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                       <label style={{ fontSize: '0.7rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Cover Branding</label>
                       <div style={{ 
                         border: '2px dashed #e2e8f0', 
                         borderRadius: '24px', 
                         padding: '40px 20px', 
                         backgroundColor: '#f8fafc',
                         display: 'flex',
                         flexDirection: 'column',
                         alignItems: 'center',
                         gap: '20px'
                       }}>
                          <div style={{ width: '120px', height: '120px', borderRadius: '20px', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                             {formData.image ? <img src={formData.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ImageIcon size={32} color="#cbd5e1" />}
                          </div>
                          
                          <div style={{ textAlign: 'center' }}>
                             <input type="file" id="cat-img-final" hidden onChange={handleFileUpload} accept="image/*" />
                             <label htmlFor="cat-img-final" style={{ 
                               display: 'inline-flex', 
                               alignItems: 'center', 
                               gap: '10px', 
                               padding: '12px 24px', 
                               backgroundColor: 'white', 
                               borderRadius: '14px', 
                               fontSize: '0.875rem', 
                               fontWeight: 800, 
                               color: '#1e293b', 
                               cursor: 'pointer',
                               border: '1px solid #e2e8f0',
                               boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                             }}>
                                <Upload size={18} color="#0f172a" />
                                <span>{uploading ? "Uploading..." : (formData.image ? "Replace Artwork" : "Choose Artwork")}</span>
                             </label>
                             {formData.image && <p style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 900, marginTop: '12px' }}>DESIGN SYNCED SUCCESSFULY</p>}
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Actions */}
                 <div style={{ display: 'flex', gap: '12px', marginTop: '40px' }}>
                    <button 
                      type="button" 
                      onClick={() => setShowModal(false)}
                      style={{ flex: 1, padding: '18px', borderRadius: '16px', fontWeight: 800, color: '#64748b', fontSize: '1rem', border: '1px solid #f1f5f9' }}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      style={{ 
                        flex: 1, 
                        padding: '18px', 
                        borderRadius: '16px', 
                        backgroundColor: '#0f172a', 
                        color: 'white', 
                        fontWeight: 800, 
                        fontSize: '1rem',
                        boxShadow: '0 10px 20px -5px rgba(15, 23, 42, 0.4)'
                      }}
                    >
                      {editingCategory ? "Update Design" : "Launch Collection"}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

    </div>
  );
}
