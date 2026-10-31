# Strava Design System Specification

**Version:** 1.0.0  
**Design Philosophy:** "Quiet Excellence" — athletic minimalism, disciplined typography, mathematical 8-point spacing, flat surfaces separated exclusively by 1px structural borders, and absolute zero drop shadows or visual gimmicks.

---

## 1. Color System

### 1.1 Palette Architecture
All application interfaces inherit from the semantic tokens defined in `constants/theme.ts`.

#### Brand Accent
- **Primary Athletic Orange:** `#FC5200` (Used strictly for primary CTA buttons, active tab indicators, and live GPS recording route polyline)
- **Primary Dark (Pressed):** `#D64600`
- **Subtle Tint (Light):** `#FFF2EB`
- **Subtle Tint (Dark):** `#2A1308`

#### Semantic Neutrals
| Token | Light Theme | Dark Theme | Purpose |
| :--- | :--- | :--- | :--- |
| `background` | `#F8F9FA` | `#0F1012` | Screen canvas background |
| `surface` | `#FFFFFF` | `#18191C` | Cards, list containers, sheets |
| `surfaceSecondary` | `#F1F3F5` | `#222327` | Inner grouped surfaces, table rows |
| `surfaceSubtle` | `#E9ECEF` | `#2B2D32` | Inactive tracks, dividers |
| `border` | `#E5E7EB` | `#2E3036` | Primary 1px structural boundary |
| `borderSubtle` | `#F0F2F5` | `#24252A` | Subdued list row separators |
| `borderFocus` | `#111827` | `#F9FAFB` | Active input boundary |
| `textPrimary` | `#111827` | `#F9FAFB` | High-contrast headers and metrics |
| `textSecondary` | `#4B5563` | `#9CA3AF` | Supporting descriptions, metadata |
| `textMuted` | `#9CA3AF` | `#6B7280` | Footnotes, placeholders, disabled states |

#### Functional Signals
- **Success / GPS Strong:** `#16A34A`
- **Warning / GPS Fair:** `#D97706`
- **Error / GPS Searching:** `#DC2626`
- **Route Polyline:** `#2563EB` (high-contrast blue for map routes)

---

## 2. Typography Scale

Typography establishes the visual architecture of each screen. All numbers in fitness metrics must use tabular/monospaced alignment to prevent horizontal layout shift during live activity tracking.

| Style Token | Size | Line Height | Weight | Letter Spacing | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `displayHero` | 52px | 56px | 800 (ExtraBold) | -0.5px | Live HUD primary metric (Distance / Time) |
| `displayLarge` | 32px | 38px | 800 (ExtraBold) | -0.3px | Summary cards primary numbers |
| `displayMedium` | 24px | 30px | 700 (Bold) | -0.2px | Section summary numbers |
| `heading1` | 20px | 26px | 700 (Bold) | 0px | Screen titles, athlete name |
| `heading2` | 17px | 22px | 600 (SemiBold) | 0px | Modal headers, group names |
| `heading3` | 15px | 20px | 600 (SemiBold) | 0px | Card titles, subsection titles |
| `body` | 15px | 22px | 400 (Regular) | 0px | Main content, athlete descriptions |
| `bodySmall` | 13px | 18px | 400 (Regular) | 0px | Secondary metadata, dates |
| `label` | 11px | 14px | 700 (Bold) | +0.8px (Caps) | Metric labels, column headers |
| `caption` | 11px | 14px | 500 (Medium) | 0px | Units (km, /km, m), helper text |
| `button` | 15px | 20px | 700 (Bold) | +0.3px | Primary & secondary button text |

---

## 3. Spacing Scale (8-Point Grid)

Arbitrary paddings and margins are strictly prohibited. Every dimension must be a token from `spacing`:

```typescript
export const spacing = {
  xs: 4,    // Micro spacing between value and unit, icon gap
  sm: 8,    // Gap between title and subtitle, inner badge padding
  md: 12,   // Card item gap, list row vertical padding
  lg: 16,   // Standard screen edge horizontal padding, card inner padding
  xl: 20,   // Section vertical margins
  xxl: 24,  // Major section separation
  xxxl: 32, // Hero component margins
  huge: 48, // Bottom scroll padding, empty state padding
};
```

---

## 4. Radii Scale

Overly circular pill elements are eliminated. Controls use a disciplined 8px corner radius:

```typescript
export const radii = {
  xs: 4,    // Micro badges, split bars
  sm: 8,    // Buttons, text inputs, segmented control chips
  md: 12,   // Activity cards, stats grid containers
  lg: 16,   // Modal sheets, dialogs
  full: 9999, // Circular athlete avatars only
};
```

---

## 5. Structural Borders (No Drop Shadows)

Drop shadows, card elevations, glowing halos, and glassmorphism are completely eliminated.

```typescript
export const borders = {
  thin: 1,  // Standard structural border for cards, inputs, sheets
  thick: 2, // Focused input state, active selection ring
};

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
};
```

---

## 6. Iconography Guidelines

1. **Family:** Use `@expo/vector-icons` (Ionicons) with outline style by default (`heart-outline`, `chatbubble-outline`, `location-outline`). Active states switch to filled icons (`heart`, `chatbubble`).
2. **Stroke & Proportions:**
   - Small (`sm`): 16px (inline with body text)
   - Medium (`md`): 20px (action buttons, list row icons)
   - Large (`lg`): 24px (tab bar, screen navigation headers)
3. **No Arbitrary Emojis:** System iconography must be vector-based.
