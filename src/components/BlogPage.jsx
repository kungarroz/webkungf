import React, { useState, useEffect, useMemo } from 'react';
import { Menu, X, Aperture, Globe, Check, ArrowUpRight, Clock, Calendar } from 'lucide-react';

// --- CONFIGURACIÓN DE CONTENIDO ESTÁTICO (TEXTOS UI) ---
const translations = {
  es: {
    // MENÚ GLOBAL (Añadido 'Inicio')
    menu: ['Inicio', 'Obra', 'Sobre mí', 'Blog', 'Contacto'],
    
    // CONTENIDO BLOG
    title: 'Blog',
    subtitle: 'Reflexiones sobre fotografía, cultura y luz.',
    featuredLabel: 'Destacado',
    readMore: 'Leer Artículo',
    readTime: 'min de lectura',
    footer: '© 2025 Kungfundidos',
  },
  zh: {
    menu: ['首页', '作品', '关于我', '博客', '联系'],
    title: '日志',
    subtitle: '关于摄影、文化与光的思考。',
    featuredLabel: '精选',
    readMore: '阅读文章',
    readTime: '分钟阅读',
    footer: '© 2025 Kungfundidos',
  },
  en: {
    menu: ['Home', 'Work', 'About', 'Blog', 'Contact'],
    title: 'Blog',
    subtitle: 'Thoughts on photography, culture, and light.',
    featuredLabel: 'Featured',
    readMore: 'Read Article',
    readTime: 'min read',
    footer: '© 2025 Kungfundidos',
  }
};

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

export default function BlogPage({ automaticPosts = [] }) {
  // Inicialización de idioma basada en el contenido recibido
  const initialLang = automaticPosts && automaticPosts.length > 0 
    ? automaticPosts[0].slug.split('/')[0] 
    : 'es';

  // Estados
  const [lang, setLang] = useState(initialLang);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  
  const t = translations[lang] || translations.es;
  const sourceData = automaticPosts || [];

  // --- LÓGICA DE NAVEGACIÓN GLOBAL ---
  const getHref = (item) => {
    if (item === 'Inicio' || item === 'Home' || item === '首页') return '/';
    if (item === 'Obra' || item === 'Work' || item === '作品') return '/obra';
    if (item === 'Sobre mí' || item === 'About' || item === '关于我') return '/sobre-mi';
    if (item === 'Blog' || item === 'Blog' || item === '博客') return '/blog';
    if (item === 'Contacto' || item === 'Contact' || item === '联系') return '/contacto'; 
    return '/'; 
  };

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : 'unset';
  }, [isMenuOpen]);

  // --- LÓGICA DE TRANSFORMACIÓN DE POSTS ---
  const displayPosts = useMemo(() => {
    // 1. Procesar datos
    const processed = sourceData.map(post => {
      // Si no existe imagen procesada, usamos fallback
      const realThumbnailPath = post.image || `/${post.folderPath}/Cover.jpg`;
      
      return {
        id: post.slug, 
        title: post.title,
        excerpt: post.excerpt,
        category: post.category || 'General',
        date: post.date,
        readTime: Math.ceil((post.excerpt?.length || 500) / 100).toString(), 
        image: realThumbnailPath, 
        link: post.link,
        langCode: post.slug.split('/')[0] 
      };
    });

    // 2. Filtrar por idioma seleccionado en UI (si hay mezcla de posts)
    const langPosts = processed.filter(post => post.langCode === lang);

    return langPosts.length > 0 ? langPosts : processed; 
  }, [lang, sourceData]);

  const toggleLang = (l) => {
    setLang(l);
    setIsLangMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#e5e5e5] font-serif selection:bg-red-600 selection:text-white relative">
      {/* Texture Overlay */}
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
                    className={`hover:text-red-600 transition-colors ${item === 'Blog' || item === 'Blog' || item === '博客' ? 'text-red-600 font-bold' : ''}`}
                  >
                    {item}
                  </a>
                ))}
              </div>
              
              {/* Desktop Language Selector */}
              <div className="border-l border-neutral-800 pl-8 flex items-center gap-4 text-xs tracking-widest font-sans uppercase">
                {['es', 'zh', 'en'].map((l) => (
                  <button 
                    key={l}
                    onClick={() => toggleLang(l)} 
                    className={`hover:text-red-600 transition-colors ${lang === l ? 'text-white font-bold' : 'text-neutral-500'}`}
                  >
                    {l === 'es' ? 'Español' : l === 'zh' ? '中文' : 'English'}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Language Icon & Dropdown */}
            <div className="md:hidden relative">
              <button 
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className={`p-2 transition-colors ${isLangMenuOpen ? 'text-red-600' : 'text-white'}`}
              >
                <Globe size={22} strokeWidth={1.5} />
              </button>

              <div className={`absolute top-full right-0 mt-4 bg-[#111] border border-neutral-800 p-2 min-w-[140px] flex flex-col gap-1 transition-all duration-300 origin-top-right ${isLangMenuOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'}`}>
                {[
                  { code: 'es', label: 'Español' },
                  { code: 'zh', label: '中文' },
                  { code: 'en', label: 'English' }
                ].map((l) => (
                  <button
                    key={l.code}
                    onClick={() => toggleLang(l)}
                    className={`text-left px-4 py-3 text-xs uppercase tracking-widest font-sans flex justify-between items-center hover:bg-neutral-900 ${lang === l.code ? 'text-red-600 font-bold' : 'text-neutral-400'}`}
                  >
                    {l.label}
                    {lang === l.code && <Check size={12} />}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden text-white p-2" 
              onClick={() => setIsMenuOpen(true)}
            >
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
            <a 
              key={item} 
              href={getHref(item)} 
              onClick={() => setIsMenuOpen(false)}
              className="text-4xl italic text-neutral-300 hover:text-red-600 transition-colors py-2"
            >
              {item}
            </a>
          ))}
        </div>
      </div>

      {/* Contenido Principal */}
      <main className="relative pt-40 pb-20 px-6 md:px-12 max-w-6xl mx-auto z-10">
        <FadeIn>
          <div className="border-b border-neutral-900 pb-12 mb-16">
            <h1 className="text-6xl md:text-8xl font-light italic mb-4 text-white/90">{t.title}</h1>
            <p className="text-neutral-500 font-sans uppercase tracking-[0.2em] text-xs">{t.subtitle}</p>
          </div>
        </FadeIn>

        {displayPosts.length > 0 ? (
          <>
            {/* Post Destacado */}
            <FadeIn delay={100}>
              <a href={displayPosts[0].link} className="group relative grid md:grid-cols-2 gap-8 md:gap-16 items-center mb-32 cursor-pointer">
                <div className="relative overflow-hidden aspect-[4/3] bg-[#111]">
                  <img 
                    src={displayPosts[0].image} 
                    alt={displayPosts[0].title} 
                    onError={(e) => {
                      e.target.onerror = null; 
                      e.target.style.opacity = '0.5';
                    }}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 ease-out transform group-hover:scale-105" 
                  />
                  <div className="absolute top-4 left-4 bg-red-600 text-white text-[10px] uppercase tracking-widest px-3 py-1 font-sans font-bold">
                    {t.featuredLabel}
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="flex items-center gap-4 text-xs font-sans uppercase tracking-widest text-neutral-500">
                    <span className="text-red-600">{displayPosts[0].category}</span>
                    <span>—</span>
                    <span>{displayPosts[0].date}</span>
                  </div>
                  <h2 className="text-3xl md:text-5xl font-light leading-tight text-white group-hover:text-red-600 transition-colors duration-500">
                    {displayPosts[0].title}
                  </h2>
                  <p className="text-neutral-400 font-light leading-relaxed line-clamp-3">
                    {displayPosts[0].excerpt}
                  </p>
                  <div className="pt-4 flex items-center gap-2 text-xs uppercase tracking-widest text-white border-b border-transparent group-hover:border-red-600 w-max pb-1 transition-all">
                    {t.readMore} <ArrowUpRight size={14} />
                  </div>
                </div>
              </a>
            </FadeIn>

            {/* Lista restante */}
            <div className="space-y-0">
              {displayPosts.slice(1).map((post, idx) => (
                <FadeIn key={idx} delay={200 + (idx * 50)}>
                  <a href={post.link} className="group py-12 border-t border-neutral-900 grid md:grid-cols-12 gap-8 items-start cursor-pointer hover:bg-[#0a0a0a] transition-colors -mx-6 px-6">
                    <div className="md:col-span-3 flex flex-col gap-2">
                      <span className="text-xs font-sans uppercase tracking-widest text-neutral-500 group-hover:text-red-600 transition-colors">
                        {post.category}
                      </span>
                      <div className="flex items-center gap-2 text-[10px] text-neutral-600 font-sans uppercase tracking-wider">
                        <Calendar size={12} /> {post.date}
                      </div>
                    </div>
                    <div className="md:col-span-6">
                      <h3 className="text-2xl md:text-3xl font-light mb-3 text-neutral-300 group-hover:text-white transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-sm text-neutral-500 font-light leading-relaxed line-clamp-2">
                        {post.excerpt}
                      </p>
                    </div>
                    <div className="md:col-span-3 flex md:justify-end items-center gap-4 md:gap-8 mt-4 md:mt-0">
                      <span className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-neutral-600">
                        <Clock size={12} /> {post.readTime} {t.readTime}
                      </span>
                      <div className="w-8 h-8 rounded-full border border-neutral-800 flex items-center justify-center text-neutral-500 group-hover:border-red-600 group-hover:text-red-600 transition-all opacity-0 group-hover:opacity-100">
                        <ArrowUpRight size={14} />
                      </div>
                    </div>
                  </a>
                </FadeIn>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-32 border-t border-neutral-900 mt-12">
            <p className="text-neutral-500 italic text-xl font-light">No hay entradas disponibles en este idioma.</p>
          </div>
        )}

      </main>

      <footer className="py-24 border-t border-neutral-900 text-center px-6">
        <p className="text-[10px] uppercase tracking-widest text-neutral-600">
          {t.footer}
        </p>
      </footer>
    </div>
  );
}