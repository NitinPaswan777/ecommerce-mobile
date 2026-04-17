"use client";

import { useState, useEffect } from "react";
import { Upload, Save, Globe, Image as ImageIcon, Video, Trash2, CheckCircle, Plus, ExternalLink, X, Layout, Sparkles, Edit2 } from "lucide-react";

interface Banner {
  id: string;
  title: string;
  subtitle: string;
  link: string;
  imageUrl: string;
  position: string;
  isActive: boolean;
  showOverlay: boolean;
}

// UNBREAKABLE DESIGN SYSTEM (Vanilla CSS Constants)
const UI = {
  card: {
    background: '#ffffff',
    borderRadius: '24px',
    padding: '32px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    border: '1px solid #f1f5f9',
    marginBottom: '40px'
  },
  label: {
    display: 'block',
    fontSize: '11px',
    fontWeight: 900,
    color: '#64748b',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    marginBottom: '8px'
  },
  input: {
    width: '100%',
    padding: '14px 20px',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '14px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#1e293b',
    outline: 'none'
  },
  primaryBtn: {
    background: '#0f172a',
    color: '#ffffff',
    padding: '14px 24px',
    borderRadius: '14px',
    border: 'none',
    fontWeight: 700,
    fontSize: '14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s'
  },
  secondaryBtn: {
    background: '#ffffff',
    color: '#334155',
    padding: '10px 18px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    fontWeight: 700,
    fontSize: '12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  }
};

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [config, setConfig] = useState<any>({
    siteName: "Savana Style",
    logoUrl: "",
  });

  const [newBanner, setNewBanner] = useState<any>({
    id: "",
    title: "",
    subtitle: "",
    link: "",
    imageUrl: "",
    position: "HERO_1",
    isActive: true,
    showOverlay: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const configRes = await fetch("http://localhost:5000/api/admin/site-config");
      if (configRes.ok) setConfig(await configRes.json());
      const bannersRes = await fetch("http://localhost:5000/api/admin/banners");
      if (bannersRes.ok) setBanners(await bannersRes.json());
    } catch (error) {
      console.error("Failed to fetch settings", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'logoUrl' | 'bannerUrl') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (field === 'bannerUrl') setUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append("file", file);
    try {
      const res = await fetch("http://localhost:5000/api/admin/upload", {
        method: "POST",
        body: formDataUpload,
      });
      if (res.ok) {
        const { url } = await res.json();
        if (field === 'logoUrl') setConfig((prev: any) => ({ ...prev, logoUrl: url }));
        else setNewBanner((prev: any) => ({ ...prev, imageUrl: url }));
      }
    } catch (error) {
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    setSuccess(false);
    try {
      const res = await fetch("http://localhost:5000/api/admin/site-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error) {
      alert("Failed to save branding");
    } finally {
      setSaving(false);
    }
  };

  const addBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBanner.imageUrl) return alert("Upload banner image first");

    const method = newBanner.id ? "PUT" : "POST";
    const url = newBanner.id 
      ? `http://localhost:5000/api/admin/banners/${newBanner.id}` 
      : "http://localhost:5000/api/admin/banners";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBanner),
      });
      if (res.ok) {
        setNewBanner({ id: "", title: "", subtitle: "", link: "", imageUrl: "", position: "HERO_1", isActive: true, showOverlay: true });
        setIsModalOpen(false);
        fetchData();
      }
    } catch (error) {
      alert("Failed to save banner");
    }
  };

  const deleteBanner = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/admin/banners/${id}`, { method: "DELETE" });
      if (res.ok) fetchData();
    } catch (error) {
      alert("Delete failed");
    }
  };

  const openForm = (banner?: Banner) => {
    if (banner) {
      setNewBanner(banner);
    } else {
      setNewBanner({ id: "", title: "", subtitle: "", link: "", imageUrl: "", position: "HERO_1", isActive: true, showOverlay: true });
    }
    setIsModalOpen(true);
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', fontWeight: 900, fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Fetching Configuration...</div>;

  return (
    <div style={{ padding: '40px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>Settings</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#64748b' }}>Configure your storefront identity and visuals.</p>
        </div>
        <button 
          onClick={saveConfig} 
          disabled={saving} 
          style={{ ...UI.primaryBtn, background: success ? '#10b981' : '#0f172a' }}
        >
          {success ? <CheckCircle size={18} /> : <Save size={18} />}
          <span>{saving ? "Saving..." : (success ? "Saved!" : "Save Changes")}</span>
        </button>
      </div>

      <div style={{ maxWidth: '1200px' }}>
        
        {/* BRAND IDENTITY CARD */}
        <div style={UI.card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
             <div style={{ padding: '10px', background: '#eff6ff', color: '#3b82f6', borderRadius: '12px' }}><Globe size={20} /></div>
             <h3 style={{ margin: 0, fontWeight: 900, fontSize: '16px', color: '#1e293b', textTransform: 'uppercase' }}>Site Branding</h3>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
            <div>
              <label style={UI.label}>Store Name</label>
              <input 
                type="text" 
                style={UI.input}
                value={config.siteName || ""}
                onChange={(e) => setConfig({...config, siteName: e.target.value})}
                placeholder="Savana Style"
              />
            </div>

            <div>
              <label style={UI.label}>Brand Logo</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ width: '80px', height: '80px', background: '#f8fafc', border: '2px dashed #e2e8f0', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {config.logoUrl ? <img src={config.logoUrl} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', padding: '10px' }} /> : <ImageIcon size={24} color="#cbd5e1" />}
                </div>
                <div>
                  <input type="file" id="logo-up" hidden onChange={(e) => handleFileUpload(e, 'logoUrl')} />
                  <label htmlFor="logo-up" style={UI.secondaryBtn}>
                    <Upload size={14} /> Replace
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SLIDESHOW BANNERS CARD */}
        <div style={UI.card}>
           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ padding: '10px', background: '#ecfdf5', color: '#10b981', borderRadius: '12px' }}><Layout size={20} /></div>
                <h3 style={{ margin: 0, fontWeight: 900, fontSize: '16px', color: '#1e293b', textTransform: 'uppercase' }}>Banner Slideshow</h3>
              </div>
              <button onClick={() => openForm()} style={{ ...UI.primaryBtn, background: '#10b981', padding: '10px 20px' }}>
                <Plus size={18} /> <span>Add Banner</span>
              </button>
           </div>

           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
              {banners.length === 0 ? (
                <div style={{ gridColumn: '1/-1', padding: '60px', background: '#f8fafc', borderRadius: '24px', border: '2px dashed #e2e8f0', textAlign: 'center' }}>
                   <ImageIcon size={40} color="#cbd5e1" style={{ marginBottom: '12px' }} />
                   <p style={{ margin: 0, fontSize: '12px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>No active banners</p>
                </div>
              ) : (
                banners.map(banner => (
                  <div key={banner.id} style={{ border: '1px solid #f1f5f9', borderRadius: '24px', overflow: 'hidden', background: '#fff' }}>
                     <div style={{ position: 'relative', width: '100%', aspectRatio: '21/9', overflow: 'hidden' }}>
                        <img src={banner.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '8px' }}>
                           <button onClick={() => openForm(banner)} style={{ background: 'white', color: '#3b82f6', border: 'none', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                              <Edit2 size={14} />
                           </button>
                           <button onClick={() => deleteBanner(banner.id)} style={{ background: 'white', color: '#ef4444', border: 'none', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                              <Trash2 size={14} />
                           </button>
                        </div>
                     </div>
                     <div style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: '#1e293b', textTransform: 'uppercase' }}>{banner.title || "Untitled"}</h4>
                          <span style={{ fontSize: '9px', fontWeight: 900, padding: '2px 6px', background: banner.showOverlay ? '#eff6ff' : '#f1f5f9', color: banner.showOverlay ? '#3b82f6' : '#94a3b8', borderRadius: '6px' }}>
                            {banner.showOverlay ? "OVERLAY ON" : "OVERLAY OFF"}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px', fontSize: '11px', color: '#64748b' }}>
                           <ExternalLink size={12} /> <span style={{ textDecoration: 'underline' }}>{banner.link || "No link"}</span>
                        </div>
                     </div>
                  </div>
                ))
              )}
           </div>
        </div>
      </div>

      {/* MODAL - VANILLA CSS BOX (NO TAILWIND) */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: '#ffffff', width: '100%', maxWidth: '500px', borderRadius: '32px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
             <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 32px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                   <div style={{ color: '#6366f1' }}><Sparkles size={18} /></div>
                   <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 900, textTransform: 'uppercase', color: '#1e293b' }}>
                     {newBanner.id ? "Edit Banner" : "New Banner"}
                   </h2>
                </div>
                <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={20} /></button>
             </div>

             <form onSubmit={addBanner} style={{ padding: '32px' }}>
                <div style={{ marginBottom: '24px' }}>
                   <label style={UI.label}>Banner Image</label>
                   <div style={{ position: 'relative', width: '100%', aspectRatio: '21/9', background: '#f8fafc', border: '2px dashed #e2e8f0', borderRadius: '16px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {uploading ? <div style={{ fontWeight: 900, fontSize: '10px', color: '#6366f1' }}>Uploading...</div> :
                       newBanner.imageUrl ? <img src={newBanner.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> :
                       <div style={{ textAlign: 'center', color: '#cbd5e1' }}>
                          <ImageIcon size={32} />
                          <div style={{ fontSize: '10px', fontWeight: 800, marginTop: '8px' }}>Select Image</div>
                       </div>
                      }
                      <input type="file" id="sl-up" hidden onChange={(e) => handleFileUpload(e, 'bannerUrl')} accept="image/*" />
                      <label htmlFor="sl-up" style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'white', padding: '8px', borderRadius: '10px', display: 'flex', border: '1px solid #e2e8f0', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}><Upload size={14} /></label>
                   </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                   <div>
                      <label style={UI.label}>Banner Title</label>
                      <input type="text" style={UI.input} value={newBanner.title} placeholder="Summer Sale" onChange={e => setNewBanner({...newBanner, title: e.target.value})} />
                   </div>
                   <div>
                      <label style={UI.label}>Deep Link</label>
                      <input type="text" style={UI.input} value={newBanner.link} placeholder="/category/.." onChange={e => setNewBanner({...newBanner, link: e.target.value})} />
                   </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', padding: '12px', background: '#f8fafc', borderRadius: '12px' }}>
                   <input 
                     type="checkbox" 
                     id="show-ov" 
                     checked={newBanner.showOverlay} 
                     onChange={e => setNewBanner({...newBanner, showOverlay: e.target.checked})} 
                     style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                   />
                   <label htmlFor="show-ov" style={{ fontSize: '13px', fontWeight: 700, color: '#334155', cursor: 'pointer' }}>Show Text Overlay (Title/Subtitle/Button)</label>
                </div>

                <div style={{ marginBottom: '32px' }}>
                   <label style={UI.label}>Subtitle / Message</label>
                   <input type="text" style={UI.input} value={newBanner.subtitle} placeholder="Up to 50% Off" onChange={e => setNewBanner({...newBanner, subtitle: e.target.value})} />
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                   <button type="button" onClick={() => setIsModalOpen(false)} style={{ ...UI.primaryBtn, background: '#f1f5f9', color: '#64748b', flex: 1, justifyContent: 'center' }}>Cancel</button>
                   <button type="submit" style={{ ...UI.primaryBtn, background: '#6366f1', flex: 1, justifyContent: 'center' }}>
                     {newBanner.id ? "Update Banner" : "Create Banner"}
                   </button>
                </div>
             </form>
          </div>
        </div>
      )}

    </div>
  );
}
