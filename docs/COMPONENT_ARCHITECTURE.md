# Component Architecture & Reusable UI Catalog

**Version:** 1.0.0  
**Design System Compliance:** Full adherence to `constants/theme.ts` with zero drop shadows (`shadows.none`), zero gradients, and 8-point mathematical spacing.

---

## 1. Directory Structure

```
components/
├── ui/
│   ├── ScreenContainer.tsx         # Root view with safe areas and status bar
│   ├── ScreenHeader.tsx            # Standard top navigation header
│   ├── SectionHeader.tsx           # Categorized list headers with optional action
│   ├── SurfaceCard.tsx             # 1px border container with zero drop shadows
│   ├── Button.tsx                  # Primary, Secondary, Destructive, Ghost variants
│   ├── IconButton.tsx              # Standardized 40px touch targets
│   ├── SegmentedControl.tsx        # Filter chips & tab switches
│   ├── Badge.tsx                   # Sport indicators & sync state badges
│   ├── InputText.tsx               # High-contrast inputs with active focus borders
│   └── EmptyState.tsx              # Vector-based empty screens with zero emojis
├── activity/
│   ├── MetricItem.tsx              # Tabular numerical statistics with micro labels
│   ├── MetricGrid.tsx              # 2, 3, or 4 column statistical matrix with dividers
│   ├── AthleteAvatar.tsx           # Standardized initials fallback avatar (sm, md, lg, xl)
│   ├── SplitRow.tsx                # Normalized split timing with solid flat progress bars
│   ├── ElevationChart.tsx          # Pure flat SVG area chart (Zero LinearGradient)
│   └── ActivityCard.tsx            # Unified social feed & athlete profile activity card
```

---

## 2. Component Specifications

### 2.1 Layout & Navigation Components

#### `<ScreenContainer>`
- **Role:** Handles device safe area insets (iOS notch, dynamic island, Android navigation bar) and applies the current theme canvas background.
- **Props:** `children`, `safeBottom?: boolean`, `style?: ViewStyle`.
- **Zero Gimmicks:** Solid flat background, no backdrop filters.

#### `<ScreenHeader>`
- **Role:** Replaces ad-hoc custom headers with a uniform 52px navigation bar.
- **Features:** Standard back button with hitSlop, title + subtitle truncation, right action slot for actions (e.g. Delete, Settings).

#### `<SectionHeader>`
- **Role:** Categorizes content into clear editorial sections (e.g., "KILOMETER SPLITS", "RECENT ACTIVITIES", "WEEKLY GOAL").
- **Styling:** Uppercase 11px label with `letterSpacing: 0.8`.

#### `<SurfaceCard>`
- **Role:** Groups related content into a distinct visual plane.
- **Styling:** Strictly 1px structural border (`theme.border`), 12px corner radius (`radii.md`), zero drop shadows (`elevation: 0`, `shadowOpacity: 0`).

---

### 2.2 Form & Interaction Components

#### `<Button>`
- **Variants:**
  - `primary`: Solid athletic orange (`#FC5200`), white text, 8px radius.
  - `secondary`: Subdued neutral surface (`surfaceSecondary`), 1px border, high-contrast text.
  - `destructive`: Matte crimson (`#DC2626`), white text.
  - `ghost`: Transparent background, high-contrast text.
- **Sizes:** `sm` (36px height), `md` (44px height), `lg` (52px height).
- **Proportions:** 8px radius (`radii.sm`). Pill-shaped buttons are prohibited.

#### `<InputText>`
- **Role:** Unified text entry for workout titles, descriptions, logins, and registrations.
- **Features:** Floating labels, left icon slot, right action slot (password visibility toggle), active focus ring (`borderFocus: 1px`), and validation error text.

#### `<SegmentedControl>`
- **Role:** Replaces floating pill filters with a sleek, recessed segmented control.
- **Usage:** Sport selection (Run / Ride / Walk / Hike) and section switching (Challenges / Clubs).

---

### 2.3 Athletic Domain Components

#### `<MetricItem>`
- **Role:** The core numeric building block of the application.
- **Features:**
  - Sizes: `hero` (52px), `large` (32px), `medium` (24px), `small` (15px).
  - Uses `fontVariant: ['tabular-nums']` to ensure numbers do not horizontally shift during live GPS workouts.
  - Subdued unit text (`km`, `/km`, `m`, `bpm`) placed baseline-aligned.

#### `<MetricGrid>`
- **Role:** Aligns 2 to 4 `<MetricItem>` components into a single row with 1px vertical dividers (`borderSubtle`).
- **Dividers:** 28px height, 1px width, no shadow.

#### `<ActivityCard>`
- **Role:** Replaces the duplicate activity card implementations in `app/(tabs)/index.tsx` and `app/(tabs)/you.tsx`.
- **Anatomy:**
  1. Athlete Identity Row: Avatar (`AthleteAvatar`) + Athlete Name + Time Ago + Sport Badge.
  2. Activity Title: Bold 17px editorial heading.
  3. `<MetricGrid>`: Distance, Pace, Time, and Elevation Gain.
  4. Social Footer: Kudos button with heart icon and count + Comment trigger with count.
- **Rules:** Zero drop shadows (`elevation: 0, shadowOpacity: 0`). 1px border.

#### `<ElevationChart>`
- **Role:** Renders elevation profiles for recorded workouts.
- **Refactoring Achieved:** Completely eliminated `<LinearGradient>` and drop shadows. Replaced with solid flat vector fills (`fill={flatAreaFill}`) and a 2px stroke profile line with interactive scrub line and tooltip.

#### `<SplitRow>`
- **Role:** Displays kilometer-by-kilometer performance.
- **Features:** Split number, normalized proportional pace bar track with solid fill, split pace string, elevation delta, and 1px hairline bottom border.
