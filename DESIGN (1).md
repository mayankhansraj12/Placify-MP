```markdown
# Design System Specification: Editorial Glassmorphism

## 1. Overview & Creative North Star: "The Digital Ethereal"
The North Star for this design system is **"The Digital Ethereal."** We are moving away from the rigid, boxy constraints of traditional SaaS dashboards toward a high-end editorial experience. The goal is to make the user feel like they are interacting with a premium physical object—a pane of frosted glass suspended in a soft, atmospheric light.

To achieve this, we reject "template" layouts. We embrace **intentional asymmetry**, where content is anchored by heavy editorial typography and floating, glass-morphic modules. We do not use lines to separate ideas; we use depth, light, and breathing room.

---

## 2. Color & Atmospheric Surface
The palette is built on a tension between the airy transparency of the sky and the authoritative depth of the deep sea.

### The Palette (Material Design Mapping)
*   **Primary (#0962A0 / #7BBBFF):** Use for high-action focal points. The `primary_container` (#7BBBFF) acts as our "Sky Periwinkle" signature.
*   **Secondary (#5D54A3 / #B3A9FF):** Our "Soft Lavender," used to denote AI-driven insights or secondary atmospheric accents.
*   **On-Surface / Text (#050F2A):** This Deep Navy is our anchor. It must be used with tight tracking to provide a high-contrast, editorial feel against the soft backgrounds.

### The "No-Line" Rule
**Explicit Instruction:** 1px solid borders for sectioning are strictly prohibited. Boundaries must be defined solely through:
1.  **Tonal Shifts:** Placing a `surface_container_low` card on a `surface` background.
2.  **Negative Space:** Utilizing the `16` (5.5rem) and `20` (7rem) spacing tokens to create mental groupings.
3.  **Glassmorphism:** Using `backdrop-filter: blur(24px)` to create a perceived boundary.

### Surface Hierarchy & Nesting
Treat the UI as a series of nested layers.
*   **Base:** A complex multi-stop gradient (Primary Fixed to Secondary Fixed).
*   **Level 1:** `surface_container_low` for large content areas.
*   **Level 2:** `surface_container_highest` or Glass-morphic cards for interactive elements.
*   **Level 3:** `surface_bright` for floating CTAs or active tooltips.

---

## 3. Typography: The Editorial Voice
Typography is the primary architecture of this system. We use **Epilogue** (or Clash Display) for a bold, geometric presence and **Inter** for high-performance utility.

*   **Display & Headlines (Epilogue):** Set with `-0.04em` letter spacing. These should feel like magazine mastheads—massive, confident, and deep navy.
*   **Body & Labels (Inter):** Set with `-0.01em` letter spacing for a modern, "compact" look.
*   **Visual Hierarchy:** Use `display-lg` (3.5rem) for hero statements. Never be afraid of scale; the contrast between a `display-lg` header and `label-sm` metadata creates the "High-End" feel.

---

## 4. Elevation & Depth: The Layering Principle
We do not use standard drop shadows. We use **Ambient Radiance.**

*   **The Layering Principle:** Depth is achieved by "stacking" surface tiers. A `surface_container_lowest` card placed on a `surface_container_low` section creates a natural lift.
*   **Glassmorphism (The Signature):** 
    *   **Fill:** `surface` at 40%–60% opacity.
    *   **Blur:** `backdrop-filter: blur(20px)`.
    *   **The Ghost Border:** A 1px stroke using `outline_variant` at **15% opacity**. This provides just enough definition for accessibility without breaking the "ethereal" aesthetic.
*   **Ambient Shadows:** For floating elements, use a blur of `40px` with a `4%` opacity shadow tinted with the `primary` color (not black).

---

## 5. Components

### Buttons
*   **Primary:** A gradient-fill transition from `primary` to `secondary`. No borders. Slight `scale(1.02)` on hover with a subtle `primary` outer glow.
*   **Tertiary:** Deep Navy text with no background. Hover state triggers a `surface_container_highest` glass-morphic pill background.

### Cards & Containers
*   **Constraint:** No dividers. Use `Spacing 6` (2rem) to separate internal card elements.
*   **Currency Elements:** All financial data must default to **INR (₹)**. Use `title-lg` for the amount and `label-md` for the currency symbol, slightly offset vertically to feel like a bespoke financial publication.

### Input Fields
*   **Style:** Minimalist. Only a `surface_container_highest` background with a `Ghost Border` (10% opacity). On focus, the border transitions to 100% `primary` opacity with a 2px width.
*   **Micro-interaction:** The label should "float" into the upper margin using `label-sm` when the field is active.

### Chips & Selection
*   **Action Chips:** Use `secondary_fixed` background with `on_secondary_fixed` text. Roundedness must always be `full`.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** use asymmetrical layouts. Push content to the edges or overlap a glass card over a headline.
*   **Do** use the full spacing scale. High-end design requires "wasteful" white space.
*   **Do** ensure all currency displays use the ₹ symbol in a high-contrast weight.
*   **Do** use micro-interactions for every hover state (subtle scale, blur increase, or glow).

### Don’t:
*   **Don’t** use `#000000` for shadows. Use tinted navy or periwinkle shadows at low opacity.
*   **Don’t** use a divider line to separate list items. Use a 4px background shift (`surface_container_low` vs `surface_container_lowest`).
*   **Don’t** use standard 400ms easing. Use custom cubic-beziers (e.g., `0.22, 1, 0.36, 1`) for "snappy yet smooth" transitions.
*   **Don’t** use high-contrast borders. If you can see the border clearly from 2 feet away, it is too heavy. Decrease opacity.