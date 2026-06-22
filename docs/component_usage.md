# Component Usage Guide

This document outlines prop signatures, accessibility notes, and code snippets for all components in the **AI Recruiter Platform UI Library**.

---

## 1. IconWrapper

Wraps Lucide React icons to support hover rotations and pulse animations.

### Props
- `icon: LucideIcon` (Lucide React icon definition)
- `size?: "xs" | "sm" | "md" | "lg" | "xl" | number` (default: `"md"`)
- `variant?: "default" | "accent" | "success" | "warning" | "danger" | "info" | "muted"` (default: `"default"`)
- `animation?: "none" | "spin" | "pulse" | "rotate-hover" | "bounce-hover" | "glow-hover"` (default: `"none"`)

### Usage Example
```tsx
import { IconWrapper } from "../../components/ui/Icon/IconWrapper";
import { Sparkles } from "lucide-react";

<IconWrapper icon={Sparkles} animation="pulse" variant="accent" size="lg" />
```

---

## 2. Button

Interactive trigger element with hover scale and pressed springs.

### Props
- `variant?: "primary" | "secondary" | "ghost" | "danger" | "success" | "outline"` (default: `"primary"`)
- `size?: "sm" | "md" | "lg"` (default: `"md"`)
- `isLoading?: boolean` (default: `false`)
- `leftIcon?: LucideIcon`
- `rightIcon?: LucideIcon`
- Standard HTML button attributes.

### Accessibility Notes
- Synchronizes `disabled` and `aria-busy` states when loading is active.
- Outlines focus rings on tab-key navigation.

### Usage Example
```tsx
import { Button } from "../../components/ui/Button/Button";
import { Sparkles } from "lucide-react";

<Button variant="primary" leftIcon={Sparkles} onClick={() => alert("Action!")}>
  Analyze Match
</Button>
```

---

## 3. Card

Premium content panel with glassmorphism, hover scaling, and optional 3D pointer tilt.

### Props
- `enableTilt?: boolean` (default: `true`)
- `enableSpotlight?: boolean` (default: `true`)
- `glow?: boolean` (default: `false`)
- Standard HTML div attributes.

### Accessibility Notes
- Fallbacks are active: translates, scales, and tilts resolve to flat offsets if `prefers-reduced-motion` is active.

### Usage Example
```tsx
import { Card } from "../../components/ui/Card/Card";

<Card enableTilt glow className="w-80">
  <h3 className="font-heading-md font-semibold">Candidate Profile</h3>
  <p className="text-body-sm text-text-muted">Review alignment scores below.</p>
</Card>
```

---

## 4. Input & Textarea

Standardized text inputs with floating label animations and shake triggers.

### Props
- `label: string` (placeholder floating label)
- `error?: string` (renders error tag and triggers shake)
- `success?: boolean` (shows check indicator icon)
- `isLoading?: boolean` (shows spin loader)
- Standard input/textarea attributes.

### Accessibility Notes
- Ties input validation states to `aria-invalid`.

### Usage Example
```tsx
import { Input } from "../../components/ui/Input/Input";

<Input
  label="Primary Email"
  placeholder="Enter email"
  error={emailError}
  onChange={(e) => setEmail(e.target.value)}
/>
```

---

## 5. Modal, Drawer, & Dialog

Accessible overlay containers mapping keyboard traps and dismiss events.

### Props (Modal / Drawer)
- `isOpen: boolean`
- `onClose: () => void`
- `title?: string`
- `children: React.ReactNode`

### Accessibility Notes
- Restores original document focus upon closing.
- Handles tab-loops, locking cursor access within active overlays.
- Set `role="dialog"` and `aria-modal="true"`.

### Usage Example (Confirm Dialog)
```tsx
import { Dialog } from "../../components/ui/Modal/Dialog";

<Dialog
  isOpen={isConfirmOpen}
  onClose={() => setConfirmOpen(false)}
  onConfirm={handleDelete}
  variant="danger"
  title="Archive Match History?"
  description="This will permanently delete candidate AI scores."
/>
```

---

## 6. Tooltip & Popover

Floating helpers supporting delay triggers and smart layouts.

### Props
- `content: React.ReactNode` (content rendered inside bubble)
- `position?: "top" | "bottom" | "left" | "right"` (default: `"top"`)
- `children: React.ReactElement` (target trigger element)

### Accessibility Notes
- Opens on keyboard element focus and closes on element blur.
- Binds `aria-expanded` and `role="tooltip"` attributes.

### Usage Example
```tsx
import { Tooltip } from "../../components/ui/Tooltip/Tooltip";
import { Button } from "../Button/Button";

<Tooltip content="Requires Senior Level Experience" position="top">
  <Button variant="outline">Learn More</Button>
</Tooltip>
```

---

## 7. Select & MultiSelect

Dropdown selectors with custom tags and single/multiple value pickers.

### Props (MultiSelect)
- `options: Array<{ value: string, label: string }>`
- `selectedValues: string[]`
- `onChange: (values: string[]) => void`
- `label?: string`

### Usage Example
```tsx
import { MultiSelect } from "../../components/ui/Dropdown/MultiSelect";

<MultiSelect
  label="Candidate Skills"
  options={[
    { value: "react", label: "React" },
    { value: "typescript", label: "TypeScript" }
  ]}
  selectedValues={selectedSkills}
  onChange={setSelectedSkills}
/>
```

---

## 8. Tabs & AnimatedTabs

Visual selectors supporting underline overlays and active glows.

### Props
- `tabs: Array<{ id: string, label: string, count?: number }>`
- `activeTab: string`
- `onChange: (id: string) => void`
- `variant?: "underline" | "pill"` (default: `"underline"`)

### Usage Example
```tsx
import { Tabs } from "../../components/ui/Tabs/Tabs";

<Tabs
  tabs={[
    { id: "all", label: "All Candidates", count: 48 },
    { id: "selected", label: "Selected Matches" }
  ]}
  activeTab={activeTabId}
  onChange={setActiveTabId}
  variant="pill"
/>
```

---

## 9. Skeletons & EmptyState

Layout placeholders and fallback screens showing shimmer overlays.

### Usage Example (Card Shimmer)
```tsx
import { CardSkeleton } from "../../components/ui/Skeleton/Skeleton";

{isLoading ? <CardSkeleton /> : <CandidateCard />}
```

### Usage Example (Empty State)
```tsx
import { EmptyState } from "../../components/ui/EmptyState/EmptyState";
import { User } from "lucide-react";

<EmptyState
  title="No rankings generated"
  description="Start by uploading candidate resume profiles."
  icon={User}
  actionLabel="Upload Resumes"
  onActionClick={triggerUpload}
/>
```
