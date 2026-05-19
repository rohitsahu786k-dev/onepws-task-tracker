---
name: website-development
description: |
  Use this skill for ANY advanced web development task — 3D websites, dynamic frontends, AI-powered webapps, enterprise portals, dashboards, and professional UI systems. Trigger this skill whenever the user mentions: Three.js, WebGL, GSAP, 3D animations, scroll effects, parallax, SaaS dashboard, admin portal, AI automation UI, dark-themed professional UI, glassmorphism, modern landing pages, React apps, Next.js, component libraries, design systems, or anything involving visually rich and interactive web experiences. Also trigger for performance optimization, mobile-first design, accessibility, and API/backend integration tasks. Use proactively whenever output is a web interface, web component, or interactive artifact — even if the user does not say "website" explicitly.
---

# Website Development Skill

A comprehensive skill for building **3D websites**, **dynamic webapps**, **AI-powered portals**, and **professional-grade UI** systems. This skill guides AI agents through the full stack — from visual design to deployment-ready code.

---

## Agent Mindset

- Always produce **production-ready**, clean, commented code.
- Default to **dark, premium aesthetics** unless user specifies otherwise.
- Prioritize **performance + visual impact** together — never sacrifice one for the other.
- Structure code **modularly** so each component is reusable and maintainable.
- When in doubt, **ask one clarifying question** before writing large amounts of code.

---

## Stack Selection Guide

Choose the right stack based on the task. Use this decision tree:

| Use Case | Recommended Stack |
|---|---|
| 3D hero, particle effects, WebGL scenes | Three.js + GSAP + Vite |
| Full SaaS / Admin Portal | Next.js 14+ (App Router) + Tailwind + ShadCN |
| AI Chat / Automation UI | Next.js + Vercel AI SDK + Streaming API |
| Marketing Landing Page | Astro or Next.js + Framer Motion + Tailwind |
| Real-time Dashboard | React + Recharts/D3 + WebSocket / SWR |
| Component Library / Design System | Storybook + Radix UI + Tailwind |
| Simple Interactive Artifact | Vanilla HTML/CSS/JS (single file) |

---

## Module 1 — 3D Websites & WebGL

### When to use
User asks for: 3D scenes, particle systems, 3D text, scroll-driven 3D, product configurators, immersive landing pages, WebGL backgrounds.

### Key Libraries
```
three.js         — 3D rendering engine
@react-three/fiber  — React wrapper for Three.js
@react-three/drei   — Helpers (OrbitControls, Text3D, Environment, etc.)
gsap + ScrollTrigger — Scroll-linked 3D animations
leva             — Debug GUI for 3D parameters
```

### Agent Steps
1. **Scaffold** — Set up Vite + React or plain HTML with Three.js CDN.
2. **Scene Setup** — Create `Scene.jsx`: PerspectiveCamera, WebGLRenderer, lighting (ambient + directional + point lights).
3. **3D Assets** — Use `GLTFLoader` for models or generate geometry procedurally (TorusKnot, IcosahedronGeometry, etc.).
4. **Shaders** — Write custom GLSL vertex/fragment shaders for unique visual effects when needed.
5. **Animation Loop** — Use `requestAnimationFrame` or R3F's `useFrame` hook.
6. **Scroll Integration** — Use GSAP ScrollTrigger to drive camera position / object rotation on scroll.
7. **Performance** — Enable `antialias: false` on mobile, use `InstancedMesh` for repeated objects, dispose geometries/materials.

### Code Pattern — Three.js Boilerplate
```javascript
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

// Lighting
scene.add(new THREE.AmbientLight(0xffffff, 0.5));
const dirLight = new THREE.DirectionalLight(0x7b2fff, 1.5);
dirLight.position.set(5, 5, 5);
scene.add(dirLight);

camera.position.z = 5;

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

// Responsive
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
```

---

## Module 2 — Professional UI System

### When to use
User asks for: dark dashboards, glassmorphism cards, admin panels, SaaS UI, design systems, modern component libraries, premium landing pages.

### Design Tokens (Dark Premium Theme)
```css
:root {
  /* Colors */
  --bg-primary: #0a0a0f;
  --bg-secondary: #111118;
  --bg-card: rgba(255, 255, 255, 0.04);
  --border: rgba(255, 255, 255, 0.08);
  --accent-primary: #7b2fff;   /* Electric purple */
  --accent-secondary: #00d4ff; /* Cyan */
  --accent-glow: rgba(123, 47, 255, 0.3);
  --text-primary: #f0f0f5;
  --text-secondary: #8a8a9a;
  --text-muted: #4a4a5a;
  --success: #00e676;
  --warning: #ffab40;
  --error: #ff5252;

  /* Typography */
  --font-display: 'Inter', 'Space Grotesk', sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  /* Spacing (8pt grid) */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;
  --space-16: 64px;

  /* Radius */
  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 20px;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-glow: 0 0 40px rgba(123, 47, 255, 0.2);
  --shadow-card: 0 8px 32px rgba(0, 0, 0, 0.4);
}
```

### Glassmorphism Card Pattern
```css
.glass-card {
  background: var(--bg-card);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  padding: var(--space-6);
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}
.glass-card:hover {
  border-color: rgba(123, 47, 255, 0.4);
  box-shadow: var(--shadow-glow), var(--shadow-card);
}
```

### UI Components Checklist
When building a UI system, always include:
- [ ] **NavBar** — sticky, blurred background, logo + links + CTA button
- [ ] **Hero Section** — headline, subtext, 2 CTAs, visual (3D/animation/gradient)
- [ ] **Feature Cards** — glassmorphism, icon, title, description
- [ ] **Stats/Metrics Row** — animated counter, value, label
- [ ] **Pricing Table** — toggle monthly/annual, highlighted plan, feature list
- [ ] **Testimonials** — carousel or grid, avatar, quote, name/title
- [ ] **CTA Section** — gradient background, headline, button
- [ ] **Footer** — logo, links columns, social icons, copyright

---

## Module 3 — AI-Powered Webapp

### When to use
User asks for: AI chat UI, prompt builder, AI automation dashboard, LLM-powered features, streaming responses, AI agent interface.

### Architecture Pattern
```
Frontend (Next.js App Router)
  └── /app
      ├── layout.tsx          — Root layout, providers
      ├── page.tsx            — Landing / dashboard
      └── /api
          └── chat/route.ts   — API route → Anthropic/OpenAI SDK

Components
  ├── ChatInterface.tsx        — Message list + input
  ├── StreamingMessage.tsx     — Renders streamed tokens
  ├── PromptBuilder.tsx        — Structured prompt UI
  └── AutomationFlow.tsx       — Visual workflow builder
```

### Streaming API Route (Next.js + Anthropic)
```typescript
// app/api/chat/route.ts
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export async function POST(req: Request) {
  const { messages, systemPrompt } = await req.json();

  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    system: systemPrompt,
    messages,
  });

  return new Response(stream.toReadableStream(), {
    headers: { 'Content-Type': 'text/event-stream' },
  });
}
```

### AI UI Best Practices
- Always show **typing indicator** while streaming.
- Display **token count / cost estimate** in dev/admin mode.
- Add **copy button** to every AI response block.
- Support **markdown rendering** in responses (use `react-markdown` + `rehype-highlight`).
- Implement **conversation history** management (trim old messages to stay within context limit).
- Add **retry** and **regenerate** buttons.
- Store conversations in **localStorage** or database with unique IDs.

---

## Module 4 — Dynamic Animations

### When to use
User asks for: scroll animations, entrance effects, micro-interactions, page transitions, loading sequences, morphing shapes.

### Library Priority
1. **GSAP** — For complex, timeline-based animations and scroll effects (most powerful).
2. **Framer Motion** — For React component animations and page transitions.
3. **CSS Animations** — For simple hover effects and loaders.
4. **Lottie** — For JSON-based vector animations from After Effects.

### GSAP Scroll Animation Pattern
```javascript
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

// Staggered card entrance
gsap.from('.feature-card', {
  scrollTrigger: {
    trigger: '.features-section',
    start: 'top 80%',
    toggleActions: 'play none none reverse',
  },
  y: 60,
  opacity: 0,
  duration: 0.8,
  stagger: 0.15,
  ease: 'power3.out',
});

// Parallax background
gsap.to('.hero-bg', {
  scrollTrigger: {
    trigger: '.hero',
    start: 'top top',
    end: 'bottom top',
    scrub: 1.5,
  },
  y: -150,
});
```

### Framer Motion Page Transition (Next.js)
```tsx
// components/PageWrapper.tsx
import { motion } from 'framer-motion';

export function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  );
}
```

---

## Module 5 — Enterprise Portal / Dashboard

### When to use
User asks for: admin panel, analytics dashboard, CRM, ERP interface, multi-role portal, data tables, charts, user management.

### Layout System
```
┌─────────────────────────────────────────────┐
│  TOPBAR: Logo | Search | Notifications | Avatar│
├──────────┬──────────────────────────────────┤
│          │  BREADCRUMB + PAGE TITLE         │
│ SIDEBAR  ├──────────────────────────────────┤
│          │  STATS CARDS ROW                 │
│ • Nav    ├──────────────────────────────────┤
│ • Links  │  MAIN CONTENT AREA               │
│ • Icons  │  (Charts / Tables / Forms)       │
│          │                                  │
└──────────┴──────────────────────────────────┘
```

### Essential Dashboard Components
```tsx
// Stat Card
<StatCard
  title="Total Revenue"
  value="$124,582"
  change="+14.2%"
  trend="up"
  icon={<DollarSign />}
  sparklineData={[...]}
/>

// Data Table with sorting, filtering, pagination
<DataTable
  columns={columns}
  data={data}
  searchable
  exportable
  pagination={{ pageSize: 20 }}
/>

// Chart (Recharts)
<ResponsiveContainer width="100%" height={300}>
  <AreaChart data={data}>
    <defs>
      <linearGradient id="colorGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#7b2fff" stopOpacity={0.3}/>
        <stop offset="95%" stopColor="#7b2fff" stopOpacity={0}/>
      </linearGradient>
    </defs>
    <Area type="monotone" dataKey="value" stroke="#7b2fff" fill="url(#colorGrad)" strokeWidth={2}/>
  </AreaChart>
</ResponsiveContainer>
```

### Role-Based Access (RBAC) Pattern
```typescript
// lib/rbac.ts
type Role = 'admin' | 'manager' | 'viewer';
type Permission = 'read' | 'write' | 'delete' | 'export';

const permissions: Record<Role, Permission[]> = {
  admin: ['read', 'write', 'delete', 'export'],
  manager: ['read', 'write', 'export'],
  viewer: ['read'],
};

export function can(role: Role, action: Permission): boolean {
  return permissions[role]?.includes(action) ?? false;
}
```

---

## Module 6 — Performance & SEO

### Core Web Vitals Targets
| Metric | Target |
|---|---|
| LCP (Largest Contentful Paint) | < 2.5s |
| FID / INP (Interaction to Next Paint) | < 200ms |
| CLS (Cumulative Layout Shift) | < 0.1 |
| Bundle Size (initial JS) | < 200KB gzipped |

### Optimization Checklist
- [ ] Use `next/image` with proper `width`, `height`, `priority` for hero images.
- [ ] Code-split heavy libraries (Three.js, D3) with `dynamic(() => import(...), { ssr: false })`.
- [ ] Lazy-load below-fold sections.
- [ ] Preload critical fonts with `<link rel="preload">`.
- [ ] Use `will-change: transform` sparingly on animated elements.
- [ ] Implement proper `loading="lazy"` on all non-critical images.
- [ ] Add `rel="preconnect"` for external API/font domains.
- [ ] Minify and tree-shake: use Vite or Next.js built-in optimizations.
- [ ] Serve WebP/AVIF images with fallback.
- [ ] Add proper meta tags: `og:title`, `og:image`, `twitter:card`, `description`.

---

## Module 7 — File & Project Structure

### Next.js App Router (Recommended for Portals / AI Apps)
```
my-webapp/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   └── settings/page.tsx
│   └── api/
│       └── [...route]/route.ts
├── components/
│   ├── ui/          ← Base design system (Button, Card, Input...)
│   ├── layout/      ← Navbar, Sidebar, Footer
│   ├── sections/    ← Hero, Features, Pricing...
│   └── features/    ← Domain-specific components
├── lib/
│   ├── utils.ts
│   ├── api.ts
│   └── hooks/
├── styles/
│   ├── globals.css
│   └── tokens.css
├── public/
│   ├── fonts/
│   └── assets/
└── types/
    └── index.ts
```

### Three.js / Pure 3D Site
```
3d-website/
├── index.html
├── src/
│   ├── main.js         ← Entry: scene init, render loop
│   ├── scene/
│   │   ├── lights.js
│   │   ├── camera.js
│   │   └── objects.js
│   ├── animations/
│   │   ├── scroll.js   ← GSAP ScrollTrigger
│   │   └── intro.js    ← Entry animation
│   └── utils/
│       └── responsive.js
├── shaders/
│   ├── vertex.glsl
│   └── fragment.glsl
└── assets/
    ├── models/
    └── textures/
```

---

## Quick Reference — Common Patterns

### Animated Counter
```javascript
gsap.to(counterEl, {
  innerHTML: targetValue,
  duration: 2,
  ease: 'power2.out',
  snap: { innerHTML: 1 },
  scrollTrigger: { trigger: counterEl, start: 'top 85%' },
});
```

### CSS Gradient Text
```css
.gradient-text {
  background: linear-gradient(135deg, #7b2fff 0%, #00d4ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

### Smooth Cursor Follower
```javascript
const cursor = document.querySelector('.cursor');
let mouseX = 0, mouseY = 0;
let curX = 0, curY = 0;

document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

function updateCursor() {
  curX += (mouseX - curX) * 0.1;
  curY += (mouseY - curY) * 0.1;
  cursor.style.transform = `translate(${curX}px, ${curY}px)`;
  requestAnimationFrame(updateCursor);
}
updateCursor();
```

### Typewriter Effect
```javascript
const phrases = ['Build Faster.', 'Ship Smarter.', 'Scale Globally.'];
let i = 0, j = 0, isDeleting = false;

function typewrite() {
  const current = phrases[i];
  el.textContent = isDeleting ? current.slice(0, j--) : current.slice(0, j++);

  if (!isDeleting && j === current.length) {
    setTimeout(() => isDeleting = true, 1500);
  } else if (isDeleting && j === 0) {
    isDeleting = false;
    i = (i + 1) % phrases.length;
  }

  setTimeout(typewrite, isDeleting ? 60 : 100);
}
typewrite();
```

---

## Agent Output Checklist

Before returning code to the user, verify:

- [ ] Code is **complete and runnable** (no placeholder `// TODO` blocks left).
- [ ] **All imports** are included at the top.
- [ ] CSS uses **design tokens** (`var(--accent-primary)`) not hardcoded hex.
- [ ] Components are **responsive** (mobile-first media queries).
- [ ] **Accessibility** basics: semantic HTML, `aria-label`, keyboard navigation, sufficient contrast.
- [ ] **Comments** explain non-obvious sections.
- [ ] Heavy libraries are **lazy-loaded** where appropriate.
- [ ] File has a clear **folder path** specified so the user knows where to place it.
- [ ] If multiple files, output in **order of dependency** (utils → hooks → components → pages).

---

## Examples

### Example 1 — User: "3D hero section with rotating torus and scroll effect"
**Agent does:**
1. Creates `Hero.jsx` with R3F canvas.
2. Adds `TorusKnot` mesh with custom purple shader material.
3. Uses GSAP ScrollTrigger to rotate mesh on scroll.
4. Adds ambient + point light with purple glow.
5. Makes canvas `position: absolute` behind hero text.
6. Adds responsive resize handler.

### Example 2 — User: "Admin dashboard with sidebar, stats, and charts"
**Agent does:**
1. Scaffolds Next.js app with Tailwind + ShadCN.
2. Creates `DashboardLayout.tsx` with collapsible sidebar.
3. Builds `StatCard` component with sparkline.
4. Adds `AreaChart` with Recharts using gradient fill.
5. Adds `DataTable` with sorting, search, and pagination.
6. Implements dark theme with design tokens.

### Example 3 — User: "AI chat interface with streaming"
**Agent does:**
1. Creates `ChatInterface.tsx` with message list + input.
2. Sets up `app/api/chat/route.ts` with Anthropic streaming.
3. Renders streamed tokens in real-time with `StreamingMessage.tsx`.
4. Adds copy button, retry, and markdown rendering.
5. Persists conversation in localStorage with IDs.