"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  Menu, X, ArrowRight, ArrowUpRight, Ruler, Hammer, Sparkles, ShieldCheck,
  Phone, Mail, MapPin, MessageCircle, Check, Quote, Star, Layers, PencilRuler,
  PackageCheck, Plus, Minus, Upload, ChefHat, Briefcase, Trees, ChevronRight,
} from "lucide-react";

/* ------------------------------------------------------------------ *
 *  HEWN & OAK — custom kitchens & office desks
 *  Single-file React app. Client-side routing via state so it renders
 *  inline; the structure maps 1:1 onto Next.js routes for later:
 *    pages -> app/(routes)/...   sections -> components/...
 *    QuotePage form -> wire onSubmit to email / DB / WhatsApp / Firebase
 *    "Start Designing" CTAs -> entry point for the future 3D configurator
 * ------------------------------------------------------------------ */

const C = {
  cream: "#F7F2EA",
  paper: "#FBF8F2",
  sand: "#EBE1D2",
  oak: "#B0794A",
  oakDeep: "#9A6638",
  walnut: "#6B4A30",
  walnutDark: "#3E2C1E",
  charcoal: "#241F1B",
  ink: "#33291F",
  muted: "#7C6A57",
  line: "#E0D4C1",
  lineDark: "#5A4632",
};

const NAV = [
  ["Home", "home"],
  ["About", "about"],
  ["Services", "services"],
  ["Kitchens", "kitchens"],
  ["Office Desks", "desks"],
  ["Gallery", "gallery"],
  ["How It Works", "how"],
  ["Contact", "contact"],
];

const IMG = {
  heroKitchen:
    "https://images.unsplash.com/photo-1556912173-3bb406ef7e77?w=1600&q=80&auto=format&fit=crop",
  kitchen1:
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&q=80&auto=format&fit=crop",
  kitchen2:
    "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=900&q=80&auto=format&fit=crop",
  kitchen3:
    "https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=900&q=80&auto=format&fit=crop",
  desk1:
    "https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=900&q=80&auto=format&fit=crop",
  desk2:
    "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=900&q=80&auto=format&fit=crop",
  desk3:
    "https://images.unsplash.com/photo-1542435503-956c469947f6?w=900&q=80&auto=format&fit=crop",
  craft1:
    "https://images.unsplash.com/photo-1601058494054-b6e9756d07e8?w=1200&q=80&auto=format&fit=crop",
  craft2:
    "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=1200&q=80&auto=format&fit=crop",
  wood:
    "https://images.unsplash.com/photo-1517414204284-fb7e3a5a4f8d?w=1200&q=80&auto=format&fit=crop",
  workshop:
    "https://images.unsplash.com/photo-1622372738946-62e02505feb3?w=1200&q=80&auto=format&fit=crop",
};

/* ----------------------------- primitives ----------------------------- */

const grainBG = {
  background: `linear-gradient(135deg, ${C.walnut} 0%, ${C.walnutDark} 55%, ${C.charcoal} 100%)`,
};

function Photo({ src, alt, style, className }) {
  const [err, setErr] = useState(false);
  return (
    <div
      className={className}
      style={{ position: "relative", overflow: "hidden", ...grainBG, ...style }}
    >
      {!err ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setErr(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      ) : (
        <div
          style={{
            width: "100%", height: "100%", display: "flex", alignItems: "center",
            justifyContent: "center", color: "rgba(255,255,255,.5)", letterSpacing: ".12em",
            fontSize: 12, textTransform: "uppercase",
          }}
        >
          {alt || "Hewn & Oak"}
        </div>
      )}
    </div>
  );
}

function Reveal({ children, delay = 0, as = "div", className, style }) {
  const ref = useRef(null);
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShow(true); return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setShow(true); io.disconnect(); } },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const Tag = as;
  return (
    <Tag
      ref={ref}
      className={className}
      style={{
        transition: "opacity .7s ease, transform .7s ease",
        transitionDelay: `${delay}ms`,
        opacity: show ? 1 : 0,
        transform: show ? "translateY(0)" : "translateY(22px)",
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}

function Btn({ children, onClick, variant = "solid", icon = true, style }) {
  const base = {
    display: "inline-flex", alignItems: "center", gap: 10, cursor: "pointer",
    fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 600, fontSize: 15,
    padding: "14px 26px", borderRadius: 2, border: "1px solid transparent",
    transition: "all .25s ease", letterSpacing: ".01em", lineHeight: 1,
  };
  const variants = {
    solid: { background: C.oak, color: "#fff", borderColor: C.oak },
    dark: { background: C.charcoal, color: C.cream, borderColor: C.charcoal },
    outline: { background: "transparent", color: C.walnutDark, borderColor: C.lineDark },
    ghostLight: { background: "transparent", color: "#fff", borderColor: "rgba(255,255,255,.5)" },
  };
  const [h, setH] = useState(false);
  const hover = {
    solid: { background: C.oakDeep, borderColor: C.oakDeep, transform: "translateY(-1px)" },
    dark: { background: C.walnutDark, borderColor: C.walnutDark, transform: "translateY(-1px)" },
    outline: { background: C.walnutDark, color: "#fff", borderColor: C.walnutDark },
    ghostLight: { background: "#fff", color: C.charcoal, borderColor: "#fff" },
  };
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{ ...base, ...variants[variant], ...(h ? hover[variant] : {}), ...style }}
    >
      {children}
      {icon && <ArrowRight size={17} style={{ transform: h ? "translateX(3px)" : "none", transition: "transform .25s" }} />}
    </button>
  );
}

function Eyebrow({ children, light }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
      <span style={{ width: 28, height: 1, background: light ? "rgba(255,255,255,.5)" : C.oak }} />
      <span
        style={{
          fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 12.5, fontWeight: 700,
          letterSpacing: ".22em", textTransform: "uppercase",
          color: light ? "rgba(255,255,255,.75)" : C.oakDeep,
        }}
      >
        {children}
      </span>
    </div>
  );
}

function H2({ children, light, style }) {
  return (
    <h2
      style={{
        fontFamily: "'Fraunces', serif", fontWeight: 500, lineHeight: 1.08,
        fontSize: "clamp(2rem, 4.2vw, 3.2rem)", letterSpacing: "-0.01em",
        color: light ? C.cream : C.walnutDark, ...style,
      }}
    >
      {children}
    </h2>
  );
}

function Section({ children, bg, style, id }) {
  return (
    <section id={id} style={{ background: bg || "transparent", ...style }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>{children}</div>
    </section>
  );
}

/* ------------------------------ data ------------------------------ */

const WHY = [
  { icon: Ruler, t: "Built to your millimetre", d: "Every piece is engineered around your exact dimensions, your wall, your floor, your ceiling — no forcing your space to fit a stock cabinet." },
  { icon: Hammer, t: "Joinery, not flat-pack", d: "Real cabinetmaking by a workshop team. Solid carcasses, dovetailed drawers, and hardware rated to outlast the room." },
  { icon: Layers, t: "Materials you can touch", d: "Choose from oak, walnut, ash and painted finishes with sample boards sent to you before anything is cut." },
  { icon: ShieldCheck, t: "One team, start to fit", d: "The people who design your piece are the ones who install it. A single point of contact from quote to handover." },
];

const STEPS = [
  { n: "01", t: "Choose your product", d: "Start with a custom kitchen or an office desk. Tell us the room and how you'll use it." },
  { n: "02", t: "Customise size & features", d: "Set dimensions, storage, finishes and worktops. We translate your needs into a build spec." },
  { n: "03", t: "Preview the design", d: "Review drawings and material samples. Adjust until the layout works for how you live or work." },
  { n: "04", t: "Submit your request", d: "Send us your spec and reference images. We confirm scope and an accurate, itemised quote." },
  { n: "05", t: "We review & contact you", d: "A maker reviews feasibility, refines details with you, and locks the production schedule." },
  { n: "06", t: "Build & installation", d: "We manufacture in the workshop, deliver, and fit on site — leaving the space clean and finished." },
];

const TESTI = [
  { q: "They redrew our awkward galley three times until the fridge, oven and prep run actually made sense. The drawers still glide a year on.", n: "Mariam & Khaled", r: "Custom walnut kitchen" },
  { q: "I gave them my standing-desk height, two monitors and a cable mess. What came back hid every wire and matched our boardroom oak.", n: "Tarek H.", r: "Executive office desk" },
  { q: "Premium without the showroom markup. The sample boards meant zero surprises when the kitchen was fitted.", n: "Salma A.", r: "Open-plan family kitchen" },
];

const FAQ = [
  { q: "How long does a custom kitchen or desk take?", a: "Most desks are built in 3–4 weeks and kitchens in 6–8 weeks after the design is approved. Your exact timeline is confirmed in the quote once the spec is locked." },
  { q: "Do you measure on site?", a: "Yes. For kitchens and built-in desks we take final site measurements before manufacturing so the piece fits to the millimetre. You can also submit your own dimensions to get an initial quote." },
  { q: "Can I see materials before committing?", a: "We send physical sample boards of your shortlisted woods, finishes and worktops so you decide with the real material in hand, not a screen." },
  { q: "What does the quote include?", a: "An itemised price covering design, materials, manufacturing, delivery and installation. There are no hidden fitting fees added later." },
  { q: "Do you deliver and install?", a: "Yes — the same workshop team that builds your piece delivers and fits it, then clears the site. You're not handed off to a separate contractor." },
  { q: "Will there be a 3D preview?", a: "An interactive 3D configurator for kitchens and desks is on the way. For now you'll receive detailed drawings and samples before anything is cut." },
];

/* ------------------------------ cards ------------------------------ */

function ProjectCard({ img, tag, title, meta, onClick }) {
  const [h, setH] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{ cursor: onClick ? "pointer" : "default", background: C.paper, border: `1px solid ${C.line}`, borderRadius: 3, overflow: "hidden", transition: "all .3s ease", transform: h ? "translateY(-4px)" : "none", boxShadow: h ? "0 22px 40px -24px rgba(62,44,30,.45)" : "0 1px 0 rgba(62,44,30,.04)" }}
    >
      <Photo src={img} alt={title} style={{ aspectRatio: "4 / 3" }} />
      <div style={{ padding: "20px 22px 24px" }}>
        <div style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 11.5, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: C.oakDeep, marginBottom: 8 }}>{tag}</div>
        <div style={{ fontFamily: "'Fraunces',serif", fontSize: 22, color: C.walnutDark, lineHeight: 1.2 }}>{title}</div>
        <div style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 14.5, color: C.muted, marginTop: 8 }}>{meta}</div>
      </div>
    </div>
  );
}

function OptionChips({ title, items }) {
  return (
    <div style={{ border: `1px solid ${C.line}`, borderRadius: 3, padding: "26px 26px 28px", background: C.paper }}>
      <div style={{ fontFamily: "'Fraunces',serif", fontSize: 20, color: C.walnutDark, marginBottom: 16 }}>{title}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
        {items.map((it) => (
          <span key={it} style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 14, color: C.ink, background: C.sand, border: `1px solid ${C.line}`, padding: "8px 14px", borderRadius: 999 }}>{it}</span>
        ))}
      </div>
    </div>
  );
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: `1px solid ${C.line}` }}>
      <button onClick={() => setOpen((o) => !o)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18, padding: "22px 4px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}>
        <span style={{ fontFamily: "'Fraunces',serif", fontSize: "clamp(17px,2vw,20px)", color: C.walnutDark }}>{q}</span>
        <span style={{ flexShrink: 0, width: 34, height: 34, borderRadius: 999, border: `1px solid ${C.lineDark}`, display: "grid", placeItems: "center", color: C.walnutDark }}>
          {open ? <Minus size={16} /> : <Plus size={16} />}
        </span>
      </button>
      <div style={{ maxHeight: open ? 240 : 0, overflow: "hidden", transition: "max-height .35s ease" }}>
        <p style={{ fontFamily: "'Hanken Grotesk',sans-serif", color: C.muted, fontSize: 16, lineHeight: 1.65, padding: "0 4px 24px", maxWidth: 760 }}>{a}</p>
      </div>
    </div>
  );
}

/* ------------------------ shared section blocks ------------------------ */

function CategorySplit({ go }) {
  const Card = ({ icon: Icon, kicker, title, copy, img, cta, onClick }) => {
    const [h, setH] = useState(false);
    return (
      <div onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{ position: "relative", borderRadius: 3, overflow: "hidden", minHeight: 460, display: "flex", flexDirection: "column", justifyContent: "flex-end", cursor: "pointer" }} onClick={onClick}>
        <Photo src={img} alt={title} style={{ position: "absolute", inset: 0 }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(36,31,27,.05) 0%, rgba(36,31,27,.82) 88%)" }} />
        <div style={{ position: "relative", padding: "34px 32px 32px", color: "#fff" }}>
          <Icon size={26} style={{ marginBottom: 14, color: C.sand }} />
          <div style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase", color: "rgba(255,255,255,.72)", marginBottom: 8 }}>{kicker}</div>
          <div style={{ fontFamily: "'Fraunces',serif", fontSize: 30, marginBottom: 10 }}>{title}</div>
          <p style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 15.5, lineHeight: 1.6, color: "rgba(255,255,255,.82)", maxWidth: 420, marginBottom: 18 }}>{copy}</p>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 9, fontFamily: "'Hanken Grotesk',sans-serif", fontWeight: 600, fontSize: 15, color: "#fff", borderBottom: "1px solid rgba(255,255,255,.6)", paddingBottom: 3 }}>
            {cta} <ArrowRight size={16} style={{ transform: h ? "translateX(4px)" : "none", transition: "transform .25s" }} />
          </span>
        </div>
      </div>
    );
  };
  return (
    <div className="grid md:grid-cols-2" style={{ gap: 22 }}>
      <Card icon={ChefHat} kicker="Category 01" title="Custom Kitchens" copy="Cabinetry shaped to your room and the way you cook — from the worktop run to where every pan lives." img={IMG.kitchen1} cta="Explore kitchens" onClick={() => go("kitchens")} />
      <Card icon={Briefcase} kicker="Category 02" title="Office Desks" copy="Work surfaces with the storage, shelving and hidden cable runs that match how you actually work." img={IMG.desk1} cta="Explore desks" onClick={() => go("desks")} />
    </div>
  );
}

function ProcessStrip({ steps }) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4" style={{ gap: 0, border: `1px solid ${C.line}`, borderRadius: 3, overflow: "hidden", background: C.paper }}>
      {steps.map((s, i) => (
        <Reveal key={s.n} delay={i * 80} style={{ padding: "30px 26px 34px", borderRight: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}` }}>
          <div style={{ fontFamily: "'Fraunces',serif", fontSize: 40, color: C.sand, lineHeight: 1, marginBottom: 16, fontWeight: 600 }}>{s.n}</div>
          <div style={{ fontFamily: "'Fraunces',serif", fontSize: 21, color: C.walnutDark, marginBottom: 10 }}>{s.t}</div>
          <p style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 15, lineHeight: 1.6, color: C.muted }}>{s.d}</p>
        </Reveal>
      ))}
    </div>
  );
}

function CtaBand({ go }) {
  return (
    <Section style={{ padding: "0 24px" }}>
      <Reveal style={{ ...grainBG, borderRadius: 4, padding: "clamp(40px,6vw,72px)", position: "relative", overflow: "hidden", margin: "0 auto", maxWidth: 1200 }}>
        <Photo src={IMG.wood} alt="" style={{ position: "absolute", inset: 0, opacity: 0.14 }} />
        <div style={{ position: "relative", textAlign: "center", maxWidth: 720, margin: "0 auto" }}>
          <Eyebrow light>Start your build</Eyebrow>
          <H2 light style={{ marginBottom: 16 }}>Ready to design something that fits perfectly?</H2>
          <p style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 17, lineHeight: 1.6, color: "rgba(255,255,255,.78)", marginBottom: 28, maxWidth: 560, marginLeft: "auto", marginRight: "auto" }}>
            Tell us your dimensions and how you'll use the space. We'll come back with drawings, samples and an honest, itemised quote.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <Btn variant="solid" onClick={() => go("configure", "Kitchen")}>Design Your Kitchen</Btn>
            <Btn variant="ghostLight" onClick={() => go("configure", "Office Desk")}>Design Your Desk</Btn>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}

/* ------------------------------ pages ------------------------------ */

function HomePage({ go }) {
  return (
    <>
      {/* HERO */}
      <header style={{ position: "relative", minHeight: "92vh", display: "flex", alignItems: "flex-end", overflow: "hidden" }}>
        <Photo src={IMG.heroKitchen} alt="Custom walnut kitchen" style={{ position: "absolute", inset: 0 }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(36,31,27,.55) 0%, rgba(36,31,27,.30) 35%, rgba(36,31,27,.86) 100%)" }} />
        <div style={{ position: "relative", maxWidth: 1200, margin: "0 auto", padding: "0 24px 80px", width: "100%" }}>
          <Reveal style={{ maxWidth: 760 }}>
            <Eyebrow light>Custom woodwork · made to your space</Eyebrow>
            <h1 style={{ fontFamily: "'Fraunces',serif", fontWeight: 500, color: "#fff", fontSize: "clamp(2.6rem, 6vw, 5rem)", lineHeight: 1.02, letterSpacing: "-0.02em", marginBottom: 22 }}>
              Custom kitchens & office desks built for your space.
            </h1>
            <p style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: "clamp(16px,2.2vw,20px)", lineHeight: 1.55, color: "rgba(255,255,255,.85)", maxWidth: 580, marginBottom: 34 }}>
              Design your ideal kitchen or desk with custom dimensions, storage and materials — then let our workshop bring it to life.
            </p>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <Btn variant="solid" onClick={() => go("configure", "Kitchen")}>Design Your Kitchen</Btn>
              <Btn variant="ghostLight" onClick={() => go("configure", "Office Desk")}>Design Your Desk</Btn>
            </div>
          </Reveal>
        </div>
      </header>

      {/* INTRO + trust row */}
      <Section bg={C.cream} style={{ padding: "clamp(64px,9vw,110px) 0" }}>
        <div className="grid lg:grid-cols-12" style={{ gap: 48, alignItems: "center" }}>
          <Reveal className="lg:col-span-7">
            <Eyebrow>The workshop</Eyebrow>
            <H2 style={{ marginBottom: 22 }}>A small team of makers building furniture that fits one home, one office — yours.</H2>
            <p style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 17, lineHeight: 1.7, color: C.muted, maxWidth: 560 }}>
              We design and build two things, and we build them well: custom kitchens and custom desks. Each project starts with your measurements and the way you actually use the space, then runs through our own workshop — so the people drawing your piece are the ones cutting, finishing and fitting it.
            </p>
          </Reveal>
          <Reveal className="lg:col-span-5" delay={120}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: C.line, border: `1px solid ${C.line}`, borderRadius: 3, overflow: "hidden" }}>
              {[["12+", "years at the bench"], ["480+", "rooms fitted"], ["2", "focused product lines"], ["1", "team, design to install"]].map(([a, b]) => (
                <div key={b} style={{ background: C.paper, padding: "26px 22px" }}>
                  <div style={{ fontFamily: "'Fraunces',serif", fontSize: 34, color: C.walnutDark, lineHeight: 1 }}>{a}</div>
                  <div style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 13.5, color: C.muted, marginTop: 8, letterSpacing: ".02em" }}>{b}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </Section>

      {/* CATEGORIES */}
      <Section bg={C.paper} style={{ padding: "clamp(56px,8vw,96px) 0" }}>
        <Reveal style={{ marginBottom: 38, maxWidth: 620 }}>
          <Eyebrow>What we make</Eyebrow>
          <H2>Two products. Endless configurations.</H2>
        </Reveal>
        <Reveal delay={80}><CategorySplit go={go} /></Reveal>
      </Section>

      {/* WHY */}
      <Section bg={C.cream} style={{ padding: "clamp(56px,8vw,96px) 0" }}>
        <Reveal style={{ marginBottom: 40, maxWidth: 620 }}>
          <Eyebrow>Why Hewn & Oak</Eyebrow>
          <H2>The difference is in the parts you don't see.</H2>
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4" style={{ gap: 22 }}>
          {WHY.map((w, i) => (
            <Reveal key={w.t} delay={i * 90}>
              <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 3, padding: "30px 26px 32px", height: "100%" }}>
                <div style={{ width: 48, height: 48, borderRadius: 3, background: C.sand, display: "grid", placeItems: "center", color: C.walnutDark, marginBottom: 20 }}>
                  <w.icon size={22} />
                </div>
                <div style={{ fontFamily: "'Fraunces',serif", fontSize: 21, color: C.walnutDark, marginBottom: 10 }}>{w.t}</div>
                <p style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 15, lineHeight: 1.62, color: C.muted }}>{w.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* FEATURED */}
      <Section bg={C.paper} style={{ padding: "clamp(56px,8vw,96px) 0" }}>
        <Reveal style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 18, marginBottom: 38 }}>
          <div style={{ maxWidth: 560 }}>
            <Eyebrow>Featured projects</Eyebrow>
            <H2>Recent work from the workshop.</H2>
          </div>
          <Btn variant="outline" onClick={() => go("gallery")}>View full gallery</Btn>
        </Reveal>
        <div className="grid md:grid-cols-3" style={{ gap: 22 }}>
          {[
            { img: IMG.kitchen2, tag: "Kitchen", title: "The Maadi Galley", meta: "Walnut veneer · quartz worktop · 3.4m run" },
            { img: IMG.desk2, tag: "Office Desk", title: "Studio Standing Desk", meta: "Solid oak · sit-stand · cable channel" },
            { img: IMG.kitchen3, tag: "Kitchen", title: "Open-plan Family Island", meta: "Painted ash · integrated seating" },
          ].map((p, i) => (
            <Reveal key={p.title} delay={i * 90}><ProjectCard {...p} onClick={() => go("gallery")} /></Reveal>
          ))}
        </div>
      </Section>

      {/* HOW IT WORKS (4) */}
      <Section bg={C.cream} style={{ padding: "clamp(56px,8vw,96px) 0" }}>
        <Reveal style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 18, marginBottom: 36 }}>
          <div style={{ maxWidth: 560 }}>
            <Eyebrow>How it works</Eyebrow>
            <H2>From your measurements to a fitted room, in four moves.</H2>
          </div>
          <Btn variant="outline" onClick={() => go("how")}>See the full process</Btn>
        </Reveal>
        <ProcessStrip steps={STEPS.slice(0, 4)} />
      </Section>

      {/* TESTIMONIALS */}
      <Section bg={C.charcoal} style={{ padding: "clamp(56px,8vw,100px) 0" }}>
        <Reveal style={{ marginBottom: 42, maxWidth: 620 }}>
          <Eyebrow light>In their words</Eyebrow>
          <H2 light>Clients who let us redraw their space.</H2>
        </Reveal>
        <div className="grid md:grid-cols-3" style={{ gap: 22 }}>
          {TESTI.map((t, i) => (
            <Reveal key={t.n} delay={i * 90}>
              <div style={{ border: "1px solid rgba(255,255,255,.12)", borderRadius: 3, padding: "30px 28px 32px", height: "100%", display: "flex", flexDirection: "column" }}>
                <Quote size={26} style={{ color: C.oak, marginBottom: 16 }} />
                <p style={{ fontFamily: "'Fraunces',serif", fontSize: 18.5, lineHeight: 1.5, color: C.cream, marginBottom: 22, flexGrow: 1 }}>{t.q}</p>
                <div style={{ display: "flex", gap: 3, marginBottom: 12 }}>
                  {[0,1,2,3,4].map((s) => <Star key={s} size={15} style={{ color: C.oak, fill: C.oak }} />)}
                </div>
                <div style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontWeight: 700, color: "#fff", fontSize: 15 }}>{t.n}</div>
                <div style={{ fontFamily: "'Hanken Grotesk',sans-serif", color: "rgba(255,255,255,.55)", fontSize: 13.5 }}>{t.r}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* FAQ */}
      <Section bg={C.cream} style={{ padding: "clamp(56px,8vw,96px) 0" }}>
        <div className="grid lg:grid-cols-12" style={{ gap: 48 }}>
          <Reveal className="lg:col-span-4">
            <Eyebrow>Questions</Eyebrow>
            <H2>The things clients ask before they start.</H2>
            <p style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 16, lineHeight: 1.65, color: C.muted, marginTop: 18 }}>
              Still unsure about something? A quick message on WhatsApp usually clears it up faster than a form.
            </p>
            <div style={{ marginTop: 24 }}><Btn variant="solid" onClick={() => go("contact")}>Talk to a maker</Btn></div>
          </Reveal>
          <div className="lg:col-span-8">
            {FAQ.slice(0, 5).map((f) => <FaqItem key={f.q} {...f} />)}
          </div>
        </div>
      </Section>

      <div style={{ padding: "clamp(40px,7vw,90px) 0", background: C.paper }}><CtaBand go={go} /></div>
    </>
  );
}

function PageHero({ kicker, title, sub, img }) {
  return (
    <header style={{ position: "relative", minHeight: 420, display: "flex", alignItems: "flex-end", overflow: "hidden" }}>
      <Photo src={img} alt="" style={{ position: "absolute", inset: 0 }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(36,31,27,.45) 0%, rgba(36,31,27,.85) 100%)" }} />
      <div style={{ position: "relative", maxWidth: 1200, margin: "0 auto", padding: "0 24px 56px", width: "100%" }}>
        <Reveal style={{ maxWidth: 720 }}>
          <Eyebrow light>{kicker}</Eyebrow>
          <h1 style={{ fontFamily: "'Fraunces',serif", fontWeight: 500, color: "#fff", fontSize: "clamp(2.2rem,5vw,3.6rem)", lineHeight: 1.05, letterSpacing: "-0.015em", marginBottom: sub ? 16 : 0 }}>{title}</h1>
          {sub && <p style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 18, lineHeight: 1.55, color: "rgba(255,255,255,.82)", maxWidth: 560 }}>{sub}</p>}
        </Reveal>
      </div>
    </header>
  );
}

function AboutPage({ go }) {
  return (
    <>
      <PageHero kicker="About us" title="We make two things, and we make them properly." sub="A workshop-led studio for custom kitchens and office desks — design, build and fit, under one roof." img={IMG.craft1} />
      <Section bg={C.cream} style={{ padding: "clamp(56px,8vw,100px) 0" }}>
        <div className="grid lg:grid-cols-2" style={{ gap: 56, alignItems: "center" }}>
          <Reveal>
            <Eyebrow>Our story</Eyebrow>
            <H2 style={{ marginBottom: 22 }}>Started at a single bench. Still run like one.</H2>
            <div style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 16.5, lineHeight: 1.72, color: C.muted, display: "grid", gap: 16, maxWidth: 540 }}>
              <p>Hewn & Oak began with a frustration: beautiful spaces let down by furniture that didn't quite fit. Stock cabinets leaving dead gaps, desks too shallow for two monitors, storage that ignored how people really live.</p>
              <p>So we narrowed down. Instead of making everything, we make kitchens and desks — bespoke, measured, and built by the same hands that design them. That focus is why the joinery holds up and the fit is exact.</p>
              <p>Today the studio is a small team of cabinetmakers, a designer and a fitter who never hand your project to a stranger.</p>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <Photo src={IMG.workshop} alt="Workshop bench" style={{ aspectRatio: "4/5", borderRadius: 3 }} />
          </Reveal>
        </div>
      </Section>
      <Section bg={C.paper} style={{ padding: "clamp(56px,8vw,96px) 0" }}>
        <Reveal style={{ maxWidth: 620, marginBottom: 40 }}>
          <Eyebrow>What we stand on</Eyebrow>
          <H2>Principles we won't cut corners on.</H2>
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4" style={{ gap: 22 }}>
          {[
            { icon: Trees, t: "Honest materials", d: "Real timber and rated hardware, named openly in your quote." },
            { icon: PencilRuler, t: "Designed to fit", d: "Drawn around your exact space, never forced into a stock size." },
            { icon: Hammer, t: "Made in-house", d: "Cut and finished in our workshop, not outsourced to the lowest bid." },
            { icon: PackageCheck, t: "Fitted by us", d: "The makers deliver and install, then leave the site clean." },
          ].map((w, i) => (
            <Reveal key={w.t} delay={i * 90}>
              <div style={{ background: C.cream, border: `1px solid ${C.line}`, borderRadius: 3, padding: "28px 24px 30px", height: "100%" }}>
                <w.icon size={24} style={{ color: C.oakDeep, marginBottom: 16 }} />
                <div style={{ fontFamily: "'Fraunces',serif", fontSize: 20, color: C.walnutDark, marginBottom: 8 }}>{w.t}</div>
                <p style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 14.5, lineHeight: 1.6, color: C.muted }}>{w.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>
      <div style={{ padding: "clamp(40px,7vw,90px) 0", background: C.cream }}><CtaBand go={go} /></div>
    </>
  );
}

function ServicesPage({ go }) {
  const services = [
    { icon: ChefHat, t: "Custom Kitchens", d: "Full kitchen design and build — cabinetry, islands, worktops and storage shaped to your room and routine.", link: "kitchens" },
    { icon: Briefcase, t: "Office & Home Desks", d: "Desks for focused work — sit-stand frames, drawer banks, shelving and cable management built in.", link: "desks" },
    { icon: PencilRuler, t: "Design & Drawings", d: "Measured drawings and layout options before anything is cut, so you approve the plan with confidence.", link: "how" },
    { icon: Layers, t: "Materials Consulting", d: "Sample boards of woods, finishes and worktops sent to you to choose with the real material in hand.", link: "kitchens" },
    { icon: PackageCheck, t: "Delivery & Installation", d: "Workshop-direct delivery and on-site fitting by the same team that built your piece.", link: "how" },
    { icon: Sparkles, t: "Coming soon · 3D Configurator", d: "Build and preview your kitchen or desk in 3D, adjust dimensions live, and send the spec straight to us.", link: "quote" },
  ];
  return (
    <>
      <PageHero kicker="Services" title="Everything from first sketch to final fit." sub="A focused set of services around two products — kitchens and desks — handled end to end." img={IMG.craft2} />
      <Section bg={C.cream} style={{ padding: "clamp(56px,8vw,100px) 0" }}>
        <div className="grid md:grid-cols-2 lg:grid-cols-3" style={{ gap: 22 }}>
          {services.map((s, i) => {
            const soon = s.t.includes("Coming soon");
            return (
              <Reveal key={s.t} delay={i * 70}>
                <div onClick={() => go(s.link)} style={{ cursor: "pointer", background: soon ? C.charcoal : C.paper, border: `1px solid ${soon ? "rgba(255,255,255,.14)" : C.line}`, borderRadius: 3, padding: "32px 28px 30px", height: "100%", display: "flex", flexDirection: "column" }}>
                  <div style={{ width: 50, height: 50, borderRadius: 3, background: soon ? "rgba(255,255,255,.08)" : C.sand, display: "grid", placeItems: "center", color: soon ? C.oak : C.walnutDark, marginBottom: 22 }}>
                    <s.icon size={23} />
                  </div>
                  <div style={{ fontFamily: "'Fraunces',serif", fontSize: 22, color: soon ? C.cream : C.walnutDark, marginBottom: 10 }}>{s.t}</div>
                  <p style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 15, lineHeight: 1.62, color: soon ? "rgba(255,255,255,.7)" : C.muted, flexGrow: 1 }}>{s.d}</p>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 7, marginTop: 20, fontFamily: "'Hanken Grotesk',sans-serif", fontWeight: 600, fontSize: 14.5, color: soon ? C.oak : C.oakDeep }}>
                    {soon ? "Join the waitlist" : "Learn more"} <ChevronRight size={16} />
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </Section>
      <div style={{ padding: "clamp(40px,7vw,90px) 0", background: C.paper }}><CtaBand go={go} /></div>
    </>
  );
}

function ProductPage({ go, kind }) {
  const isKitchen = kind === "kitchen";
  const cfg = isKitchen
    ? {
        kicker: "Custom kitchens",
        title: "A kitchen designed around how you cook.",
        sub: "From compact galleys to family islands — built to your dimensions, storage needs and worktop of choice.",
        img: IMG.kitchen1,
        intro: "Your kitchen is the hardest-working room in the house, and a stock layout rarely respects that. We start from your floor plan and the way you move between the sink, hob and fridge, then build cabinetry that puts everything within reach. Every carcass, drawer and hinge is specified to last — and finished in the material you actually fell for.",
        gallery: [IMG.kitchen1, IMG.kitchen2, IMG.kitchen3],
        cta: "Start Designing Your Kitchen",
        product: "Kitchen",
        options: [
          { t: "Kitchen styles", items: ["Handleless modern", "Shaker", "Classic in-frame", "Galley", "Island", "L-shape", "U-shape"] },
          { t: "Materials", items: ["Solid oak", "Walnut veneer", "Painted ash", "Birch ply", "Laminate fronts"] },
          { t: "Finishes", items: ["Matt lacquer", "Satin oil", "Hand-painted", "Natural wax", "Woodgrain melamine"] },
          { t: "Worktops", items: ["Quartz", "Granite", "Solid oak", "Compact laminate", "Stainless steel"] },
          { t: "Storage", items: ["Soft-close drawers", "Larder pull-outs", "Corner carousels", "Built-in bins", "Spice racks", "Pan dividers"] },
          { t: "Hardware", items: ["Push-to-open", "Brass handles", "Black matt pulls", "Integrated rails"] },
        ],
      }
    : {
        kicker: "Office desks",
        title: "A desk that works the way you do.",
        sub: "Sit-stand frames, hidden cables and exactly the storage you need — sized to your room and your setup.",
        img: IMG.desk1,
        intro: "A good desk disappears into the work. We build yours around your height, your monitors and your cable mess — with drawer banks where you reach, shelving where you glance, and channels that keep every wire out of sight. Whether it's a home study or an executive office, the surface is solid and the proportions are yours.",
        gallery: [IMG.desk1, IMG.desk2, IMG.desk3],
        cta: "Start Designing Your Desk",
        product: "Office Desk",
        options: [
          { t: "Desk styles", items: ["Executive", "Minimal floating", "L-shape corner", "Sit-stand", "Writing desk", "Twin / shared"] },
          { t: "Materials", items: ["Solid oak", "Walnut", "Ash", "Birch ply", "Laminate top"] },
          { t: "Storage", items: ["Drawer bank", "Filing drawer", "Under-desk cabinet", "Hidden tray", "Lockable drawer"] },
          { t: "Shelves & extras", items: ["Floating shelves", "Monitor riser", "Bookcase wing", "Pin board"] },
          { t: "Cable management", items: ["Cable channel", "Grommet ports", "Power shelf", "Under-desk tray", "Hidden routing"] },
          { t: "Frame & finish", items: ["Sit-stand electric", "Fixed timber legs", "Steel hairpin", "Matt lacquer", "Natural oil"] },
        ],
      };
  return (
    <>
      <PageHero kicker={cfg.kicker} title={cfg.title} sub={cfg.sub} img={cfg.img} />
      <Section bg={C.cream} style={{ padding: "clamp(56px,8vw,96px) 0" }}>
        <div className="grid lg:grid-cols-12" style={{ gap: 48, alignItems: "center" }}>
          <Reveal className="lg:col-span-7">
            <Eyebrow>The approach</Eyebrow>
            <H2 style={{ marginBottom: 20 }}>{isKitchen ? "Engineered for the room you already have." : "Designed for the way you already work."}</H2>
            <p style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 17, lineHeight: 1.72, color: C.muted, maxWidth: 560 }}>{cfg.intro}</p>
            <div style={{ marginTop: 28 }}><Btn variant="solid" onClick={() => go("configure", cfg.product)}>{cfg.cta}</Btn></div>
          </Reveal>
          <Reveal className="lg:col-span-5" delay={120}>
            <Photo src={cfg.gallery[1]} alt={cfg.product} style={{ aspectRatio: "4/5", borderRadius: 3 }} />
          </Reveal>
        </div>
      </Section>

      <Section bg={C.paper} style={{ padding: "clamp(56px,8vw,96px) 0" }}>
        <Reveal style={{ maxWidth: 620, marginBottom: 38 }}>
          <Eyebrow>Configure it</Eyebrow>
          <H2>Choose every detail.</H2>
          <p style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 16, lineHeight: 1.65, color: C.muted, marginTop: 16 }}>
            Mix and match the options below — or describe your own. This list previews what the upcoming 3D configurator will let you adjust live.
          </p>
        </Reveal>
        <div className="grid md:grid-cols-2 lg:grid-cols-3" style={{ gap: 22 }}>
          {cfg.options.map((o, i) => (
            <Reveal key={o.t} delay={i * 60}><OptionChips title={o.t} items={o.items} /></Reveal>
          ))}
        </div>
      </Section>

      <Section bg={C.cream} style={{ padding: "clamp(56px,8vw,90px) 0" }}>
        <Reveal style={{ marginBottom: 32 }}><Eyebrow>Recent {isKitchen ? "kitchens" : "desks"}</Eyebrow><H2>See it built.</H2></Reveal>
        <div className="grid md:grid-cols-3" style={{ gap: 22 }}>
          {cfg.gallery.map((g, i) => (
            <Reveal key={g + i} delay={i * 80}><Photo src={g} alt="" style={{ aspectRatio: "4/3", borderRadius: 3 }} /></Reveal>
          ))}
        </div>
      </Section>

      <div style={{ padding: "clamp(40px,7vw,90px) 0", background: C.paper }}><CtaBand go={go} /></div>
    </>
  );
}

function GalleryPage({ go }) {
  const items = [
    { img: IMG.kitchen1, tag: "Kitchen", title: "Walnut Handleless", meta: "3.6m run · quartz", cat: "Kitchens" },
    { img: IMG.desk1, tag: "Office Desk", title: "Oak Executive", meta: "Drawer bank · cable run", cat: "Desks" },
    { img: IMG.kitchen2, tag: "Kitchen", title: "The Maadi Galley", meta: "Painted ash · oak tops", cat: "Kitchens" },
    { img: IMG.desk2, tag: "Office Desk", title: "Studio Sit-Stand", meta: "Solid oak · electric frame", cat: "Desks" },
    { img: IMG.kitchen3, tag: "Kitchen", title: "Family Island", meta: "Integrated seating", cat: "Kitchens" },
    { img: IMG.desk3, tag: "Office Desk", title: "Minimal Floating", meta: "Hidden routing", cat: "Desks" },
  ];
  const [filter, setFilter] = useState("All");
  const tabs = ["All", "Kitchens", "Desks"];
  const shown = filter === "All" ? items : items.filter((i) => i.cat === filter);
  return (
    <>
      <PageHero kicker="Gallery" title="A portfolio you can run your hand along." sub="Real projects, real dimensions. Filter by what you're building." img={IMG.kitchen3} />
      <Section bg={C.cream} style={{ padding: "clamp(48px,7vw,80px) 0" }}>
        <Reveal style={{ display: "flex", gap: 10, marginBottom: 36, flexWrap: "wrap" }}>
          {tabs.map((t) => {
            const active = filter === t;
            return (
              <button key={t} onClick={() => setFilter(t)} style={{ cursor: "pointer", fontFamily: "'Hanken Grotesk',sans-serif", fontWeight: 600, fontSize: 14.5, padding: "10px 22px", borderRadius: 999, border: `1px solid ${active ? C.walnutDark : C.line}`, background: active ? C.walnutDark : "transparent", color: active ? "#fff" : C.walnut, transition: "all .2s" }}>{t}</button>
            );
          })}
        </Reveal>
        <div className="grid md:grid-cols-2 lg:grid-cols-3" style={{ gap: 22 }}>
          {shown.map((p, i) => (
            <Reveal key={p.title} delay={i * 70}><ProjectCard {...p} onClick={() => go("quote", p.cat === "Kitchens" ? "Kitchen" : "Office Desk")} /></Reveal>
          ))}
        </div>
      </Section>
      <div style={{ padding: "clamp(40px,7vw,90px) 0", background: C.paper }}><CtaBand go={go} /></div>
    </>
  );
}

function HowItWorksPage({ go }) {
  return (
    <>
      <PageHero kicker="How it works" title="Six steps from your space to a finished piece." sub="No mystery, no surprise invoices — here's exactly how a project runs." img={IMG.wood} />
      <Section bg={C.cream} style={{ padding: "clamp(56px,8vw,100px) 0" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 60}>
              <div style={{ display: "flex", gap: 28, paddingBottom: 40, marginBottom: 40, borderBottom: i < STEPS.length - 1 ? `1px solid ${C.line}` : "none" }}>
                <div style={{ flexShrink: 0, fontFamily: "'Fraunces',serif", fontSize: "clamp(40px,7vw,64px)", color: C.sand, lineHeight: 0.9, fontWeight: 600, width: 92 }}>{s.n}</div>
                <div>
                  <div style={{ fontFamily: "'Fraunces',serif", fontSize: "clamp(22px,3vw,28px)", color: C.walnutDark, marginBottom: 10 }}>{s.t}</div>
                  <p style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 16.5, lineHeight: 1.68, color: C.muted, maxWidth: 600 }}>{s.d}</p>
                </div>
              </div>
            </Reveal>
          ))}
          <Reveal style={{ textAlign: "center", marginTop: 8 }}>
            <Btn variant="solid" onClick={() => go("quote")}>Start your request</Btn>
          </Reveal>
        </div>
      </Section>
      <div style={{ padding: "clamp(40px,7vw,90px) 0", background: C.paper }}><CtaBand go={go} /></div>
    </>
  );
}

function Field({ label, children, required }) {
  return (
    <label style={{ display: "block" }}>
      <span style={{ display: "block", fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 13.5, fontWeight: 700, color: C.walnut, marginBottom: 8, letterSpacing: ".02em" }}>
        {label}{required && <span style={{ color: C.oakDeep }}> *</span>}
      </span>
      {children}
    </label>
  );
}

const inputStyle = {
  width: "100%", fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 15.5, color: C.ink,
  background: C.paper, border: `1px solid ${C.line}`, borderRadius: 3, padding: "13px 15px",
  outline: "none", boxSizing: "border-box",
};

function QuotePage({ go, preset }) {
  const [form, setForm] = useState({
    name: "", phone: "", email: "", location: "", product: preset || "Kitchen",
    width: "", depth: "", height: "", notes: "", file: "",
  });
  const [sent, setSent] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const onFile = (e) => setForm((f) => ({ ...f, file: e.target.files?.[0]?.name || "" }));

  const submit = () => {
    // Wire here later: send `form` to email / database / WhatsApp / Firebase.
    setSent(true);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (sent) {
    return (
      <Section bg={C.cream} style={{ padding: "clamp(80px,12vw,160px) 0", minHeight: "70vh", display: "flex", alignItems: "center" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
          <div style={{ width: 72, height: 72, borderRadius: 999, background: C.oak, display: "grid", placeItems: "center", margin: "0 auto 28px" }}>
            <Check size={34} color="#fff" />
          </div>
          <Eyebrow>Request received</Eyebrow>
          <H2 style={{ marginBottom: 18 }}>Thanks, {form.name.split(" ")[0] || "there"} — your {form.product.toLowerCase()} request is in.</H2>
          <p style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 17, lineHeight: 1.65, color: C.muted, marginBottom: 30 }}>
            A maker will review your dimensions and details and reach out within one working day with next steps and an itemised quote. Prefer to talk now? Message us on WhatsApp.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <Btn variant="solid" onClick={() => go("home")}>Back to home</Btn>
            <Btn variant="outline" icon={false} onClick={() => { setSent(false); setForm((f) => ({ ...f, notes: "", file: "" })); }}>Submit another</Btn>
          </div>
        </div>
      </Section>
    );
  }

  return (
    <>
      <PageHero kicker="Request a quote" title="Tell us what you're building." sub="Share your dimensions and a few preferences — we'll reply with drawings, samples and a clear price." img={IMG.kitchen2} />
      <Section bg={C.cream} style={{ padding: "clamp(56px,8vw,96px) 0" }}>
        <div className="grid lg:grid-cols-12" style={{ gap: 48 }}>
          {/* left rail */}
          <Reveal className="lg:col-span-4">
            <Eyebrow>What happens next</Eyebrow>
            <H2 style={{ fontSize: "clamp(1.7rem,3vw,2.2rem)", marginBottom: 22 }}>A real person, within a day.</H2>
            <div style={{ display: "grid", gap: 20 }}>
              {[
                ["We read your spec", "A maker checks feasibility against your dimensions."],
                ["We send samples", "Physical boards of your shortlisted materials."],
                ["You get an itemised quote", "Design, build, delivery and fitting — no hidden fees."],
              ].map(([t, d], i) => (
                <div key={t} style={{ display: "flex", gap: 14 }}>
                  <div style={{ flexShrink: 0, width: 30, height: 30, borderRadius: 999, background: C.sand, color: C.walnutDark, display: "grid", placeItems: "center", fontFamily: "'Fraunces',serif", fontSize: 15 }}>{i + 1}</div>
                  <div>
                    <div style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontWeight: 700, color: C.walnutDark, fontSize: 15.5 }}>{t}</div>
                    <div style={{ fontFamily: "'Hanken Grotesk',sans-serif", color: C.muted, fontSize: 14.5, lineHeight: 1.55, marginTop: 3 }}>{d}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 30, padding: "20px 22px", background: C.charcoal, borderRadius: 3 }}>
              <div style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: C.oak, marginBottom: 8 }}>Prefer to chat?</div>
              <p style={{ fontFamily: "'Hanken Grotesk',sans-serif", color: "rgba(255,255,255,.78)", fontSize: 14.5, lineHeight: 1.55, marginBottom: 14 }}>Send your dimensions straight to a maker on WhatsApp and skip the form.</p>
              <a href="https://wa.me/201000000000" target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 9, fontFamily: "'Hanken Grotesk',sans-serif", fontWeight: 600, fontSize: 14.5, color: "#fff" }}>
                <MessageCircle size={17} style={{ color: C.oak }} /> Open WhatsApp
              </a>
            </div>
          </Reveal>

          {/* form */}
          <Reveal className="lg:col-span-8" delay={100}>
            <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 4, padding: "clamp(24px,4vw,40px)" }}>
              {/* product toggle */}
              <Field label="Product type" required>
                <div style={{ display: "flex", gap: 10, marginTop: 2 }}>
                  {["Kitchen", "Office Desk"].map((p) => {
                    const active = form.product === p;
                    return (
                      <button key={p} onClick={() => setForm((f) => ({ ...f, product: p }))} style={{ flex: 1, cursor: "pointer", fontFamily: "'Hanken Grotesk',sans-serif", fontWeight: 600, fontSize: 15, padding: "14px", borderRadius: 3, border: `1px solid ${active ? C.oak : C.line}`, background: active ? C.oak : "transparent", color: active ? "#fff" : C.walnut, transition: "all .2s", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 9 }}>
                        {p === "Kitchen" ? <ChefHat size={18} /> : <Briefcase size={18} />} {p}
                      </button>
                    );
                  })}
                </div>
              </Field>

              <div className="grid sm:grid-cols-2" style={{ gap: 18, marginTop: 22 }}>
                <Field label="Full name" required><input style={inputStyle} value={form.name} onChange={set("name")} placeholder="e.g. Nour Adel" /></Field>
                <Field label="Phone number" required><input style={inputStyle} value={form.phone} onChange={set("phone")} placeholder="+20 ___ ___ ____" /></Field>
                <Field label="Email" required><input style={inputStyle} type="email" value={form.email} onChange={set("email")} placeholder="you@email.com" /></Field>
                <Field label="Location" required><input style={inputStyle} value={form.location} onChange={set("location")} placeholder="City / area" /></Field>
              </div>

              <div style={{ marginTop: 22 }}>
                <Field label="Dimensions (cm)">
                  <div className="grid grid-cols-3" style={{ gap: 12 }}>
                    <input style={inputStyle} value={form.width} onChange={set("width")} placeholder="Width" inputMode="numeric" />
                    <input style={inputStyle} value={form.depth} onChange={set("depth")} placeholder="Depth" inputMode="numeric" />
                    <input style={inputStyle} value={form.height} onChange={set("height")} placeholder="Height" inputMode="numeric" />
                  </div>
                </Field>
              </div>

              <div style={{ marginTop: 22 }}>
                <Field label="Notes — styles, storage, finishes, anything specific">
                  <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 110, lineHeight: 1.55 }} value={form.notes} onChange={set("notes")} placeholder="Tell us about the space, how you'll use it, materials you like…" />
                </Field>
              </div>

              <div style={{ marginTop: 22 }}>
                <Field label="Reference image (optional)">
                  <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", border: `1px dashed ${C.lineDark}`, borderRadius: 3, padding: "16px 18px", background: C.cream }}>
                    <Upload size={18} style={{ color: C.oakDeep }} />
                    <span style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 14.5, color: form.file ? C.ink : C.muted }}>{form.file || "Upload a photo or sketch of your space"}</span>
                    <input type="file" accept="image/*" onChange={onFile} style={{ display: "none" }} />
                  </label>
                </Field>
              </div>

              <div style={{ marginTop: 30, display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
                <Btn variant="solid" onClick={submit}>Submit request</Btn>
                <span style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 13.5, color: C.muted }}>No obligation. We reply within one working day.</span>
              </div>
            </div>
          </Reveal>
        </div>
      </Section>
    </>
  );
}

function ContactPage({ go }) {
  return (
    <>
      <PageHero kicker="Contact" title="Come and talk timber with us." sub="Visit the workshop, send a message, or start a quote — whatever's easiest." img={IMG.workshop} />
      <Section bg={C.cream} style={{ padding: "clamp(56px,8vw,96px) 0" }}>
        <div className="grid lg:grid-cols-2" style={{ gap: 48 }}>
          <Reveal>
            <Eyebrow>Reach us</Eyebrow>
            <H2 style={{ marginBottom: 28 }}>The details.</H2>
            <div style={{ display: "grid", gap: 4 }}>
              {[
                { icon: MapPin, t: "Workshop & showroom", d: "Industrial Zone, Alexandria, Egypt" },
                { icon: Phone, t: "Phone", d: "+20 100 000 0000" },
                { icon: Mail, t: "Email", d: "hello@hewnandoak.example" },
                { icon: MessageCircle, t: "WhatsApp", d: "Tap the green button any time" },
              ].map((r) => (
                <div key={r.t} style={{ display: "flex", gap: 16, padding: "20px 0", borderBottom: `1px solid ${C.line}` }}>
                  <div style={{ flexShrink: 0, width: 44, height: 44, borderRadius: 3, background: C.sand, display: "grid", placeItems: "center", color: C.walnutDark }}><r.icon size={20} /></div>
                  <div>
                    <div style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontWeight: 700, color: C.walnutDark, fontSize: 15.5 }}>{r.t}</div>
                    <div style={{ fontFamily: "'Hanken Grotesk',sans-serif", color: C.muted, fontSize: 15, marginTop: 2 }}>{r.d}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 26, display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Btn variant="solid" onClick={() => go("quote")}>Request a quote</Btn>
              <a href="https://wa.me/201000000000" target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
                <Btn variant="outline" icon={false}><MessageCircle size={17} /> Chat on WhatsApp</Btn>
              </a>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <Photo src={IMG.craft1} alt="Workshop" style={{ aspectRatio: "1/1", borderRadius: 3 }} />
            <div style={{ marginTop: 22, padding: "24px 26px", background: C.charcoal, borderRadius: 3 }}>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: 22, color: C.cream, marginBottom: 8 }}>Studio hours</div>
              <div style={{ fontFamily: "'Hanken Grotesk',sans-serif", color: "rgba(255,255,255,.72)", fontSize: 15, lineHeight: 1.8 }}>
                Saturday – Thursday · 9:00 – 18:00<br />Friday · by appointment
              </div>
            </div>
          </Reveal>
        </div>
      </Section>
      <Section bg={C.paper} style={{ padding: "clamp(48px,7vw,80px) 0" }}>
        <Reveal style={{ maxWidth: 620, marginBottom: 30 }}><Eyebrow>Before you ask</Eyebrow><H2>Quick answers.</H2></Reveal>
        <div className="grid lg:grid-cols-2" style={{ gap: "0 56px" }}>
          <div>{FAQ.slice(0, 3).map((f) => <FaqItem key={f.q} {...f} />)}</div>
          <div>{FAQ.slice(3).map((f) => <FaqItem key={f.q} {...f} />)}</div>
        </div>
      </Section>
    </>
  );
}

/* ------------------------------ chrome ------------------------------ */

function Logo({ light, onClick }) {
  return (
    <button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 11, background: "none", border: "none", cursor: "pointer" }}>
      <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden>
        <rect x="1" y="1" width="28" height="28" rx="3" stroke={light ? "#fff" : C.walnutDark} strokeWidth="1.5" />
        <path d="M7 20c3-7 5-10 8-10s5 3 8 10" stroke={C.oak} strokeWidth="1.6" strokeLinecap="round" />
        <path d="M7 15c3-5 5-7 8-7s5 2 8 7" stroke={light ? "rgba(255,255,255,.55)" : C.walnut} strokeWidth="1.3" strokeLinecap="round" />
      </svg>
      <span style={{ fontFamily: "'Fraunces',serif", fontSize: 20, fontWeight: 600, letterSpacing: "-0.01em", color: light ? "#fff" : C.walnutDark }}>
        Hewn <span style={{ color: C.oak }}>&amp;</span> Oak
      </span>
    </button>
  );
}

function Nav({ page, go }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const onHero = ["home", "about", "services", "kitchens", "desks", "gallery", "how", "quote", "contact"].includes(page);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    h(); window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);
  const solid = scrolled || open;
  const light = !solid && onHero;
  return (
    <>
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, transition: "all .3s ease", background: solid ? C.cream : "transparent", borderBottom: solid ? `1px solid ${C.line}` : "1px solid transparent", boxShadow: scrolled ? "0 10px 30px -24px rgba(62,44,30,.4)" : "none" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 68, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Logo light={light} onClick={() => { go("home"); setOpen(false); }} />
          <div className="hidden lg:flex" style={{ alignItems: "center", gap: 6 }}>
            {NAV.map(([label, key]) => {
              const active = page === key;
              return (
                <button key={key} onClick={() => go(key)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 14.5, fontWeight: active ? 700 : 500, color: light ? (active ? "#fff" : "rgba(255,255,255,.8)") : active ? C.walnutDark : C.muted, padding: "8px 12px", position: "relative" }}>
                  {label}
                  {active && <span style={{ position: "absolute", bottom: 2, left: 12, right: 12, height: 2, background: C.oak, borderRadius: 2 }} />}
                </button>
              );
            })}
          </div>
          <div className="hidden lg:block">
            <Btn variant={light ? "ghostLight" : "solid"} icon={false} onClick={() => go("quote")} style={{ padding: "11px 20px" }}>Request a Quote</Btn>
          </div>
          <button className="lg:hidden" onClick={() => setOpen((o) => !o)} style={{ background: "none", border: "none", cursor: "pointer", color: light ? "#fff" : C.walnutDark, padding: 6 }}>
            {open ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </nav>

      {/* mobile menu */}
      <div className="lg:hidden" style={{ position: "fixed", inset: 0, zIndex: 49, background: C.cream, transition: "opacity .3s, transform .3s", opacity: open ? 1 : 0, transform: open ? "translateY(0)" : "translateY(-12px)", pointerEvents: open ? "auto" : "none", paddingTop: 68, overflowY: "auto" }}>
        <div style={{ padding: "24px" }}>
          {NAV.map(([label, key], i) => (
            <button key={key} onClick={() => { go(key); setOpen(false); }} style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between", background: "none", border: "none", borderBottom: `1px solid ${C.line}`, cursor: "pointer", padding: "18px 4px", fontFamily: "'Fraunces',serif", fontSize: 22, color: page === key ? C.oakDeep : C.walnutDark }}>
              {label} <ArrowUpRight size={18} style={{ color: C.muted }} />
            </button>
          ))}
          <div style={{ marginTop: 24 }}>
            <Btn variant="solid" onClick={() => { go("quote"); setOpen(false); }} style={{ width: "100%", justifyContent: "center" }}>Request a Quote</Btn>
          </div>
        </div>
      </div>
    </>
  );
}

function Footer({ go }) {
  return (
    <footer style={{ background: C.charcoal, color: "rgba(255,255,255,.7)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "clamp(48px,7vw,80px) 24px 36px" }}>
        <div className="grid md:grid-cols-12" style={{ gap: 40 }}>
          <div className="md:col-span-5">
            <Logo light onClick={() => go("home")} />
            <p style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 15.5, lineHeight: 1.65, color: "rgba(255,255,255,.6)", maxWidth: 360, marginTop: 20 }}>
              Custom kitchens and office desks, designed and built to your exact space by a small workshop team — from first sketch to final fit.
            </p>
            <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
              <a href="https://wa.me/201000000000" target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 14, fontWeight: 600, color: "#fff" }}>
                <MessageCircle size={16} style={{ color: C.oak }} /> WhatsApp
              </a>
            </div>
          </div>
          <div className="md:col-span-3">
            <FooterCol title="Explore" links={[["Home", "home"], ["About", "about"], ["Services", "services"], ["Gallery", "gallery"]]} go={go} />
          </div>
          <div className="md:col-span-2">
            <FooterCol title="Products" links={[["Kitchens", "kitchens"], ["Office Desks", "desks"], ["How It Works", "how"], ["Quote", "quote"]]} go={go} />
          </div>
          <div className="md:col-span-2">
            <div style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 12.5, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "rgba(255,255,255,.45)", marginBottom: 16 }}>Visit</div>
            <p style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 14.5, lineHeight: 1.7, color: "rgba(255,255,255,.65)" }}>
              Industrial Zone<br />Alexandria, Egypt<br /><br />+20 100 000 0000<br />hello@hewnandoak.example
            </p>
          </div>
        </div>
        <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,.1)", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <span style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 13.5, color: "rgba(255,255,255,.45)" }}>© {new Date().getFullYear()} Hewn &amp; Oak. Custom woodwork studio.</span>
          <span style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 13.5, color: "rgba(255,255,255,.45)" }}>3D configurator — coming soon.</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links, go }) {
  return (
    <div>
      <div style={{ fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 12.5, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "rgba(255,255,255,.45)", marginBottom: 16 }}>{title}</div>
      <div style={{ display: "grid", gap: 11 }}>
        {links.map(([l, k]) => (
          <button key={k} onClick={() => go(k)} style={{ textAlign: "left", background: "none", border: "none", cursor: "pointer", fontFamily: "'Hanken Grotesk',sans-serif", fontSize: 14.5, color: "rgba(255,255,255,.65)", padding: 0 }}>{l}</button>
        ))}
      </div>
    </div>
  );
}

function WhatsAppFab() {
  const [h, setH] = useState(false);
  return (
    <a
      href="https://wa.me/201000000000?text=Hi%20Hewn%20%26%20Oak%2C%20I'd%20like%20to%20talk%20about%20a%20custom%20piece."
      target="_blank" rel="noreferrer"
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ position: "fixed", right: 22, bottom: 22, zIndex: 60, display: "inline-flex", alignItems: "center", gap: 10, background: "#1FA855", color: "#fff", textDecoration: "none", padding: h ? "14px 20px 14px 16px" : "14px", borderRadius: 999, boxShadow: "0 14px 34px -12px rgba(31,168,85,.7)", transition: "all .25s ease", fontFamily: "'Hanken Grotesk',sans-serif", fontWeight: 700, fontSize: 15 }}
    >
      <MessageCircle size={24} />
      <span style={{ maxWidth: h ? 160 : 0, overflow: "hidden", whiteSpace: "nowrap", transition: "max-width .25s ease" }}>Chat with us</span>
    </a>
  );
}

/* ------------------------------ app ------------------------------ */

export default function MarketingSite() {
  const [page, setPage] = useState("home");
  const [quoteProduct, setQuoteProduct] = useState("Kitchen");

  const go = (key, product) => {
    if (key === "configure") {
      if (typeof window !== "undefined")
        window.location.href = product ? "/configure?product=" + encodeURIComponent(product) : "/configure";
      return;
    }
    if (product) setQuoteProduct(product);
    setPage(key);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "auto" });
  };

  const render = () => {
    switch (page) {
      case "about": return <AboutPage go={go} />;
      case "services": return <ServicesPage go={go} />;
      case "kitchens": return <ProductPage go={go} kind="kitchen" />;
      case "desks": return <ProductPage go={go} kind="desk" />;
      case "gallery": return <GalleryPage go={go} />;
      case "how": return <HowItWorksPage go={go} />;
      case "quote": return <QuotePage go={go} preset={quoteProduct} />;
      case "contact": return <ContactPage go={go} />;
      default: return <HomePage go={go} />;
    }
  };

  return (
    <div style={{ background: C.cream, minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Hanken+Grotesk:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        ::selection { background: ${C.oak}; color: #fff; }
        html { scroll-behavior: smooth; }
        button:focus-visible, a:focus-visible, input:focus-visible, textarea:focus-visible {
          outline: 2px solid ${C.oakDeep}; outline-offset: 2px;
        }
        input::placeholder, textarea::placeholder { color: ${C.muted}; opacity: .8; }
        @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
      `}</style>
      <Nav page={page} go={go} />
      <main>{render()}</main>
      <Footer go={go} />
      <WhatsAppFab />
    </div>
  );
}
