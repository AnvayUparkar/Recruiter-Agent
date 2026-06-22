# Layouts & Navigation Architecture

This directory defines the core UI layout shell, navigation components, and routing structure of the AI-powered Recruiter Platform.

## Directory Structure

```
src/
├── components/
│   ├── common/
│   │   ├── ErrorBoundary.tsx  <- React render crash interception
│   │   ├── GlobalLoader.tsx   <- Routing Suspense fallback overlay
│   │   ├── PageContainer.tsx  <- Shared spacing, width, and motion wrapper
│   │   ├── PageTitle.tsx      <- Standard top-of-page heading component
│   │   └── SectionHeader.tsx  <- Sub-section headings
│   └── navigation/
│       ├── CommandPalette.tsx <- Ctrl+K fuzzy route search overlay
│       ├── MobileMenu.tsx     <- Sliding overlay drawer on mobile viewports
│       ├── NavItem.tsx        <- Spring-based links with active markers
│       ├── NavSection.tsx     <- Group headers separating links
│       ├── NotificationBell.5x<- Dropdown containing mock system alerts
│       ├── SidebarGroup.tsx   <- Grouping wrapper
│       ├── ThemeToggle.tsx    <- Rotational cycle theme toggle
│       └── UserMenu.tsx       <- Dropdown for user profiles
├── layouts/
│   ├── AppLayout/
│   │   ├── AppLayout.tsx      <- Coordinates Sidebar, TopNavbar, and main viewport
│   │   ├── AppShell.tsx       <- Global hotkey capture boundaries
│   │   ├── Breadcrumbs.tsx    <- URL trail auto-generator
│   │   ├── Footer.tsx         <- Copyright and system gateway metadata
│   │   ├── Sidebar.tsx        <- Collapsible navigation sidebar
│   │   └── TopNavbar.tsx      <- Sticky header panel
│   └── ResponsiveLayout.tsx   <- Resize hooks exposing screen context
└── routes/
    ├── AppRouter.tsx          <- Dynamic router mapping with guards
    ├── index.tsx              <- Clean re-export endpoints
    ├── ProtectedRoute.tsx     <- Mock auth checkpoint wrapper
    └── RouteTransition.tsx    <- Exit/entry spring transitions
```

---

## 1. Layout Hierarchy

All standard dashboard routes are loaded within `AppLayout`, wrapping children with responsive viewport configurations:

```
[AppShell] (Global Shortcuts, Error Boundaries)
    └── [AppLayout] (Responsive Provider)
        ├── [Sidebar] (Desktop Navigation / Tablet Collapse)
        ├── [MobileMenu] (Mobile Drawer Navigation Overlay)
        └── [Main Panel]
            ├── [TopNavbar] (Breadcrumbs, Search Palette, User Details)
            ├── [RouteTransition] (Framer Motion spring transitions)
            │   └── [PageContainer] (Individual page contents)
            └── [Footer] (System health details)
```

---

## 2. Shared Components Usage

### PageContainer

Standardizes layout widths, margins, responsive paddings, and page entrance animations. Every sub-page in subsequent phases should wrap its contents with this layout:

```tsx
import React from "react";
import PageContainer from "../components/common/PageContainer";
import PageTitle from "../components/common/PageTitle";

const MyCustomPage: React.FC = () => {
  return (
    <PageContainer maxWidth="7xl">
      <PageTitle 
        title="Custom Analytics" 
        subtitle="Review calibrator score metrics" 
      />
      {/* Page content here */}
    </PageContainer>
  );
};
```

---

## 3. Keyboard Accessibility (WCAG AA)

- **Command Palette**: Triggered globally via `Ctrl + K` or `Cmd + K`. Traverse routes using `ArrowUp` / `ArrowDown`, select with `Enter`, and dismiss with `Escape`.
- **Dropdowns**: Profile lists (`UserMenu`) and notification panels (`NotificationBell`) listen for clicks outside the container and `Escape` key releases to automatically close and return focus.
- **Screen Readers**: Interactive anchors include standard ARIA attributes (`aria-current`, `aria-expanded`, `aria-haspopup`) and focus ring highlights.

---

## 4. How to Add New Routes

To integrate a new route module into the platform:

1. **Add route parameter config** in [AppRouter.tsx](file:///d:/Engineering/Hackathon%20Projects/Finance%20Agent/frontend/src/routes/AppRouter.tsx):
   ```tsx
   const NewFeature = lazy(() => import("../pages/NewFeature"));
   
   // Insert in router config array
   {
     path: "/new-feature",
     element: <RouteWrapper element={<NewFeature />} />,
   }
   ```
2. **Add navigation link** in [Sidebar.tsx](file:///d:/Engineering/Hackathon%20Projects/Finance%20Agent/frontend/src/layouts/AppLayout/Sidebar.tsx) and [MobileMenu.tsx](file:///d:/Engineering/Hackathon%20Projects/Finance%20Agent/frontend/src/components/navigation/MobileMenu.tsx) (or inside the shared `navItems` configuration):
   ```tsx
   <NavItem
     label="New Feature"
     path="/new-feature"
     icon={SparklesIcon}
     isCollapsed={!isSidebarOpen}
   />
   ```
3. **Configure Breadcrumb labels** (optional) inside [Breadcrumbs.tsx](file:///d:/Engineering/Hackathon%20Projects/Finance%20Agent/frontend/src/layouts/AppLayout/Breadcrumbs.tsx):
   ```tsx
   const routeNameMap = {
     "new-feature": "Custom Feature",
   };
   ```
