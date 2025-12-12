import React, { useState, useEffect } from 'react';
import { Menu, X, Aperture, Globe, Check, Mail, Youtube, Instagram, BookOpen, ExternalLink, Copy } from 'lucide-react';

// --- TRADUCCIONES ---
const translations = {
  es: {
    menu: ['Inicio', 'Obra', 'Sobre mí', 'Blog', 'Contacto'],
    title: 'Kungfundidos',
    subtitle: 'Fotógrafo Callejero | Street Photography',
    emailLabel: 'Email de contacto',
    copy: 'Copiar',
    copied: '¡Copiado!',
    footer: '© 2025 Kungfundidos',
    links: {
      substack: 'Reflexiones y Reviews',
      youtube: 'Reviews, Vlogs, POV...',
      instagram: 'Portfolio "cotidiano"',
      xhs: 'Contenido en Chino',
      douyin: 'Cortos y Behind the Scenes',
      tiktok: 'Contenido Viral'
    }
  },
  zh: {
    menu: ['首页', '作品', '关于我', '博客', '联系'],
    title: 'Kungfundidos',
    subtitle: '街头摄影师',
    emailLabel: '联系邮箱',
    copy: '复制',
    copied: '已复制！',
    footer: '© 2025 Kungfundidos',
    links: {
      substack: '文章与思考',
      youtube: '视频博客，测评，POV...',
      instagram: '每日作品集',
      xhs: '中文测评和POV',
      douyin: '短片与幕后',
      tiktok: '热门内容'
    }
  },
  en: {
    menu: ['Home', 'Work', 'About', 'Journal', 'Contact'],
    title: 'Kungfundidos',
    subtitle: 'Street Photographer',
    emailLabel: 'Contact Email',
    copy: 'Copy',
    copied: 'Copied!',
    footer: '© 2025 Kungfundidos',
    links: {
      substack: 'Essays & Reviews',
      youtube: 'Vlogs, Reviews & POV',
      instagram: 'Daily Portfolio',
      xhs: 'Chinese content',
      douyin: 'Shorts & BTS',
      tiktok: 'Viral Content'
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

export default function ContactPage() {
  const [lang, setLang] = useState('es');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const t = translations[lang];

  // --- TÉCNICA ANTI-SPAM ---
  // Dividimos el email en partes para que no aparezca completo en el código fuente.
  // Los bots simples que escanean HTML no podrán leerlo.
  const user = 'contacto';
  const domain = 'kungfundidos.com';
  const email = `${user}@${domain}`; 

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

  const handleCopy = () => {
    // Copiamos la variable reconstruida
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleLang = (l) => {
    setLang(l);
    setIsLangMenuOpen(false);
  };

  const socialLinks = [
    { 
      id: 'substack', 
      name: 'Substack', 
      desc: t.links.substack, 
      url: 'https://substack.com/@kungfundidos', 
      icon: <BookOpen size={24} />,
      color: 'hover:border-[#FF6719] hover:text-[#FF6719]',
      bg: 'group-hover:bg-[#FF6719]/10'
    },
    { 
      id: 'youtube', 
      name: 'YouTube', 
      desc: t.links.youtube, 
      url: 'https://www.youtube.com/@Kungfundidos', 
      icon: <Youtube size={24} />,
      color: 'hover:border-[#FF0033] hover:text-[#FF0033]',
      bg: 'group-hover:bg-[#FF0033]/10'
    },
    { 
      id: 'instagram', 
      name: 'Instagram', 
      desc: t.links.instagram, 
      url: 'https://www.instagram.com/kungfundidos', 
      icon: <Instagram size={24} />,
      color: 'hover:border-[#E1306C] hover:text-[#E1306C]',
      bg: 'group-hover:bg-[#E1306C]/10'
    },
    { 
      id: 'xhs', 
      name: 'Xiaohongshu 小红书', 
      desc: t.links.xhs, 
      url: 'https://www.xiaohongshu.com/user/profile/62433dff0000000010005059', 
      icon: <span className="font-bold text-sm border-2 border-current px-1 rounded">红</span>,
      color: 'hover:border-[#FF2442] hover:text-[#FF2442]',
      bg: 'group-hover:bg-[#FF2442]/10'
    },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-[#e5e5e5] font-serif selection:bg-red-600 selection:text-white relative flex flex-col">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0 mix-blend-overlay fixed" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>

      {/* --- NAVEGACIÓN GLOBAL --- */}
      <nav className="fixed w-full z-50 py-6 px-6 md:py-8 md:px-12 mix-blend-difference">
        <div className="flex justify-between items-center max-w-[1800px] mx-auto">
          <a href="/" className="text-lg md:text-xl tracking-widest uppercase font-light hover:opacity-70 transition-opacity flex items-center gap-3">
            <Aperture className="text-red-600 animate-spin-slow" size={24} strokeWidth={2.5} />
            <span>Kungfundidos</span>
          </a>
          
          <div className="flex items-center gap-4 md:gap-12">
            <div className="hidden md:flex items-center gap-12">
              <div className="flex gap-12 text-xs tracking-[0.2em] uppercase font-sans">
                {t.menu.map((item) => (
                  <a 
                    key={item} 
                    href={getHref(item)}
                    className={`hover:text-red-600 transition-colors ${item === 'Contacto' || item === 'Contact' || item === '联系' ? 'text-red-600 font-bold' : ''}`}
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

      <main className="flex-grow flex flex-col items-center px-4 py-32 z-10 relative max-w-lg mx-auto w-full">
        <FadeIn>
          <div className="text-center mb-12 flex flex-col items-center">
            <div className="w-28 h-28 rounded-full bg-[#111] border border-neutral-800 mb-6 overflow-hidden relative group">
                <img 
                    src="/perfil.jpeg" 
                    alt="Kungfundidos Profile" 
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://ui-avatars.com/api/?name=K&background=111&color=fff&size=200'; }}
                />
            </div>
            <h1 className="text-3xl md:text-4xl font-light italic mb-2 tracking-wide text-white">{t.title}</h1>
            <p className="text-neutral-500 text-xs uppercase tracking-[0.2em] font-sans">{t.subtitle}</p>
          </div>
        </FadeIn>

        <div className="w-full space-y-4 mb-16">
          {socialLinks.map((link, idx) => (
            <FadeIn key={link.id} delay={100 + (idx * 50)}>
              <a href={link.url} target="_blank" rel="noopener noreferrer" className={`group relative flex items-center p-4 md:p-5 border border-neutral-900 bg-[#0a0a0a] rounded-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${link.color}`}>
                <div className={`absolute inset-0 opacity-0 transition-opacity duration-300 rounded-lg ${link.bg}`}></div>
                <div className="relative z-10 mr-5 text-neutral-500 group-hover:text-current transition-colors">{link.icon}</div>
                <div className="relative z-10 flex-grow">
                  <h3 className="text-lg font-light text-neutral-200 group-hover:text-current transition-colors leading-tight">{link.name}</h3>
                  <p className="text-[10px] text-neutral-600 uppercase tracking-widest font-sans mt-1 group-hover:text-neutral-400 transition-colors">{link.desc}</p>
                </div>
                <ExternalLink size={18} className="relative z-10 text-neutral-700 group-hover:text-current transition-colors opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0" />
              </a>
            </FadeIn>
          ))}
        </div>

        {/* --- SECCIÓN EMAIL (OBFUSCADA) --- */}
        <FadeIn delay={400}>
            <div className="w-full border-t border-neutral-900 pt-8 text-center">
                <p className="text-[10px] text-neutral-600 uppercase tracking-widest mb-4 font-sans">{t.emailLabel}</p>
                <div 
                    onClick={handleCopy}
                    className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-[#111] border border-neutral-800 cursor-pointer hover:border-red-900 hover:text-white transition-all group active:scale-95"
                >
                    <Mail size={16} className="text-red-600" />
                    {/* Renderizamos el email construido, no el literal */}
                    <span className="text-sm font-light tracking-wide">{email}</span>
                    {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-neutral-600 group-hover:text-white" />}
                </div>
                <div className={`h-4 mt-2 text-[10px] text-green-500 uppercase tracking-widest transition-opacity duration-300 ${copied ? 'opacity-100' : 'opacity-0'}`}>
                    {t.copied}
                </div>
            </div>
        </FadeIn>

      </main>

      <footer className="py-8 text-center text-[10px] uppercase tracking-widest text-neutral-800 z-10">
        {t.footer}
      </footer>
    </div>
  );
}


