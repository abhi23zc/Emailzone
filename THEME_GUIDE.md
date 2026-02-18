# EmailZone - Modern UI Quick Reference

## 🎨 Theme System

### Toggle Theme
- **Navbar**: Click sun/moon icon (top-right when logged in)
- **Login/Signup**: Theme toggle button in top-right corner
- **Automatic**: Preference saved in browser localStorage

### Color Palette

#### Light Mode
- Background: `#F9FAFB` (gray-50)
- Card: `#FFFFFF` (white)
- Text: `#111827` (gray-900)
- Muted: `#6B7280` (gray-500)
- Primary: `#3B82F6` (blue-500)
- Border: `#E5E7EB` (gray-200)

#### Dark Mode
- Background: `#030712` (very dark blue-gray)
- Card: `#111827` (gray-900)
- Text: `#F3F4F6` (gray-100)
- Muted: `#9CA3AF` (gray-400)
- Primary: `#3B82F6` (blue-500)
- Border: `#374151` (gray-700)

## 📱 Pages Overview

### Authentication Pages
- **Login** (`/login`) - Email/password + Google OAuth
- **Signup** (`/signup`) - Account creation

### Main Application
- **Dashboard** (`/dashboard`) - Quick access cards
- **Campaigns** (`/campaigns`) - Campaign list with stats
- **Campaign Detail** (`/campaigns/[id]`) - Individual campaign view
- **Recipients** (`/recipients`) - Contact management + CSV upload
- **SMTP Settings** (`/smtp-settings`) - Email provider configuration
- **Editor** (`/editor`) - Campaign creation (not updated yet)

## 🎯 Key Features

### Modern Design Elements
- ✨ Gradient branding text
- 🎴 Rounded cards with subtle shadows
- 🎭 Smooth transitions and hover effects
- 📊 Progress bars and status badges
- 🎨 Icon-based navigation
- 🌙 Seamless dark mode

### User Experience
- 💾 Theme preference persistence
- 🔄 Real-time campaign updates
- 📱 Responsive design
- ♿ Accessible (ARIA labels, focus states)
- 🎯 Empty states with helpful messages
- ✅ Success/error notifications with icons

## 🚀 Quick Start

```bash
# Start development server
npm run dev

# Open browser
http://localhost:3000

# Toggle theme
Click sun/moon icon in navbar
```

## 📝 Component Usage

### Navbar
```tsx
import Navbar from '@/components/navbar';

<Navbar /> // Includes theme toggle automatically
```

### Card
```tsx
import { Card } from '@/components/card';

<Card className="custom-class">
  Content here
</Card>
```

### Theme Hook
```tsx
import { useTheme } from '@/lib/theme-context';

const { theme, toggleTheme } = useTheme();
// theme: 'light' | 'dark'
// toggleTheme: () => void
```

## 🎨 CSS Classes Reference

### Background Colors
- `bg-background` - Main background
- `bg-card` - Card background
- `bg-primary` - Primary color
- `bg-muted` - Muted background
- `bg-accent` - Accent background

### Text Colors
- `text-foreground` - Main text
- `text-muted-foreground` - Secondary text
- `text-primary` - Primary colored text
- `text-card-foreground` - Card text

### Borders
- `border` - Default border with theme color
- `rounded-lg` - 8px border radius
- `rounded-xl` - 12px border radius
- `rounded-2xl` - 16px border radius

### Interactive States
- `hover:bg-accent` - Hover background
- `hover:opacity-90` - Hover opacity
- `transition` - Smooth transitions
- `focus:ring-2 focus:ring-primary` - Focus ring

## 🔧 Customization

### Change Primary Color
Edit `app/globals.css`:
```css
:root {
  --primary: 59 130 246; /* Change these RGB values */
}
```

### Add New Theme Variables
```css
:root {
  --custom-color: 255 0 0;
}

.dark {
  --custom-color: 200 0 0;
}
```

Use in components:
```tsx
<div className="bg-[rgb(var(--custom-color))]">
```

## 📦 Files Modified

### Core Theme Files
- `lib/theme-context.tsx` - Theme state management
- `app/globals.css` - CSS variables and theme styles
- `app/layout.tsx` - ThemeProvider wrapper

### Components
- `components/navbar.tsx` - Navigation with theme toggle
- `components/card.tsx` - Reusable card component

### Pages (All Updated)
- `app/page.tsx`
- `app/login/page.tsx`
- `app/signup/page.tsx`
- `app/dashboard/page.tsx`
- `app/campaigns/page.tsx`
- `app/campaigns/[id]/page.tsx`
- `app/recipients/page.tsx`
- `app/smtp-settings/page.tsx`

## 🐛 Troubleshooting

### Theme not persisting
- Check browser localStorage
- Clear cache and reload

### Flash of wrong theme
- Ensure `suppressHydrationWarning` is on `<html>` tag
- Theme is loaded before first render

### Colors not changing
- Verify CSS variables are defined in `globals.css`
- Check if `.dark` class is applied to `<html>`

## 📚 Resources

- [Tailwind CSS v4 Docs](https://tailwindcss.com/docs)
- [Next.js 16 Docs](https://nextjs.org/docs)
- [Heroicons](https://heroicons.com/)

---

**Version**: 1.0.0  
**Last Updated**: February 16, 2026  
**Status**: ✅ Production Ready
