import type { Metadata, Viewport } from "next";
import { Figtree, Syne } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const sans = Figtree({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
  display: "swap",
});

const display = Syne({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI Knowledge Base",
  description: "Enterprise AI Knowledge Base workspace",
  appleWebApp: {
    capable: true,
    title: "AI Knowledge Base",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f1f3f5" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0e13" },
  ],
};

const accentBootScript = `
(function(){
  try {
    var raw = localStorage.getItem('akb-theme-prefs');
    if (!raw) return;
    var prefs = JSON.parse(raw);
    var presets = {
      teal:{primary:'#0d9488',secondary:'#2dd4bf',tertiary:'#115e59'},
      blue:{primary:'#2563eb',secondary:'#38bdf8',tertiary:'#1e3a8a'},
      indigo:{primary:'#4f46e5',secondary:'#818cf8',tertiary:'#312e81'},
      violet:{primary:'#7c3aed',secondary:'#c084fc',tertiary:'#581c87'},
      rose:{primary:'#e11d48',secondary:'#fb7185',tertiary:'#9f1239'},
      amber:{primary:'#d97706',secondary:'#fbbf24',tertiary:'#92400e'},
      emerald:{primary:'#059669',secondary:'#34d399',tertiary:'#064e3b'},
      slate:{primary:'#64748b',secondary:'#94a3b8',tertiary:'#1e293b'}
    };
    var colors = prefs.accentId === 'custom'
      ? {
          primary:(prefs.customColors&&prefs.customColors.primary)||prefs.customHex||'#0f766e',
          secondary:(prefs.customColors&&prefs.customColors.secondary)||'#0e7490',
          tertiary:(prefs.customColors&&prefs.customColors.tertiary)||'#134e4a'
        }
      : (presets[prefs.accentId]||presets.teal);
    function hexToRgb(h){
      h=String(h).replace('#','');
      if(h.length===3)h=h.split('').map(function(c){return c+c}).join('');
      if(!/^[0-9a-fA-F]{6}$/.test(h))return null;
      return {r:parseInt(h.slice(0,2),16),g:parseInt(h.slice(2,4),16),b:parseInt(h.slice(4,6),16)};
    }
    function rgbToHsl(r,g,b){
      r/=255;g/=255;b/=255;
      var max=Math.max(r,g,b),min=Math.min(r,g,b),l=(max+min)/2,s=0,h=0;
      if(max!==min){
        var d=max-min;
        s=l>0.5?d/(2-max-min):d/(max+min);
        switch(max){
          case r:h=((g-b)/d+(g<b?6:0))/6;break;
          case g:h=((b-r)/d+2)/6;break;
          default:h=((r-g)/d+4)/6;
        }
      }
      return {h:h*360,s:s*100,l:l*100};
    }
    function hslToHex(h,s,l){
      s/=100;l/=100;
      var c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs((h/60)%2-1)),m=l-c/2,r=0,g=0,b=0;
      if(h<60){r=c;g=x;}else if(h<120){r=x;g=c;}else if(h<180){g=c;b=x;}
      else if(h<240){g=x;b=c;}else if(h<300){r=x;b=c;}else{r=c;b=x;}
      function t(v){return Math.round((v+m)*255).toString(16).padStart(2,'0')}
      return '#'+t(r)+t(g)+t(b);
    }
    var root=document.documentElement;
    root.style.setProperty('--theme-primary', colors.primary);
    root.style.setProperty('--theme-secondary', colors.secondary);
    root.style.setProperty('--theme-tertiary', colors.tertiary);
    root.style.setProperty('--panel-from', colors.tertiary);
    root.style.setProperty('--panel-to', colors.secondary);
    root.style.setProperty('--canvas-glow', 'color-mix(in srgb, '+colors.secondary+' 16%, transparent)');
    var rgb=hexToRgb(colors.primary); if(!rgb) return;
    var hsl=rgbToHsl(rgb.r,rgb.g,rgb.b);
    var sat=Math.min(85,Math.max(35,hsl.s));
    var lights={50:97,100:94,200:86,300:76,400:64,500:53,600:45,700:37,800:29,900:22,950:12};
    Object.keys(lights).forEach(function(step){
      var stepSat=(step==='50'||step==='100')?Math.min(60,Math.max(20,sat*0.55))
        :(step==='950'?Math.min(70,Math.max(30,sat*0.85)):sat);
      root.style.setProperty('--accent-'+step,hslToHex(hsl.h,stepSat,lights[step]));
    });
  } catch(e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${sans.variable} ${display.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: accentBootScript }} />
      </head>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
