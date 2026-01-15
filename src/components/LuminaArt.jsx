import React, { useState, useEffect } from 'react';
import { Menu, X, Aperture, Globe, Check, ArrowRight, MoveDown, ArrowUpRight } from 'lucide-react';

// --- IMPORTACIÓN DE IMÁGENES LOCALES ---
import imgSpotlight from '../assets/calle/calle20.jpeg'; 

// --- CONFIGURACIÓN DE CONTENIDO ---

const content = {
  es: {
    menu: ['Obra', 'Sobre mí', 'Blog', 'Contacto'],
    heroSubtitle: 'Fotografía Callejera',
    heroTitle: ['China,', 'a pie de calle'],
    scroll: 'Explorar',
    statement: 'Un archivo personal de todo lo que me encuentro cuando salgo a caminar.',
    spotlightTitle: 'Guangzhou',
    spotlightSub: 'Serie Nocturna',
    viewWork: 'Ver Obra Completa',
    latestPostLabel: 'Último en el Blog',
    latestPostTitle: 'Review: TTArtisan AF 56mm F1.8',
    latestPostExcerpt: 'Una exploración del rendimiento y la estética de este objetivo en las calles de Guangzhou.',
    latestPostDate: '02 ABR 2024',
    latestPostLink: '/es/blog/ttartisan56mm18', // CORREGIDO: Ruta correcta /es/blog/...
    readPost: 'Leer Artículo',
    footerTitle: 'Hablemos.',
  },
  zh: {
    menu: ['作品', '关于我', '博客', '联系'],
    heroSubtitle: '街头摄影',
    heroTitle: ['中国', '街头'], 
    scroll: '探索',
    statement: '一份关于我散步时所见所闻的个人档案。',
    spotlightTitle: '广州',
    spotlightSub: '夜间系列',
    viewWork: '查看完整作品',
    latestPostLabel: '最新日志',
    latestPostTitle: '评测：铭匠 TTArtisan AF 56mm',
    latestPostExcerpt: '在广州街头探索这款镜头的性能与美学。',
    latestPostDate: '2024年 4月',
    latestPostLink: '/zh/blog/ttartisan56mm18', // Ruta versión china
    readPost: '阅读文章',
    footerTitle: '联系我。',
  },
  en: {
    menu: ['Work', 'About', 'Journal', 'Contact'],
    heroSubtitle: 'Street Photography',
    heroTitle: ['China', 'Street Level'],
    scroll: 'Explore',
    statement: 'A personal archive of everything I encounter when I go for a walk.',
    spotlightTitle: 'Guangzhou',
    spotlightSub: 'Night Series',
    viewWork: 'View Full Work',
    latestPostLabel: 'Latest Journal',
    latestPostTitle: 'Review: TTArtisan AF 56mm F1.8',
    latestPostExcerpt: 'An exploration of performance and aesthetics of this lens on the streets of Guangzhou.',
    latestPostDate: '02 APR 2024',
    latestPostLink: '/en/blog/ttartisan56mm18', // Ruta versión inglesa
    readPost: 'Read Article',
    footerTitle: 'Let\'s Talk.',
  }
};

const FadeIn = ({ children, delay = 0 }) => {
  const [visible, setVisible] = useState(false);
  const domRef = React.useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) setVisible(true);
      });
    }, { threshold: 0.1 }); 
    const currentRef = domRef.current;
    if (currentRef) observer.observe(currentRef);
    return () => { if (currentRef) observer.unobserve(currentRef); };
  }, []);

  return (
    <div
      ref={domRef}
      className={`transition-all duration-1000 ease-out transform ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [lang, setLang] = useState('es');

  const t = content[lang];

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : 'unset';
  }, [isMenuOpen]);

  const toggleLang = (l) => {
    setLang(l);
    setIsLangMenuOpen(false);
  };

  const getHref = (item) => {
    if (item === 'Obra' || item === 'Work' || item === '作品') return '/obra';
    if (item === 'Sobre mí' || item === 'About' || item === '关于我') return '/sobre-mi';
    if (item === 'Blog' || item === 'Journal' || item === '博客') return '/blog';
    if (item === 'Contacto' || item === 'Contact' || item === '联系') return '/contacto'; 
    return '#';
  };

  // Función auxiliar para formatear la fecha visualmente
  const renderDate = (dateString) => {
    const parts = dateString.split(' ');
    // Asumimos formato "02 ABR 2024"
    if (parts.length >= 2) {
      return (
        <>
          <span className="text-5xl md:text-6xl font-serif italic text-white group-hover:text-red-600 transition-colors duration-500">
            {parts[0]}
          </span>
          <span className="text-xs uppercase tracking-[0.3em] text-neutral-500 mt-2 font-sans">
            {parts.slice(1).join(' ')}
          </span>
        </>
      );
    }
    return <span className="text-xl text-white">{dateString}</span>;
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#e5e5e5] font-serif selection:bg-red-600 selection:text-white relative flex flex-col overflow-x-hidden">
      
      {/* Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0 mix-blend-overlay fixed" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>

      {/* Navegación */}
      <nav className="fixed w-full z-50 py-6 px-6 md:py-8 md:px-12 mix-blend-difference">
        <div className="flex justify-between items-center max-w-[1800px] mx-auto">
          <a href="/" className="text-lg md:text-xl tracking-widest uppercase font-light hover:opacity-70 transition-opacity flex items-center gap-3">
            <img src="/logo.svg" alt="Logo" className="w-8 h-8 rounded-md" />
            <span>Kungfundidos</span>
          </a>
          
          <div className="flex items-center gap-4 md:gap-12">
            <div className="hidden md:flex items-center gap-12">
              <div className="flex gap-12 text-xs tracking-[0.2em] uppercase font-sans">
                {t.menu.map((item) => (
                  <a key={item} href={getHref(item)} className="hover:text-red-600 transition-colors">
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

            <div className="md:hidden relative">
              <button onClick={() => setIsLangMenuOpen(!isLangMenuOpen)} className={`p-2 transition-colors ${isLangMenuOpen ? 'text-red-600' : 'text-white'}`}>
                <Globe size={22} strokeWidth={1.5} />
              </button>
              {/* CORRECCIÓN MENÚ MÓVIL: Ahora itera sobre objetos para mostrar los labels correctamente */}
              <div className={`absolute top-full right-0 mt-4 bg-[#111] border border-neutral-800 p-2 min-w-[140px] flex flex-col gap-1 transition-all duration-300 origin-top-right ${isLangMenuOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'}`}>
                {[
                  { code: 'es', label: 'Español' },
                  { code: 'zh', label: '中文' },
                  { code: 'en', label: 'English' }
                ].map((l) => (
                  <button key={l.code} onClick={() => toggleLang(l.code)} className={`text-left px-4 py-3 text-xs uppercase tracking-widest font-sans flex justify-between items-center hover:bg-neutral-900 ${lang === l.code ? 'text-red-600 font-bold' : 'text-neutral-400'}`}>
                    {l.label}
                    {lang === l.code && <Check size={12} />}
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

      {/* Hero */}
      <main className="h-screen flex flex-col justify-center items-center px-6 relative z-10">
        <FadeIn>
          <div className="text-center space-y-8 md:space-y-10">
            <span className="block text-xs md:text-sm uppercase tracking-[0.6em] text-red-600 font-sans font-bold animate-pulse">
              {t.heroSubtitle}
            </span>
            <h1 className="text-6xl md:text-9xl font-light leading-none tracking-tighter mix-blend-lighten opacity-95">
              {t.heroTitle[0]} <br/>
              <span className="italic font-serif relative inline-block mt-2 md:mt-4">
                {t.heroTitle[1]}
                <span className="absolute -right-3 md:-right-6 top-0 md:top-2 text-red-600 text-6xl md:text-9xl leading-none">.</span>
              </span>
            </h1>
          </div>
        </FadeIn>
        
        <div className="absolute bottom-12 w-full flex flex-col items-center gap-4 opacity-50">
           <MoveDown size={24} className="text-red-600 animate-bounce" strokeWidth={1} />
        </div>
      </main>

      {/* Statement */}
      <section className="pt-12 pb-24 md:pt-20 md:pb-32 px-6 md:px-12 max-w-4xl mx-auto text-center z-10 relative">
         <FadeIn>
           <div className="h-[1px] w-12 bg-red-600 mx-auto mb-12"></div>
           <p className="text-2xl md:text-4xl font-light leading-snug text-neutral-300 italic">
             "{t.statement}"
           </p>
         </FadeIn>
      </section>

      {/* Spotlight Image */}
      <section className="pb-24 px-6 md:px-12 w-full z-10 relative">
         <FadeIn>
           <a href="/obra" className="block max-w-[1400px] mx-auto relative group cursor-pointer">
              <div className="aspect-[16/9] md:aspect-[21/9] overflow-hidden bg-[#111] shadow-2xl relative">
                {/* Overlay oscuro al hover para resaltar el texto */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-500 z-10"></div>
                
                {/* Texto central al hover */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 z-20">
                    <span className="text-2xl md:text-4xl font-light italic tracking-widest text-white border-b border-red-600 pb-2">
                        {t.viewWork}
                    </span>
                </div>

                <img 
                    src={imgSpotlight.src} 
                    alt="Spotlight"
                    className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-[2s] ease-in-out transform group-hover:scale-105"
                />
              </div>
              
              <div className="absolute -bottom-6 right-6 md:-right-6 bg-[#050505] border border-neutral-900 px-6 py-4 flex items-center gap-4 shadow-xl z-20">
                 <div>
                    <h3 className="text-xl font-light italic text-white">{t.spotlightTitle}</h3>
                    <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-sans">{t.spotlightSub}</p>
                 </div>
                 <div className="h-8 w-[1px] bg-red-600"></div>
                 <ArrowRight size={16} className="text-neutral-400 group-hover:text-red-600 transition-colors" />
              </div>
           </a>
         </FadeIn>
      </section>

      {/* Último Post del Blog (Diseño con Fecha) */}
      <section className="py-24 px-6 md:px-12 bg-[#080808] z-10 relative border-t border-neutral-900">
        <div className="max-w-4xl mx-auto">
            <FadeIn>
                <div className="flex flex-col md:flex-row items-baseline justify-between mb-12 border-b border-neutral-800 pb-4">
                    <h2 className="text-xs uppercase tracking-[0.3em] text-red-600 font-bold mb-4 md:mb-0">{t.latestPostLabel}</h2>
                    <a href="/blog" className="text-[10px] uppercase tracking-widest text-neutral-500 hover:text-white transition-colors flex items-center gap-2">
                        {t.menu[2]} <ArrowRight size={12} />
                    </a>
                </div>

                {/* CORRECCIÓN: Enlace dinámico según el idioma seleccionado */}
                <a href={t.latestPostLink} className="group block">
                    <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-center">
                        {/* CAJA DE FECHA ELEGANTE */}
                        <div className="w-full md:w-1/3 aspect-[4/3] flex flex-col justify-center items-center bg-[#111] border border-neutral-900 group-hover:border-red-900/50 transition-colors duration-500 relative overflow-hidden">
                            {/* Efecto hover sutil en fondo */}
                            <div className="absolute inset-0 bg-red-900/0 group-hover:bg-red-900/5 transition-colors duration-500"></div>
                            {renderDate(t.latestPostDate)}
                        </div>
                        
                        {/* Contenido */}
                        <div className="w-full md:w-2/3 space-y-4">
                            <h3 className="text-3xl md:text-4xl font-light italic text-white group-hover:text-red-600 transition-colors duration-500 leading-tight">
                                {t.latestPostTitle}
                            </h3>
                            <p className="text-neutral-500 font-light leading-relaxed">
                                {t.latestPostExcerpt}
                            </p>
                            <div className="pt-4 flex items-center gap-2 text-xs uppercase tracking-widest text-white group-hover:translate-x-2 transition-transform duration-500">
                                {t.readPost} <ArrowUpRight size={14} className="text-red-600" />
                            </div>
                        </div>
                    </div>
                </a>
            </FadeIn>
        </div>
      </section>

      {/* Footer Minimalista */}
      <footer id="contacto" className="py-24 px-6 md:px-12 bg-[#050505] z-10 relative border-t border-neutral-900/50">
        <div className="max-w-[1800px] mx-auto flex flex-col items-center justify-center gap-8">
          <FadeIn>
            <a href="/contacto" className="group">
              <h2 className="text-7xl md:text-9xl font-light hover:text-red-600 transition-colors duration-500 cursor-pointer text-center">
                {t.footerTitle}
              </h2>
            </a>
            <div className="text-center mt-12">
              <p className="text-neutral-800 text-[10px] uppercase tracking-widest font-sans">© 2025 Kungfundidos</p>
            </div>
          </FadeIn>
        </div>
      </footer>
    </div>
  );
}