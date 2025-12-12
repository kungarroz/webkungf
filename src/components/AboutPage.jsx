import React, { useState, useEffect } from 'react';
import { Menu, X, Aperture, Globe, Check, Landmark, Video } from 'lucide-react';

// --- TRADUCCIONES Y CONTENIDO ---
const translations = {
  es: {
    // MENÚ GLOBAL (Añadido Inicio)
    menu: ['Inicio', 'Obra', 'Sobre mí', 'Blog', 'Contacto'],
    
    // CONTENIDO ESPECÍFICO
    title: 'Sobre mí',
    paragraphs: [
      'Guangzhou, en el sur de China, es mi segundo hogar y el lienzo para mi pasión: la fotografía callejera. Mi cámara es una excusa para recorrer sus calles y buscar las historias que se esconden en la vida cotidiana.',
      'Mi filosofía es simple: capturar la vida tal como es, sin pretensiones. En lugar de buscar la perfección técnica, me centro en la emoción de un momento.',
      'Mi equipo, compuesto por cámaras Fujifilm y objetivos TTArtisan, es la herramienta que me permite convertir esos instantes en un relato visual con un toque cinematográfico.',
      'Este espacio es una extensión de esa filosofía. No encontrarás análisis de laboratorio, sino experiencias reales de un fotógrafo de calle.'
    ],
    signature: 'Kungfundidos',
    milestones: {
      title: 'Trayectoria',
      museum: {
        title: 'Museo de Arte de GZ',
        desc: 'Obra seleccionada para la exposición permanente "Perspectivas Urbanas".'
      },
      ambassador: {
        title: 'TTArtisan & Creación',
        desc: 'Embajador de marca y creador de contenido.'
      }
    },
    footer: {
      text: 'Si te gusta lo que ves o tienes curiosidad por el equipo que uso, me encantaría charlar contigo.',
      cta: 'Escríbeme'
    }
  },
  zh: {
    menu: ['首页', '作品', '关于我', '博客', '联系'],
    title: '关于我',
    paragraphs: [
      '位于中国南方的广州是我的第二故乡，也是我街头摄影热情的画布。我的相机是我穿梭于街道的借口，去寻找隐藏在日常生活中的故事。',
      '我的哲学很简单：捕捉生活原本的样子，毫不做作。我不追求技术上的完美，而是专注于当下的情感。',
      '我的装备由富士相机和铭匠光学（TTArtisan）镜头组成，它们是我将这些瞬间转化为具有电影感的视觉叙事的工具。',
      '这个空间是这种哲学的延伸。你在这里找不到实验室般的分析，只有一个街头摄影师的真实体验。'
    ],
    signature: 'Kungfundidos',
    milestones: {
      title: '轨迹',
      museum: {
        title: '广州艺术博物馆',
        desc: '作品入选“城市视角”常设展览。'
      },
      ambassador: {
        title: '铭匠光学 (TTArtisan)',
        desc: '品牌大使与内容创作者'
      }
    },
    footer: {
      text: '如果你喜欢你所看到的，或者对我不完美的器材感到好奇，我很乐意与你交流。',
      cta: '写信给我'
    }
  },
  en: {
    menu: ['Home', 'Work', 'About', 'Journal', 'Contact'],
    title: 'About Me',
    paragraphs: [
      'Guangzhou, in southern China, is my second home and the canvas for my passion: street photography. My camera is an excuse to roam its streets and seek out the stories hidden in everyday life.',
      'My philosophy is simple: capture life as it is, without pretense. Instead of seeking technical perfection, I focus on the emotion of a moment.',
      'My gear, consisting of Fujifilm cameras and TTArtisan lenses, is simply the tool that allows me to turn those moments into a visual narrative with a cinematic touch.',
      'This space is an extension of that philosophy. You won\'t find lab analysis here, but real experiences from a street photographer.'
    ],
    signature: 'Kungfundidos',
    milestones: {
      title: 'Path',
      museum: {
        title: 'GZ Art Museum',
        desc: 'Work selected for the permanent exhibition "Urban Perspectives".'
      },
      ambassador: {
        title: 'TTArtisan & Creation',
        desc: 'Brand ambassador and content creator.'
      }
    },
    footer: {
      text: 'If you like what you see or are curious about the gear I use, I\'d love to chat.',
      cta: 'Write me'
    }
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

export default function AboutPage() {
  const [lang, setLang] = useState('es');
  
  // Estados para el Menú Global
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

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : 'unset';
  }, [isMenuOpen]);

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
                    className={`hover:text-red-600 transition-colors ${item === 'Sobre mí' || item === 'About' || item === '关于我' ? 'text-red-600 font-bold' : ''}`}
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

      {/* Contenido Central */}
      <main className="relative pt-40 pb-20 px-6 md:px-12 max-w-3xl mx-auto z-10 flex flex-col items-center">
        
        {/* Título */}
        <FadeIn>
          <h1 className="text-4xl md:text-5xl font-light italic mb-12 text-center text-white/90">
            {t.title}
          </h1>
        </FadeIn>

        {/* Imagen Atmosférica Principal */}
        <FadeIn delay={100}>
          <div className="w-full aspect-video md:aspect-[21/9] overflow-hidden bg-[#111] mb-16 relative shadow-2xl shadow-black/50">
             <img 
               src="/perfil2.jpeg" 
               alt="Foto de perfil" 
               className="w-full h-full object-cover grayscale opacity-80 hover:opacity-100 transition-opacity duration-1000"
               onError={(e) => {
                 e.target.onerror = null; 
                 e.target.src = 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=1600&q=80';
               }}
             />
          </div>
        </FadeIn>

        {/* Texto Narrativo */}
        <div className="prose prose-invert prose-lg md:prose-xl font-light leading-relaxed text-neutral-300 space-y-8 text-justify md:text-left mb-16">
          {t.paragraphs.map((paragraph, index) => (
            <FadeIn key={index} delay={200 + (index * 50)}>
              <p className={index === 0 ? "first-letter:text-5xl first-letter:font-serif first-letter:text-red-600 first-letter:float-left first-letter:mr-3 first-letter:mt-[-10px]" : ""}>
                {paragraph}
              </p>
            </FadeIn>
          ))}
        </div>

        {/* --- SECCIÓN: Trayectoria / Hitos --- */}
        <div className="w-full border-t border-neutral-900 pt-16 mb-16">
          <FadeIn>
            <h2 className="text-xs uppercase tracking-[0.3em] text-neutral-500 mb-12 text-center md:text-left">{t.milestones.title}</h2>
          </FadeIn>
          
          <div className="grid md:grid-cols-2 gap-12">
            
            {/* GRUPO 1 */}
            <div className="flex flex-col gap-6">
              <FadeIn delay={100}>
                <div className="flex gap-6 group">
                  <div className="flex-shrink-0 text-red-600/70 group-hover:text-red-600 transition-colors pt-1">
                    <Landmark size={24} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-lg text-white font-serif italic mb-2">{t.milestones.museum.title}</h3>
                    <p className="text-sm text-neutral-400 font-light leading-relaxed">{t.milestones.museum.desc}</p>
                  </div>
                </div>
              </FadeIn>
              
              <FadeIn delay={200}>
                 <div className="bg-[#111] overflow-hidden h-48 w-full opacity-80 hover:opacity-100 transition-opacity duration-700">
                    <img 
                      src="/museo.jpeg" 
                      alt="Architecture detail" 
                      className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000"
                      onError={(e) => e.target.style.display = 'none'} 
                    />
                 </div>
              </FadeIn>
            </div>

            {/* GRUPO 2 */}
            <div className="flex flex-col gap-6">
              <FadeIn delay={300}>
                <div className="flex gap-6 group">
                  <div className="flex-shrink-0 text-red-600/70 group-hover:text-red-600 transition-colors pt-1">
                    <Video size={24} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-lg text-white font-serif italic mb-2">{t.milestones.ambassador.title}</h3>
                    <p className="text-sm text-neutral-400 font-light leading-relaxed">{t.milestones.ambassador.desc}</p>
                  </div>
                </div>
              </FadeIn>

              <FadeIn delay={400}>
                 <div className="bg-[#111] overflow-hidden h-48 w-full opacity-80 hover:opacity-100 transition-opacity duration-700">
                    <img 
                      src="/creador.jpeg" 
                      alt="Street detail" 
                      className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                 </div>
              </FadeIn>
            </div>

          </div>
        </div>

      </main>

      {/* Footer Minimalista */}
      <footer className="py-24 border-t border-neutral-900 text-center px-6">
        <FadeIn>
          <p className="text-neutral-500 max-w-md mx-auto mb-8 font-light text-sm leading-loose">
            {t.footer.text}
          </p>
          <a 
            href="/contacto" 
            className="text-xs uppercase tracking-[0.2em] text-white border-b border-red-600 pb-1 hover:text-red-600 hover:border-transparent transition-all"
          >
            {t.footer.cta}
          </a>
        </FadeIn>
      </footer>
    </div>
  );
}


