import React, { useState, useEffect, useRef } from 'react';
import { 
  Menu, X, MapPin, Calendar, Camera, 
  ArrowRight, Heart, Plane, Footprints, 
  Ship, Coffee, Sun, Star, Anchor, Maximize2, QrCode, ScanLine, Info
} from 'lucide-react';
import { db, doc, onSnapshot, updateDoc, increment, setDoc, getDoc } from '../services/firebase';
import { PollData, ItineraryItem, GuideProfile } from '../types';

// --- Constants & Assets ---
const ASSETS = {
  // Replaced broken 302.ai links with stable Unsplash images matching the Jeju/Vintage theme
  
  // Hero: Coastal Cliff / Ocean with vintage vibe
  hero: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=80", 
  
  // Highlight 2 (Small): Hiker/Walking (Olle Trail vibe)
  highlight1: "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=800&q=80", 
  
  // Highlight 1 (Big): Udo Island / Lighthouse / Blue Ocean
  highlight2: "https://images.unsplash.com/photo-1504700610630-ac6aba3536d3?auto=format&fit=crop&w=1200&q=80", 
  
  // Highlight 3 (Wide): Vintage Christmas / Cozy
  highlight3: "https://images.unsplash.com/photo-1512389142860-9c449e58a543?auto=format&fit=crop&w=1200&q=80", 
  
  // Itinerary Images
  // Day 0: Cozy/Relaxing Arrival (Greenery)
  day0: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80", 
  
  // Day 1: Deep Blue Ocean Texture
  day1: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&w=800&q=80", 
  
  // Day 2: Christmas/Festive House or Village
  day2: "https://images.unsplash.com/photo-1576919228236-a097c32a58be?auto=format&fit=crop&w=800&q=80", 
  
  // Day 3: Stone Path / Farewell
  day3: "https://images.unsplash.com/photo-1494451733671-55db00085a67?auto=format&fit=crop&w=800&q=80", 
  
  guide1: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=400&q=80", // Male guide avatar
  guide2: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80", // Female guide avatar
  qr: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=WeChat-Contact" // Generated QR
};

const ITINERARY: ItineraryItem[] = [
  { 
    day: "Day 0", 
    date: "12.22", 
    title: "抵达 · 济州集合", 
    desc: "济州市区集合。自行前往酒店办理入住，安顿行囊，准备迎接冬日海岛的徒步旅程。", 
    icon: "🛬", 
    image: ASSETS.day0 
  },
  { 
    day: "Day 1", 
    date: "12.23", 
    title: "徒步 · 山海印记", 
    desc: "偶来小路 18 & 19 号线。早上前往金万德纪念馆领取护照，途径三阳沙滩盖章。徒步至终点后，前往咸德沙滩与犀牛峰，夜宿海边民宿。", 
    icon: "👣", 
    image: ASSETS.day1 
  },
  { 
    day: "Day 2", 
    date: "12.24", 
    title: "离岛 · 城山牛岛", 
    desc: "晨间打卡城山日出峰，随后轮渡前往牛岛，完成偶来 1-1 线环岛徒步。晚归城山晚餐，自行探访附近的圣诞集市。", 
    icon: "⛴️", 
    image: ASSETS.day2 
  },
  { 
    day: "Day 3", 
    date: "12.25", 
    title: "余兴 · 咸德告别", 
    desc: "睡个巨懒的觉，再去咸德沙滩发发呆。午餐举行结线仪式，分享旅途见闻，随后解散，送机或继续探索济州市区。", 
    icon: "🎄", 
    image: ASSETS.day3 
  },
];

const SCENARIOS = [
  { id: 'coffee', label: '独立咖啡馆' },
  { id: 'market', label: '复古市集' },
  { id: 'film', label: '胶片摄影' },
  { id: 'music', label: '黑胶唱片店' },
];

// --- Utility Components ---

const Reveal: React.FC<{ children: React.ReactNode; className?: string; delay?: number }> = ({ children, className = "", delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setTimeout(() => setIsVisible(true), delay);
        observer.disconnect();
      }
    }, { threshold: 0.1 });
    
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div ref={ref} className={`transition-all duration-1000 ease-out transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'} ${className}`}>
      {children}
    </div>
  );
};

// --- Main Page Component ---

const JejuPage: React.FC = () => {
  const [scrollY, setScrollY] = useState(0);
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [pollData, setPollData] = useState<PollData>({ design: { optionA: 42, optionB: 12 }, scenarios: {} });
  const [hasVotedMain, setHasVotedMain] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Parallax & Scroll Listener
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Mouse move for image preview
  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  // Firebase Poll Listener
  useEffect(() => {
    if (!db) return; // Fallback for no DB
    
    const unsubMain = onSnapshot(doc(db, "poll_results", "jeju_main_poll"), (doc) => {
      if (doc.exists()) {
        setPollData(prev => ({ ...prev, design: doc.data() as any }));
      }
    });

    const unsubScenarios = onSnapshot(doc(db, "poll_results", "jeju_scenarios_poll"), (doc) => {
      if (doc.exists()) {
        setPollData(prev => ({ ...prev, scenarios: doc.data() as any }));
      }
    });

    // Check local storage
    if (localStorage.getItem('jeju_voted_main')) setHasVotedMain(true);

    return () => {
      unsubMain();
      unsubScenarios();
    };
  }, []);

  const handleMainVote = async (option: 'optionA' | 'optionB') => {
    if (hasVotedMain) return;
    setHasVotedMain(true);
    localStorage.setItem('jeju_voted_main', 'true');
    
    // Optimistic update
    setPollData(prev => ({
      ...prev,
      design: { ...prev.design, [option]: prev.design[option] + 1 }
    }));

    if (db) {
      const ref = doc(db, "poll_results", "jeju_main_poll");
      try {
        await updateDoc(ref, { [option]: increment(1) });
      } catch (e) {
        // If doc doesn't exist yet
        await setDoc(ref, { optionA: option === 'optionA' ? 1 : 0, optionB: option === 'optionB' ? 1 : 0 });
      }
    }
  };

  return (
    <div className="min-h-screen bg-jeju-bg bg-noise text-jeju-charcoal selection:bg-jeju-orange selection:text-white overflow-hidden relative">
      
      {/* --- Lightbox --- */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-jeju-charcoal/95 backdrop-blur-md p-4 cursor-zoom-out animate-in fade-in duration-200"
          onClick={() => setPreviewImage(null)}
        >
          <img src={previewImage} alt="Full view" className="max-h-[85vh] max-w-[95vw] shadow-2xl rounded-lg border-2 border-jeju-bg" />
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/80 font-mono text-xs bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm">
            Click to close
          </div>
        </div>
      )}

      {/* --- Navbar --- */}
      <nav className="fixed top-0 w-full z-40 px-6 py-4 flex justify-between items-center mix-blend-multiply text-jeju-teal pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* MCM Starburst Icon */}
          <Sun className="w-8 h-8 fill-jeju-orange text-jeju-orange animate-spin-slow" />
          <span className="font-serif font-black tracking-widest text-lg">JEJU VINTAGE</span>
        </div>
        
        <div className="flex items-center gap-4">
           {/* Hint */}
           <div className="hidden md:flex items-center gap-2 text-[10px] font-mono bg-white/50 backdrop-blur px-3 py-1 rounded-full border border-jeju-charcoal/10 text-jeju-charcoal/60 pointer-events-auto">
             <Maximize2 className="w-3 h-3" />
             <span>CLICK IMAGES TO EXPAND</span>
           </div>

           <div className="font-mono text-xs border border-jeju-teal/30 px-3 py-1 rounded-full bg-jeju-bg/50 backdrop-blur-sm pointer-events-auto">
             WINTER 2025
           </div>
        </div>
      </nav>

      {/* --- Hero Section --- */}
      <section className="relative h-screen flex flex-col justify-center items-center overflow-hidden px-4">
        {/* Background Big Text */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[20vw] font-black text-jeju-orange/10 font-serif leading-none select-none z-0"
          style={{ transform: `translate(-50%, calc(-50% + ${scrollY * 0.2}px))` }}
        >
          JEJU
        </div>

        {/* Floating Shapes (MCM Blobs) */}
        <div className="absolute top-20 right-[10%] w-32 h-32 bg-jeju-teal/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-[10%] w-48 h-48 bg-jeju-mustard/30 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col items-center text-center max-w-4xl w-full">
          <Reveal delay={200}>
            <div className="inline-block px-4 py-1 mb-6 border border-jeju-charcoal rounded-full text-xs font-bold tracking-widest uppercase bg-jeju-orange text-white transform -rotate-2 shadow-lg">
              Organic Journey
            </div>
          </Reveal>
          
          <Reveal delay={400}>
            <h1 className="text-6xl md:text-8xl font-serif font-black text-jeju-charcoal mb-8 relative">
              橘屿<br/><span className="text-jeju-orange">冬日信</span>
              {/* Dol Hareubang Badge - Resized for mobile */}
              <div className="absolute -top-6 -right-2 md:-top-10 md:-right-20 w-12 h-12 md:w-24 md:h-24 bg-jeju-teal rounded-full flex items-center justify-center transform rotate-12 shadow-xl border-4 border-jeju-bg z-20">
                 <span className="text-xl md:text-3xl">🗿</span>
              </div>
            </h1>
          </Reveal>

          <Reveal delay={600}>
            <p className="text-lg md:text-xl font-medium leading-relaxed max-w-lg mx-auto text-jeju-charcoal/80 mb-12">
              "在橘子树与海风的间隙，<br/>
              拾起被城市遗忘的时间。<br/>
              一场关于<strong>偶来小路、火山岩与圣诞</strong>的治愈出逃。"
            </p>
          </Reveal>

          {/* Hero Image with Blob Clip */}
          <Reveal delay={800} className="w-full max-w-3xl relative">
            <div className="relative aspect-video group cursor-zoom-in" onClick={() => setPreviewImage(ASSETS.hero)}>
              <div className="absolute inset-0 bg-jeju-orange rounded-[2rem] transform rotate-2 translate-y-2 translate-x-2"></div>
              <img 
                src={ASSETS.hero} 
                alt="Jeju Coast" 
                className="relative w-full h-full object-cover rounded-[2rem] border-2 border-jeju-charcoal filter contrast-110 group-hover:scale-[1.01] transition-transform duration-500"
              />
              <div className="absolute bottom-4 left-4 bg-jeju-bg/90 px-4 py-2 rounded-lg font-serif text-sm shadow-md border border-jeju-charcoal z-10">
                📍 Udo Island
              </div>
              
              {/* Click Hint */}
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-jeju-teal border border-jeju-teal/20 shadow-sm opacity-100 animate-pulse md:animate-none md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10 flex items-center gap-1">
                <Maximize2 className="w-3 h-3" />
                Tap to View
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* --- Highlights --- */}
      <section className="py-24 px-6 md:px-12 bg-white/50 relative">
         <div className="max-w-6xl mx-auto">
            <Reveal>
              <div className="flex justify-between items-end mb-16">
                <h2 className="text-4xl md:text-5xl font-serif font-bold text-jeju-teal flex items-center gap-4">
                  <Star className="fill-jeju-teal w-8 h-8" />
                  精选体验
                </h2>
                <div className="flex items-center gap-2 text-xs font-mono text-jeju-charcoal/60 bg-jeju-bg px-3 py-1 rounded-full border border-jeju-charcoal/10">
                   <Info className="w-3 h-3" />
                   <span>图片均可点击放大</span>
                </div>
              </div>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
               {/* Card 1: Udo (Big) */}
               <Reveal className="md:col-span-8 group cursor-zoom-in" delay={100}>
                  <div className="relative h-[400px] md:h-[500px] overflow-hidden rounded-lg border-2 border-jeju-charcoal shadow-[8px_8px_0px_0px_rgba(74,78,77,1)] transition-transform hover:-translate-y-1 hover:shadow-[12px_12px_0px_0px_rgba(74,78,77,1)]" onClick={() => setPreviewImage(ASSETS.highlight2)}>
                    <img src={ASSETS.highlight2} className="w-full h-full object-cover" alt="Udo" />
                    <div className="absolute top-4 left-4 bg-jeju-orange text-white px-3 py-1 text-xs font-bold tracking-wider">LANDSCAPE</div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-jeju-charcoal/90 to-transparent p-6 pt-24">
                       <h3 className="text-2xl font-serif font-bold text-white mb-2">牛岛环游</h3>
                       <p className="text-jeju-bg/90">骑行在离岛的离岛，看海水的颜色分层，在珊瑚沙滩虚度时光。</p>
                    </div>
                  </div>
               </Reveal>

               {/* Card 2: Olle (Small) */}
               <Reveal className="md:col-span-4 flex flex-col gap-8" delay={200}>
                  <div className="relative flex-1 overflow-hidden rounded-lg border-2 border-jeju-charcoal shadow-[6px_6px_0px_0px_#E27D60] transition-transform hover:-translate-y-1 group cursor-zoom-in" onClick={() => setPreviewImage(ASSETS.highlight1)}>
                    <img src={ASSETS.highlight1} className="w-full h-full object-cover" alt="Olle" />
                    <div className="absolute inset-0 bg-jeju-teal/10 mix-blend-multiply"></div>
                    <div className="absolute bottom-0 p-4 bg-jeju-bg w-full border-t-2 border-jeju-charcoal">
                       <h3 className="text-xl font-serif font-bold mb-1">偶来漫步</h3>
                       <p className="text-xs text-jeju-charcoal/70">Route 18 & 19，用双脚丈量咸德犀牛峰的日落。</p>
                    </div>
                  </div>
               </Reveal>

               {/* Card 3: Christmas (Wide) */}
               <Reveal className="md:col-span-12 group cursor-zoom-in" delay={300}>
                 <div className="relative h-72 rounded-lg bg-jeju-teal border-2 border-jeju-charcoal shadow-[8px_8px_0px_0px_#E9C46A] overflow-hidden flex items-center hover:-translate-y-1 transition-transform" onClick={() => setPreviewImage(ASSETS.highlight3)}>
                    <div className="w-1/2 h-full relative">
                       <img src={ASSETS.highlight3} className="w-full h-full object-cover" alt="Christmas" />
                       <div className="absolute inset-0 bg-jeju-orange/10 mix-blend-overlay"></div>
                    </div>
                    <div className="w-1/2 p-4 md:p-8 flex flex-col justify-center">
                       <div className="text-jeju-mustard text-xs font-bold mb-2 tracking-widest">FESTIVE</div>
                       <h3 className="text-2xl md:text-3xl font-serif font-bold text-white mb-4">橘色圣诞</h3>
                       <p className="text-jeju-bg/80 text-sm md:text-base">没有拥挤的人潮，只有小螃蟹陪伴的原生态治愈平安夜。</p>
                       <div className="mt-6 flex items-center gap-2 text-xs text-jeju-mustard font-bold bg-white/10 w-fit px-3 py-1 rounded-full">
                         <Maximize2 className="w-3 h-3" /> 点击放大
                       </div>
                    </div>
                 </div>
               </Reveal>
            </div>
         </div>
      </section>

      {/* --- Itinerary --- */}
      <section className="py-24 px-6 md:px-12 relative overflow-hidden" onMouseMove={handleMouseMove}>
        {/* Hover Preview Image */}
        {hoveredDay !== null && (
          <div 
            className="fixed pointer-events-none z-50 transition-opacity duration-300 rounded-lg overflow-hidden border-4 border-jeju-bg shadow-2xl w-64 h-48 hidden md:block"
            style={{ 
              top: mousePos.y + 20, 
              left: mousePos.x + 20,
              opacity: 1
            }}
          >
            <img src={ITINERARY[hoveredDay].image} className="w-full h-full object-cover" alt="Preview" />
          </div>
        )}

        <div className="max-w-4xl mx-auto relative z-10">
          <Reveal>
            <div className="text-center mb-20">
              <span className="font-mono text-jeju-orange uppercase tracking-widest text-sm block mb-2">Schedule</span>
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-jeju-charcoal">行程时间轴</h2>
              <p className="text-xs text-jeju-charcoal/50 mt-4 flex items-center justify-center gap-1">
                <Info className="w-3 h-3" /> 点击行程标题查看实景图
              </p>
            </div>
          </Reveal>

          <div className="relative border-l-2 border-jeju-charcoal/20 ml-4 md:ml-0 space-y-12 pl-8 md:pl-0">
            {ITINERARY.map((item, index) => (
              <Reveal key={index} delay={index * 100}>
                <div 
                  className="relative md:grid md:grid-cols-5 md:gap-10 group"
                  onMouseEnter={() => setHoveredDay(index)}
                  onMouseLeave={() => setHoveredDay(null)}
                >
                  {/* Timeline Dot */}
                  <div className="absolute -left-[39px] md:left-auto md:right-0 md:col-start-2 top-0 w-5 h-5 bg-jeju-bg border-4 border-jeju-orange rounded-full z-10 transition-colors group-hover:bg-jeju-orange md:transform md:translate-x-1/2"></div>
                  
                  {/* Left: Date (Desktop) */}
                  <div className="hidden md:block md:col-span-2 text-right pt-1">
                    <span className="font-serif text-3xl font-bold text-jeju-teal block">{item.day}</span>
                    <span className="font-mono text-jeju-charcoal/60">{item.date}</span>
                  </div>

                  {/* Right: Content */}
                  <div className="md:col-span-3 pt-1 pb-8 border-b border-jeju-charcoal/10 group-last:border-0">
                    <div className="flex items-center gap-3 mb-2 md:hidden">
                       <span className="font-serif font-bold text-jeju-teal">{item.day}</span>
                       <span className="text-xs font-mono bg-jeju-charcoal/10 px-2 py-0.5 rounded">{item.date}</span>
                    </div>
                    
                    <div className="flex items-start gap-4">
                      <span className="text-4xl filter grayscale group-hover:grayscale-0 transition-all">{item.icon}</span>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-jeju-charcoal group-hover:text-jeju-orange transition-colors cursor-zoom-in flex items-center gap-2 w-fit" onClick={() => setPreviewImage(item.image)}>
                          {item.title}
                          <Camera className="w-4 h-4 opacity-30 group-hover:opacity-100 transition-opacity text-jeju-orange" />
                        </h3>
                        <p className="text-jeju-charcoal/70 mt-2 leading-relaxed text-sm">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* --- Guides & Price --- */}
      <section className="py-24 px-6 md:px-12 bg-jeju-teal/5 border-y-2 border-jeju-charcoal border-dashed">
         <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-16 items-start">
               {/* Guides */}
               <div>
                  <Reveal>
                    <h2 className="text-3xl font-serif font-bold text-jeju-teal mb-10">领队介绍</h2>
                  </Reveal>
                  <div className="space-y-8">
                    {[
                      { name: "呱呱", role: "岛屿探险家", desc: "熟悉每一条偶来小路，知道哪里风最小，哪里橘子最甜。", img: ASSETS.guide1 },
                      { name: "小贾", role: "生活方式主理人", desc: "寻找最出片的橘子园，为你的胶片相机寻找最佳光影。", img: ASSETS.guide2 }
                    ].map((guide, i) => (
                      <Reveal key={i} delay={i * 200}>
                        <div className="flex items-stretch gap-6 bg-jeju-bg p-4 rounded-lg border border-jeju-charcoal shadow-md relative overflow-hidden group">
                           {/* Retro TV/Film Frame */}
                           <div className="w-24 h-24 flex-shrink-0 relative rounded-md overflow-hidden border-4 border-double border-jeju-charcoal bg-jeju-charcoal/10">
                              <img src={guide.img} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt={guide.name} />
                           </div>
                           
                           <div className="flex-1 flex flex-col justify-center z-10">
                              <div className="text-xs font-bold text-jeju-orange uppercase tracking-wider mb-1">{guide.role}</div>
                              <h3 className="text-xl font-serif font-bold text-jeju-charcoal mb-2">{guide.name}</h3>
                              <p className="text-xs text-jeju-charcoal/70">{guide.desc}</p>
                           </div>

                           {/* QR Code Placeholder Slot - More Distinct */}
                           <div className="w-20 flex flex-col items-center justify-center border-l-2 border-dashed border-jeju-charcoal/20 pl-4 bg-jeju-mustard/5">
                              <div className="w-14 h-14 bg-white border border-jeju-charcoal/30 flex items-center justify-center rounded shadow-sm relative group-hover:scale-105 transition-transform">
                                 <QrCode className="w-8 h-8 text-jeju-charcoal/20" />
                                 <div className="absolute inset-0 flex items-center justify-center text-[8px] text-jeju-charcoal/40 font-mono">
                                    SCAN ME
                                 </div>
                              </div>
                           </div>

                           <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-jeju-mustard/20 rounded-full blur-xl"></div>
                        </div>
                      </Reveal>
                    ))}
                  </div>
               </div>

               {/* Price */}
               <Reveal delay={300} className="relative">
                  <div className="bg-jeju-mustard p-8 rounded-lg border-2 border-jeju-charcoal shadow-[12px_12px_0px_0px_#264653] transform rotate-1 hover:rotate-0 transition-transform duration-300">
                     <div className="absolute -top-6 -left-6 bg-jeju-orange text-white w-20 h-20 rounded-full flex items-center justify-center font-black text-xl shadow-lg border-2 border-jeju-charcoal animate-bounce">
                        EARLY<br/>BIRD
                     </div>
                     <h2 className="text-3xl font-serif font-bold text-jeju-charcoal mb-6 text-center border-b-2 border-jeju-charcoal/20 pb-4">
                        行程费用
                     </h2>
                     <div className="text-center mb-8">
                        <span className="text-sm line-through text-jeju-charcoal/50 mr-2">¥4,599</span>
                        <span className="text-5xl font-black text-jeju-charcoal">¥3,xxx</span>
                        <span className="text-sm font-bold block mt-2 text-jeju-charcoal/70">/ 人 (不含机票)</span>
                     </div>
                     <ul className="space-y-3 mb-8 text-sm font-medium text-jeju-charcoal/80">
                        <li className="flex items-center gap-2"><div className="w-2 h-2 bg-jeju-charcoal rounded-full"></div> 全程包车接送服务</li>
                        <li className="flex items-center gap-2"><div className="w-2 h-2 bg-jeju-charcoal rounded-full"></div> 牛岛往返船票 + 环岛巴士/骑行</li>
                        <li className="flex items-center gap-2"><div className="w-2 h-2 bg-jeju-charcoal rounded-full"></div> 偶来护照一本</li>
                        <li className="flex items-center gap-2"><div className="w-2 h-2 bg-jeju-charcoal rounded-full"></div> 全程专业摄影跟拍 + 修图</li>
                     </ul>
                     <button className="w-full bg-jeju-charcoal text-jeju-bg py-4 font-bold text-lg rounded border-2 border-jeju-bg hover:bg-jeju-teal transition-colors flex items-center justify-center gap-2">
                        咨询报名 <ArrowRight className="w-5 h-5" />
                     </button>
                  </div>
               </Reveal>
            </div>
         </div>
      </section>

      {/* --- Polls --- */}
      <section className="py-24 px-4 bg-jeju-orange/10">
         <div className="max-w-2xl mx-auto text-center">
            <Reveal>
              <div className="bg-jeju-bg p-8 md:p-12 rounded-2xl shadow-xl border border-jeju-orange/20 relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-jeju-orange via-jeju-mustard to-jeju-teal"></div>
                 
                 <h3 className="text-2xl font-serif font-bold text-jeju-charcoal mb-8">这种「复古杂志风」的行程介绍，你喜欢吗？</h3>
                 
                 <div className="grid grid-cols-2 gap-4 mb-8">
                    <button 
                      onClick={() => handleMainVote('optionA')}
                      disabled={hasVotedMain}
                      className={`p-6 rounded-lg border-2 transition-all ${
                        hasVotedMain 
                        ? 'border-jeju-charcoal/10 bg-gray-50' 
                        : 'border-jeju-orange bg-white hover:bg-jeju-orange hover:text-white shadow-md hover:shadow-lg'
                      }`}
                    >
                       <span className="text-3xl block mb-2">🥰</span>
                       <div className="font-bold">喜欢</div>
                       <div className="text-xs opacity-70 mt-1">很有格调</div>
                       {hasVotedMain && <div className="mt-2 text-xl font-black text-jeju-orange">{pollData.design.optionA} 票</div>}
                    </button>

                    <button 
                      onClick={() => handleMainVote('optionB')}
                      disabled={hasVotedMain}
                      className={`p-6 rounded-lg border-2 transition-all ${
                        hasVotedMain 
                        ? 'border-jeju-charcoal/10 bg-gray-50' 
                        : 'border-jeju-charcoal bg-white hover:bg-jeju-charcoal hover:text-white shadow-md hover:shadow-lg'
                      }`}
                    >
                       <span className="text-3xl block mb-2">🤔</span>
                       <div className="font-bold">一般</div>
                       <div className="text-xs opacity-70 mt-1">直接看报价</div>
                       {hasVotedMain && <div className="mt-2 text-xl font-black text-jeju-charcoal">{pollData.design.optionB} 票</div>}
                    </button>
                 </div>

                 <p className="text-xs text-jeju-charcoal/50 italic">
                    * 匿名投票，实时更新
                 </p>
              </div>
            </Reveal>

            {/* Scenario Poll */}
            <Reveal delay={200} className="mt-12">
               <h4 className="text-sm font-bold uppercase tracking-widest text-jeju-teal mb-6">你期待在哪些场景看到独立网站宣传？</h4>
               <div className="flex flex-wrap justify-center gap-3">
                  {SCENARIOS.map(scene => (
                    <button 
                      key={scene.id}
                      className="px-4 py-2 bg-white border border-jeju-charcoal rounded-full text-sm font-medium hover:bg-jeju-mustard transition-colors shadow-sm"
                    >
                       {scene.label}
                    </button>
                  ))}
               </div>
            </Reveal>
         </div>
      </section>

      {/* --- Footer --- */}
      <footer className="bg-jeju-charcoal text-jeju-bg py-20 px-6 relative overflow-hidden">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center pointer-events-none opacity-5">
             <div className="text-[15vw] font-black font-serif leading-none">JEJU</div>
             <div className="text-[15vw] font-black font-serif leading-none">2025</div>
         </div>
         
         <div className="max-w-4xl mx-auto relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
             <div className="text-center md:text-left">
                <div className="text-2xl font-serif font-bold mb-2">JEJU VINTAGE</div>
                <p className="text-sm opacity-60">© 2025 Jeju Vintage Holiday Project.</p>
                <p className="text-sm opacity-60">All rights reserved by GuaGua & XiaoJia.</p>
             </div>

             <div className="flex gap-6">
                <div className="text-center">
                   <div className="bg-white p-2 rounded-lg mb-2">
                      <img src={ASSETS.qr} className="w-24 h-24" alt="QR Code" />
                   </div>
                   <div className="text-xs font-mono opacity-80">WeChat Contact</div>
                </div>
             </div>
         </div>
      </footer>

    </div>
  );
};

export default JejuPage;