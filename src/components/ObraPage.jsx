import React, { useState, useEffect } from 'react';
import { Menu, X, Aperture, Globe, Check } from 'lucide-react';

// --- DICCIONARIO DE TRADUCCIONES ---
const translations = {
  es: {
    // MENÚ GLOBAL (Añadido Inicio)
    menu: ['Inicio', 'Obra', 'Sobre mí', 'Blog', 'Contacto'],
    
    title: 'Archivo Completo',
    loading: 'Cargando archivo...',
    catalogued: 'obras catalogadas',
    back: 'Volver al Inicio',
    all: 'Todos',
    noImages: 'No se encontraron imágenes.',
    checkPath: 'Asegúrate de que tus fotos están en src/assets/carpeta/foto.jpg',
    footer: '© 2025 Kungfundidos',
    categories: {
      'arquitectura': 'Arquitectura',
      'calle': 'Calle',
      'detalles': 'Detalles',
      'hongkong': 'Hong Kong',
      'macao': 'Macao',
      'noche': 'Noche',
      'retratos': 'Retratos',
      'retratos-urbanos': 'Retratos Urbanos',
      'hong kong': 'Hong Kong',
      'retratos urbanos': 'Retratos Urbanos'
    }
  },
  zh: {
    menu: ['首页', '作品', '关于我', '博客', '联系'],
    title: '完整档案',
    loading: '加载档案...',
    catalogued: '件已编目作品',
    back: '返回首页',
    all: '全部',
    noImages: '未找到图片。',
    checkPath: '请确保照片位于 src/assets/文件夹/photo.jpg',
    footer: '© 2025 Kungfundidos',
    categories: {
      'arquitectura': '建筑',
      'calle': '街道',
      'detalles': '细节',
      'hongkong': '香港',
      'macao': '澳门',
      'noche': '夜景',
      'retratos': '人像',
      'retratos-urbanos': '城市人像',
      'hong kong': '香港',
      'retratos urbanos': '城市人像'
    }
  },
  en: {
    menu: ['Home', 'Work', 'About', 'Journal', 'Contact'],
    title: 'Full Archive',
    loading: 'Loading archive...',
    catalogued: 'catalogued works',
    back: 'Back to Home',
    all: 'All',
    noImages: 'No images found.',
    checkPath: 'Ensure photos are in src/assets/folder/photo.jpg',
    footer: '© 2025 Kungfundidos',
    categories: {
      'arquitectura': 'Architecture',
      'calle': 'Street',
      'detalles': 'Details',
      'hongkong': 'Hong Kong',
      'macao': 'Macao',
      'noche': 'Night',
      'retratos': 'Portraits',
      'retratos-urbanos': 'Urban Portraits',
      'hong kong': 'Hong Kong',
      'retratos urbanos': 'Urban Portraits'
    }
  }
};

// --- TU LÓGICA ORIGINAL (INTACTA) ---
const imageFiles = import.meta.glob('../assets/**/*.{png,jpg,jpeg,webp,PNG,JPG,JPEG,WEBP}', { eager: true });

const allPhotosRaw = Object.entries(imageFiles).map(([path, module], index) => {
  const parts = path.split('/');
  const folderName = parts[parts.length - 2]; 
  const fileName = parts[parts.length - 1].split('.')[0];

  const formatTitle = (text) => {
    try {
      return decodeURIComponent(text).replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    } catch (e) { return text; }
  };

  // @ts-ignore
  const imageSource = module.default;
  const finalUrl = (typeof imageSource === 'string') ? imageSource : imageSource.src;

  return {
    id: index,
    rawCategory: folderName.toLowerCase(),
    title: formatTitle(fileName),
    url: finalUrl
  };
});

const FadeIn = ({ children, delay = 0 }) => {
  const [visible, setVisible] = useState(false);
  const domRef = React.useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) setVisible(true); });
    });
    const currentRef = domRef.current;
    if (currentRef) observer.observe(currentRef);
    return () => { if (currentRef) observer.unobserve(currentRef); };
  }, []);

  return (
    <div ref={domRef} className={`transition-all duration-1000 ease-out transform ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
};

export default function ObraPage() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [activeCategoryKey, setActiveCategoryKey] = useState('all');
  const [lang, setLang] = useState('es');
  
  // NUEVOS ESTADOS PARA EL MENÚ
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  const t = translations[lang];

  // --- LÓGICA DE NAVEGACIÓN GLOBAL ---
  const getHref = (item) => {
    if (item === 'Inicio' || item === 'Home' || item === '首页') return '/';
    if (item === 'Obra' || item === 'Work' || item === '作品') return '/obra';
    if (item === 'Sobre mí' || item === 'About' || item === '关于我') return '/sobre-mi';
    if (item === 'Blog' || item === 'Journal' || item === '博客') return '/blog';
    if (item === 'Contacto' || item === 'Contact' || item === '联系') return '/contacto'; 
    return '/'; 
  };

  const allPhotos = allPhotosRaw.map(photo => {
    const translatedCat = t.categories[photo.rawCategory] || 
      photo.rawCategory.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    return { ...photo, category: translatedCat };
  });

  const categoryKeys = ['all', ...new Set(allPhotosRaw.map(photo => photo.rawCategory))];

  const filteredPhotos = activeCategoryKey === 'all' 
    ? allPhotos 
    : allPhotos.filter(photo => photo.rawCategory === activeCategoryKey);

  useEffect(() => {
    document.body.style.overflow = (selectedImage || isMenuOpen) ? 'hidden' : 'unset';
  }, [selectedImage, isMenuOpen]);

  const toggleLang = (l) => {
    setLang(l);
    setIsLangMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#e5e5e5] font-serif selection:bg-red-600 selection:text-white relative">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0 mix-blend-overlay fixed" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>

      {/* --- NAVEGACIÓN GLOBAL --- */}
      <nav className="fixed w-full z-50 py-6 px-6 md:py-8 md:px-12 mix-blend-difference">
        <div className="flex justify-between items-center max-w-[1800px] mx-auto">
          <a href="/" className="text-lg md:text-xl tracking-widest uppercase font-light hover:opacity-70 transition-opacity flex items-center gap-3">
            <Aperture className="text-red-600 animate-spin-slow" size={24} strokeWidth={2.5} />
            <span>Kungfundidos</span>
          </a>
          
          <div className="flex items-center gap-4 md:gap-12">
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-12">
              <div className="flex gap-12 text-xs tracking-[0.2em] uppercase font-sans">
                {t.menu.map((item) => (
                  <a 
                    key={item} 
                    href={getHref(item)}
                    className={`hover:text-red-600 transition-colors ${item === 'Obra' || item === 'Work' || item === '作品' ? 'text-red-600 font-bold' : ''}`}
                  >
                    {item}
                  </a>
                ))}
              </div>
              
              <div className="border-l border-neutral-800 pl-8 flex items-center gap-4 text-xs tracking-widest font-sans uppercase">
                {['es', 'zh', 'en'].map((l) => (
                  <button key={l} onClick={() => setLang(l)} className={`hover:text-red-600 transition-colors ${lang === l ? 'text-white font-bold' : 'text-neutral-500'}`}>
                    {l === 'es' ? 'Español' : l === 'zh' ? '中文' : 'English'}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Icons */}
            <div className="md:hidden relative">
              <button onClick={() => setIsLangMenuOpen(!isLangMenuOpen)} className={`p-2 transition-colors ${isLangMenuOpen ? 'text-red-600' : 'text-white'}`}>
                <Globe size={22} strokeWidth={1.5} />
              </button>
              <div className={`absolute top-full right-0 mt-4 bg-[#111] border border-neutral-800 p-2 min-w-[140px] flex flex-col gap-1 transition-all duration-300 origin-top-right ${isLangMenuOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'}`}>
                {['es', 'zh', 'en'].map((l) => (
                  <button key={l} onClick={() => toggleLang(l)} className={`text-left px-4 py-3 text-xs uppercase tracking-widest font-sans flex justify-between items-center hover:bg-neutral-900 ${lang === l ? 'text-red-600 font-bold' : 'text-neutral-400'}`}>
                    {l === 'es' ? 'Español' : l === 'zh' ? '中文' : 'English'}
                  </button>
                ))}
              </div>
            </div>

            <button className="md:hidden text-white p-2" onClick={() => setIsMenuOpen(true)}>
              <Menu size={24} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </nav>

      {/* Menú Móvil Overlay */}
      <div className={`fixed inset-0 bg-[#0a0a0a] z-[60] flex flex-col justify-center items-center transition-all duration-700 ${isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
        <button className="absolute top-6 right-6 text-white hover:text-red-600 transition-colors p-4" onClick={() => setIsMenuOpen(false)}>
          <X size={28} strokeWidth={1} />
        </button>
        <div className="flex flex-col gap-8 text-center font-light">
          {t.menu.map((item) => (
            <a key={item} href={getHref(item)} onClick={() => setIsMenuOpen(false)} className="text-4xl italic text-neutral-300 hover:text-red-600 transition-colors py-2">
              {item}
            </a>
          ))}
        </div>
      </div>

      {/* Header Galería */}
      <section className="pt-40 pb-12 px-6 text-center z-10 relative">
        <FadeIn>
          <h1 className="text-5xl md:text-7xl font-light italic mb-4">{t.title}</h1>
          <p className="text-neutral-500 text-xs uppercase tracking-widest mb-8">
            {allPhotos.length > 0 ? `${allPhotos.length} ${t.catalogued}` : t.loading}
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 md:gap-8 max-w-4xl mx-auto">
            {categoryKeys.map((catKey) => {
              const displayLabel = catKey === 'all' 
                ? t.all 
                : (t.categories[catKey] || catKey.replace(/[-_]/g, ' '));

              return (
                <button
                  key={catKey}
                  onClick={() => setActiveCategoryKey(catKey)}
                  className={`text-xs uppercase tracking-[0.2em] transition-all pb-1 border-b ${
                    activeCategoryKey === catKey 
                      ? 'text-white border-red-600 font-bold' 
                      : 'text-neutral-500 border-transparent hover:text-neutral-300 hover:border-neutral-800'
                  }`}
                >
                  {displayLabel}
                </button>
              );
            })}
          </div>
        </FadeIn>
      </section>

      {/* Grid de Galería */}
      <section className="pb-40 px-6 md:px-12 max-w-[1920px] mx-auto z-10 relative">
        {filteredPhotos.length > 0 ? (
          <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
            {filteredPhotos.map((item) => (
              <FadeIn key={item.id}>
                <div 
                  className="group cursor-pointer space-y-3 break-inside-avoid"
                  onClick={() => setSelectedImage(item)}
                >
                  <div className="overflow-hidden bg-[#111] relative">
                    <img 
                      src={item.url} 
                      alt={item.title} 
                      loading="lazy"
                      decoding="async" 
                      className="w-full h-auto object-cover grayscale brightness-[0.9] transition-all duration-700 group-hover:grayscale-0 group-hover:scale-[1.02]"
                    />
                  </div>
                  <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] uppercase tracking-widest text-red-600 bg-black/50 backdrop-blur-sm px-2 py-1">{item.category}</span>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border border-neutral-900 border-dashed rounded-lg">
            <p className="text-neutral-500 italic mb-2">{t.noImages}</p>
            <p className="text-xs text-neutral-600 font-sans">{t.checkPath}</p>
          </div>
        )}
      </section>

      <footer className="py-12 border-t border-neutral-900 text-center text-[10px] uppercase tracking-widest text-neutral-600">
        {t.footer}
      </footer>

      {/* Lightbox */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center cursor-zoom-out p-4"
          onClick={() => setSelectedImage(null)}
        >
          <img src={selectedImage.url} alt={selectedImage.title} className="max-w-full max-h-full object-contain shadow-2xl" />
          <div className="absolute bottom-6 left-6 text-white mix-blend-difference pointer-events-none">
             <h3 className="text-xl italic">{selectedImage.title}</h3>
             <p className="text-xs uppercase tracking-widest text-red-600 mt-1">{selectedImage.category}</p>
          </div>
        </div>
      )}
    </div>
  );
}