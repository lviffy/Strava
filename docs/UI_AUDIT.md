# UI/UX Audit & Deficiency Ledger

**Date:** October 31, 2026  
**Product:** Strava Mobile Client (React Native + Expo SDK 58)  
**Audit Objective:** Catalog every visual inconsistency, arbitrary spacing value, hardcoded color, forbidden drop shadow, and architectural duplication prior to implementing the design system.

---

## 1. Global Deficiencies & Violations

### 1.1 Hardcoded Colors & Token Bypass
Currently, `constants/Colors.ts` defines only 15 tokens. Throughout screen files, at least 28 unique raw hex values and translucent RGBA strings are hardcoded:
- `#34C759` (iOS system green, used in start marker, sync icons)
- `#FF9500` / `rgba(255, 149, 0, 0.15)` (Orange/Amber, used for pending badges and recovery card)
- `#FF3B30` / `#FF453A` (Red, used for discard buttons, logout button, error banners)
- `#3A3A3C` / `#2C2C2E` / `#1C1C1E` / `#121214` (Inconsistent dark surface greys)
- `#636366` / `#8E8E93` / `#98989F` / `#CCCCCC` (Inconsistent muted text greys)
- `rgba(150, 150, 150, 0.15)` (Ad-hoc border color in metric dividers and split tracks)
- `rgba(252, 82, 0, 0.15)` (Ad-hoc translucent brand orange in sport tags)

### 1.2 Forbidden Drop Shadows & Elevation
The following files violate the strict **Zero Drop Shadows** mandate:
1. `app/(tabs)/index.tsx` (Feed card):
   ```typescript
   shadowColor: '#000000',
   shadowOffset: { width: 0, height: 2 },
   shadowOpacity: 0.1,
   shadowRadius: 4,
   elevation: 2,
   ```
2. `app/(tabs)/record.tsx` (Big start button):
   ```typescript
   shadowColor: BrandColors.primary,
   shadowOffset: { width: 0, height: 6 },
   shadowOpacity: 0.4,
   shadowRadius: 10,
   elevation: 6,
   ```
3. `app/(tabs)/_layout.tsx` (Record center tab button):
   ```typescript
   elevation: 4,
   shadowColor: BrandColors.primary,
   shadowOffset: { width: 0, height: 4 },
   shadowOpacity: 0.3,
   shadowRadius: 6,
   ```

### 1.3 Forbidden Gradients
- `components/activity/ElevationChart.tsx` lines 104–107:
  ```xml
  <LinearGradient id="elevationGrad" x1="0" y1="0" x2="0" y2="1">
    <Stop offset="0%" stopColor="#FF9500" stopOpacity="0.45" />
    <Stop offset="100%" stopColor="#FF9500" stopOpacity="0.02" />
  </LinearGradient>
  ```
  *Violation:* Gradients of any kind are strictly forbidden. The elevation profile must be rendered with crisp solid vector fills and lines.

### 1.4 Inconsistent Radii Scale
Corner rounding is arbitrary across components:
- Buttons: 27px, 30px (circular pill buttons) vs 16px (resume alert button) vs 6px (tags)
- Cards: 16px in Feed, 16px in Profile, 24px in Record HUD panel
- Avatars: 21px (width 42), 38px (width 76)
- Badges: 6px, 12px, 16px

---

## 2. Screen-by-Screen Audit

### 2.1 Social Activity Feed (`app/(tabs)/index.tsx`)
- **Card Hierarchy:** The activity card is inlined entirely in `renderItem` (over 180 lines of JSX), making it impossible to reuse on the profile screen.
- **Shadows:** Cards use `elevation: 2` and `shadowOpacity: 0.1` rather than clean 1px structural borders.
- **Pill Badges:** Translucent pills with saturated text (`rgba(252, 82, 0, 0.15)`) clash with high-contrast minimalism.
- **Typography:** Labels use `fontWeight: '800'` indiscriminately for athlete names, titles, and metrics.
- **Spacing:** Outer padding is 16px, inner card padding is 16px, but metric row padding is 12px with raw hairline borders.

### 2.2 Live Workout Recording HUD (`app/(tabs)/record.tsx`)
- **Visual Gimmicks:** The start button has a high-intensity orange glow (`shadowOpacity: 0.4, shadowRadius: 10, elevation: 6`).
- **Pill-Shaped Overuse:** Lap button (`borderRadius: 27`), Pause button (`borderRadius: 27`), Start button (`borderRadius: 30`).
- **Color Noise:** Buttons introduce contrasting bright yellow (`#FFB800`), bright green (`#34C759`), and bright red (`#FF3B30`).
- **Telemetry Readability:** Primary metric (54px) lacks tabular numerals alignment, causing horizontal jitter during rapid GPS speed/distance updates.
- **Panel Separation:** HUD panel relies on `borderTopLeftRadius: 24, borderTopRightRadius: 24` without standard surface tokens.

### 2.3 Post-Workout Save & Summary (`app/activity/save.tsx`)
- **Map View Frame:** The route preview map is mounted without a defined boundary or subtle 1px border.
- **Form Controls:** Text inputs for title and description have inconsistent border widths and paddings.
- **Button Inconsistency:** The Save Workout and Discard buttons do not share dimensions, padding, or touch states with the rest of the app.
- **Sport Selector:** Renders basic text chips with arbitrary margins.

### 2.4 Activity Detail & Splits (`app/activity/[id].tsx`)
- **Navigation Bar:** Custom top bar replicates standard header functionality instead of using a unified header component.
- **Stats Card:** Repetitive metric columns duplicated from the feed card styles.
- **Elevation Chart:** Contains forbidden SVG linear gradient.
- **Kilometer Splits:** The pace progress bar track has a hardcoded background `rgba(150, 150, 150, 0.15)` and lacks a unified layout component.

### 2.5 Athlete Profile (`app/(tabs)/you.tsx`)
- **Duplicated Activity Cards:** Recent activities render a completely different card layout than the home feed (different metric layout, different date formatting, different tags).
- **Interrupted Workout Recovery Card:** Styled with a jarring yellow border (`#FF9500`) and translucent background (`rgba(255, 149, 0, 0.12)`).
- **Activity Heatmap:** Uses hardcoded opacity values (`0.4` and `0.9`) and disparate square margins.
- **Weekly Goal Bar:** Height and radius are hardcoded (6px track, 3px radius).

### 2.6 Explore Routes & Maps (`app/(tabs)/maps.tsx`)
- **Overlay Clutter:** Floating cards partially obscure the route polyline.
- **Filter Chips:** Custom pill buttons with hardcoded active orange background.
- **Route Cards:** Scroll list cards have arbitrary widths and lack consistent typography.

### 2.7 Groups, Clubs & Challenges (`app/(tabs)/groups.tsx`)
- **Tab Switcher:** Uses basic underline switcher with inconsistent active indicators.
- **Challenge Cards:** Progress bar and badge icons lack unified spacing tokens.
- **Club Directory:** Member counts and join buttons use disparate button styling.

### 2.8 Auth Screens (`app/(auth)/login.tsx` & `register.tsx`)
- **Theme Lock:** Hardcoded to dark mode styles, ignoring the user's active system color scheme.
- **Inputs:** Custom input wrappers with manual icon placements that do not handle focus or error states uniformly.
- **Button Styling:** Giant pill buttons clashing with the 8px/10px rectangular design system standard.

### 2.9 Dead & Boilerplate Code
- `components/EditScreenInfo.tsx`: Unused starter template component with external documentation links.
- `app/modal.tsx`: Starter template modal referencing `EditScreenInfo`.

---

## 3. Mandatory Refactoring Checklist

| Item | Current Issue | Target Refactored State |
| :--- | :--- | :--- |
| **Borders vs Shadows** | 3 files use drop shadows / elevation | 0 drop shadows across all files; 1px crisp borders only |
| **Gradients** | 1 SVG linear gradient | 0 gradients; flat solid geometry with high contrast |
| **Button Geometry** | Pill buttons (radius 27–30px) | 8px rounded rectangles with disciplined heights (44px, 52px) |
| **Activity Card** | Inlined twice with divergent UI | Single reusable `ActivityCard` in `components/activity/` |
| **Telemetry Typography** | Mixed weights, jittery metrics | Monospaced/tabular display numerals (52px, 32px, 20px) |
| **Color Tokens** | 28+ raw hex strings scattered | 100% tokens from `constants/theme.ts` |
| **Boilerplate Residuals** | `EditScreenInfo.tsx` & `modal.tsx` | Cleaned up / repurposed with production components |
