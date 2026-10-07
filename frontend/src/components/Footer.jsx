import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Globe, ArrowUp } from 'lucide-react';
import RipomaLogo from './RipomaLogo';
import { TornEdgeDivider } from './RusticComponents';

const InstagramIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const FacebookIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const Footer = () => {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <footer>
      {/* Torn paper top edge flowing into barnwood footer */}
      <TornEdgeDivider color="#3A2B1D" />

      <div
        className="relative text-[#F2E8D5]/80 font-sans"
        style={{ background: '#3A2B1D' }}
      >
        {/* Woven basket texture overlay */}
        <div className="absolute inset-0 bg-texture-basket opacity-15 pointer-events-none" aria-hidden="true" />

        {/* Horizontal slat line decorations */}
        <div className="absolute top-0 left-0 right-0 h-0.5 opacity-20" style={{ background: 'linear-gradient(90deg, transparent 0%, #C99A3A 30%, #C99A3A 70%, transparent 100%)' }} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">

          {/* Upper section */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-12" style={{ borderBottom: '1px dashed rgba(217,196,163,0.2)' }}>

            {/* Brand column */}
            <div className="md:col-span-4 space-y-6">
              <Link to="/" className="inline-block">
                <RipomaLogo variant="full" color="white" height={40} />
              </Link>
              <p className="text-xs font-light leading-relaxed max-w-sm" style={{ color: 'rgba(242,232,213,0.65)' }}>
                Rooted in real soil, coastal tides, and honest hands. Delivering premium, clean Dry Fish,
                fresh pasture Eggs, and free-range Chicken straight from our gate to your doorstep.
              </p>
              <div className="flex space-x-3.5">
                {[Globe, InstagramIcon, FacebookIcon].map((Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
                    style={{ background: 'rgba(217,196,163,0.1)', border: '1px solid rgba(217,196,163,0.15)', color: 'rgba(242,232,213,0.7)' }}
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(201,154,58,0.2)'}
                    onMouseOut={e => e.currentTarget.style.background = 'rgba(217,196,163,0.1)'}
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Quick links */}
            <div className="md:col-span-2 space-y-4">
              <h4 className="font-handwritten font-bold text-base" style={{ color: '#C99A3A' }}>Navigation</h4>
              <ul className="space-y-2.5 text-xs">
                {[['/', 'Home'], ['/catalog', 'Shop Catalog'], ['/about', 'Our Farm Story'], ['/contact', 'Get in Touch']].map(([to, label]) => (
                  <li key={to}>
                    <Link to={to} className="font-light transition-colors hover:text-white" style={{ color: 'rgba(242,232,213,0.65)' }}>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Specialties */}
            <div className="md:col-span-3 space-y-4">
              <h4 className="font-handwritten font-bold text-base" style={{ color: '#C99A3A' }}>Our Harvests</h4>
              <ul className="space-y-2.5 text-xs">
                {[
                  ['/catalog?category=Dry Fish', 'Hygienic Sun-Dried Fish'],
                  ['/catalog?category=Eggs', 'Organic Pasture Eggs'],
                  ['/catalog?category=Chicken', 'Free-Range Dressed Chicken'],
                ].map(([to, label]) => (
                  <li key={to}>
                    <Link to={to} className="font-light transition-colors hover:text-white" style={{ color: 'rgba(242,232,213,0.65)' }}>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div className="md:col-span-3 space-y-4">
              <h4 className="font-handwritten font-bold text-base" style={{ color: '#C99A3A' }}>Homestead Office</h4>
              <ul className="space-y-3.5 text-xs">
                {[
                  { Icon: MapPin, text: '10 Organic Way, Agro Valley, GreenState' },
                  { Icon: Phone, text: '+94 11 274 6622' },
                  { Icon: Mail, text: 'support@ripomafarm.com' },
                ].map(({ Icon, text }) => (
                  <li key={text} className="flex items-start gap-2" style={{ color: 'rgba(242,232,213,0.65)' }}>
                    <Icon className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#C99A3A' }} />
                    <span className="font-light">{text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Lower section */}
          <div className="flex flex-col sm:flex-row justify-between items-center pt-8 gap-4" style={{ color: 'rgba(242,232,213,0.35)' }}>
            <p className="text-[11px] font-light">© {new Date().getFullYear()} Ripoma Farm & Foods. All rights reserved.</p>
            <div className="flex items-center gap-6 text-[11px]">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <button
                onClick={scrollToTop}
                className="flex items-center gap-1 hover:text-white transition-colors uppercase tracking-widest text-[9px] font-bold font-handwritten cursor-pointer"
              >
                Back to Top <ArrowUp className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;
