"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, LayoutGrid, Package, ChevronRight, X, Search, CheckCircle } from "lucide-react";

export default function HomeSectionsPage() {
  const [sections, setSections] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [selectedSection, setSelectedSection] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
      const [secRes, prodRes] = await Promise.all([
        fetch(`${backendUrl}/api/admin/sections`),
        fetch(`${backendUrl}/api/admin/products`)
      ]);
      if (secRes.ok && prodRes.ok) {
        setSections(await secRes.json());
        setProducts(await prodRes.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createSection = async () => {
    if (!newSectionTitle) return;
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
      const res = await fetch(`${backendUrl}/api/admin/sections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newSectionTitle, position: sections.length })
      });
      if (res.ok) {
        setNewSectionTitle("");
        setShowCreateModal(false);
        fetchData();
      }
    } catch (err) {
      alert("Failed to create section");
    }
  };

  const deleteSection = async (id: string) => {
    if (!confirm("Are you sure you want to delete this section?")) return;
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
      await fetch(`${backendUrl}/api/admin/sections/${id}`, { method: "DELETE" });
      fetchData();
    } catch (err) {
      alert("Delete failed");
    }
  };

  const addProductToSection = async (sectionId: string, productId: string) => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
      const res = await fetch(`${backendUrl}/api/admin/sections/${sectionId}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId })
      });
      if (res.ok) fetchData();
    } catch (err) {
      alert("Failed to add product");
    }
  };

  const removeProductFromSection = async (sectionId: string, productId: string) => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
      const res = await fetch(`${backendUrl}/api/admin/sections/${sectionId}/products/${productId}`, {
        method: "DELETE"
      });
      if (res.ok) fetchData();
    } catch (err) {
      alert("Failed to remove product");
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="page-container">Loading Sections...</div>;

  return (
    <div className="page-container animate-fade-in">
      <div className="section-header">
        <div>
          <h1 className="section-title" style={{ fontSize: '1.5rem' }}>Home Page Sections</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Create and curate manual product collections for the home page.
          </p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="stat-card" 
          style={{ 
            flexDirection: 'row', 
            padding: '0.75rem 1.25rem', 
            gap: '0.5rem', 
            backgroundColor: 'var(--primary)', 
            color: 'white',
            borderColor: 'var(--primary-hover)',
            alignItems: 'center',
            cursor: 'pointer'
          }}
        >
          <Plus size={18} />
          <span style={{ fontWeight: 700 }}>New Section</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem' }}>
        
        {/* Sections List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {sections.length === 0 ? (
            <div className="chart-section" style={{ textAlign: 'center', padding: '4rem' }}>
               <LayoutGrid size={48} color="#cbd5e1" style={{ margin: '0 auto 1.5rem' }} />
               <h3 style={{ color: '#64748b' }}>No sections created yet.</h3>
               <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Create your first collection to start curating the home page.</p>
            </div>
          ) : (
            sections.map((section) => (
              <div 
                key={section.id} 
                className={`chart-section ${selectedSection?.id === section.id ? 'active-row' : ''}`}
                style={{ 
                  padding: '0', 
                  overflow: 'hidden', 
                  border: selectedSection?.id === section.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                  cursor: 'pointer',
                  backgroundColor: selectedSection?.id === section.id ? '#f8fafc' : 'white'
                }}
                onClick={() => setSelectedSection(section)}
              >
                <div style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                     <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 800, fontSize: '0.75rem' }}>
                        {section.position + 1}
                     </div>
                     <h3 style={{ fontWeight: 800, color: '#1e293b' }}>{section.title}</h3>
                     <span className="badge badge-primary">{section.products.length} Products</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                     <button 
                       onClick={(e) => { e.stopPropagation(); deleteSection(section.id); }}
                       style={{ color: '#ef4444', opacity: 0.6 }}
                       onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                       onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
                     >
                       <Trash2 size={18} />
                     </button>
                     <ChevronRight size={20} color="#94a3b8" />
                  </div>
                </div>
                
                <div style={{ padding: '1rem', display: 'flex', gap: '0.75rem', overflowX: 'auto', backgroundColor: '#f8fafc' }}>
                   {section.products.length === 0 ? (
                     <p style={{ fontSize: '0.75rem', color: '#94a3b8', padding: '0.5rem' }}>No products in this section. Add some from the selector.</p>
                   ) : (
                     section.products.map((p: any) => (
                       <div key={p.id} style={{ minWidth: '120px', width: '120px', display: 'flex', flexDirection: 'column', gap: '0.5rem', position: 'relative', background: 'white', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                          <div style={{ width: '100%', aspectRatio: '1/1', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                             {p.images?.[0]?.url && <img src={p.images[0].url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                          </div>
                          <p style={{ fontSize: '10px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</p>
                          <button 
                            onClick={(e) => { e.stopPropagation(); removeProductFromSection(section.id, p.id); }}
                            style={{ position: 'absolute', top: '2px', right: '2px', backgroundColor: 'rgba(239, 68, 68, 0.9)', color: 'white', borderRadius: '50%', padding: '0.15rem' }}
                          >
                             <X size={12} />
                          </button>
                       </div>
                     ))
                   )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Product Selector Panel */}
        <div style={{ position: 'sticky', top: '84px', height: 'calc(100vh - 120px)' }}>
          <div className="chart-section" style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '0' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
               <h3 style={{ fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Package size={20} color="var(--primary)" />
                  {selectedSection ? `Adding to: ${selectedSection.title.slice(0, 15)}${selectedSection.title.length > 15 ? '...' : ''}` : "Catalog Products"}
               </h3>
               {!selectedSection && (
                 <div style={{ padding: '0.5rem', backgroundColor: '#fff7ed', border: '1px solid #ffedd5', borderRadius: '6px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <LayoutGrid size={14} color="#f97316" />
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#9a3412' }}>SELECT A SECTION ON THE LEFT TO ADD PRODUCTS</span>
                 </div>
               )}
               <div style={{ position: 'relative' }}>
                  <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input 
                    type="text" 
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ 
                      width: '100%', 
                      padding: '0.6rem 1rem 0.6rem 2.5rem', 
                      backgroundColor: 'var(--input)', 
                      border: '1px solid var(--border)', 
                      borderRadius: 'var(--radius)',
                      outline: 'none',
                      fontSize: '0.875rem'
                    }}
                  />
               </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {filteredProducts.map(p => {
                    const isAdded = selectedSection?.products.some((sp: any) => sp.id === p.id);
                    return (
                      <div 
                        key={p.id} 
                        className="stat-card" 
                        style={{ 
                          flexDirection: 'row', 
                          padding: '0.75rem', 
                          alignItems: 'center', 
                          justifyContent: 'space-between',
                          opacity: (isAdded || !selectedSection) ? 0.6 : 1,
                          cursor: !selectedSection ? 'not-allowed' : 'default'
                        }}
                      >
                         <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                            <div style={{ width: '40px', height: '40px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden', flexShrink: 0 }}>
                               {p.images?.[0]?.url && <img src={p.images[0].url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                            </div>
                            <div style={{ minWidth: 0 }}>
                               <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</p>
                               <p style={{ fontSize: '0.6875rem', color: '#64748b' }}>{p.sku || '#' + p.id.slice(-4)}</p>
                            </div>
                         </div>
                         <button 
                           disabled={isAdded || !selectedSection}
                           onClick={() => selectedSection && addProductToSection(selectedSection.id, p.id)}
                           style={{ 
                             padding: '0.4rem', 
                             borderRadius: '50%', 
                             backgroundColor: (isAdded || !selectedSection) ? '#f1f5f9' : 'var(--primary)', 
                             color: (isAdded || !selectedSection) ? '#94a3b8' : 'white',
                             cursor: !selectedSection ? 'not-allowed' : 'pointer'
                           }}
                         >
                            {isAdded ? <CheckCircle size={16} /> : <Plus size={16} />}
                         </button>
                      </div>
                    )
                  })}
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Section Modal */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
           <div className="chart-section animate-fade-in" style={{ width: '400px', margin: 0 }}>
              <h3 style={{ fontWeight: 800, fontSize: '1.25rem', marginBottom: '1.5rem' }}>New Collection Section</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                 <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Section Title</label>
                 <input 
                   type="text" 
                   value={newSectionTitle}
                   onChange={(e) => setNewSectionTitle(e.target.value)}
                   placeholder="e.g. Trendy Outfits"
                   style={{ 
                     width: '100%', 
                     padding: '0.875rem 1rem', 
                     backgroundColor: 'var(--input)', 
                     border: 'none', 
                     borderRadius: 'var(--radius)',
                     outline: 'none',
                     fontSize: '0.9375rem'
                   }}
                 />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                 <button 
                   onClick={() => setShowCreateModal(false)}
                   style={{ flex: 1, padding: '0.875rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', fontWeight: 700 }}
                 >
                   Cancel
                 </button>
                 <button 
                   onClick={createSection}
                   style={{ flex: 1, padding: '0.875rem', borderRadius: 'var(--radius)', backgroundColor: 'var(--primary)', color: 'white', fontWeight: 700 }}
                 >
                   Create Section
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
