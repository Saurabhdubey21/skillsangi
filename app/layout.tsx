import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Instrument_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const heading = Bricolage_Grotesque({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
});

const body = Instrument_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const code = JetBrains_Mono({
  variable: "--font-code",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "SkillSangi",
    template: "%s | SkillSangi",
  },
  description:
    "A daily study plan, an AI teacher and a study partner for engineering students.",
  openGraph: {
    title: "SkillSangi",
    description:
      "A daily study plan, an AI teacher and a study partner for engineering students.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#070b1a",
};

// Applies the saved light/dark choice before first paint (dark is the default).
const themeScript = `try{var t=localStorage.getItem("skillsangi-theme");if(t==="light"||t==="dark"){document.documentElement.setAttribute("data-theme",t)}}catch(e){}`;

// Applies the saved accent colour before first paint (unchanged from your version).
const accentScript = `try{var c=localStorage.getItem("skillsangi-accent");if(c&&/^#[0-9a-fA-F]{6}$/.test(c)){var r=parseInt(c.slice(1,3),16)/255,g=parseInt(c.slice(3,5),16)/255,b=parseInt(c.slice(5,7),16)/255;var f=function(x){return x<=0.03928?x/12.92:Math.pow((x+0.055)/1.055,2.4)};var l=0.2126*f(r)+0.7152*f(g)+0.0722*f(b);var s=document.documentElement.style;s.setProperty("--accent",c);s.setProperty("--on-accent",l>0.18?"#0F172A":"#FFFFFF")}}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${heading.variable} ${body.variable} ${code.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script dangerouslySetInnerHTML={{ __html: accentScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}