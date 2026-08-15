---
name: Nuance Logic
colors:
  surface: '#111317'
  surface-dim: '#111317'
  surface-bright: '#37393e'
  surface-container-lowest: '#0c0e12'
  surface-container-low: '#1a1c20'
  surface-container: '#1e2024'
  surface-container-high: '#282a2e'
  surface-container-highest: '#333539'
  on-surface: '#e2e2e8'
  on-surface-variant: '#c3caad'
  inverse-surface: '#e2e2e8'
  inverse-on-surface: '#2f3035'
  outline: '#8d947a'
  outline-variant: '#434934'
  surface-tint: '#a1d800'
  primary: '#ffffff'
  on-primary: '#253500'
  primary-container: '#b9f612'
  on-primary-container: '#506e00'
  inverse-primary: '#4b6700'
  secondary: '#c0c1ff'
  on-secondary: '#1000a9'
  secondary-container: '#3131c0'
  on-secondary-container: '#b0b2ff'
  tertiary: '#ffffff'
  on-tertiary: '#620040'
  tertiary-container: '#ffd8e7'
  on-tertiary-container: '#ab3779'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#b9f612'
  primary-fixed-dim: '#a1d800'
  on-primary-fixed: '#141f00'
  on-primary-fixed-variant: '#384e00'
  secondary-fixed: '#e1e0ff'
  secondary-fixed-dim: '#c0c1ff'
  on-secondary-fixed: '#07006c'
  on-secondary-fixed-variant: '#2f2ebe'
  tertiary-fixed: '#ffd8e7'
  tertiary-fixed-dim: '#ffafd3'
  on-tertiary-fixed: '#3d0026'
  on-tertiary-fixed-variant: '#85145a'
  background: '#111317'
  on-background: '#e2e2e8'
  surface-variant: '#333539'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
  data-mono:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: -0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 16px
  md: 24px
  lg: 32px
  xl: 48px
  gutter: 20px
  margin: 32px
---

## Brand & Style

The design system embodies a **Corporate Modern** aesthetic with a precision-engineered feel. It is designed for high-stakes professional environments—finance, SaaS, and data analytics—where information density must coexist with extreme clarity.

The personality is authoritative yet approachable, shifting away from gamer-centric neon toward a "Studio Professional" look. It leverages **Minimalism** to manage complex data and **Tactile** subtle borders to define structure. The emotional response is one of confidence, efficiency, and sophisticated control.

- **Visual Narrative:** A focus on "Information Architecture as Art."
- **Key Principles:** Grid-first composition, strict hierarchical weight, and purposeful use of high-chroma accents against a muted, professional foundation.

## Colors

The palette transitions from a pure black to a deep **Charcoal/Slate** ecosystem. This reduces eye strain while maintaining a premium "pro-tool" feel.

- **Primary (#C1FF22):** "Electric Lime" is used exclusively for primary actions, success states, and progress indicators. It is the North Star of the interface.
- **Accents:** Muted purples and dusty blues are used for data categorization (e.g., multi-series charts or tags) to provide variety without breaking the professional tone.
- **Neutrals:** The background uses a tiered dark grey scale. Pure white is avoided; instead, use off-whites for typography to ensure legible contrast that isn't jarring.
- **Borders:** A consistent 1px stroke (#2D3139) is used to define containers, replacing shadows as the primary method of separation.

## Typography

Typography is used as a functional tool for data navigation. By utilizing **Geist** for headings and labels, we achieve a technical, precise feel. **Inter** is reserved for longer body passages to ensure maximum readability.

- **Weight Hierarchy:** Use Medium (500) and SemiBold (600) for data points and headers. Use Regular (400) only for descriptive text.
- **Labels:** Small, uppercase labels with slight letter-spacing are the standard for card headers and axis titles.
- **Numerical Data:** Always use tabular figures (monospaced) for numbers within tables and charts to ensure vertical alignment.

## Layout & Spacing

The layout philosophy follows a **High-Density Fluid Grid**. It is designed to maximize information "above the fold" without feeling cluttered.

- **Grid Model:** Use a 12-column grid for desktop. For dashboard views, use a sidebar + main content area where the main content is divided into modular "widgets."
- **Modular Cards:** Every piece of information lives in a defined container. Containers should span 3, 4, 6, or 12 columns.
- **Density:** Padding within cards is tight (16px - 24px) to allow for more data visualization. 
- **Reflow:** On mobile, the sidebar collapses into a bottom navigation bar or a hamburger menu, and all cards stack vertically to 100% width.

## Elevation & Depth

This design system avoids heavy shadows and traditional skeuomorphism. Depth is communicated through **Tonal Layers** and **Low-Contrast Outlines**.

- **Surface Tiers:** The background is the darkest layer. Cards sit on top of this background with a slightly lighter fill.
- **Border-Based Separation:** Instead of shadows, use 1px solid borders. This creates a "blueprint" or "architectural" feel. 
- **Subtle Glow:** Only primary interactive elements (like an active toggle or a high-priority "Hot Opportunity" dot) may use a very soft, color-matched outer glow to draw attention.
- **Active State:** When a card or row is selected, it should receive a subtle background tint or a left-hand border accent in the Primary color.

## Shapes

The shape language is disciplined and geometric. 

- **Containers:** Cards and primary UI containers use a 0.5rem (8px) radius. This provides a modern, professional look that isn't as "bubbly" as consumer apps but softer than industrial software.
- **Buttons:** Primary buttons should use the same 8px radius to match the containers. 
- **Data Points:** In charts, use square or slightly rounded (2px) markers to maintain the technical aesthetic.

## Components

- **Modular Cards:** Cards consist of a header (uppercase label + optional icon), a main content area (Data point or Chart), and a footer (trend indicator). Use a 1px border separator between the header and body.
- **Primary Buttons:** High-contrast fill using the Primary Lime color with dark text. No gradient.
- **Secondary Buttons:** Ghost style with a 1px border and light grey text.
- **Input Fields:** Dark background, 1px border. Focus state is indicated by the border changing to the Primary color.
- **Status Pills:** Small, rounded badges for "New," "Priority," or "In Progress." Use subtle background tints with high-contrast text.
- **Data Visualization:** Use thin lines (1.5px) for sparklines and bar charts. Avoid heavy fills; use 20% opacity gradients for area charts to keep the UI feeling "light."
- **Dashboards:** Use "Value + Delta" patterns (e.g., 1232 +8%) where the delta is significantly smaller and placed adjacent to the main metric.