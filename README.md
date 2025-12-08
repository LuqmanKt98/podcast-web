# Podcast Archive - Premium Web Application

A modern, professional Next.js web application for displaying and exploring a podcast transcript database with premium animations, smooth interactions, and responsive design.

## ✨ Features

### 🎨 Premium UI/UX
- **Modern Design**: Professional blue-purple gradient color scheme with depth and elevation
- **Glassmorphism Effects**: Frosted glass cards and panels for a contemporary look
- **Responsive Layout**: Fully responsive design for mobile, tablet, and desktop
- **Accessibility**: ARIA labels, keyboard navigation, and semantic HTML

### 🎬 Advanced Animations & Motion
- **Page Transitions**: Smooth fade and slide animations when navigating between routes
- **Scroll-Triggered Animations**: Fade-in and slide-up effects for episode cards as they enter viewport
- **Hover Animations**: Scale and glow effects on interactive elements with smooth transitions
- **Animated Counters**: Statistics counters that count up on page load
- **Stagger Animations**: Sequential animations for episode grids and lists
- **Parallax Effects**: Subtle parallax scrolling for enhanced depth
- **Micro-interactions**: Button ripples, icon animations, and smooth transitions
- **Reduced Motion Support**: All animations respect user's `prefers-reduced-motion` settings

### 📊 Dashboard
- Hero section with gradient background
- Statistics cards with animated counters (total episodes, unique guests, hosts, date range)
- Series breakdown visualization
- Recent episodes grid with scroll-triggered animations
- Floating back-to-top button

### 📑 Episodes Listing
- Browse all episodes with responsive grid layout
- Advanced filtering by series, host, and guest
- Sorting options (newest/oldest first, alphabetical)
- Global search functionality
- Empty state handling with animations
- Skeleton loading states with shimmer effects

### 📖 Episode Details
- Full episode information display
- Enhanced transcript viewer with:
  - Read More/Read Less expandable sections
  - Copy-to-clipboard functionality for paragraphs and full transcript
  - Better typography and formatting
  - Lazy loading for performance
- Guest work experience details
- Word count and audio link
- Floating back-to-top button

### 🔍 Search
- Global search across titles, guests, hosts, and transcript content
- Animated search results with stagger effects
- Real-time filtering

## 🛠 Tech Stack

- **Framework**: Next.js 16.0.0 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Data**: JSON-based podcast database

## 📦 Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
podcast-web/
├── app/
│   ├── page.tsx                 # Dashboard/home page
│   ├── episodes/
│   │   ├── page.tsx            # Episodes listing page
│   │   └── [id]/page.tsx       # Episode detail page
│   ├── search/page.tsx         # Search results page
│   ├── layout.tsx              # Root layout
│   └── globals.css             # Global styles
├── components/
│   ├── Header.tsx              # Navigation header
│   ├── EpisodeCard.tsx         # Episode card component
│   ├── StatsCard.tsx           # Statistics card with animated counter
│   ├── FilterPanel.tsx         # Filter controls
│   ├── SearchBar.tsx           # Search input
│   ├── AnimatedCounter.tsx     # Animated number counter
│   ├── TranscriptViewer.tsx    # Enhanced transcript viewer
│   ├── FloatingButton.tsx      # Floating back-to-top button
│   └── SkeletonLoader.tsx      # Loading skeleton states
├── lib/
│   ├── types.ts                # TypeScript type definitions
│   ├── data.ts                 # Data loading and utilities
│   ├── animations.ts           # Framer Motion animation variants
│   └── useScrollAnimation.ts   # Custom hooks for animations
├── public/
│   └── data/
│       └── extracted_data.json # Podcast database
└── README.md
```

## 🎯 Key Components

### AnimatedCounter
Displays numbers with smooth count-up animation on page load.

### TranscriptViewer
Enhanced transcript display with:
- Expandable sections
- Copy-to-clipboard functionality
- Smooth animations
- Better typography

### FloatingButton
Floating action button that appears on scroll with smooth animations.

### SkeletonLoader
Loading skeleton states with shimmer animation for better UX.

### EpisodeCard
Episode card with:
- Scroll-triggered fade-in animation
- Hover scale and glow effects
- Glassmorphism styling
- Responsive layout

### StatsCard
Statistics display with:
- Animated counter for numeric values
- Icon rotation animation
- Gradient background
- Hover elevation effect

## 🎨 Animation Features

### Variants Available
- `pageVariants` - Page transition animations
- `fadeInVariants` - Fade in effect
- `slideUpVariants` - Slide up from bottom
- `scaleVariants` - Scale animation
- `staggerContainerVariants` - Container for staggered children
- `staggerItemVariants` - Individual item animation
- `hoverScaleVariants` - Hover scale effect
- `glowVariants` - Glow effect on hover
- `counterVariants` - Counter animation
- `shimmerVariants` - Shimmer loading effect
- `badgeVariants` - Badge animation
- `floatingVariants` - Floating animation
- `pulseVariants` - Pulse effect
- `rotateVariants` - Rotation animation

### Custom Hooks
- `useScrollAnimation()` - Trigger animations on scroll using Intersection Observer
- `useParallax()` - Parallax scroll effect
- `useCountUp()` - Count up animation for numbers

## ⚙️ Performance Optimizations

- **Lazy Loading**: Episode cards load animations only when visible
- **Skeleton States**: Shimmer loading states during data fetch
- **GPU Acceleration**: Uses `transform` and `opacity` for smooth 60fps animations
- **Reduced Motion**: Respects user's motion preferences
- **Code Splitting**: Next.js automatic code splitting
- **Image Optimization**: Optimized images and icons

## ♿ Accessibility

- Semantic HTML structure
- ARIA labels on interactive elements
- Keyboard navigation support
- Color contrast compliance
- Reduced motion support
- Screen reader friendly

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Docker
```bash
docker build -t podcast-web .
docker run -p 3000:3000 podcast-web
```

### Traditional Hosting
```bash
npm run build
npm start
```

## 📝 Environment Variables

Create a `.env.local` file if needed:
```
NEXT_PUBLIC_API_URL=your_api_url
```

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Code Quality
- TypeScript for type safety
- ESLint for code quality
- Tailwind CSS for consistent styling

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Framer Motion Documentation](https://www.framer.com/motion/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For issues and questions, please open an issue on the GitHub repository.
