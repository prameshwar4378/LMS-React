import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getPublicCatalogueApi, submitPublicInquiryApi } from '../api/catalogueApi';
import { formatCurrency } from '../utils/formatCurrency';
import { exportHotelCataloguePDF } from '../utils/exportUtils';
import {
  MapPin,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  Users,
  Check,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Star,
  X,
  Building,
  Clock,
  Sparkles,
  Share2,
  Navigation,
  Eye,
  ShieldCheck,
  Wifi,
  Wind,
  Zap,
  ArrowUpDown,
  Car,
  Utensils,
  Bell,
  Droplets,
  HeartPulse,
  Send,
  BedDouble,
  CheckCircle2,
  AlertCircle,
  Menu,
  ChevronDown,
  Award,
  Coffee,
  KeyRound,
  Tv,
  Maximize2,
  Bath,
  Copy,
  Info,
  Layers,
  ArrowRight,
  ChevronUp,
  HelpCircle,
  ThumbsUp,
  Compass,
  Printer,
  Download,
  Flame,
  Tag,
  CheckSquare,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Play,
  Pause,
  Search,
  Headphones
} from 'lucide-react';

const THEME_PALETTES = {
  BLUE: {
    primary: '#1d4ed8',
    primaryHover: '#1e40af',
    primaryLight: '#eff6ff',
    primaryBorder: '#bfdbfe',
    gradient: 'linear-gradient(135deg, #091224 0%, #1e3a8a 50%, #2563eb 100%)',
    badge: 'bg-primary text-white',
    accentText: 'text-primary',
    accentGlow: 'rgba(37, 99, 235, 0.25)',
    goldAccent: '#fbbf24',
    darkBg: '#09101f'
  },
  EMERALD: {
    primary: '#059669',
    primaryHover: '#047857',
    primaryLight: '#ecfdf5',
    primaryBorder: '#a7f3d0',
    gradient: 'linear-gradient(135deg, #022c22 0%, #065f46 50%, #10b981 100%)',
    badge: 'bg-success text-white',
    accentText: 'text-success',
    accentGlow: 'rgba(16, 185, 129, 0.25)',
    goldAccent: '#fbbf24',
    darkBg: '#031914'
  },
  GOLD: {
    primary: '#b45309',
    primaryHover: '#92400e',
    primaryLight: '#fffbeb',
    primaryBorder: '#fde68a',
    gradient: 'linear-gradient(135deg, #271103 0%, #78350f 50%, #d97706 100%)',
    badge: 'bg-warning text-dark',
    accentText: 'text-warning',
    accentGlow: 'rgba(217, 119, 6, 0.25)',
    goldAccent: '#f59e0b',
    darkBg: '#180d04'
  },
  ROSE: {
    primary: '#e11d48',
    primaryHover: '#be123c',
    primaryLight: '#fff1f2',
    primaryBorder: '#fecdd3',
    gradient: 'linear-gradient(135deg, #350410 0%, #881337 50%, #e11d48 100%)',
    badge: 'bg-danger text-white',
    accentText: 'text-danger',
    accentGlow: 'rgba(225, 29, 72, 0.25)',
    goldAccent: '#fbbf24',
    darkBg: '#1f040b'
  },
  SLATE: {
    primary: '#0f172a',
    primaryHover: '#1e293b',
    primaryLight: '#f8fafc',
    primaryBorder: '#cbd5e1',
    gradient: 'linear-gradient(135deg, #020617 0%, #0f172a 50%, #1e293b 100%)',
    badge: 'bg-dark text-white',
    accentText: 'text-dark',
    accentGlow: 'rgba(15, 23, 42, 0.25)',
    goldAccent: '#fbbf24',
    darkBg: '#020617'
  },
};

const DEFAULT_HOTEL_BANNER = 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1600&auto=format&fit=crop&q=80';

const DEFAULT_HOTEL_GALLERY = [
  {
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1600&auto=format&fit=crop&q=80',
    caption: 'Grand Heritage Architecture & Arrival Porch'
  },
  {
    image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=1600&auto=format&fit=crop&q=80',
    caption: 'Signature Master Luxury Suites'
  },
  {
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1600&auto=format&fit=crop&q=80',
    caption: 'Executive Lounge & Reception'
  },
  {
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1600&auto=format&fit=crop&q=80',
    caption: 'Evening Poolside Oasis & Courtyard Ambience'
  },
  {
    image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1600&auto=format&fit=crop&q=80',
    caption: 'King Deluxe Comfort & Designer Interiors'
  },
  {
    image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=1600&auto=format&fit=crop&q=80',
    caption: 'Warm Hospitality & Fine Dining Amenities'
  }
];

const FALLBACK_ROOM_PHOTOS = [
  'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1591088398332-8a7791972843?w=1200&auto=format&fit=crop&q=80'
];

const DEFAULT_ROOM_BADGES = [
  '👑 Luxury Presidential',
  '✨ Premium Deluxe',
  '💎 Executive Suite',
  '🌟 Family Haven',
  '🌿 Garden Suite'
];

/**
 * Format tariff cleanly without redundant .00 and avoiding double rupee symbol
 */
const formatTariff = (val) => {
  const num = parseFloat(val) || 0;
  return `₹${Math.round(num).toLocaleString('en-IN')}`;
};

const FAQS_LIST = [
  {
    id: 'checkin-timings',
    category: 'checkin',
    icon: 'Clock',
    q: 'What are the standard Check-in and Check-out timings?',
    a: 'Standard Check-in begins at 12:00 PM onwards, and Check-out is until 11:00 AM. Early check-in and late check-out can be arranged upon request, subject to room availability upon arrival. Our front desk concierge also provides secure, complimentary luggage holding so you can explore the city without burden.',
    highlights: ['Standard Check-In: 12:00 PM', 'Check-Out: 11:00 AM', 'Free Luggage Storage', '24/7 Front Desk Active']
  },
  {
    id: 'gov-id-docs',
    category: 'checkin',
    icon: 'ShieldCheck',
    q: 'What government identification documents are required at Check-in?',
    a: 'In accordance with local hospitality and government regulations, all adult occupants must present an original, valid government-issued photo ID at check-in (Aadhaar Card, Passport, Voter ID, or Driving License). Please note that PAN cards are not accepted as valid residential address proof.',
    highlights: ['Aadhaar / Passport / DL Accepted', 'Mandatory for All Adults', 'Instant Front Desk Verification']
  },
  {
    id: 'wifi-power-amenities',
    category: 'amenities',
    icon: 'Wifi',
    q: 'Are high-speed Wi-Fi, power backup, and vehicle parking complimentary?',
    a: 'Yes! All registered guests enjoy complimentary high-speed dual-band fiber Wi-Fi across all suites and public lounges. The property is equipped with 24/7 heavy-duty automatic generator backup so air conditioning and power never get interrupted. We also provide free guarded parking for four-wheelers and two-wheelers.',
    highlights: ['Free Ultra-Fast Fiber Wi-Fi', '24/7 Heavy Generator Backup', 'Complimentary Guarded Parking']
  },
  {
    id: 'dining-room-service',
    category: 'dining',
    icon: 'Utensils',
    q: 'Is in-room dining and 24-hour room service available?',
    a: 'Yes, our kitchen and guest room service operate around the clock. You can order fresh multi-cuisine specialties, regional delicacies, hot tea/coffee, snacks, and late-night meals delivered directly to your door with a single call to reception.',
    highlights: ['24-Hour Kitchen & Room Service', 'Fresh Multi-Cuisine Menu', 'Quick Contact Dial']
  },
  {
    id: 'best-rate-guarantee',
    category: 'booking',
    icon: 'Sparkles',
    q: 'Why should I book directly through this digital catalogue?',
    a: 'Direct bookings through our official digital showcase come with our 100% Best Rate Guarantee. Unlike third-party booking portals (OTA) that add high commissions and hidden processing fees, direct booking ensures the lowest available tariff, complimentary room upgrade priority, and priority check-in handling.',
    highlights: ['Best Rate Guarantee (0% Commission)', 'Priority Room Upgrades', 'Direct Reception Confirmation']
  },
  {
    id: 'cancellation-refund',
    category: 'booking',
    icon: 'CheckCircle2',
    q: 'What is the cancellation and refund policy for reservations?',
    a: 'We understand plans change. Direct reservations enjoy free cancellation up to 24 hours prior to standard check-in time with a full 100% instant refund. For last-minute modifications or emergency date changes, our front desk team is always ready to assist you flexibly.',
    highlights: ['Free Cancellation (up to 24h)', '100% Refund Assurance', 'Flexible Date Rescheduling']
  },
  {
    id: 'location-transit',
    category: 'location',
    icon: 'Car',
    q: 'How accessible is the hotel from railway stations and transit hubs?',
    a: 'Our property is strategically located with quick access to the central railway junction, primary intercity bus terminal, and major highway routes. Ride-hailing cabs, auto-rickshaws, and express transit options are available directly outside our main entrance 24/7.',
    highlights: ['Prime Central Location', 'Easy Transit & Cab Access', 'One-Tap Google Maps Navigation']
  },
  {
    id: 'groups-corporate',
    category: 'booking',
    icon: 'Building',
    q: 'Can I book multiple suites for corporate events or family gatherings?',
    a: 'Absolutely! We offer specialized group tariff packages, corporate billing vouchers, and coordinated adjacent room arrangements for family weddings, business conferences, and group tours. Contact our manager directly via WhatsApp or the direct reservation form for tailored group quotes.',
    highlights: ['Group Discounts Available', 'Corporate Invoicing & GST', 'Dedicated Concierge Coordinator']
  }
];

const FAQ_CATEGORIES = [
  { key: 'all', label: 'All Questions' },
  { key: 'checkin', label: 'Check-in & Rules' },
  { key: 'amenities', label: 'Amenities & Wi-Fi' },
  { key: 'dining', label: 'Dining & Food' },
  { key: 'booking', label: 'Booking & Tariffs' },
  { key: 'location', label: 'Location & Transit' }
];

const renderFaqIcon = (iconName) => {
  const props = { size: 19 };
  switch (iconName) {
    case 'Clock': return <Clock {...props} />;
    case 'ShieldCheck': return <ShieldCheck {...props} />;
    case 'Wifi': return <Wifi {...props} />;
    case 'Utensils': return <Utensils {...props} />;
    case 'Sparkles': return <Sparkles {...props} />;
    case 'CheckCircle2': return <CheckCircle2 {...props} />;
    case 'Car': return <Car {...props} />;
    case 'Building': return <Building {...props} />;
    default: return <HelpCircle {...props} />;
  }
};

const DEFAULT_ALL_FACILITIES = [
  { key: 'wifi', label: 'Free Fiber Wi-Fi', icon: 'Wifi', desc: 'High-speed internet in all suites & lobby', enabled: true },
  { key: 'ac', label: 'Air Conditioning', icon: 'Wind', desc: 'Individual climate control in every room', enabled: true },
  { key: 'power_backup', label: '24/7 Power Backup', icon: 'Zap', desc: 'Heavy generator backup for uninterrupted stay', enabled: true },
  { key: 'lift', label: 'Elevator / Lift', icon: 'ArrowUpDown', desc: 'Smooth elevator access across all guest floors', enabled: true },
  { key: 'parking', label: 'Free Secure Parking', icon: 'Car', desc: '24/7 guarded parking space for vehicles', enabled: true },
  { key: 'restaurant', label: 'In-House Dining', icon: 'Utensils', desc: 'Multi-cuisine kitchen & 24h room delivery', enabled: true },
  { key: 'cctv', label: '24/7 CCTV & Security', icon: 'ShieldCheck', desc: 'Continuous surveillance for complete peace of mind', enabled: true },
  { key: 'room_service', label: '24h Room Service', icon: 'Bell', desc: 'Prompt front desk & housekeeping assistance', enabled: true },
  { key: 'hot_water', label: '24h Hot & Cold Water', icon: 'Droplets', desc: 'Continuous pressurized solar & geyser hot water', enabled: true },
  { key: 'doctor', label: 'Doctor on Call', icon: 'HeartPulse', desc: 'Emergency medical support & first-aid', enabled: true },
];

const DEFAULT_REVIEWS = [
  {
    id: 'rev-1',
    guest_name: 'Rohit Sharma',
    stay_type: 'Corporate Traveler',
    rating: 5,
    stay_date: 'Stayed Aug 2026',
    review_text: 'Outstanding cleanliness, courteous front desk, and high-speed Wi-Fi that made remote meetings seamless. The 24/7 power backup gave total peace of mind. Highly recommended!'
  },
  {
    id: 'rev-2',
    guest_name: 'Pooja & Ankit Deshmukh',
    stay_type: 'Family Vacation',
    rating: 5,
    stay_date: 'Stayed Sep 2026',
    review_text: 'We stayed for three nights with kids. Spacious suites, spotless washrooms, and very prompt room service. Booking directly through this digital catalogue gave us the best price!'
  },
  {
    id: 'rev-3',
    guest_name: 'Vikramaditya Rao',
    stay_type: 'Verified Direct Guest',
    rating: 5,
    stay_date: 'Stayed Jul 2026',
    review_text: 'Effortless direct booking, immediate WhatsApp voucher, and zero hidden platform fees. Truly 5-star hospitality at unbeatable direct tariffs.'
  }
];

const DEFAULT_RATING_SUMMARY = {
  overall_rating: 4.9,
  total_reviews_text: 'Based on 420+ authentic verified guest stay experiences',
  categories: [
    { label: 'Cleanliness & Hygiene Standards', score: 4.9, progress: 98, color: 'success' },
    { label: 'Staff Hospitality & Service', score: 4.9, progress: 97, color: 'primary' },
    { label: 'Prime Location & Accessibility', score: 4.8, progress: 96, color: 'warning' },
    { label: 'Room Comfort & Bedding Quality', score: 4.9, progress: 98, color: 'info' }
  ]
};

const DEFAULT_NEARBY_PLACES = [
  { id: 'place-1', icon: 'train', name: 'Central Railway Station', distance: '~ 2.5 km', duration: '7 mins' },
  { id: 'place-2', icon: 'bus', name: 'Main Bus Terminal', distance: '~ 1.2 km', duration: '4 mins' },
  { id: 'place-3', icon: 'monument', name: 'Heritage & Temple Site', distance: '~ 1.0 km', duration: '3 mins' }
];

const DEFAULT_STATS = [
  { label: 'Direct Booking Guarantee', value: '100%', color: 'primary' },
  { label: 'Front Desk & Concierge', value: '24 / 7', color: 'success' }
];

const DEFAULT_PRIVILEGES = [
  'Best Rate Guarantee (0% Commission)',
  'Priority Room Upgrades on Direct Booking',
  'Complimentary Dual-Band Fiber Wi-Fi',
  'Instant WhatsApp Confirmation Voucher'
];

const renderFacilityIcon = (iconName, color) => {
  const props = { size: 24, className: 'flex-shrink-0' };
  switch (iconName) {
    case 'Wifi': return <Wifi {...props} style={{ color }} />;
    case 'Wind': return <Wind {...props} style={{ color }} />;
    case 'Zap': return <Zap {...props} style={{ color }} />;
    case 'ArrowUpDown': return <ArrowUpDown {...props} style={{ color }} />;
    case 'Car': return <Car {...props} style={{ color }} />;
    case 'Utensils': return <Utensils {...props} style={{ color }} />;
    case 'ShieldCheck': return <ShieldCheck {...props} style={{ color }} />;
    case 'Bell': return <Bell {...props} style={{ color }} />;
    case 'Droplets': return <Droplets {...props} style={{ color }} />;
    case 'HeartPulse': return <HeartPulse {...props} style={{ color }} />;
    default: return <Sparkles {...props} style={{ color }} />;
  }
};

const getTomorrowDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};

const getTodayDate = () => {
  return new Date().toISOString().split('T')[0];
};

const PublicCatalogue = () => {
  const { propertyCode, branchCode } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeBranchQuery = searchParams.get('branch') || branchCode || null;

  // Multi-branch state
  const [currentBranchCode, setCurrentBranchCode] = useState(activeBranchQuery);

  // Navigation & Scroll State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Search / Availability Widget State
  const [searchCheckIn, setSearchCheckIn] = useState(getTodayDate());
  const [searchCheckOut, setSearchCheckOut] = useState(getTomorrowDate());
  const [searchAdults, setSearchAdults] = useState(2);
  const [searchChildren, setSearchChildren] = useState(0);
  const [roomFilter, setRoomFilter] = useState('ALL');

  // Room Image Carousel Indices for each room card
  const [roomPhotoIndices, setRoomPhotoIndices] = useState({});

  // Lead / Inquiry Modal State
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);
  const [selectedRoomForInquiry, setSelectedRoomForInquiry] = useState(null);
  const [inquirySuccess, setInquirySuccess] = useState(false);
  const [lastInquiryId, setLastInquiryId] = useState(null);
  const [inquiryForm, setInquiryForm] = useState({
    guest_name: '',
    guest_mobile: '',
    guest_email: '',
    check_in_date: getTodayDate(),
    check_out_date: getTomorrowDate(),
    adults: 2,
    children: 0,
    message: ''
  });

  // Digital Brochure Modal State
  const [isBrochureModalOpen, setIsBrochureModalOpen] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // FAQ Expanded & Filter State
  const [expandedFaqIndex, setExpandedFaqIndex] = useState(0);
  const [faqCategory, setFaqCategory] = useState('all');
  const [faqSearchQuery, setFaqSearchQuery] = useState('');

  // Lightbox Photo Viewer & Zoom/Pan State
  const [lightboxImages, setLightboxImages] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxZoom, setLightboxZoom] = useState(1);
  const [lightboxPan, setLightboxPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });

  // Hotel Property Gallery Slideshow State
  const [hotelSlideIndex, setHotelSlideIndex] = useState(0);
  const [isAutoSlidePlaying, setIsAutoSlidePlaying] = useState(true);
  const [isHoveringSlide, setIsHoveringSlide] = useState(false);
  const hotelThumbnailsRef = useRef(null);
  const touchStartXRef = useRef(null);
  const touchStartYRef = useRef(null);

  // Copy Link / Share State
  const [copiedLink, setCopiedLink] = useState(false);

  // Fetch Public Catalogue Data
  const {
    data,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['public-catalogue', propertyCode, currentBranchCode],
    queryFn: () => getPublicCatalogueApi(propertyCode, currentBranchCode),
    retry: 1,
  });

  // Sync Branch Query
  useEffect(() => {
    if (activeBranchQuery !== currentBranchCode) {
      setCurrentBranchCode(activeBranchQuery);
    }
  }, [activeBranchQuery]);

  // UNRESTRICTED SMOOTH SCROLLING ENGINE
  useEffect(() => {
    // Add public catalogue class to html & body
    document.documentElement.classList.add('public-catalogue-page');
    document.body.classList.add('public-catalogue-page');

    // Force styles on elements so nothing can lock scroll
    const prevHtmlOverflowY = document.documentElement.style.overflowY;
    const prevHtmlHeight = document.documentElement.style.height;
    const prevBodyOverflowY = document.body.style.overflowY;
    const prevBodyHeight = document.body.style.height;

    document.documentElement.style.setProperty('overflow-y', 'auto', 'important');
    document.documentElement.style.setProperty('overflow-x', 'hidden', 'important');
    document.documentElement.style.setProperty('height', 'auto', 'important');
    document.documentElement.style.setProperty('min-height', '100%', 'important');

    document.body.style.setProperty('overflow-y', 'auto', 'important');
    document.body.style.setProperty('overflow-x', 'hidden', 'important');
    document.body.style.setProperty('height', 'auto', 'important');
    document.body.style.setProperty('min-height', '100%', 'important');

    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      const currentScroll = window.scrollY || document.documentElement.scrollTop;
      if (totalScroll > 0) {
        setScrollProgress(Math.min(100, Math.max(0, (currentScroll / totalScroll) * 100)));
      }
      setShowScrollToTop(currentScroll > 280);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.documentElement.classList.remove('public-catalogue-page');
      document.body.classList.remove('public-catalogue-page');
      document.documentElement.style.overflowY = prevHtmlOverflowY;
      document.documentElement.style.height = prevHtmlHeight;
      document.body.style.overflowY = prevBodyOverflowY;
      document.body.style.height = prevBodyHeight;
    };
  }, []);

  const hotel = data?.hotel || {};
  const config = data?.config || {};
  const roomTypes = data?.room_types || [];
  const branches = data?.branches || [];
  const isMultiBranch = Boolean(data?.is_multi_branch || (branches && branches.length > 1));

  const palette = THEME_PALETTES[config.accent_theme] || THEME_PALETTES.BLUE;

  // Calculate lowest suite starting tariff
  const validRoomPrices = roomTypes.map(r => Number(r.base_price) || 0).filter(p => p > 0);
  const minRoomPrice = validRoomPrices.length > 0 ? Math.min(...validRoomPrices) : 0;

  // Calculate Nights
  const calculatedNights = Math.max(
    1,
    Math.round(
      (new Date(searchCheckOut || getTomorrowDate()) - new Date(searchCheckIn || getTodayDate())) /
        (1000 * 60 * 60 * 24)
    )
  );

  // Switch Branch
  const handleBranchSwitch = (code) => {
    setCurrentBranchCode(code);
    setSearchParams({ branch: code });
    setIsMobileMenuOpen(false);
    setIsBranchDropdownOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Open Inquiry Modal
  const handleOpenInquiry = (room = null) => {
    setSelectedRoomForInquiry(room);
    setInquirySuccess(false);
    setInquiryForm({
      guest_name: '',
      guest_mobile: '',
      guest_email: '',
      check_in_date: searchCheckIn,
      check_out_date: searchCheckOut,
      adults: searchAdults,
      children: searchChildren,
      message: ''
    });
    setIsInquiryModalOpen(true);
  };

  // Dynamic Data Memoizations
  const hotelGalleryPhotos = React.useMemo(() => {
    // 1. If backend has uploaded hotel gallery photos for this property, prioritize them 100%!
    if (data?.gallery_photos && Array.isArray(data.gallery_photos) && data.gallery_photos.length > 0) {
      return data.gallery_photos.map(p => ({
        id: p.id,
        image: p.image_url || p.image,
        caption: p.caption || hotel.name
      }));
    }
    // 2. Fallback to hero banner + room photos
    const list = [];
    if (config.hero_banner_url) {
      list.push({
        image: config.hero_banner_url,
        caption: `${hotel.name || 'Hotel'} - Panoramic Property View`
      });
    }
    roomTypes.forEach(r => {
      if (r.photos && Array.isArray(r.photos)) {
        r.photos.forEach(p => {
          if (p.image && !list.some(item => item.image === p.image)) {
            list.push({
              image: p.image,
              caption: `${hotel.name || 'Hotel'} - ${r.name}`
            });
          }
        });
      }
    });
    if (list.length > 0) return list;
    return DEFAULT_HOTEL_GALLERY;
  }, [data?.gallery_photos, config.hero_banner_url, roomTypes, hotel.name]);

  // Dynamic FAQs & Categories
  const faqsList = React.useMemo(() => {
    if (Array.isArray(config.faqs_json) && config.faqs_json.length > 0) {
      return config.faqs_json;
    }
    return FAQS_LIST;
  }, [config.faqs_json]);

  const faqCategories = React.useMemo(() => {
    const cats = new Set(faqsList.map(f => f.category || 'general'));
    return [
      { key: 'all', label: 'All Questions' },
      ...Array.from(cats).map(c => ({
        key: c,
        label: c === 'checkin' ? 'Check-in & Rules' :
               c === 'amenities' ? 'Amenities & Wi-Fi' :
               c === 'dining' ? 'Dining & Food' :
               c === 'booking' ? 'Booking & Tariffs' :
               c === 'location' ? 'Location & Transit' :
               c.charAt(0).toUpperCase() + c.slice(1)
      }))
    ];
  }, [faqsList]);

  // Dynamic Reviews & Ratings
  const reviewsList = React.useMemo(() => {
    if (Array.isArray(config.reviews_json) && config.reviews_json.length > 0) {
      return config.reviews_json;
    }
    return DEFAULT_REVIEWS;
  }, [config.reviews_json]);

  const ratingSummary = React.useMemo(() => {
    if (config.rating_summary_json && typeof config.rating_summary_json === 'object' && config.rating_summary_json.overall_rating) {
      return config.rating_summary_json;
    }
    return DEFAULT_RATING_SUMMARY;
  }, [config.rating_summary_json]);

  // Dynamic Nearby Places / Transit Landmarks
  const nearbyPlaces = React.useMemo(() => {
    if (Array.isArray(config.nearby_places_json) && config.nearby_places_json.length > 0) {
      return config.nearby_places_json;
    }
    return DEFAULT_NEARBY_PLACES;
  }, [config.nearby_places_json]);

  // Dynamic Stats & Privileges
  const statsList = React.useMemo(() => {
    if (Array.isArray(config.stats_json) && config.stats_json.length > 0) {
      return config.stats_json;
    }
    return DEFAULT_STATS;
  }, [config.stats_json]);

  const directPrivileges = React.useMemo(() => {
    if (Array.isArray(config.direct_privileges_json) && config.direct_privileges_json.length > 0) {
      return config.direct_privileges_json;
    }
    return DEFAULT_PRIVILEGES;
  }, [config.direct_privileges_json]);

  // Hotel Carousel Auto-Slide Timer Effect with auto-restart on manual slide interaction
  useEffect(() => {
    if (!isAutoSlidePlaying || isHoveringSlide || hotelGalleryPhotos.length <= 1) return;
    const timer = setInterval(() => {
      setHotelSlideIndex(prev => (prev + 1) % hotelGalleryPhotos.length);
    }, 4200);
    return () => clearInterval(timer);
  }, [isAutoSlidePlaying, isHoveringSlide, hotelSlideIndex, hotelGalleryPhotos.length]);

  // Keep active hotel thumbnail in view horizontally without scrolling the browser window!
  useEffect(() => {
    const container = hotelThumbnailsRef.current;
    if (!container) return;
    const activeThumb = container.children[hotelSlideIndex];
    if (!activeThumb) return;

    // Center the active thumbnail horizontally inside its scrollable container only
    const targetLeft = activeThumb.offsetLeft - (container.clientWidth / 2) + (activeThumb.clientWidth / 2);
    container.scrollTo({
      left: Math.max(0, targetLeft),
      behavior: 'smooth'
    });
  }, [hotelSlideIndex]);

  const handleNextHotelSlide = (e) => {
    if (e) e.stopPropagation();
    setHotelSlideIndex(prev => (prev + 1) % hotelGalleryPhotos.length);
  };

  const handlePrevHotelSlide = (e) => {
    if (e) e.stopPropagation();
    setHotelSlideIndex(prev => (prev - 1 + hotelGalleryPhotos.length) % hotelGalleryPhotos.length);
  };

  const handleTouchStart = (e) => {
    if (e.touches && e.touches.length > 0) {
      touchStartXRef.current = e.touches[0].clientX;
      touchStartYRef.current = e.touches[0].clientY;
    }
  };

  const handleTouchEnd = (e) => {
    if (touchStartXRef.current === null) return;
    const touch = e.changedTouches && e.changedTouches[0];
    if (!touch) return;
    const diffX = touchStartXRef.current - touch.clientX;
    const diffY = touchStartYRef.current !== null ? touchStartYRef.current - touch.clientY : 0;
    // Dominant horizontal swipe check to prevent interference with vertical scrolling
    if (Math.abs(diffX) > 35 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 0) {
        handleNextHotelSlide();
      } else {
        handlePrevHotelSlide();
      }
    }
    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  // Open Lightbox with Zoom reset
  const openLightbox = (photos, initialIndex = 0, roomName = '') => {
    if (!photos || photos.length === 0) return;
    const formatted = photos.map(p => ({
      image: typeof p === 'string' ? p : p.image,
      caption: (typeof p === 'object' && p.caption) ? p.caption : roomName
    }));
    setLightboxImages(formatted);
    setLightboxIndex(initialIndex);
    setLightboxZoom(1);
    setLightboxPan({ x: 0, y: 0 });
    setIsLightboxOpen(true);
  };

  const handleZoomIn = (e) => {
    if (e) e.stopPropagation();
    setLightboxZoom(prev => Math.min(3.5, Number((prev + 0.4).toFixed(2))));
  };

  const handleZoomOut = (e) => {
    if (e) e.stopPropagation();
    setLightboxZoom(prev => {
      const next = Math.max(1, Number((prev - 0.4).toFixed(2)));
      if (next === 1) setLightboxPan({ x: 0, y: 0 });
      return next;
    });
  };

  const handleZoomReset = (e) => {
    if (e) e.stopPropagation();
    setLightboxZoom(1);
    setLightboxPan({ x: 0, y: 0 });
  };

  const handleToggleZoom = (e) => {
    if (e) e.stopPropagation();
    if (lightboxZoom > 1) {
      handleZoomReset();
    } else {
      setLightboxZoom(2);
    }
  };

  const handleLightboxNext = (e) => {
    if (e) e.stopPropagation();
    setLightboxIndex(prev => (prev + 1) % lightboxImages.length);
    setLightboxZoom(1);
    setLightboxPan({ x: 0, y: 0 });
  };

  const handleLightboxPrev = (e) => {
    if (e) e.stopPropagation();
    setLightboxIndex(prev => (prev - 1 + lightboxImages.length) % lightboxImages.length);
    setLightboxZoom(1);
    setLightboxPan({ x: 0, y: 0 });
  };

  const handleLightboxSelectPhoto = (idx) => {
    setLightboxIndex(idx);
    setLightboxZoom(1);
    setLightboxPan({ x: 0, y: 0 });
  };

  const handleWheelZoom = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setLightboxZoom(prev => Math.min(3.5, Number((prev + 0.25).toFixed(2))));
    } else {
      setLightboxZoom(prev => {
        const next = Math.max(1, Number((prev - 0.25).toFixed(2)));
        if (next === 1) setLightboxPan({ x: 0, y: 0 });
        return next;
      });
    }
  };

  const handleMouseDownPan = (e) => {
    if (lightboxZoom <= 1) return;
    setIsPanning(true);
    panStartRef.current = { x: e.clientX - lightboxPan.x, y: e.clientY - lightboxPan.y };
  };

  const handleMouseMovePan = (e) => {
    if (!isPanning || lightboxZoom <= 1) return;
    setLightboxPan({
      x: e.clientX - panStartRef.current.x,
      y: e.clientY - panStartRef.current.y
    });
  };

  const handleMouseUpPan = () => {
    setIsPanning(false);
  };

  // Carousel thumbnail navigation for a specific room card
  const handleNextRoomPhoto = (roomId, totalPhotos, e) => {
    e.stopPropagation();
    setRoomPhotoIndices(prev => ({
      ...prev,
      [roomId]: ((prev[roomId] || 0) + 1) % totalPhotos
    }));
  };

  const handlePrevRoomPhoto = (roomId, totalPhotos, e) => {
    e.stopPropagation();
    setRoomPhotoIndices(prev => ({
      ...prev,
      [roomId]: ((prev[roomId] || 0) - 1 + totalPhotos) % totalPhotos
    }));
  };

  const handleSelectRoomPhoto = (roomId, index, e) => {
    e.stopPropagation();
    setRoomPhotoIndices(prev => ({
      ...prev,
      [roomId]: index
    }));
  };

  // Share Link
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: hotel.name || 'Hotel Catalogue',
        text: config.hero_tagline || 'Explore our luxury rooms, verified tariffs, and hotel hospitality',
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // WhatsApp Url
  const generateWhatsAppUrl = (room = null) => {
    const rawNumber = hotel.whatsapp || hotel.phone || '';
    const cleanNumber = rawNumber.replace(/[^0-9]/g, '');
    let text = `Hello *${hotel.name}*! I am browsing your online digital catalogue.\n`;
    if (room) {
      text += `• I am interested in: *${room.name}*\n`;
      text += `• Direct Rate: ₹${room.base_price}/night\n`;
    }
    if (searchCheckIn && searchCheckOut) {
      text += `• Check-in: ${searchCheckIn}\n• Check-out: ${searchCheckOut} (${calculatedNights} Night${calculatedNights > 1 ? 's' : ''})\n`;
      text += `• Guests: ${searchAdults} Adults, ${searchChildren} Children\n`;
    }
    text += `Please confirm current room availability, early check-in, and best direct discount offers. Thank you!`;
    const finalNumber = cleanNumber.length === 10 ? '91' + cleanNumber : cleanNumber;
    return `https://wa.me/${finalNumber}?text=${encodeURIComponent(text)}`;
  };

  // Submit Lead Mutation
  const inquiryMutation = useMutation({
    mutationFn: (formData) =>
      submitPublicInquiryApi(propertyCode, {
        ...formData,
        requested_room_type: selectedRoomForInquiry?.id || null
      }),
    onSuccess: (res) => {
      setInquirySuccess(true);
      setLastInquiryId(res?.inquiry?.id || Math.floor(1000 + Math.random() * 9000));
    }
  });

  const handleInquirySubmit = (e) => {
    e.preventDefault();
    inquiryMutation.mutate(inquiryForm);
  };

  // Filtered Rooms
  const filteredRooms = roomTypes.filter(r => {
    if (roomFilter === 'ALL') return true;
    return r.name.toLowerCase().includes(roomFilter.toLowerCase());
  });

  // Unique Room Categories
  const roomCategories = ['ALL', ...new Set(roomTypes.map(r => r.name.split(' ')[0]))];

  // Group rooms category-wise for brochure and catalogue views
  const brochureCategoriesMap = {};
  roomTypes.forEach((r) => {
    const rawCat = r.category || (r.name ? r.name.split(' ')[0] : 'Standard');
    const catKey = rawCat.toUpperCase() + ' SUITES';
    if (!brochureCategoriesMap[catKey]) {
      brochureCategoriesMap[catKey] = [];
    }
    brochureCategoriesMap[catKey].push(r);
  });

  // Smooth Scroll with Header Offset
  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const topOffset = 72; // Header height
      const elementPosition = el.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({
        top: elementPosition - topOffset,
        behavior: 'smooth'
      });
    }
    setIsMobileMenuOpen(false);
  };

  // Scroll to top
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="min-vh-100 d-flex flex-column align-items-center justify-content-center text-white p-4" style={{ backgroundColor: '#090d16' }}>
        <div className="position-relative mb-4">
          <div className="spinner-border text-warning" role="status" style={{ width: '4rem', height: '4rem', borderWidth: '4px' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <Building size={28} className="position-absolute top-50 start-50 translate-middle text-warning" />
        </div>
        <h3 className="fw-extrabold tracking-tight mb-2 text-white">Opening Hotel Showcase...</h3>
        <p className="text-secondary small max-w-sm text-center">
          Loading handcrafted suites, verified direct rates, signature amenities, and local guides.
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-vh-100 d-flex flex-column align-items-center justify-content-center bg-light p-4 text-center">
        <div className="p-4 rounded-circle bg-danger-subtle text-danger mb-3 shadow-sm">
          <AlertCircle size={46} />
        </div>
        <h3 className="fw-bold text-dark mb-2">Catalogue Currently Offline</h3>
        <p className="text-muted max-w-md mb-4">
          {error?.response?.data?.detail || 'This hotel catalogue could not be loaded or is undergoing updates. Please try again in a moment.'}
        </p>
        <button className="btn btn-primary px-4 py-2.5 rounded-pill fw-bold shadow-sm" onClick={() => refetch()}>
          Try Again
        </button>
      </div>
    );
  }

  const enabledFacilities = (config.facilities_json && config.facilities_json.length > 0)
    ? config.facilities_json.filter(f => f.enabled)
    : DEFAULT_ALL_FACILITIES;

  const heroBackground = config.hero_banner_url || DEFAULT_HOTEL_BANNER;

  // Safe HTML string escaper
  const escapeHtml = (str) => {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  };

  // 1. Direct PDF file generation & download via jsPDF
  const handleDownloadCataloguePDF = async () => {
    try {
      setIsDownloadingPdf(true);
      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${hotel.name || 'Hotel'} ${hotel.address || ''} ${hotel.city || ''}`)}`;
      await exportHotelCataloguePDF(hotel, config, roomTypes, enabledFacilities, {
        galleryPhotos: hotelGalleryPhotos,
        googleMapsUrl,
        ratingSummary,
        directPrivileges
      });
    } catch (err) {
      console.error('Error downloading catalogue PDF:', err);
      // Fallback to standalone printable A4 window
      handlePrintCatalogueA4();
    } finally {
      setTimeout(() => setIsDownloadingPdf(false), 600);
    }
  };

  // 2. Standalone Printable A4 Catalogue Window with embedded photos and category-wise layout
  const handlePrintCatalogueA4 = () => {
    const printWin = window.open('', '_blank', 'width=950,height=1050');
    if (!printWin) {
      alert('Popup was blocked by your browser. Please allow popups to open the print preview or use the direct Download PDF button.');
      return;
    }

    const hotelName = escapeHtml(hotel.name || 'Hotel & Luxury Suites');
    const hotelAddress = escapeHtml(hotel.address || hotel.city || 'Central Hotel Location');
    const hotelPhone = escapeHtml(hotel.phone || 'Available 24/7');
    const hotelWhatsapp = escapeHtml(hotel.whatsapp || '');
    const hotelEmail = escapeHtml(hotel.email || '');
    const checkIn = escapeHtml(config.check_in_time || '12:00 PM');
    const checkOut = escapeHtml(config.check_out_time || '11:00 AM');
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${hotel.name || 'Hotel'} ${hotel.address || ''} ${hotel.city || ''}`)}`;

    // Group rooms by category
    const categoriesMap = {};
    roomTypes.forEach((r) => {
      const rawCat = r.category || (r.name ? r.name.split(' ')[0] : 'STANDARD');
      const catKey = rawCat.toUpperCase() + ' SUITES';
      if (!categoriesMap[catKey]) {
        categoriesMap[catKey] = [];
      }
      categoriesMap[catKey].push(r);
    });

    const categoriesHtml = Object.entries(categoriesMap).map(([catTitle, rooms]) => `
      <div class="category-block">
        <div class="category-header">
          <span>◆ ${escapeHtml(catTitle)}</span>
          <span class="category-count">${rooms.length} Suite Option${rooms.length > 1 ? 's' : ''}</span>
        </div>
        <div class="room-grid">
          ${rooms.map((room, idx) => {
            let photoUrl = (room.photos && room.photos.length > 0 && room.photos[0]?.image)
              ? room.photos[0].image
              : (room.primary_photo || FALLBACK_ROOM_PHOTOS[idx % FALLBACK_ROOM_PHOTOS.length]);
            if (photoUrl && !photoUrl.startsWith('http') && !photoUrl.startsWith('data:')) {
              photoUrl = window.location.origin + (photoUrl.startsWith('/') ? '' : '/') + photoUrl;
            }
            const amenities = room.amenities
              ? room.amenities.split(',').map(a => `<span class="pill-badge">${escapeHtml(a.trim())}</span>`).join(' ')
              : '<span class="pill-badge">Air Conditioning</span> <span class="pill-badge">Free Wi-Fi</span> <span class="pill-badge">Smart TV</span> <span class="pill-badge">Hot Water 24/7</span>';
            return `
              <div class="room-card">
                <div class="room-img-box">
                  <img src="${photoUrl}" alt="${escapeHtml(room.name)}" onerror="this.style.display='none'" />
                </div>
                <div class="room-info">
                  <div class="room-top">
                    <div>
                      <h3 class="room-name">${escapeHtml(room.name)}</h3>
                      <div class="room-cap">👥 Max ${room.max_adults || 2} Adults ${room.max_children ? `• 👶 ${room.max_children} Child` : ''}</div>
                    </div>
                    <div class="room-price-box">
                      <div class="room-price">${formatTariff(room.base_price || 0)}</div>
                      <div class="room-price-sub">per night (Direct)</div>
                    </div>
                  </div>
                  <div class="room-amenities">
                    ${amenities}
                  </div>
                  ${room.description ? `<div class="room-desc">${escapeHtml(room.description)}</div>` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `).join('');

    const facilitiesHtml = enabledFacilities.slice(0, 16).map(f => `
      <div class="facility-item">✓ ${escapeHtml(f.label)}</div>
    `).join('');

    printWin.document.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>${hotelName} - Digital Catalogue & Factsheet</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #1e293b;
            background: #ffffff;
            font-size: 11px;
            line-height: 1.4;
            padding: 12px;
          }
          .action-bar {
            margin-bottom: 12px;
            display: flex;
            justify-content: flex-end;
            gap: 8px;
          }
          .btn-action {
            background: #1d4ed8;
            color: #ffffff;
            border: none;
            padding: 8px 18px;
            border-radius: 20px;
            font-weight: 700;
            font-size: 12px;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(29, 78, 216, 0.3);
          }
          .header-banner {
            background: #0f172a;
            color: #ffffff;
            padding: 14px 18px;
            border-radius: 8px;
            margin-bottom: 12px;
            border-top: 4px solid #d97706;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .hotel-title {
            font-size: 20px;
            font-weight: 800;
            letter-spacing: -0.02em;
            margin-bottom: 3px;
          }
          .hotel-sub {
            font-size: 10px;
            color: #94a3b8;
          }
          .rating-badge {
            background: #f59e0b;
            color: #451a03;
            font-weight: 800;
            font-size: 9px;
            padding: 4px 10px;
            border-radius: 20px;
            display: inline-block;
            margin-bottom: 4px;
          }
          .meta-box {
            text-align: right;
            font-size: 9px;
            color: #cbd5e1;
          }
          .contact-grid {
            display: grid;
            grid-template-columns: 1.2fr 1fr;
            gap: 10px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 10px 14px;
            margin-bottom: 12px;
          }
          .contact-col h4 {
            font-size: 10px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 5px;
            text-transform: uppercase;
          }
          .contact-col p {
            font-size: 9.5px;
            color: #475569;
            margin-bottom: 3px;
          }
          .maps-btn {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: #ea4335;
            color: #ffffff !important;
            text-decoration: none;
            font-size: 9.5px;
            font-weight: 700;
            padding: 5px 12px;
            border-radius: 20px;
            margin-top: 6px;
            box-shadow: 0 2px 6px rgba(234, 67, 53, 0.35);
          }
          .facilities-section {
            background: #f1f5f9;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            padding: 8px 12px;
            margin-bottom: 14px;
          }
          .facilities-title {
            font-size: 9.5px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 6px;
            text-transform: uppercase;
          }
          .facilities-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 4px;
          }
          .facility-item {
            font-size: 8.5px;
            color: #334155;
            font-weight: 600;
          }
          .gallery-section {
            margin-bottom: 14px;
            page-break-inside: avoid;
          }
          .gallery-title {
            font-size: 9.5px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 6px;
            text-transform: uppercase;
          }
          .gallery-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
          }
          .gallery-card {
            border-radius: 6px;
            overflow: hidden;
            border: 1px solid #cbd5e1;
            background: #0f172a;
          }
          .gallery-card img {
            width: 100%;
            height: 90px;
            object-fit: cover;
            display: block;
          }
          .gallery-caption {
            padding: 4px 6px;
            font-size: 7.5px;
            color: #ffffff;
            font-weight: 600;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .category-block {
            margin-bottom: 14px;
            page-break-inside: avoid;
          }
          .category-header {
            background: #1e3a8a;
            color: #ffffff;
            padding: 6px 12px;
            font-size: 10.5px;
            font-weight: 700;
            border-radius: 6px 6px 0 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .category-count {
            font-size: 8.5px;
            background: rgba(255,255,255,0.2);
            padding: 2px 6px;
            border-radius: 10px;
          }
          .room-card {
            display: flex;
            gap: 12px;
            border: 1px solid #e2e8f0;
            border-top: none;
            padding: 8px 12px;
            background: #ffffff;
            align-items: center;
          }
          .room-card:nth-child(even) {
            background: #fafbfc;
          }
          .room-img-box {
            width: 105px;
            height: 72px;
            flex-shrink: 0;
            border-radius: 6px;
            overflow: hidden;
            border: 1px solid #cbd5e1;
            background: #f1f5f9;
          }
          .room-img-box img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .room-info {
            flex-grow: 1;
          }
          .room-top {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 4px;
          }
          .room-name {
            font-size: 11.5px;
            font-weight: 700;
            color: #0f172a;
          }
          .room-cap {
            font-size: 8.5px;
            color: #64748b;
          }
          .room-price-box {
            text-align: right;
          }
          .room-price {
            font-size: 13px;
            font-weight: 800;
            color: #1d4ed8;
          }
          .room-price-sub {
            font-size: 7.5px;
            color: #94a3b8;
          }
          .room-amenities {
            display: flex;
            flex-wrap: wrap;
            gap: 3px;
            margin-bottom: 3px;
          }
          .pill-badge {
            background: #e2e8f0;
            color: #334155;
            font-size: 7.5px;
            padding: 1px 5px;
            border-radius: 3px;
            font-weight: 600;
          }
          .room-desc {
            font-size: 8px;
            color: #64748b;
            line-height: 1.3;
          }
          .policies-box {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 8px 12px;
            margin-top: 10px;
            font-size: 8.5px;
            color: #92400e;
            page-break-inside: avoid;
          }
          .policies-box strong {
            font-size: 9px;
            display: block;
            margin-bottom: 3px;
          }
          .footer-strip {
            margin-top: 14px;
            padding-top: 6px;
            border-top: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            font-size: 8px;
            color: #94a3b8;
          }
          @media print {
            .no-print {
              display: none !important;
            }
            body {
              padding: 0 !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="action-bar no-print">
          <button class="btn-action" onclick="window.print()">🖨️ Print or Save as PDF</button>
        </div>

        <div class="header-banner">
          <div>
            <div class="rating-badge">${config.show_reviews !== false ? `★ ${escapeHtml(ratingSummary.overall_rating || '4.9')} LUXURY VERIFIED` : '★ VERIFIED HOTEL PROPERTY'}</div>
            <h1 class="hotel-title">${hotelName.toUpperCase()}</h1>
            <div class="hotel-sub">📍 ${hotelAddress} • Official Guest Tariff Directory</div>
          </div>
          <div class="meta-box">
            <div>Direct Booking Guarantee</div>
            <div style="font-weight: 700; color: #f59e0b; margin-top: 2px;">0% Commission</div>
            <div style="margin-top: 4px; font-size: 8px;">Date: ${new Date().toLocaleDateString('en-IN')}</div>
          </div>
        </div>

        <div class="contact-grid">
          <div class="contact-col">
            <h4>Direct Front Desk &amp; Location</h4>
            <p><strong>Address:</strong> ${hotelAddress}</p>
            <p><strong>Phone:</strong> ${hotelPhone}</p>
            ${hotelWhatsapp ? `<p><strong>WhatsApp:</strong> ${hotelWhatsapp}</p>` : ''}
            ${hotelEmail ? `<p><strong>Email:</strong> ${hotelEmail}</p>` : ''}
            <a href="${googleMapsUrl}" target="_blank" rel="noopener noreferrer" class="maps-btn">
              📍 View Location &amp; Directions on Google Maps →
            </a>
          </div>
          <div class="contact-col">
            <h4>Check-in Rules &amp; Timings</h4>
            <p><strong>Check-in:</strong> ${checkIn} &bull; <strong>Check-out:</strong> ${checkOut}</p>
            <p><strong>Govt ID:</strong> Mandatory (Aadhaar / Passport / DL)</p>
            <p><strong>Front Desk:</strong> 24 Hours Active Guest Care</p>
            <p style="margin-top: 6px; font-size: 8.5px; color: #1e3a8a;"><strong>Payment:</strong> Cash, UPI, Card, Net Banking</p>
          </div>
        </div>

        <div class="facilities-section">
          <div class="facilities-title">Signature Hotel Amenities &amp; Services</div>
          <div class="facilities-grid">
            ${facilitiesHtml}
          </div>
        </div>

        ${hotelGalleryPhotos && hotelGalleryPhotos.length > 0 ? `
          <div class="gallery-section">
            <div class="gallery-title">Hotel Property Photo Gallery &amp; Showcase (${hotelGalleryPhotos.length} Photos)</div>
            <div class="gallery-grid">
              ${hotelGalleryPhotos.map(p => `
                <div class="gallery-card">
                  <img src="${p.image}" alt="${escapeHtml(p.caption || hotelName)}" onerror="this.parentElement.style.display='none'" />
                  <div class="gallery-caption">${escapeHtml(p.caption || hotelName)}</div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        ${categoriesHtml}

        <div class="policies-box">
          <strong>Direct Guest Privileges &amp; Policies</strong>
          ${directPrivileges && directPrivileges.length > 0
            ? directPrivileges.map(dp => `<div>&bull; ${escapeHtml(dp)}</div>`).join('')
            : '<div>&bull; Best Tariff Guarantee: Direct booking from reception ensures lowest rate with zero booking surcharge.</div>'
          }
          <div>&bull; Identification: Valid government photo ID proof is required for each adult occupant prior to key handover.</div>
          <div>&bull; Cancellation: ${escapeHtml(config.cancellation_policy || 'Free cancellation up to 24 hours before check-in.')}</div>
          ${config.house_rules ? `<div>&bull; House Rules: ${escapeHtml(config.house_rules)}</div>` : ''}
        </div>

        <div class="footer-strip">
          <span>${hotelName} • Official Digital Catalogue &bull; Front Desk: ${hotelPhone}</span>
          <span>Generated on ${new Date().toLocaleString('en-IN')}</span>
        </div>
      </body>
      </html>
    `);

    printWin.document.close();
    printWin.focus();
    setTimeout(() => {
      try {
        printWin.print();
      } catch (e) {
        console.error('Auto print trigger error:', e);
      }
    }, 450);
  };

  return (
    <div className="luxury-hotel-site" style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}>
      {/* ========================================================================= */}
      {/* ADVANCED LUXURY ANIMATIONS & RESPONSIVE ENGINE                             */}
      {/* ========================================================================= */}
      <style>{`
        /* Global Scroll Reset to guarantee free scrolling */
        html, body {
          overflow-x: hidden !important;
          overflow-y: auto !important;
          height: auto !important;
          min-height: 100vh !important;
          scroll-behavior: smooth !important;
          -webkit-overflow-scrolling: touch !important;
        }
        #root {
          min-height: 100vh !important;
          height: auto !important;
          overflow: visible !important;
        }
        .luxury-hotel-site {
          color: #1e293b;
          overflow-x: hidden !important;
          overflow-y: visible !important;
          position: relative !important;
        }

        /* Glassmorphism Header */
        .glass-navbar {
          background: rgba(8, 14, 28, 0.94);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
          transition: all 0.3s ease;
        }

        /* Reading Progress Bar */
        .reading-progress-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          height: 3.5px;
          background: linear-gradient(90deg, #f59e0b, #ec4899, #3b82f6, #10b981);
          background-size: 300% 100%;
          animation: gradientSweep 6s ease infinite;
          transition: width 0.12s ease-out;
          z-index: 1060;
        }

        @keyframes gradientSweep {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        /* Sleek Single-Line Desktop Nav Links */
        .catalogue-nav-item {
          color: rgba(255, 255, 255, 0.78) !important;
          font-size: 0.84rem;
          font-weight: 500;
          letter-spacing: 0.01em;
          padding: 6px 12px;
          border-radius: 9999px;
          white-space: nowrap !important;
          text-decoration: none;
          background: transparent;
          border: none;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          display: inline-flex;
          align-items: center;
          gap: 5px;
          cursor: pointer;
          flex-shrink: 0;
        }
        .catalogue-nav-item:hover {
          color: #ffffff !important;
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-1px);
        }
        .catalogue-nav-item:active {
          transform: translateY(0);
        }

        /* Cohesive Action Buttons */
        .catalogue-btn-call {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.22);
          color: #ffffff;
          height: 38px;
          white-space: nowrap !important;
          transition: all 0.2s ease;
          font-size: 0.8rem;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .catalogue-btn-call:hover {
          background: rgba(255, 255, 255, 0.16);
          border-color: rgba(251, 191, 36, 0.7);
          color: #fbbf24;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
        }

        .catalogue-btn-whatsapp {
          background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
          color: #ffffff !important;
          border: none;
          height: 38px;
          white-space: nowrap !important;
          font-size: 0.8rem;
          font-weight: 700;
          box-shadow: 0 3px 10px rgba(37, 211, 102, 0.3);
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .catalogue-btn-whatsapp:hover {
          background: linear-gradient(135deg, #28e06d 0%, #159e8e 100%);
          color: #ffffff !important;
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(37, 211, 102, 0.45);
        }

        .catalogue-btn-reserve {
          border: 1px solid rgba(255, 255, 255, 0.2);
          height: 38px;
          white-space: nowrap !important;
          font-size: 0.82rem;
          font-weight: 700;
          letter-spacing: 0.01em;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .catalogue-btn-reserve:hover {
          transform: translateY(-1px);
          filter: brightness(1.1);
        }

        /* Hero Ambient & Creative Typography */
        .hero-hotel-title {
          font-size: clamp(2.2rem, 5.2vw, 4.3rem);
          font-weight: 900;
          line-height: 1.08;
          letter-spacing: -0.035em;
          word-break: break-word;
          background: linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 55%, #E2E8F0 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(0 4px 16px rgba(0, 0, 0, 0.75));
        }

        .hero-gold-accent-line {
          width: 80px;
          height: 4px;
          background: linear-gradient(90deg, #fbbf24 0%, #d97706 60%, transparent 100%);
          border-radius: 9999px;
        }

        .hero-ambient-glow {
          position: absolute;
          top: 10%;
          left: 5%;
          width: 480px;
          height: 480px;
          background: radial-gradient(circle, rgba(37, 99, 235, 0.25) 0%, rgba(245, 158, 11, 0.08) 45%, transparent 70%);
          filter: blur(60px);
          pointer-events: none;
          z-index: 0;
        }

        .hero-card-privileges {
          background: rgba(10, 16, 32, 0.82);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.14);
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.55);
        }

        .hero-eyebrow-pill {
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.15);
        }

        /* Hero Ambient Overlay */
        .hero-overlay {
          background: linear-gradient(180deg, rgba(8, 13, 26, 0.75) 0%, rgba(8, 13, 26, 0.88) 55%, #080d1a 100%);
        }

        /* Elevated Floating Search Widget */
        .floating-search-bar {
          margin-top: -65px;
          border-radius: 24px;
          box-shadow: 0 25px 60px -15px rgba(15, 23, 42, 0.3), 0 0 0 1px rgba(226, 232, 240, 0.9);
          background: #ffffff;
        }

        /* Next-Level Micro-Animations */
        @keyframes subtlePulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.45); }
          70% { transform: scale(1.025); box-shadow: 0 0 0 12px rgba(37, 99, 235, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); }
        }

        @keyframes goldShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        @keyframes emeraldPulse {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5); }
          70% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }

        .animated-pulse-btn {
          animation: subtlePulse 2.6s infinite cubic-bezier(0.4, 0, 0.6, 1);
        }

        /* ULTRA HIGH-VISIBILITY GOLD SHIMMER BADGE */
        .gold-shimmer-badge {
          background: linear-gradient(90deg, #d97706 0%, #fef3c7 40%, #fbbf24 60%, #d97706 100%);
          background-size: 250% 100%;
          animation: goldShimmer 3s infinite linear;
          color: #451a03 !important;
          font-weight: 800 !important;
          letter-spacing: 0.02em;
          border: 1px solid rgba(255, 255, 255, 0.6);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.35);
          text-shadow: 0 1px 1px rgba(255, 255, 255, 0.5);
        }

        /* DISCOUNT RIBBON BADGE */
        .discount-ribbon-badge {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: #ffffff !important;
          font-weight: 800;
          letter-spacing: 0.03em;
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.45);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        /* LUXURY CARD HOVER ELEVATION */
        .luxury-card-hover {
          transition: transform 0.32s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.32s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.32s ease;
        }
        .luxury-card-hover:hover {
          transform: translateY(-8px);
          box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.18) !important;
        }

        .room-photo-zoom {
          transition: transform 0.55s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .luxury-card-hover:hover .room-photo-zoom {
          transform: scale(1.06);
        }

        .photo-thumbnail-strip::-webkit-scrollbar {
          height: 5px;
        }
        .photo-thumbnail-strip::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }

        /* FLOATING ACTION SYSTEM: TRANSLUCENT WHATSAPP & ICON-ONLY RESERVE */
        .floating-actions-dock {
          position: fixed;
          bottom: 26px;
          right: 24px;
          z-index: 1040;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          pointer-events: auto;
        }

        /* 1. Transparent Frosted Glass WhatsApp Button */
        .floating-whatsapp-transparent-btn {
          position: relative;
          width: 52px;
          height: 52px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(37, 211, 102, 0.18);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border: 1.5px solid rgba(37, 211, 102, 0.55);
          color: #25D366;
          box-shadow: 0 8px 24px rgba(37, 211, 102, 0.22), inset 0 1px 2px rgba(255, 255, 255, 0.35);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          text-decoration: none;
        }
        .floating-whatsapp-transparent-btn:hover {
          background: rgba(37, 211, 102, 0.32);
          border-color: #25D366;
          color: #128C7E;
          transform: translateY(-3px) scale(1.08);
          box-shadow: 0 12px 30px rgba(37, 211, 102, 0.45);
        }

        /* 2. Floating Reserve Icon Button (Just Icon, No Text) */
        .floating-reserve-icon-btn {
          position: relative;
          width: 52px;
          height: 52px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          border: 1.5px solid rgba(255, 255, 255, 0.35);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.35);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          padding: 0;
        }
        .floating-reserve-icon-btn:hover {
          transform: translateY(-3px) scale(1.08);
          filter: brightness(1.15);
          border-color: #fbbf24;
          box-shadow: 0 12px 30px rgba(251, 191, 36, 0.4);
        }

        /* Subtle glowing pulse badge on Reserve Icon Button */
        .floating-btn-pulse-dot {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #fbbf24;
          border: 1.5px solid #0f172a;
        }
        .floating-btn-pulse-dot::after {
          content: '';
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          border-radius: 50%;
          background: rgba(251, 191, 36, 0.65);
          animation: pingDot 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        @keyframes pingDot {
          75%, 100% {
            transform: scale(2.2);
            opacity: 0;
          }
        }

        /* 3. Floating Scroll To Top */
        .floating-scroll-top {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(15, 23, 42, 0.88);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25);
          transition: all 0.25s ease;
          cursor: pointer;
        }
        .floating-scroll-top:hover {
          background: #0f172a;
          transform: translateY(-3px);
          color: #fbbf24;
          border-color: #fbbf24;
        }

        /* ========================================================================= */
        /* NEXT-LEVEL ANIMATED FAQ ACCORDION                                         */
        /* ========================================================================= */
        .faq-item-card {
          border: 1.5px solid #e2e8f0;
          border-radius: 18px;
          background: #ffffff;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
        }
        .faq-item-card:hover {
          border-color: #cbd5e1;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
          transform: translateY(-2px);
        }
        .faq-item-card.is-expanded {
          border-color: #3b82f6 !important;
          box-shadow: 0 14px 34px -10px rgba(37, 99, 235, 0.18), 0 4px 14px rgba(0, 0, 0, 0.04) !important;
          transform: translateY(-2px);
        }

        .faq-header-trigger {
          width: 100%;
          text-align: left;
          padding: 18px 22px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: background-color 0.25s ease;
        }
        .faq-header-trigger:hover {
          background-color: #f8fafc;
        }
        .faq-item-card.is-expanded .faq-header-trigger {
          background: linear-gradient(180deg, #f0f7ff 0%, #ffffff 100%);
        }

        .faq-icon-pill {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #eff6ff;
          color: #2563eb;
          flex-shrink: 0;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .faq-item-card.is-expanded .faq-icon-pill {
          background: #1d4ed8;
          color: #ffffff;
          box-shadow: 0 6px 16px rgba(29, 78, 216, 0.35);
          transform: scale(1.05);
        }

        .faq-chevron-badge {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f1f5f9;
          color: #64748b;
          flex-shrink: 0;
          transition: transform 0.38s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.25s ease, color 0.25s ease, box-shadow 0.25s ease;
        }
        .faq-header-trigger:hover .faq-chevron-badge {
          background: #e2e8f0;
          color: #0f172a;
        }
        .faq-item-card.is-expanded .faq-chevron-badge {
          transform: rotate(180deg);
          background: #1d4ed8;
          color: #ffffff;
          box-shadow: 0 4px 14px rgba(29, 78, 216, 0.35);
        }

        /* 60FPS Pure CSS Grid Animation for Auto-Height Expand/Collapse */
        .faq-animated-collapse {
          display: grid;
          grid-template-rows: 0fr;
          transition: grid-template-rows 0.38s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .faq-item-card.is-expanded .faq-animated-collapse {
          grid-template-rows: 1fr;
        }
        .faq-animated-content {
          overflow: hidden;
        }
        .faq-body-inner {
          padding: 4px 24px 22px 80px;
          color: #475569;
          font-size: 0.92rem;
          line-height: 1.75;
          opacity: 0;
          transform: translateY(-6px);
          transition: opacity 0.3s ease 0.08s, transform 0.3s ease 0.08s;
        }
        .faq-item-card.is-expanded .faq-body-inner {
          opacity: 1;
          transform: translateY(0);
        }

        .faq-highlight-chip {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: #f0fdf4;
          color: #15803d;
          border: 1px solid rgba(34, 197, 94, 0.25);
          border-radius: 9999px;
          padding: 3px 10px;
          font-size: 0.75rem;
          font-weight: 600;
          margin-right: 6px;
          margin-top: 8px;
        }

        .faq-filter-pill {
          padding: 8px 18px;
          border-radius: 9999px;
          font-size: 0.82rem;
          font-weight: 700;
          border: 1.5px solid #e2e8f0;
          background: #ffffff;
          color: #475569;
          transition: all 0.2s ease;
          cursor: pointer;
          white-space: nowrap;
        }
        .faq-filter-pill:hover {
          border-color: #3b82f6;
          color: #1d4ed8;
          background: #f8faff;
        }
        .faq-filter-pill.is-active {
          background: #1d4ed8;
          color: #ffffff;
          border-color: #1d4ed8;
          box-shadow: 0 4px 12px rgba(29, 78, 216, 0.28);
        }

        .faq-concierge-card {
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          border-radius: 20px;
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 20px 40px -15px rgba(15, 23, 42, 0.4);
          overflow: hidden;
          position: relative;
        }
        .faq-concierge-card::before {
          content: '';
          position: absolute;
          top: -40px;
          right: -40px;
          width: 180px;
          height: 180px;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }

        @media (max-width: 767px) {
          .faq-concierge-card {
            padding: 22px 18px !important;
          }
          .faq-body-inner {
            padding: 4px 16px 18px 16px;
          }
          .faq-header-trigger {
            padding: 16px;
            gap: 12px;
          }
          .faq-icon-pill {
            width: 36px;
            height: 36px;
          }
          .faq-chevron-badge {
            width: 32px;
            height: 32px;
          }
        }

        @media (max-width: 991px) {
          .luxury-hotel-site {
            padding-bottom: 24px !important;
          }
          .floating-search-bar {
            margin-top: -24px;
            border-radius: 20px;
          }
          .floating-actions-dock {
            bottom: 18px !important;
            right: 16px !important;
            gap: 10px !important;
          }
          .floating-whatsapp-transparent-btn {
            width: 46px !important;
            height: 46px !important;
          }
          .floating-reserve-icon-btn {
            width: 46px !important;
            height: 46px !important;
          }
          .floating-scroll-top {
            width: 38px !important;
            height: 38px !important;
          }
        }

        /* HOTEL CAROUSEL SLIDING TRACK & PREVIEW SYSTEM */
        .hotel-slider-track {
          display: flex;
          height: 100%;
          width: 100%;
          will-change: transform;
          transition: transform 0.48s cubic-bezier(0.25, 1, 0.5, 1);
        }
        .hotel-slide-item {
          min-width: 100%;
          width: 100%;
          height: 100%;
          flex-shrink: 0;
          position: relative;
        }
        .hotel-thumb-btn {
          position: relative;
          width: 68px;
          height: 46px;
          border-radius: 9px;
          overflow: hidden;
          flex-shrink: 0;
          border: 2px solid #e2e8f0;
          opacity: 0.72;
          background: #f8fafc;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          padding: 0;
        }
        .hotel-thumb-btn:hover {
          opacity: 1;
          border-color: #94a3b8;
          transform: translateY(-2px);
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.12);
        }
        .hotel-thumb-btn.is-active {
          opacity: 1;
          border-color: #2563eb !important;
          transform: translateY(-3px) scale(1.05);
          box-shadow: 0 6px 16px rgba(37, 99, 235, 0.35);
        }
        .hotel-thumb-btn.is-active::after {
          content: '';
          position: absolute;
          inset: 0;
          border: 1.5px solid rgba(255, 255, 255, 0.85);
          border-radius: 7px;
          pointer-events: none;
        }
        .carousel-nav-btn {
          opacity: 0.88;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .carousel-nav-btn:hover {
          opacity: 1;
          transform: scale(1.12);
        }
        .backdrop-blur {
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
        .hover-scale {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .hover-scale:hover {
          transform: scale(1.05);
        }

        @media (max-width: 767px) {
          .floating-search-bar {
            margin-top: -20px;
            border-radius: 18px;
            padding: 14px !important;
            box-shadow: 0 10px 30px -10px rgba(15, 23, 42, 0.2), 0 0 0 1px rgba(226, 232, 240, 0.8) !important;
          }
        }
      `}</style>

      {/* ========================================================================= */}
      {/* 1. TOP LUXURY STICKY NAVBAR                                               */}
      {/* ========================================================================= */}
      <nav className="glass-navbar sticky-top py-2.5 px-3 px-md-4 text-white z-3 position-relative">
        <div className="reading-progress-bar" style={{ width: `${scrollProgress}%` }}></div>

        <div className="container-xl d-flex align-items-center justify-content-between">
          {/* Hotel Brand Logo & Monogram */}
          <div className="d-flex align-items-center gap-2.5 flex-shrink-0">
            {hotel.logo_url ? (
              <img
                src={hotel.logo_url}
                alt={hotel.name}
                className="rounded-3 bg-white p-1 border object-fit-contain shadow-sm flex-shrink-0"
                style={{ width: '44px', height: '44px' }}
              />
            ) : (
              <div
                className="rounded-3 d-flex align-items-center justify-content-center text-white fw-bold shadow-sm flex-shrink-0"
                style={{
                  width: '44px',
                  height: '44px',
                  backgroundColor: palette.primary,
                  background: `linear-gradient(135deg, ${palette.primary} 0%, #1e3a8a 100%)`
                }}
              >
                <Building size={24} />
              </div>
            )}
            <div style={{ minWidth: 0 }}>
              <div className="d-flex align-items-center gap-2 flex-nowrap">
                <span
                  className="fw-extrabold text-white text-truncate text-nowrap"
                  style={{ fontSize: '1.08rem', letterSpacing: '-0.02em', maxWidth: '210px' }}
                  title={hotel.name}
                >
                  {hotel.name}
                </span>
                <span className="badge gold-shimmer-badge extra-small rounded-pill px-2 py-0.5 d-none d-md-inline-flex align-items-center gap-1 flex-shrink-0 text-nowrap">
                  <Star size={10} className="fill-current" /> 4.9 LUXURY
                </span>
              </div>
              <div className="d-flex align-items-center gap-1.5 text-white-50 extra-small text-nowrap">
                <span>{hotel.city ? `📍 ${hotel.city}` : 'Premier Stay'}</span>
                {isMultiBranch && branches.length > 1 && (
                  <span className="badge bg-warning bg-opacity-20 text-warning border border-warning border-opacity-30 extra-small px-1.5 py-0 fw-bold text-nowrap">
                    🏢 {branches.length} Branches
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="d-none d-lg-flex align-items-center gap-1 gap-xl-2 gap-xxl-3 text-nowrap">
            <button
              type="button"
              onClick={() => scrollToSection('rooms-section')}
              className="catalogue-nav-item"
            >
              Suites &amp; Rooms
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('amenities-section')}
              className="catalogue-nav-item"
            >
              Facilities
            </button>
            {isMultiBranch && branches.length > 1 ? (
              <button
                type="button"
                onClick={() => scrollToSection('branches-section')}
                className="catalogue-nav-item text-warning fw-bold"
              >
                <Compass size={14} /> Our Branches ({branches.length})
              </button>
            ) : (
              <button
                type="button"
                onClick={() => scrollToSection('about-section')}
                className="catalogue-nav-item"
              >
                About Hotel
              </button>
            )}
            <button
              type="button"
              onClick={() => scrollToSection('location-section')}
              className="catalogue-nav-item"
            >
              Map &amp; Transit
            </button>
            {config.show_reviews !== false && (
              <button
                type="button"
                onClick={() => scrollToSection('reviews-section')}
                className="catalogue-nav-item"
              >
                Reviews
              </button>
            )}
            <button
              type="button"
              onClick={() => scrollToSection('faq-section')}
              className="catalogue-nav-item"
            >
              FAQ
            </button>
          </div>

          {/* Nav Actions & Multi-Branch Switcher */}
          <div className="d-flex align-items-center gap-1.5 gap-sm-2 flex-shrink-0">
            {/* Multi-Branch Dropdown Selector */}
            {isMultiBranch && branches.length > 1 && (
              <div className="dropdown position-relative flex-shrink-0">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-warning rounded-pill px-3 py-1.5 d-inline-flex align-items-center gap-1.5 extra-small fw-bold shadow-xs text-nowrap"
                  style={{ height: '38px' }}
                  onClick={() => setIsBranchDropdownOpen(!isBranchDropdownOpen)}
                >
                  <Compass size={14} className="text-warning flex-shrink-0" />
                  <span className="text-truncate text-nowrap" style={{ maxWidth: '110px' }}>
                    {hotel.city || 'Branches'}
                  </span>
                  <ChevronDown size={12} />
                </button>

                {isBranchDropdownOpen && (
                  <div className="position-absolute end-0 mt-2 p-2 bg-dark rounded-3 shadow-2xl border border-secondary z-3" style={{ minWidth: '260px', backgroundColor: '#090e1a' }}>
                    <div className="extra-small text-warning fw-bold px-2 py-1 text-uppercase border-bottom border-secondary mb-1 d-flex align-items-center gap-1">
                      <Building size={12} /> SELECT HOTEL BRANCH:
                    </div>
                    {branches.map(b => {
                      const isActive = String(b.code).toLowerCase() === String(hotel.code).toLowerCase();
                      return (
                        <button
                          key={b.id}
                          type="button"
                          className={`w-100 text-start p-2.5 rounded-2 extra-small fw-semibold d-flex align-items-center justify-content-between mb-1 transition-all ${
                            isActive ? 'bg-primary text-white shadow-xs' : 'bg-transparent text-light hover-bg-white-10'
                          }`}
                          onClick={() => handleBranchSwitch(b.code)}
                        >
                          <div>
                            <div className="fw-bold">{b.name}</div>
                            <div className="extra-small text-white-50">{b.city || 'Branch'} {b.min_price ? `• From ₹${b.min_price}` : ''}</div>
                          </div>
                          {isActive ? <Check size={16} className="text-warning" /> : <ArrowRight size={13} className="text-white-50" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {hotel.phone && (
              <a
                href={`tel:${hotel.phone}`}
                className="btn btn-sm catalogue-btn-call rounded-pill px-2.5 px-xl-3 py-1.5 d-none d-sm-inline-flex align-items-center gap-1.5 fw-semibold extra-small text-nowrap"
                title="Call Front Desk"
              >
                <Phone size={13} className="text-warning flex-shrink-0" />
                <span className="d-none d-xl-inline text-nowrap">Call Desk</span>
              </a>
            )}

            {hotel.whatsapp && (
              <a
                href={generateWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm catalogue-btn-whatsapp rounded-pill px-2.5 px-xl-3 py-1.5 text-white d-inline-flex align-items-center gap-1.5 fw-bold extra-small text-nowrap shadow-xs"
                title="Chat on WhatsApp"
              >
                <MessageSquare size={13} className="flex-shrink-0" />
                <span className="d-none d-md-inline text-nowrap">WhatsApp</span>
              </a>
            )}

            <button
              type="button"
              className="btn btn-sm catalogue-btn-reserve rounded-pill px-3 px-xl-3.5 py-1.5 text-white fw-bold extra-small text-nowrap shadow-sm d-none d-md-inline-flex align-items-center gap-1.5 animated-pulse-btn"
              style={{ background: `linear-gradient(135deg, ${palette.primary} 0%, #1e40af 100%)` }}
              onClick={() => handleOpenInquiry()}
            >
              <Calendar size={13} className="flex-shrink-0" />
              <span className="text-nowrap">Reserve Room</span>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              className="btn btn-sm catalogue-btn-call p-1.5 d-lg-none rounded-circle ms-1 d-inline-flex align-items-center justify-content-center flex-shrink-0"
              style={{ width: '38px', height: '38px' }}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle Navigation"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div
            className="d-lg-none mt-2.5 p-3 rounded-4 shadow-2xl border"
            style={{
              backgroundColor: 'rgba(9, 14, 28, 0.98)',
              backdropFilter: 'blur(24px)',
              borderColor: 'rgba(255, 255, 255, 0.12)',
              maxHeight: '82vh',
              overflowY: 'auto'
            }}
          >
            <div className="d-flex flex-column gap-1.5">
              {/* Primary Mobile Reserve Action */}
              <button
                type="button"
                className="btn w-100 rounded-pill py-2.5 text-white fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2 mb-2 animated-pulse-btn"
                style={{ background: `linear-gradient(135deg, ${palette.primary} 0%, #1e40af 100%)` }}
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleOpenInquiry();
                }}
              >
                <Calendar size={16} />
                <span>Reserve Room / Check Availability</span>
              </button>
              {isMultiBranch && branches.length > 1 && (
                <div className="mb-2 p-2.5 rounded-3 bg-dark border border-secondary border-opacity-50">
                  <span className="extra-small text-warning fw-bold d-block mb-1.5">🏢 HOTEL BRANCH NETWORK ({branches.length}):</span>
                  <div className="d-flex flex-wrap gap-1.5">
                    {branches.map(b => (
                      <button
                        key={b.id}
                        type="button"
                        className={`btn btn-xs rounded-pill px-3 py-1 extra-small fw-semibold ${
                          String(b.code).toLowerCase() === String(hotel.code).toLowerCase()
                            ? 'btn-primary text-white fw-bold'
                            : 'btn-outline-light text-white'
                        }`}
                        onClick={() => handleBranchSwitch(b.code)}
                      >
                        {b.name} ({b.city || 'Branch'})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="button"
                className="btn btn-sm text-start text-white py-2 px-3 rounded-3 hover-bg-white-10 d-flex align-items-center justify-content-between"
                onClick={() => scrollToSection('rooms-section')}
              >
                <div className="d-flex align-items-center gap-2">
                  <BedDouble size={16} className="text-warning" />
                  <span>Suites &amp; Room Showcase</span>
                </div>
                <ChevronRight size={14} className="text-white-50" />
              </button>

              <button
                type="button"
                className="btn btn-sm text-start text-white py-2 px-3 rounded-3 hover-bg-white-10 d-flex align-items-center justify-content-between"
                onClick={() => scrollToSection('amenities-section')}
              >
                <div className="d-flex align-items-center gap-2">
                  <Sparkles size={16} className="text-info" />
                  <span>Hotel Facilities &amp; Comforts</span>
                </div>
                <ChevronRight size={14} className="text-white-50" />
              </button>

              {isMultiBranch && branches.length > 1 ? (
                <button
                  type="button"
                  className="btn btn-sm text-start text-white py-2 px-3 rounded-3 hover-bg-white-10 d-flex align-items-center justify-content-between text-warning"
                  onClick={() => scrollToSection('branches-section')}
                >
                  <div className="d-flex align-items-center gap-2">
                    <Compass size={16} className="text-warning" />
                    <span>Our Hotel Branches ({branches.length})</span>
                  </div>
                  <ChevronRight size={14} className="text-white-50" />
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-sm text-start text-white py-2 px-3 rounded-3 hover-bg-white-10 d-flex align-items-center justify-content-between"
                  onClick={() => scrollToSection('about-section')}
                >
                  <div className="d-flex align-items-center gap-2">
                    <Info size={16} className="text-info" />
                    <span>About Our Hotel &amp; Heritage</span>
                  </div>
                  <ChevronRight size={14} className="text-white-50" />
                </button>
              )}

              <button
                type="button"
                className="btn btn-sm text-start text-white py-2 px-3 rounded-3 hover-bg-white-10 d-flex align-items-center justify-content-between"
                onClick={() => scrollToSection('location-section')}
              >
                <div className="d-flex align-items-center gap-2">
                  <MapPin size={16} className="text-danger" />
                  <span>Location &amp; Directions</span>
                </div>
                <ChevronRight size={14} className="text-white-50" />
              </button>

              {config.show_reviews !== false && (
                <button
                  type="button"
                  className="btn btn-sm text-start text-white py-2 px-3 rounded-3 hover-bg-white-10 d-flex align-items-center justify-content-between"
                  onClick={() => scrollToSection('reviews-section')}
                >
                  <div className="d-flex align-items-center gap-2">
                    <Star size={16} className="text-warning" />
                    <span>Verified Guest Reviews &amp; Ratings</span>
                  </div>
                  <ChevronRight size={14} className="text-white-50" />
                </button>
              )}

              <button
                type="button"
                className="btn btn-sm text-start text-white py-2 px-3 rounded-3 hover-bg-white-10 d-flex align-items-center justify-content-between"
                onClick={() => scrollToSection('faq-section')}
              >
                <div className="d-flex align-items-center gap-2">
                  <HelpCircle size={16} className="text-primary" />
                  <span>Frequently Asked Questions</span>
                </div>
                <ChevronRight size={14} className="text-white-50" />
              </button>

              <button
                type="button"
                className="btn btn-sm text-start text-white py-2 px-3 rounded-3 hover-bg-white-10 d-flex align-items-center justify-content-between"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsBrochureModalOpen(true);
                }}
              >
                <div className="d-flex align-items-center gap-2">
                  <Download size={16} className="text-success" />
                  <span>Download Hotel Catalogue (PDF)</span>
                </div>
                <ChevronRight size={14} className="text-white-50" />
              </button>

              {/* Quick Contact & Action strip at bottom of Mobile Drawer */}
              <div className="pt-2.5 mt-2 border-top border-secondary border-opacity-40 d-flex align-items-center gap-2">
                {hotel.phone && (
                  <a
                    href={`tel:${hotel.phone}`}
                    className="btn btn-sm btn-outline-light rounded-pill py-2 px-2.5 flex-grow-1 d-flex align-items-center justify-content-center gap-1.5 extra-small fw-semibold text-nowrap"
                  >
                    <Phone size={13} className="text-warning" />
                    <span>Call Desk</span>
                  </a>
                )}
                {hotel.whatsapp && (
                  <a
                    href={generateWhatsAppUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm rounded-pill py-2 px-2.5 flex-grow-1 text-white d-flex align-items-center justify-content-center gap-1.5 extra-small fw-bold text-nowrap"
                    style={{ backgroundColor: '#25D366' }}
                  >
                    <MessageSquare size={13} />
                    <span>WhatsApp</span>
                  </a>
                )}
                <button
                  type="button"
                  className="btn btn-sm rounded-pill py-2 px-3 text-white fw-bold extra-small flex-grow-1 d-flex align-items-center justify-content-center gap-1.5 text-nowrap"
                  style={{ backgroundColor: palette.primary }}
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleOpenInquiry();
                  }}
                >
                  <Calendar size={13} />
                  <span>Reserve</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ========================================================================= */}
      {/* 2. CINEMATIC LUXURY HERO SECTION                                          */}
      {/* ========================================================================= */}
      <header
        id="hero"
        className="position-relative text-white overflow-hidden d-flex align-items-center"
        style={{
          backgroundImage: `url('${heroBackground}')`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          minHeight: '620px',
          paddingTop: '3.5rem',
          paddingBottom: '8.5rem'
        }}
      >
        <div className="position-absolute inset-0 hero-overlay w-100 h-100 top-0 start-0"></div>
        <div className="hero-ambient-glow d-none d-md-block"></div>

        <div className="container-xl position-relative z-1">
          {/* Trust Badges Row */}
          <div className="d-flex align-items-center gap-2 gap-sm-2.5 mb-3 flex-wrap">
            <span className="badge bg-white text-dark rounded-pill px-3 py-1.5 fw-bold shadow-xs extra-small d-inline-flex align-items-center gap-1.5">
              <ShieldCheck size={14} className="text-success" />
              <span>Verified Hotel Property</span>
            </span>

            {config.show_reviews !== false && (
              <span className="badge gold-shimmer-badge rounded-pill px-3.5 py-1.5 fw-extrabold shadow-sm extra-small d-inline-flex align-items-center gap-1">
                <Star size={13} className="fill-current" />
                <span>{ratingSummary.overall_rating || 4.9} / 5.0 ({ratingSummary.total_reviews_text ? ratingSummary.total_reviews_text.replace(/Based on\s*/i, '') : '420+ Verified Reviews'})</span>
              </span>
            )}

            <span className="badge bg-dark-subtle text-light border border-secondary rounded-pill px-3 py-1.5 extra-small fw-semibold d-none d-md-inline-flex align-items-center gap-1">
              <Award size={13} className="text-warning" />
              <span>Best Rate Guarantee &bull; Direct Booking</span>
            </span>

            {isMultiBranch && branches.length > 1 && (
              <span className="badge bg-warning bg-opacity-25 text-warning border border-warning border-opacity-40 rounded-pill px-3 py-1.5 extra-small fw-bold d-inline-flex align-items-center gap-1">
                <Compass size={13} />
                <span>Multi-Branch Hotel Chain</span>
              </span>
            )}
          </div>

          {/* Main Hero Content Grid */}
          <div className="row align-items-center g-4 g-xl-5">
            <div className="col-12 col-lg-8">
              {/* Hotel Destination Eyebrow */}
              <div className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill hero-eyebrow-pill mb-2.5">
                <Sparkles size={13} className="text-warning flex-shrink-0" />
                <span className="extra-small fw-bold tracking-wider text-uppercase text-light">
                  {hotel.city ? `${hotel.city} • LUXURY DESTINATION` : 'EXCLUSIVE HOTEL RETREAT'}
                </span>
                <span className="badge bg-warning text-dark extra-small fw-extrabold rounded-pill px-2 py-0.5">
                  OFFICIAL
                </span>
              </div>

              {/* Strong, Bold, Creative, Responsive Hotel Name */}
              <h1 className="hero-hotel-title mb-2">
                {hotel.name}
              </h1>

              {/* Creative Gold Accent Line */}
              <div className="hero-gold-accent-line mb-3"></div>

              {/* Custom Headline (if configured and distinct from hotel name) */}
              {config.hero_headline && config.hero_headline.trim().toLowerCase() !== (hotel.name || '').trim().toLowerCase() ? (
                <h2 className="h4 text-warning fw-bold mb-2.5 tracking-tight d-flex align-items-center gap-2" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.6)' }}>
                  <span>{config.hero_headline}</span>
                </h2>
              ) : null}

              {/* Tagline */}
              <p className="lead text-white text-opacity-75 fw-normal mb-4" style={{ maxWidth: '640px', fontSize: '1.18rem', lineHeight: '1.65' }}>
                {config.hero_tagline || `Experience premier comfort, bespoke luxury accommodations, and heartfelt hospitality at ${hotel.name}.`}
              </p>

              {/* Address & Timings Chips */}
              <div className="d-flex align-items-center gap-2 gap-sm-2.5 flex-wrap text-white-50 small mb-4">
                <span className="d-inline-flex align-items-center gap-1.5 text-white bg-dark bg-opacity-70 px-3.5 py-1.5 rounded-pill border border-secondary shadow-xs extra-small">
                  <MapPin size={14} className="text-warning flex-shrink-0" />
                  <span className="text-truncate" style={{ maxWidth: '340px' }}>
                    {hotel.address || hotel.city || 'Central Hotel Location'}
                  </span>
                </span>

                <span className="d-inline-flex align-items-center gap-1.5 text-white-50 bg-dark bg-opacity-70 px-3.5 py-1.5 rounded-pill border border-secondary extra-small shadow-xs">
                  <Clock size={13} className="text-info flex-shrink-0" />
                  <span>Check-in: <strong className="text-white">{config.check_in_time || '12:00 PM'}</strong> &bull; Check-out: <strong className="text-white">{config.check_out_time || '11:00 AM'}</strong></span>
                </span>
              </div>

              {/* Hero Quick Action Buttons */}
              <div className="d-flex align-items-center gap-2.5 flex-wrap">
                <button
                  type="button"
                  className="btn btn-light text-dark fw-bold rounded-pill px-4 py-2.5 shadow-md d-inline-flex align-items-center gap-2 hover-translate-up"
                  onClick={() => scrollToSection('rooms-section')}
                >
                  <BedDouble size={18} style={{ color: palette.primary }} />
                  <span>Explore Suites &amp; Rates</span>
                </button>

                {hotel.whatsapp && (
                  <a
                    href={generateWhatsAppUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline-success text-white rounded-pill px-3.5 py-2.5 fw-bold shadow-sm d-inline-flex align-items-center gap-1.5"
                    style={{ backgroundColor: 'rgba(37, 211, 102, 0.15)', borderColor: '#25D366' }}
                  >
                    <MessageSquare size={16} className="text-success" />
                    <span>WhatsApp Desk</span>
                  </a>
                )}

                <button
                  type="button"
                  className="btn btn-outline-warning rounded-pill px-3.5 py-2.5 fw-bold shadow-sm d-inline-flex align-items-center gap-1.5"
                  onClick={() => setIsBrochureModalOpen(true)}
                  title="View & Download Official Hotel Catalogue (PDF)"
                >
                  <Download size={16} />
                  <span>Download Catalogue (PDF)</span>
                </button>

                <button
                  type="button"
                  className="btn btn-outline-light rounded-pill px-3 py-2.5 fw-semibold shadow-sm d-inline-flex align-items-center gap-1.5"
                  onClick={handleShare}
                  title="Share Hotel Link"
                >
                  <Share2 size={16} />
                  <span>{copiedLink ? 'Link Copied!' : 'Share Website'}</span>
                </button>
              </div>
            </div>

            {/* Right Column: Direct Booking Privileges Card (Desktop) */}
            <div className="col-12 col-lg-4 d-none d-lg-block">
              <div className="p-4 rounded-4 hero-card-privileges">
                <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2.5" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
                  <span className="extra-small fw-extrabold text-warning text-uppercase tracking-wider d-flex align-items-center gap-1.5">
                    <Award size={16} /> DIRECT BOOKING ADVANTAGE
                  </span>
                  <span className="badge bg-success bg-opacity-25 text-success border border-success border-opacity-30 extra-small rounded-pill px-2 py-0.5">
                    0% Commission
                  </span>
                </div>

                {minRoomPrice > 0 && (
                  <div className="mb-3 p-3 rounded-3" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="extra-small text-white-50">Direct Suites Starting From</div>
                    <div className="d-flex align-items-baseline gap-1 mt-0.5">
                      <span className="h3 fw-extrabold text-white m-0">{formatTariff(minRoomPrice)}</span>
                      <span className="extra-small text-white-50">/ night</span>
                    </div>
                  </div>
                )}

                <ul className="list-unstyled d-flex flex-column gap-2 mb-3.5 extra-small text-white-50">
                  <li className="d-flex align-items-center gap-2 text-white">
                    <CheckCircle2 size={15} className="text-warning flex-shrink-0" />
                    <span>Guaranteed lowest tariff direct from lodge</span>
                  </li>
                  <li className="d-flex align-items-center gap-2 text-white">
                    <CheckCircle2 size={15} className="text-warning flex-shrink-0" />
                    <span>Priority suite allocation &amp; clean guarantee</span>
                  </li>
                  <li className="d-flex align-items-center gap-2 text-white">
                    <CheckCircle2 size={15} className="text-warning flex-shrink-0" />
                    <span>Complimentary high-speed fiber Wi-Fi</span>
                  </li>
                  <li className="d-flex align-items-center gap-2 text-white">
                    <CheckCircle2 size={15} className="text-warning flex-shrink-0" />
                    <span>Instant WhatsApp reservation voucher</span>
                  </li>
                </ul>

                <button
                  type="button"
                  className="btn w-100 rounded-pill py-2.5 text-white fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2 animated-pulse-btn"
                  style={{ background: `linear-gradient(135deg, ${palette.primary} 0%, #1e40af 100%)` }}
                  onClick={() => handleOpenInquiry()}
                >
                  <Calendar size={15} />
                  <span>Reserve Suite Directly</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 3. FLOATING AVAILABILITY & LIVE TARIFF SEARCH BAR                         */}
      {/* ========================================================================= */}
      <div className="container-xl position-relative z-2">
        <div className="floating-search-bar p-3 p-sm-3.5 p-md-4">
          <div className="row g-2.5 g-md-3 align-items-end">
            {/* Check-In Date */}
            <div className="col-6 col-md-3">
              <label className="form-label extra-small fw-bold text-muted text-uppercase mb-1 d-flex align-items-center gap-1.5 text-nowrap">
                <Calendar size={13} className="flex-shrink-0" style={{ color: palette.primary }} />
                <span>Check-In</span>
              </label>
              <input
                type="date"
                min={getTodayDate()}
                className="form-control form-control-sm rounded-3 fw-bold text-dark border-secondary-subtle px-2"
                style={{ height: '38px', fontSize: '0.85rem' }}
                value={searchCheckIn}
                onChange={(e) => setSearchCheckIn(e.target.value)}
              />
            </div>

            {/* Check-Out Date */}
            <div className="col-6 col-md-3">
              <div className="d-flex align-items-center justify-content-between mb-1">
                <label className="form-label extra-small fw-bold text-muted text-uppercase m-0 d-flex align-items-center gap-1.5 text-nowrap">
                  <Calendar size={13} className="flex-shrink-0" style={{ color: palette.primary }} />
                  <span>Check-Out</span>
                </label>
                <span className="badge bg-primary bg-opacity-10 text-primary extra-small px-1.5 py-0.5 rounded-pill fw-bold">
                  {calculatedNights} {calculatedNights === 1 ? 'Night' : 'Nights'}
                </span>
              </div>
              <input
                type="date"
                min={searchCheckIn || getTodayDate()}
                className="form-control form-control-sm rounded-3 fw-bold text-dark border-secondary-subtle px-2"
                style={{ height: '38px', fontSize: '0.85rem' }}
                value={searchCheckOut}
                onChange={(e) => setSearchCheckOut(e.target.value)}
              />
            </div>

            {/* Guests Selector */}
            <div className="col-12 col-md-3">
              <label className="form-label extra-small fw-bold text-muted text-uppercase mb-1 d-flex align-items-center gap-1.5 text-nowrap">
                <Users size={13} className="flex-shrink-0" style={{ color: palette.primary }} />
                <span>Guests &amp; Occupancy</span>
              </label>
              <div className="row g-2">
                <div className="col-6">
                  <select
                    className="form-select form-select-sm rounded-3 fw-bold text-dark border-secondary-subtle"
                    style={{ height: '38px', fontSize: '0.85rem' }}
                    value={searchAdults}
                    onChange={(e) => setSearchAdults(parseInt(e.target.value))}
                    aria-label="Number of Adults"
                  >
                    <option value="1">1 Adult</option>
                    <option value="2">2 Adults</option>
                    <option value="3">3 Adults</option>
                    <option value="4">4+ Adults</option>
                  </select>
                </div>
                <div className="col-6">
                  <select
                    className="form-select form-select-sm rounded-3 fw-bold text-dark border-secondary-subtle"
                    style={{ height: '38px', fontSize: '0.85rem' }}
                    value={searchChildren}
                    onChange={(e) => setSearchChildren(parseInt(e.target.value))}
                    aria-label="Number of Children"
                  >
                    <option value="0">0 Children</option>
                    <option value="1">1 Child</option>
                    <option value="2">2 Children</option>
                    <option value="3">3+ Children</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Search Rates CTA Button */}
            <div className="col-12 col-md-3">
              <button
                type="button"
                className="btn w-100 rounded-3 text-white fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2 animated-pulse-btn"
                style={{ backgroundColor: palette.primary, height: '38px', fontSize: '0.88rem' }}
                onClick={() => scrollToSection('rooms-section')}
              >
                <Sparkles size={16} className="flex-shrink-0" />
                <span className="text-nowrap">Search Best Rates</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. VALUE PROPOSITION STRIP (WHY BOOK DIRECT)                              */}
      {/* ========================================================================= */}
      <section className="container-xl my-3 my-md-4">
        <div className="row g-2.5 g-sm-3 row-cols-1 row-cols-sm-2 row-cols-lg-4">
          <div className="col">
            <div className="p-3 bg-white rounded-4 border shadow-xs d-flex align-items-center gap-3 h-100 luxury-card-hover">
              <div className="p-2.5 rounded-3 bg-primary-subtle text-primary flex-shrink-0 d-flex align-items-center justify-content-center" style={{ width: '46px', height: '46px' }}>
                <Award size={22} />
              </div>
              <div className="overflow-hidden">
                <span className="fw-bold small text-dark d-block text-truncate mb-0.5">Best Direct Tariff</span>
                <span className="extra-small text-muted d-block" style={{ fontSize: '0.78rem', lineHeight: '1.35' }}>
                  Zero commission fees &bull; Lowest rate guaranteed
                </span>
              </div>
            </div>
          </div>

          <div className="col">
            <div className="p-3 bg-white rounded-4 border shadow-xs d-flex align-items-center gap-3 h-100 luxury-card-hover">
              <div className="p-2.5 rounded-3 bg-success-subtle text-success flex-shrink-0 d-flex align-items-center justify-content-center" style={{ width: '46px', height: '46px' }}>
                <CheckCircle2 size={22} />
              </div>
              <div className="overflow-hidden">
                <span className="fw-bold small text-dark d-block text-truncate mb-0.5">Instant Confirmation</span>
                <span className="extra-small text-muted d-block" style={{ fontSize: '0.78rem', lineHeight: '1.35' }}>
                  Direct desk reservation voucher &amp; WhatsApp slip
                </span>
              </div>
            </div>
          </div>

          <div className="col">
            <div className="p-3 bg-white rounded-4 border shadow-xs d-flex align-items-center gap-3 h-100 luxury-card-hover">
              <div className="p-2.5 rounded-3 bg-warning-subtle text-warning flex-shrink-0 d-flex align-items-center justify-content-center" style={{ width: '46px', height: '46px' }}>
                <Coffee size={22} />
              </div>
              <div className="overflow-hidden">
                <span className="fw-bold small text-dark d-block text-truncate mb-0.5">Free Wi-Fi &amp; Parking</span>
                <span className="extra-small text-muted d-block" style={{ fontSize: '0.78rem', lineHeight: '1.35' }}>
                  Complimentary fiber internet &amp; guarded parking
                </span>
              </div>
            </div>
          </div>

          <div className="col">
            <div className="p-3 bg-white rounded-4 border shadow-xs d-flex align-items-center gap-3 h-100 luxury-card-hover">
              <div className="p-2.5 rounded-3 bg-danger-subtle text-danger flex-shrink-0 d-flex align-items-center justify-content-center" style={{ width: '46px', height: '46px' }}>
                <ShieldCheck size={22} />
              </div>
              <div className="overflow-hidden">
                <span className="fw-bold small text-dark d-block text-truncate mb-0.5">24/7 Security &amp; Care</span>
                <span className="extra-small text-muted d-block" style={{ fontSize: '0.78rem', lineHeight: '1.35' }}>
                  CCTV coverage &amp; 24-hour active front desk
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. ACCOMMODATION & SUITES SHOWCASE SECTION                                */}
      {/* ========================================================================= */}
      <section id="rooms-section" className="container-xl my-5 pt-3">
        {/* Section Header */}
        <div className="d-flex flex-column flex-md-row align-items-md-end justify-content-between gap-3 mb-4">
          <div>
            <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill extra-small px-3 py-1 fw-bold">
              Signature Accommodations
            </span>
            <h2 className="h3 fw-extrabold text-dark mt-2 mb-1 tracking-tight">Luxury Suites &amp; Rooms</h2>
            <p className="text-muted small m-0">
              Each room is meticulously prepared with sanitized linens, private climate control, and modern amenities.
            </p>
          </div>

          {/* Room Category Filter Pills & Download CTA */}
          <div className="d-flex flex-column flex-sm-row align-items-stretch align-items-sm-center justify-content-between gap-2.5">
            {roomCategories.length > 1 && (
              <div className="d-flex align-items-center gap-1.5 overflow-x-auto pb-1 flex-nowrap" style={{ scrollbarWidth: 'none' }}>
                {roomCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`btn btn-sm rounded-pill px-3 py-1 extra-small fw-bold text-nowrap transition-all flex-shrink-0 ${
                      roomFilter === cat
                        ? 'btn-primary text-white shadow-xs'
                        : 'btn-light text-secondary border'
                    }`}
                    onClick={() => setRoomFilter(cat)}
                  >
                    {cat === 'ALL' ? 'All Suites' : cat}
                  </button>
                ))}
              </div>
            )}

            <button
              type="button"
              className="btn btn-sm btn-outline-dark rounded-pill px-3 py-1.5 extra-small fw-bold d-inline-flex align-items-center justify-content-center gap-1.5 shadow-2xs text-nowrap flex-shrink-0"
              onClick={() => setIsBrochureModalOpen(true)}
              title="Download Hotel Catalogue & Direct Tariffs PDF"
            >
              <Download size={13} className="text-warning flex-shrink-0" />
              <span>Download Catalogue (PDF)</span>
            </button>
          </div>
        </div>

        {/* ROOM CARDS GRID */}
        {filteredRooms.length === 0 ? (
          <div className="card border-0 rounded-4 shadow-sm p-5 text-center bg-white">
            <BedDouble size={48} className="text-muted mx-auto mb-3" />
            <h5 className="fw-bold text-dark">No Rooms Matching Your Filter</h5>
            <p className="text-muted small mb-3">Please choose another category or contact our desk directly for custom requests.</p>
            <button className="btn btn-outline-primary rounded-pill px-4 py-1.5 mx-auto small fw-bold" onClick={() => setRoomFilter('ALL')}>
              Show All Accommodations
            </button>
          </div>
        ) : (
          <div className="row g-4">
            {filteredRooms.map((room, index) => {
              const photos = room.photos && room.photos.length > 0
                ? room.photos
                : [{ image: FALLBACK_ROOM_PHOTOS[index % FALLBACK_ROOM_PHOTOS.length], caption: room.name }];
              
              const currentPhotoIndex = roomPhotoIndices[room.id] || 0;
              const activePhotoUrl = photos[currentPhotoIndex]?.image || room.primary_photo || photos[0]?.image;

              const amenitiesList = room.amenities
                ? room.amenities.split(',').map(a => a.trim()).filter(Boolean)
                : ['Air Conditioning', 'High-Speed Wi-Fi', 'Smart TV', 'Hot Water 24/7', 'Room Service', 'Ensuite Bath'];

              const strikeThroughPrice = Math.round(parseFloat(room.base_price || 1500) * 1.25);
              const roomBadge = room.catalogue_badge || DEFAULT_ROOM_BADGES[index % DEFAULT_ROOM_BADGES.length];

              return (
                <div key={room.id} className="col-lg-6">
                  <div className="card h-100 border-0 rounded-4 shadow-sm bg-white overflow-hidden luxury-card-hover d-flex flex-column justify-content-between">
                    <div>
                      {/* Photo Gallery Header with Carousel Navigation */}
                      <div className="position-relative bg-dark overflow-hidden" style={{ height: '280px' }}>
                        <img
                          src={activePhotoUrl}
                          alt={room.name}
                          className="w-100 h-100 object-fit-cover room-photo-zoom"
                          style={{ cursor: 'pointer' }}
                          onClick={() => openLightbox(photos, currentPhotoIndex, room.name)}
                        />

                        {/* Top Strip Promotional & Discount Badges */}
                        <div className="position-absolute top-0 start-0 end-0 p-2.5 p-sm-3 d-flex align-items-center justify-content-between gap-2 z-1 pointer-events-none">
                          <span className="badge gold-shimmer-badge px-2.5 py-1 rounded-pill shadow-sm extra-small text-truncate pointer-events-auto" style={{ maxWidth: '60%' }}>
                            {roomBadge}
                          </span>
                          <span className="badge discount-ribbon-badge px-2.5 py-1 rounded-pill extra-small d-inline-flex align-items-center gap-1 flex-shrink-0 pointer-events-auto">
                            <Flame size={12} className="text-warning fill-current" />
                            <span>SAVE 25%</span>
                          </span>
                        </div>

                        {/* Carousel Prev/Next Overlay Arrows */}
                        {photos.length > 1 && (
                          <div className="position-absolute top-50 start-0 end-0 px-2.5 d-flex align-items-center justify-content-between translate-middle-y z-1 pointer-events-none">
                            <button
                              type="button"
                              className="btn btn-sm btn-dark bg-opacity-70 text-white rounded-circle p-1.5 pointer-events-auto border-0 shadow-sm"
                              onClick={(e) => handlePrevRoomPhoto(room.id, photos.length, e)}
                              title="Previous Photo"
                            >
                              <ChevronLeft size={18} />
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-dark bg-opacity-70 text-white rounded-circle p-1.5 pointer-events-auto border-0 shadow-sm"
                              onClick={(e) => handleNextRoomPhoto(room.id, photos.length, e)}
                              title="Next Photo"
                            >
                              <ChevronRight size={18} />
                            </button>
                          </div>
                        )}

                        {/* Photos count pill */}
                        <button
                          type="button"
                          className="btn btn-sm btn-dark bg-opacity-75 text-white position-absolute bottom-0 end-0 m-3 rounded-pill extra-small px-3 py-1 d-flex align-items-center gap-1.5 border-0 shadow-sm z-1"
                          onClick={() => openLightbox(photos, currentPhotoIndex, room.name)}
                        >
                          <Eye size={13} />
                          <span>{photos.length} Photo{photos.length > 1 ? 's' : ''}</span>
                        </button>
                      </div>

                      {/* Photo Thumbnail Strip */}
                      {photos.length > 1 && (
                        <div className="d-flex align-items-center gap-2 px-3 pt-2 pb-1 overflow-auto photo-thumbnail-strip bg-light border-bottom">
                          {photos.map((p, pIdx) => (
                            <img
                              key={pIdx}
                              src={p.image}
                              alt={`Thumbnail ${pIdx + 1}`}
                              className={`rounded-2 object-fit-cover cursor-pointer border ${
                                currentPhotoIndex === pIdx ? 'border-primary ring-2' : 'border-light'
                              }`}
                              style={{ width: '52px', height: '38px', cursor: 'pointer' }}
                              onClick={(e) => handleSelectRoomPhoto(room.id, pIdx, e)}
                            />
                          ))}
                        </div>
                      )}

                      {/* Room Card Body */}
                      <div className="p-3 p-sm-4">
                        {/* Title & Pricing Header */}
                        <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
                          <div>
                            <h3 className="h5 fw-bold text-dark m-0">{room.name}</h3>
                            <div className="d-flex align-items-center gap-1.5 mt-1.5 flex-wrap">
                              <span className="badge bg-primary-subtle text-primary border border-primary-subtle extra-small px-2.5 py-0.5 fw-bold">
                                👥 Max {room.max_adults} Adult{room.max_adults > 1 ? 's' : ''}
                              </span>
                              {room.max_children > 0 && (
                                <span className="badge bg-info-subtle text-info-emphasis border border-info-subtle extra-small px-2.5 py-0.5 fw-bold">
                                  👶 {room.max_children} Child{room.max_children > 1 ? 'ren' : ''}
                                </span>
                              )}
                              <span className="badge bg-success-subtle text-success border border-success-subtle extra-small px-2.5 py-0.5 fw-bold d-inline-flex align-items-center gap-1">
                                <CheckCircle2 size={11} /> Instant Confirmation
                              </span>
                            </div>
                          </div>

                          <div className="text-end flex-shrink-0">
                            <span className="text-decoration-line-through text-muted extra-small d-block">
                              {formatTariff(strikeThroughPrice)}
                            </span>
                            <div className="d-flex align-items-baseline justify-content-end gap-1 text-nowrap">
                              <span className="h4 fw-extrabold text-primary m-0" style={{ color: palette.primary }}>
                                {formatTariff(room.base_price)}
                              </span>
                              <span className="extra-small text-muted">/ nt</span>
                            </div>
                            <span className="badge bg-success-subtle text-success extra-small mt-0.5">
                              Save {formatTariff(strikeThroughPrice - parseFloat(room.base_price || 0))}
                            </span>
                          </div>
                        </div>

                        {/* Room Description */}
                        {room.description && (
                          <p className="text-muted small mb-3" style={{ lineHeight: '1.6' }}>
                            {room.description}
                          </p>
                        )}

                        {/* Room Feature Highlights */}
                        <div className="row g-2 mb-3 py-2.5 border-top border-bottom bg-light rounded-3 px-1 my-2">
                          <div className="col-6 col-sm-3">
                            <div className="d-flex align-items-center gap-1.5 extra-small text-dark fw-semibold">
                              <BedDouble size={14} className="text-primary flex-shrink-0" />
                              <span>King Bed</span>
                            </div>
                          </div>
                          <div className="col-6 col-sm-3">
                            <div className="d-flex align-items-center gap-1.5 extra-small text-dark fw-semibold">
                              <Maximize2 size={14} className="text-primary flex-shrink-0" />
                              <span>350 sq.ft</span>
                            </div>
                          </div>
                          <div className="col-6 col-sm-3">
                            <div className="d-flex align-items-center gap-1.5 extra-small text-dark fw-semibold">
                              <Bath size={14} className="text-primary flex-shrink-0" />
                              <span>En-Suite Bath</span>
                            </div>
                          </div>
                          <div className="col-6 col-sm-3">
                            <div className="d-flex align-items-center gap-1.5 extra-small text-dark fw-semibold">
                              <Tv size={14} className="text-primary flex-shrink-0" />
                              <span>Smart TV</span>
                            </div>
                          </div>
                        </div>

                        {/* Room Amenities Chips */}
                        {amenitiesList.length > 0 && (
                          <div className="mb-2">
                            <div className="d-flex align-items-center gap-1.5 flex-wrap">
                              {amenitiesList.slice(0, 6).map((amenity, aIdx) => (
                                <span key={aIdx} className="badge bg-white text-dark border extra-small px-2.5 py-1 shadow-2xs fw-semibold">
                                  ✓ {amenity}
                                </span>
                              ))}
                              {amenitiesList.length > 6 && (
                                <span className="badge bg-secondary-subtle text-secondary extra-small px-2 py-1">
                                  +{amenitiesList.length - 6} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Room Card Action Bar */}
                    <div className="p-3 p-sm-3 px-3 px-sm-4 bg-light border-top d-flex flex-column flex-sm-row align-items-stretch align-items-sm-center justify-content-between gap-2">
                      <a
                        href={generateWhatsAppUrl(room)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-outline-success fw-bold rounded-3 px-3.5 py-2 d-flex align-items-center justify-content-center gap-1.5 extra-small w-100 w-sm-auto"
                      >
                        <MessageSquare size={15} />
                        <span>Chat on WhatsApp</span>
                      </a>

                      <button
                        type="button"
                        className="btn btn-sm text-white fw-bold rounded-3 px-4 py-2 shadow-xs d-flex align-items-center justify-content-center gap-1.5 extra-small animated-pulse-btn w-100 w-sm-auto"
                        style={{ backgroundColor: palette.primary }}
                        onClick={() => handleOpenInquiry(room)}
                      >
                        <Calendar size={15} />
                        <span>Reserve This Suite</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 6. OUR SISTER DESTINATIONS & HOTEL BRANCHES SECTION                       */}
      {/* ========================================================================= */}
      {isMultiBranch && branches.length > 1 && (
        <section id="branches-section" className="container-xl my-5 pt-3">
          <div className="bg-white rounded-4 shadow-sm border p-4 p-md-5">
            <div className="text-center max-w-xl mx-auto mb-4">
              <span className="badge bg-warning bg-opacity-20 text-warning border border-warning border-opacity-30 rounded-pill extra-small px-3 py-1 fw-bold">
                Hotel Network &amp; Locations
              </span>
              <h2 className="h3 fw-extrabold text-dark mt-2 mb-1 tracking-tight">Our Sister Properties &amp; Branches</h2>
              <p className="text-muted small">
                Explore our hospitality portfolio across key destinations, each offering signature comfort and verified direct tariffs.
              </p>
            </div>

            <div className="row g-4">
              {branches.map((b) => {
                const isCurrent = String(b.code).toLowerCase() === String(hotel.code).toLowerCase();
                return (
                  <div key={b.id} className="col-md-6 col-lg-4">
                    <div className={`card h-100 rounded-4 border p-4 d-flex flex-column justify-content-between luxury-card-hover ${
                      isCurrent ? 'border-primary shadow-md bg-primary-subtle bg-opacity-30' : 'bg-white shadow-xs'
                    }`}>
                      <div>
                        <div className="d-flex align-items-start justify-content-between mb-2">
                          <span className={`badge extra-small rounded-pill px-3 py-1 fw-bold ${
                            isCurrent ? 'bg-primary text-white shadow-xs' : 'bg-light text-secondary border'
                          }`}>
                            {isCurrent ? '● Active Selection' : 'Sister Branch'}
                          </span>
                          <span className="extra-small text-muted fw-semibold">
                            {b.city ? `📍 ${b.city}` : 'Branch Location'}
                          </span>
                        </div>

                        <h4 className="h6 fw-bold text-dark mb-1">{b.name}</h4>
                        <p className="text-muted extra-small mb-3" style={{ minHeight: '38px', lineHeight: '1.5' }}>
                          {b.address || `Premier hospitality destination in ${b.city || 'our hotel network'}.`}
                        </p>

                        {b.min_price && (
                          <div className="d-flex align-items-baseline gap-1 mb-2">
                            <span className="extra-small text-muted">Tariffs from:</span>
                            <strong className="text-primary small">{formatTariff(b.min_price)}/nt</strong>
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-top d-flex align-items-center justify-content-between">
                        {isCurrent ? (
                          <span className="text-success extra-small fw-bold d-flex align-items-center gap-1">
                            <CheckCircle2 size={16} /> Currently Viewing
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary rounded-pill px-3 py-1.5 extra-small fw-bold d-flex align-items-center gap-1.5"
                            onClick={() => handleBranchSwitch(b.code)}
                          >
                            <span>Switch to this Branch</span>
                            <ArrowRight size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 6.5. ABOUT OUR PROPERTY & SIGNATURE HOSPITALITY WITH HOTEL GALLERY        */}
      {/* ========================================================================= */}
      <section id="about-section" className="container-xl my-5 pt-3">
        <div className="bg-white rounded-4 shadow-sm border p-3.5 p-sm-4 p-md-5">
          <div className="row g-4 align-items-center">
            <div className="col-lg-6">
              <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill extra-small px-3 py-1 fw-bold">
                About Our Property
              </span>
              <h2 className="h3 fw-extrabold text-dark mt-2 mb-3 tracking-tight">
                {config.about_title || 'Our Heritage & Signature Hospitality'}
              </h2>
              <p className="text-secondary small mb-3" style={{ lineHeight: '1.7' }}>
                {config.about_text || `${hotel.name} welcomes you to an oasis of tranquility and modern comfort. Thoughtfully appointed with contemporary aesthetics and traditional warmth, we cater to discerning business travelers, families, and vacationers.`}
              </p>

              {/* Dynamic Stats Badges */}
              {statsList.length > 0 && (
                <div className="row g-2.5 g-sm-3 pt-2">
                  {statsList.map((st, sIdx) => (
                    <div key={sIdx} className="col-6">
                      <div className="p-2.5 p-sm-3 bg-light rounded-3 border h-100">
                        <strong className="d-block h5 fw-extrabold text-primary mb-0">{st.value}</strong>
                        <span className="extra-small text-muted d-block">{st.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Dynamic Direct Booking Privileges */}
              {directPrivileges.length > 0 && (
                <div className="d-flex flex-wrap gap-1.5 pt-3">
                  {directPrivileges.map((priv, pIdx) => (
                    <span key={pIdx} className="badge bg-light text-dark border extra-small py-1 px-2.5 fw-semibold d-inline-flex align-items-center gap-1">
                      <CheckCircle2 size={12} className="text-success" /> {priv}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="col-lg-6">
              <div className="hotel-carousel-card rounded-4 overflow-hidden shadow-lg border position-relative bg-dark">
                {/* Main Slide Viewport (Touch and Hover isolated to main viewport) */}
                <div 
                  className="position-relative overflow-hidden cursor-pointer"
                  style={{ height: 'clamp(240px, 42vw, 340px)' }}
                  onMouseEnter={() => setIsHoveringSlide(true)}
                  onMouseLeave={() => setIsHoveringSlide(false)}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                  onClick={() => openLightbox(hotelGalleryPhotos, hotelSlideIndex, hotel.name)}
                  title="Click to Zoom In & Explore Fullscreen"
                >
                  {/* Hardware-Accelerated Horizontal Sliding Track */}
                  <div 
                    className="hotel-slider-track"
                    style={{ 
                      transform: `translateX(-${hotelSlideIndex * 100}%)`,
                      transition: 'transform 0.48s cubic-bezier(0.25, 1, 0.5, 1)'
                    }}
                  >
                    {hotelGalleryPhotos.map((photo, pIdx) => (
                      <div key={pIdx} className="hotel-slide-item">
                        <img
                          src={photo.image}
                          alt={photo.caption || hotel.name}
                          className="w-100 h-100 object-fit-cover select-none"
                          draggable={false}
                          loading={pIdx <= 2 ? 'eager' : 'lazy'}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Top Control Bar: Counter, Auto-Play status & Zoom In Button */}
                  <div className="position-absolute top-0 start-0 end-0 p-2.5 p-sm-3 d-flex align-items-center justify-content-between z-2 pointer-events-none">
                    <div className="d-flex align-items-center gap-1.5 pointer-events-auto">
                      <span className="badge bg-dark bg-opacity-75 text-white backdrop-blur border border-white border-opacity-25 rounded-pill px-2.5 py-1 extra-small fw-semibold shadow-xs">
                        {hotelSlideIndex + 1} / {hotelGalleryPhotos.length}
                      </span>
                      <button
                        type="button"
                        className="btn btn-sm btn-dark bg-opacity-75 text-white backdrop-blur border border-white border-opacity-25 rounded-circle p-1 d-flex align-items-center justify-content-center shadow-xs"
                        style={{ width: '26px', height: '26px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsAutoSlidePlaying(prev => !prev);
                        }}
                        title={isAutoSlidePlaying ? "Pause Auto-Slide" : "Resume Auto-Slide"}
                      >
                        {isAutoSlidePlaying ? <Pause size={12} /> : <Play size={12} />}
                      </button>
                    </div>

                    {/* Zoom In Action Button */}
                    <button
                      type="button"
                      className="btn btn-sm btn-light bg-white bg-opacity-90 text-dark rounded-pill px-2.5 py-1 extra-small fw-bold d-flex align-items-center gap-1.5 shadow-sm pointer-events-auto hover-scale"
                      onClick={(e) => {
                        e.stopPropagation();
                        openLightbox(hotelGalleryPhotos, hotelSlideIndex, hotel.name);
                      }}
                      title="Zoom In & Fullscreen"
                    >
                      <ZoomIn size={13} className="text-primary" />
                      <span>Zoom In</span>
                    </button>
                  </div>

                  {/* Manual Navigation Arrows (< and >) */}
                  {hotelGalleryPhotos.length > 1 && (
                    <div className="position-absolute top-50 start-0 end-0 px-2.5 d-flex align-items-center justify-content-between translate-middle-y z-2 pointer-events-none">
                      <button
                        type="button"
                        className="btn btn-sm btn-dark bg-opacity-75 text-white rounded-circle p-2 pointer-events-auto border border-white border-opacity-20 shadow-md backdrop-blur carousel-nav-btn"
                        onClick={handlePrevHotelSlide}
                        title="Previous Photo"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-dark bg-opacity-75 text-white rounded-circle p-2 pointer-events-auto border border-white border-opacity-20 shadow-md backdrop-blur carousel-nav-btn"
                        onClick={handleNextHotelSlide}
                        title="Next Photo"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  )}

                  {/* Bottom Caption & Gradient Overlay */}
                  <div 
                    className="position-absolute bottom-0 start-0 end-0 p-3 pt-4 text-white z-1" 
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)' }}
                  >
                    <div className="d-flex align-items-end justify-content-between gap-2">
                      <div className="text-truncate" style={{ maxWidth: '82%' }}>
                        <div className="fw-bold small text-white text-truncate">
                          {hotelGalleryPhotos[hotelSlideIndex]?.caption || hotel.name}
                        </div>
                        <div className="extra-small text-white-50 text-truncate">
                          {hotel.name} &bull; {hotel.city || 'Exclusive Lodge Experience'}
                        </div>
                      </div>
                      {isAutoSlidePlaying && (
                        <div className="d-none d-sm-flex align-items-center gap-1 extra-small text-white-50 flex-shrink-0">
                          <span className="spinner-grow spinner-grow-sm text-primary" style={{ width: '8px', height: '8px' }} role="status"></span>
                          <span>Auto</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Preview Thumbnail Strip ("including preview") */}
                <div className="bg-white p-2.5 border-top">
                  <div className="d-flex align-items-center justify-content-between mb-1.5 px-1">
                    <span className="extra-small fw-bold text-dark text-uppercase tracking-wider">
                      Photo Previews ({hotelGalleryPhotos.length})
                    </span>
                    <span className="extra-small text-muted">
                      Click or hover to preview
                    </span>
                  </div>
                  <div 
                    ref={hotelThumbnailsRef}
                    className="d-flex align-items-center gap-2 overflow-x-auto pb-1 flex-nowrap"
                    style={{ 
                      position: 'relative',
                      scrollbarWidth: 'none', 
                      WebkitOverflowScrolling: 'touch' 
                    }}
                  >
                    {hotelGalleryPhotos.map((photo, pIdx) => {
                      const isActive = pIdx === hotelSlideIndex;
                      return (
                        <button
                          key={pIdx}
                          type="button"
                          className={`hotel-thumb-btn ${isActive ? 'is-active' : ''}`}
                          onMouseEnter={() => {
                            setIsHoveringSlide(true);
                            setHotelSlideIndex(pIdx);
                          }}
                          onMouseLeave={() => {
                            setIsHoveringSlide(false);
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setHotelSlideIndex(pIdx);
                          }}
                          title={`Preview: ${photo.caption || `Photo ${pIdx + 1}`}`}
                        >
                          <img
                            src={photo.image}
                            alt={photo.caption || `Thumbnail ${pIdx + 1}`}
                            className="w-100 h-100 object-fit-cover"
                            loading="lazy"
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. SIGNATURE HOTEL FACILITIES SECTION                                     */}
      {/* ========================================================================= */}
      {enabledFacilities.length > 0 && (
        <section id="amenities-section" className="container-xl my-5 pt-3">
          <div className="bg-white rounded-4 shadow-sm border p-4 p-md-5">
            <div className="text-center max-w-xl mx-auto mb-4">
              <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill extra-small px-3 py-1 fw-bold">
                Guest Comforts &amp; Services
              </span>
              <h2 className="h3 fw-extrabold text-dark mt-2 mb-1 tracking-tight">Signature Hotel Facilities</h2>
              <p className="text-muted small">
                Every amenity is designed to make your stay effortless, comfortable, and memorable.
              </p>
            </div>

            <div className="row g-3 row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4">
              {enabledFacilities.map((fac, idx) => (
                <div key={fac.key || idx} className="col">
                  <div className="p-3.5 rounded-3 bg-light border h-100 d-flex align-items-start gap-3 luxury-card-hover">
                    <div className="p-2.5 rounded-3 bg-white shadow-2xs flex-shrink-0">
                      {renderFacilityIcon(fac.icon, palette.primary)}
                    </div>
                    <div>
                      <span className="fw-bold small text-dark d-block mb-1">{fac.label}</span>
                      <span className="extra-small text-muted" style={{ lineHeight: '1.4' }}>
                        {fac.desc || 'Premium guest service provided around the clock.'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 8. VERIFIED GUEST REVIEWS & RATINGS SECTION                               */}
      {/* ========================================================================= */}
      {config.show_reviews !== false && (
        <section id="reviews-section" className="container-xl my-5 pt-3">
          <div className="bg-white rounded-4 shadow-sm border p-4 p-md-5 mb-4">
            <div className="row g-4 align-items-center">
              <div className="col-lg-4 text-center text-lg-start border-end-lg">
                <span className="badge gold-shimmer-badge rounded-pill extra-small px-3 py-1 fw-bold mb-2">
                  Verified Guest Ratings
                </span>
                <div className="display-3 fw-extrabold text-dark tracking-tight">
                  {ratingSummary.overall_rating || 4.9}
                </div>
                <div className="d-flex align-items-center justify-content-center justify-content-lg-start gap-1 my-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={20} className="fill-current text-warning" />
                  ))}
                </div>
                <p className="text-muted small m-0">
                  {ratingSummary.total_reviews_text || 'Based on authentic verified guest stay experiences'}
                </p>
              </div>

              <div className="col-lg-8">
                <div className="space-y-3">
                  {(ratingSummary.categories || DEFAULT_RATING_SUMMARY.categories).map((cat, cIdx) => (
                    <div key={cIdx} className={cIdx < (ratingSummary.categories || []).length - 1 ? 'mb-2' : ''}>
                      <div className="d-flex justify-content-between extra-small fw-bold mb-1">
                        <span>{cat.label}</span>
                        <span className="text-primary">{cat.score} / 5.0</span>
                      </div>
                      <div className="progress" style={{ height: '6px' }}>
                        <div
                          className={`progress-bar bg-${cat.color || 'primary'}`}
                          style={{ width: `${cat.progress || Math.min(100, Math.round((cat.score / 5) * 100))}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Review Testimonial Cards */}
          <div className="row g-3">
            {reviewsList.map((rev, rIdx) => {
              const initials = (rev.guest_name || 'Guest')
                .split(' ')
                .map(n => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();
              const badgeColors = ['bg-success-subtle text-success', 'bg-primary-subtle text-primary', 'bg-warning-subtle text-warning', 'bg-info-subtle text-info'];
              const badgeColor = badgeColors[rIdx % badgeColors.length];

              return (
                <div key={rev.id || rIdx} className="col-md-4">
                  <div className="card h-100 border-0 rounded-4 shadow-sm bg-white p-4 d-flex flex-column justify-content-between luxury-card-hover">
                    <div>
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <div className="d-flex align-items-center gap-1 text-warning">
                          {[...Array(Number(rev.rating) || 5)].map((_, i) => (
                            <Star key={i} size={14} className="fill-current text-warning" />
                          ))}
                        </div>
                        <span className={`badge ${badgeColor} extra-small`}>
                          {rev.stay_type || 'Verified Stay'}
                        </span>
                      </div>
                      <p className="text-secondary small mb-3" style={{ fontStyle: 'italic', lineHeight: '1.6' }}>
                        "{rev.review_text}"
                      </p>
                    </div>
                    <div className="d-flex align-items-center gap-2.5 pt-2 border-top">
                      <div
                        className="rounded-circle bg-primary-subtle text-primary fw-bold d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{ width: '36px', height: '36px', fontSize: '0.85rem' }}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <span className="fw-bold text-dark small d-block text-truncate">{rev.guest_name}</span>
                        <span className="extra-small text-muted text-truncate d-block">{rev.stay_date || 'Verified Booking'} &bull; Direct Guest</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 9. LOCATION, TRANSIT & GOOGLE MAPS SECTION                                */}
      {/* ========================================================================= */}
      <section id="location-section" className="container-xl my-4 my-md-5 pt-2 pt-md-3">
        <div className="card border-0 rounded-4 shadow-sm bg-white p-3.5 p-sm-4 p-md-5 overflow-hidden">
          <div className="row g-4 align-items-center">
            <div className="col-lg-5">
              <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill extra-small px-3 py-1 fw-bold">
                Neighborhood &amp; Connectivity
              </span>
              <h2 className="h3 fw-extrabold text-dark mt-2 mb-2 tracking-tight">Prime Central Location</h2>
              <p className="text-muted small mb-3">
                Easily accessible via major arterial roads, transit hubs, and commercial centers.
              </p>

              {/* Address Card */}
              <div className="p-3 bg-light rounded-3 border mb-3">
                <div className="d-flex align-items-start gap-2.5">
                  <div className="p-2 rounded-circle bg-white text-primary shadow-2xs flex-shrink-0 mt-0.5">
                    <MapPin size={16} />
                  </div>
                  <div className="min-w-0 flex-grow-1">
                    <span className="fw-bold small text-dark d-block text-truncate">
                      {hotel.address || hotel.name || 'Central Hotel Location'}
                    </span>
                    {[hotel.city, hotel.state, hotel.pincode].filter(Boolean).length > 0 ? (
                      <span className="extra-small text-muted d-block text-truncate">
                        {[hotel.city, hotel.state, hotel.pincode].filter(Boolean).join(', ')}
                      </span>
                    ) : (
                      <span className="extra-small text-muted d-block">Prime City Center Location</span>
                    )}
                  </div>
                </div>
                {config.landmark && (
                  <div className="extra-small text-muted ps-4 pt-1.5 border-top mt-2">
                    <strong>Prominent Landmark:</strong> {config.landmark}
                  </div>
                )}
              </div>

              {/* Transit Distances */}
              <div className="mb-3.5">
                <span className="extra-small fw-bold text-muted text-uppercase d-block mb-2 tracking-wider">
                  Estimated Travel Distances:
                </span>
                <div className="d-flex flex-column gap-2">
                  {nearbyPlaces.map((pl, pIdx) => {
                    const getIcon = (ic) => {
                      switch (ic) {
                        case 'train': return '🚆';
                        case 'bus': return '🚌';
                        case 'plane': return '✈️';
                        case 'monument': return '🏛️';
                        case 'car': return '🚖';
                        default: return '📍';
                      }
                    };
                    return (
                      <div key={pl.id || pIdx} className="d-flex align-items-center justify-content-between p-2.5 px-3 rounded-3 bg-light extra-small">
                        <div className="d-flex align-items-center gap-2 min-w-0">
                          <span className="flex-shrink-0" style={{ fontSize: '1.05rem' }}>{getIcon(pl.icon)}</span>
                          <span className="fw-medium text-dark text-truncate">{pl.name}</span>
                        </div>
                        <div className="d-flex align-items-center gap-1.5 flex-shrink-0 ms-2">
                          <span className="badge bg-white text-dark border extra-small px-2 py-1 fw-bold shadow-2xs">
                            {pl.distance}
                          </span>
                          {pl.duration && (
                            <span className="text-muted extra-small d-none d-sm-inline">({pl.duration})</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Google Maps Directions Action Button */}
              {config.google_maps_directions_url ? (
                <a
                  href={config.google_maps_directions_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary fw-bold rounded-pill px-4 py-2.5 d-flex align-items-center justify-content-center gap-2 shadow-sm small w-100 w-sm-auto"
                  style={{ backgroundColor: palette.primary }}
                >
                  <Navigation size={16} />
                  <span>Get Directions in Google Maps</span>
                  <ExternalLink size={13} />
                </a>
              ) : (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${hotel.name} ${hotel.address || ''} ${hotel.city || ''}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary fw-bold rounded-pill px-4 py-2.5 d-flex align-items-center justify-content-center gap-2 shadow-sm small w-100 w-sm-auto"
                  style={{ backgroundColor: palette.primary }}
                >
                  <Navigation size={16} />
                  <span>Open in Google Maps App</span>
                  <ExternalLink size={13} />
                </a>
              )}
            </div>

            {/* Embedded Google Map */}
            <div className="col-lg-7">
              <div 
                className="rounded-4 overflow-hidden border shadow-sm position-relative" 
                style={{ height: 'clamp(260px, 48vw, 380px)', backgroundColor: '#e2e8f0' }}
              >
                <iframe
                  title="Hotel Location Map"
                  src={
                    config.google_maps_embed_url ||
                    `https://maps.google.com/maps?q=${encodeURIComponent(`${hotel.name}, ${hotel.address || ''} ${hotel.city || ''}`)}&t=&z=15&ie=UTF8&iwloc=&output=embed`
                  }
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. POLICIES, HOUSE RULES & CHECK-IN GUIDELINES                           */}
      {/* ========================================================================= */}
      <section id="policies-section" className="container-xl my-5 pt-3">
        <div className="row g-4">
          <div className="col-md-6">
            <div className="card h-100 border-0 rounded-4 shadow-sm bg-white p-4">
              <div className="d-flex align-items-center gap-2 mb-3">
                <Clock size={20} className="text-primary" />
                <h4 className="h6 fw-bold text-dark m-0">Timings &amp; Cancellation Policy</h4>
              </div>

              <div className="row g-2 mb-3">
                <div className="col-6">
                  <div className="p-3 bg-light rounded-3 border text-center">
                    <span className="extra-small text-muted d-block">STANDARD CHECK-IN</span>
                    <strong className="h6 fw-bold text-dark m-0">{config.check_in_time || '12:00 PM'}</strong>
                  </div>
                </div>
                <div className="col-6">
                  <div className="p-3 bg-light rounded-3 border text-center">
                    <span className="extra-small text-muted d-block">STANDARD CHECK-OUT</span>
                    <strong className="h6 fw-bold text-dark m-0">{config.check_out_time || '11:00 AM'}</strong>
                  </div>
                </div>
              </div>

              <p className="text-muted small m-0" style={{ lineHeight: '1.6' }}>
                {config.cancellation_policy || 'Free cancellation up to 24 hours prior to check-in. Cancellations after that are subject to one night’s room charge.'}
              </p>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card h-100 border-0 rounded-4 shadow-sm bg-white p-4">
              <div className="d-flex align-items-center gap-2 mb-3">
                <ShieldCheck size={20} className="text-success" />
                <h4 className="h6 fw-bold text-dark m-0">Guest ID Requirements &amp; House Rules</h4>
              </div>

              <div className="p-3 bg-light rounded-3 border mb-3">
                <span className="extra-small fw-bold text-dark d-block mb-1">Mandatory Photo ID proof:</span>
                <span className="extra-small text-muted">
                  All adult guests must present Aadhaar, Passport, Voter ID, or Driving License.
                </span>
              </div>

              <p className="text-muted small m-0" style={{ lineHeight: '1.6' }}>
                {config.house_rules || 'Couples and families are warmly welcomed. Unregistered visitors are not permitted in guest suites after 10:00 PM.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 11. NEXT-LEVEL ANIMATED FAQ ACCORDION                                      */}
      {/* ========================================================================= */}
      <section id="faq-section" className="container-xl my-5 pt-3">
        <div className="card border-0 rounded-4 shadow-sm bg-white p-4 p-md-5">
          {/* Header Banner */}
          <div className="text-center max-w-2xl mx-auto mb-4">
            <span
              className="badge rounded-pill extra-small px-3.5 py-1.5 fw-bold d-inline-flex align-items-center gap-1.5 mb-2"
              style={{ background: palette.primaryLight, color: palette.primary, border: `1px solid ${palette.primaryBorder}` }}
            >
              <HelpCircle size={13} />
              <span>Guest Assistance & Stay Guide</span>
            </span>
            <h2 className="h3 fw-extrabold text-dark mt-1 mb-2 tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-muted small mb-0" style={{ lineHeight: '1.6' }}>
              Everything you need to know about check-in policies, high-speed fiber Wi-Fi, 24/7 dining, power backup, and guaranteed direct reservation privileges.
            </p>
          </div>

          {/* Interactive Search Bar */}
          <div className="max-w-xl mx-auto mb-4">
            <div className="input-group shadow-sm rounded-pill overflow-hidden border bg-white p-1">
              <span className="input-group-text bg-transparent border-0 text-muted ps-3">
                <Search size={18} />
              </span>
              <input
                type="text"
                className="form-control border-0 bg-transparent shadow-none small ps-1"
                placeholder="Search questions (e.g. check-in, Wi-Fi, food, cancellation)..."
                value={faqSearchQuery}
                onChange={(e) => {
                  setFaqSearchQuery(e.target.value);
                  setExpandedFaqIndex(null);
                }}
              />
              {faqSearchQuery && (
                <button
                  type="button"
                  className="btn btn-link text-muted pe-3 text-decoration-none"
                  onClick={() => setFaqSearchQuery('')}
                  title="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="d-flex align-items-center justify-content-center flex-wrap gap-2 mb-4 pb-1">
            {faqCategories.map((cat) => {
              const isActive = faqCategory === cat.key;
              const count = cat.key === 'all'
                ? faqsList.length
                : faqsList.filter((f) => f.category === cat.key).length;
              return (
                <button
                  key={cat.key}
                  type="button"
                  className={`faq-filter-pill ${isActive ? 'is-active' : ''}`}
                  onClick={() => {
                    setFaqCategory(cat.key);
                    const firstMatch = cat.key === 'all'
                      ? faqsList[0]?.id
                      : faqsList.find((f) => f.category === cat.key)?.id;
                    setExpandedFaqIndex(firstMatch);
                  }}
                >
                  <span>{cat.label}</span>
                  <span
                    className={`badge ms-2 rounded-pill ${
                      isActive ? 'bg-white text-primary' : 'bg-light text-secondary'
                    }`}
                    style={{ fontSize: '0.72rem', padding: '3px 7px' }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Filtered FAQs List */}
          {(() => {
            const filteredFaqs = faqsList.filter((faq) => {
              const matchesCategory = faqCategory === 'all' || faq.category === faqCategory;
              const query = faqSearchQuery.trim().toLowerCase();
              if (!query) return matchesCategory;
              const matchesText =
                faq.q.toLowerCase().includes(query) ||
                faq.a.toLowerCase().includes(query) ||
                (faq.highlights && faq.highlights.some((h) => h.toLowerCase().includes(query)));
              return matchesCategory && matchesText;
            });

            return (
              <div className="max-w-3xl mx-auto">
                {filteredFaqs.length === 0 ? (
                  <div className="text-center py-5 px-3 bg-light rounded-4 border">
                    <HelpCircle size={44} className="text-muted mb-2 opacity-50" />
                    <h6 className="fw-bold text-dark mb-1">No questions found matching "{faqSearchQuery}"</h6>
                    <p className="text-muted small mb-3">
                      Try searching with a different keyword or choose another category above.
                    </p>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary rounded-pill px-3 py-1.5 fw-bold extra-small"
                      onClick={() => {
                        setFaqSearchQuery('');
                        setFaqCategory('all');
                      }}
                    >
                      Reset All Filters
                    </button>
                  </div>
                ) : (
                  <div>
                    {filteredFaqs.map((faq, fIdx) => {
                      const isOpen = expandedFaqIndex === faq.id || (expandedFaqIndex === 0 && fIdx === 0);
                      return (
                        <div
                          key={faq.id || fIdx}
                          className={`faq-item-card mb-3 ${isOpen ? 'is-expanded' : ''}`}
                        >
                          <button
                            type="button"
                            className="faq-header-trigger"
                            onClick={() => setExpandedFaqIndex(isOpen ? null : faq.id)}
                            aria-expanded={isOpen}
                          >
                            <div className="d-flex align-items-center gap-3">
                              <div className="faq-icon-pill">
                                {renderFaqIcon(faq.icon)}
                              </div>
                              <div className="fw-bold text-dark text-start" style={{ fontSize: '0.98rem', letterSpacing: '-0.01em', lineHeight: '1.4' }}>
                                {faq.q}
                              </div>
                            </div>
                            <div className="faq-chevron-badge">
                              <ChevronDown size={18} />
                            </div>
                          </button>

                          {/* 60fps CSS Grid Smooth Auto-Height Transition */}
                          <div className="faq-animated-collapse">
                            <div className="faq-animated-content">
                              <div className="faq-body-inner">
                                <p className="mb-2 text-secondary" style={{ lineHeight: '1.75' }}>
                                  {faq.a}
                                </p>
                                {faq.highlights && faq.highlights.length > 0 && (
                                  <div className="d-flex flex-wrap gap-1 mt-2.5 pt-2 border-top border-light-subtle">
                                    {faq.highlights.map((highlight, hIdx) => (
                                      <span key={hIdx} className="faq-highlight-chip">
                                        <Check size={12} className="text-success flex-shrink-0" />
                                        <span>{highlight}</span>
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Luxury 24/7 Concierge Support Callout */}
                <div className="faq-concierge-card p-3.5 p-sm-4 p-md-4 mt-4 mt-md-5">
                  <div className="row g-3 align-items-center justify-content-between">
                    {/* Left: Icon + Question Title + Subtitle */}
                    <div className="col-12 col-md-7 col-lg-7">
                      <div className="d-flex align-items-center gap-3">
                        <div
                          className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                          style={{
                            width: '50px',
                            height: '50px',
                            background: 'rgba(255, 255, 255, 0.12)',
                            border: '1.5px solid rgba(255, 255, 255, 0.22)',
                            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)'
                          }}
                        >
                          <Headphones size={24} className="text-warning" />
                        </div>
                        <div>
                          <h5 className="fw-bold text-white mb-1" style={{ fontSize: '1.08rem', letterSpacing: '-0.01em' }}>
                            Still have questions about your stay?
                          </h5>
                          <p className="text-white-50 extra-small mb-0" style={{ lineHeight: '1.55' }}>
                            Our front desk team is on standby 24/7 to assist with room upgrades, customized check-ins, and direct reservations.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Right: Call Reception & Reserve Room Buttons */}
                    <div className="col-12 col-md-5 col-lg-5">
                      <div className="d-flex align-items-center justify-content-start justify-content-md-end gap-2 flex-wrap flex-sm-nowrap">
                        {hotel.phone && (
                          <a
                            href={`tel:${hotel.phone}`}
                            className="btn btn-sm btn-light rounded-pill px-3 py-2 fw-bold extra-small d-inline-flex align-items-center justify-content-center gap-1.5 shadow-sm text-decoration-none text-dark text-nowrap flex-grow-1 flex-md-grow-0"
                          >
                            <Phone size={13} className="text-primary flex-shrink-0" />
                            <span>Call Front Desk</span>
                          </a>
                        )}
                        <button
                          type="button"
                          className="btn btn-sm btn-warning rounded-pill px-3.5 py-2 fw-extrabold extra-small d-inline-flex align-items-center justify-content-center gap-1.5 shadow text-dark text-nowrap flex-grow-1 flex-md-grow-0"
                          onClick={() => {
                            setSelectedRoomForInquiry(null);
                            setIsInquiryModalOpen(true);
                          }}
                        >
                          <Sparkles size={13} className="flex-shrink-0" />
                          <span>Reserve a Room</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 12. LUXURY FOOTER                                                         */}
      {/* ========================================================================= */}
      <footer className="text-white py-5 mt-5" style={{ backgroundColor: '#060a14', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="container-xl">
          <div className="row g-4 justify-content-between">
            <div className="col-lg-4">
              <div className="d-flex align-items-center gap-2 mb-3">
                <Building size={28} className="text-warning" />
                <h5 className="fw-extrabold text-white m-0">{hotel.name}</h5>
              </div>
              <p className="text-white-50 small mb-3" style={{ lineHeight: '1.6' }}>
                {config.hero_tagline || 'Experience personalized luxury, verified best direct tariffs, and gracious hospitality.'}
              </p>
              <div className="d-flex align-items-center gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-warning rounded-pill px-3 py-1 extra-small fw-bold"
                  onClick={() => setIsBrochureModalOpen(true)}
                >
                  <Download size={13} className="me-1" />
                  <span>Download Catalogue (PDF)</span>
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-light rounded-pill px-3 py-1 extra-small fw-semibold"
                  onClick={handleShare}
                >
                  <Share2 size={13} className="me-1" />
                  <span>{copiedLink ? 'Copied' : 'Share'}</span>
                </button>
              </div>
            </div>

            <div className="col-6 col-lg-2">
              <h6 className="fw-bold text-white mb-3 extra-small text-uppercase tracking-wider">Quick Navigation</h6>
              <ul className="list-unstyled space-y-2 extra-small text-white-50">
                <li><button type="button" onClick={() => scrollToSection('rooms-section')} className="btn btn-link text-white-50 text-decoration-none p-0">Suites &amp; Tariffs</button></li>
                <li><button type="button" onClick={() => scrollToSection('amenities-section')} className="btn btn-link text-white-50 text-decoration-none p-0">Hotel Facilities</button></li>
                {isMultiBranch && branches.length > 1 && (
                  <li><button type="button" onClick={() => scrollToSection('branches-section')} className="btn btn-link text-warning text-decoration-none p-0">Our Branches</button></li>
                )}
                <li><button type="button" onClick={() => scrollToSection('location-section')} className="btn btn-link text-white-50 text-decoration-none p-0">Maps &amp; Transit</button></li>
                {config.show_reviews !== false && (
                  <li><button type="button" onClick={() => scrollToSection('reviews-section')} className="btn btn-link text-white-50 text-decoration-none p-0">Guest Reviews</button></li>
                )}
                <li><button type="button" onClick={() => scrollToSection('faq-section')} className="btn btn-link text-white-50 text-decoration-none p-0">FAQ</button></li>
              </ul>
            </div>

            <div className="col-6 col-lg-3">
              <h6 className="fw-bold text-white mb-3 extra-small text-uppercase tracking-wider">Direct Contacts</h6>
              <ul className="list-unstyled space-y-2 extra-small text-white-50">
                {hotel.phone && (
                  <li className="d-flex align-items-center gap-2">
                    <Phone size={14} className="text-warning" />
                    <a href={`tel:${hotel.phone}`} className="text-white-50 text-decoration-none">{hotel.phone}</a>
                  </li>
                )}
                {hotel.whatsapp && (
                  <li className="d-flex align-items-center gap-2">
                    <MessageSquare size={14} className="text-success" />
                    <a href={generateWhatsAppUrl()} target="_blank" rel="noopener noreferrer" className="text-white-50 text-decoration-none">{hotel.whatsapp} (WhatsApp)</a>
                  </li>
                )}
                {hotel.email && (
                  <li className="d-flex align-items-center gap-2">
                    <Mail size={14} className="text-info" />
                    <a href={`mailto:${hotel.email}`} className="text-white-50 text-decoration-none">{hotel.email}</a>
                  </li>
                )}
                <li className="d-flex align-items-start gap-2 mt-2">
                  <MapPin size={14} className="text-danger mt-0.5 flex-shrink-0" />
                  <span>{hotel.address || hotel.city || 'Central Location'}</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-4 mt-4 border-top border-secondary border-opacity-25 d-flex flex-column flex-sm-row align-items-center justify-content-between gap-2 extra-small text-white-50">
            <span>&copy; {new Date().getFullYear()} {hotel.name}. All Rights Reserved.</span>
            <span>Digital Showcase Powered by InnVetrix &bull; Stay Ahead. Beyond Expectations.</span>
          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* 13. FLOATING ACTIONS DOCK: TRANSPARENT WHATSAPP & ICON-ONLY RESERVE       */}
      {/* ========================================================================= */}
      <div className="floating-actions-dock" aria-label="Quick Actions">
        {/* Scroll To Top Button (stacks cleanly above actions when scrolled) */}
        {showScrollToTop && (
          <button
            type="button"
            className="floating-scroll-top border-0"
            onClick={scrollToTop}
            title="Scroll to Top"
            aria-label="Scroll to Top"
          >
            <ChevronUp size={20} />
          </button>
        )}

        {/* Reserve Room Button - ICON ONLY (no text) */}
        <button
          type="button"
          className="floating-reserve-icon-btn border-0"
          style={{ background: `linear-gradient(135deg, ${palette.primary} 0%, #0f172a 100%)` }}
          onClick={() => handleOpenInquiry()}
          title="Reserve Room / Check Availability"
          aria-label="Reserve Room / Check Availability"
        >
          <Calendar size={22} />
          <span className="floating-btn-pulse-dot" />
        </button>

        {/* Transparent Frosted Glass WhatsApp Button */}
        {hotel.whatsapp && (
          <a
            href={generateWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="floating-whatsapp-transparent-btn text-decoration-none"
            title="Chat with Reception on WhatsApp"
            aria-label="Chat on WhatsApp"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm.01 1.67c4.54 0 8.24 3.7 8.24 8.24 0 2.2-.86 4.27-2.42 5.82a8.188 8.188 0 0 1-5.82 2.42c-1.48 0-2.93-.39-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.204 8.204 0 0 1-1.25-4.38c0-4.54 3.7-8.24 8.24-8.24zm4.52 11.64c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.84-.86 2.05s.88 2.38 1 2.55c.12.17 1.73 2.64 4.2 3.7.59.25 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.11-.22-.18-.47-.3z"/>
            </svg>
          </a>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 15. DIRECT BOOKING & INQUIRY LEAD MODAL                                   */}
      {/* ========================================================================= */}
      {isInquiryModalOpen && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(8, 13, 26, 0.85)', zIndex: 1100 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-2xl overflow-hidden bg-white">
              <div className="modal-header bg-light py-3 px-4 border-bottom d-flex align-items-center justify-content-between">
                <div>
                  <h5 className="modal-title fw-bold text-dark m-0">Direct Room Reservation</h5>
                  <span className="text-muted extra-small">{hotel.name} &bull; Best Rate Guarantee</span>
                </div>
                <button type="button" className="btn-close" onClick={() => setIsInquiryModalOpen(false)}></button>
              </div>

              <div className="modal-body p-4">
                {inquirySuccess ? (
                  <div className="text-center py-4">
                    <div className="p-3 rounded-circle bg-success-subtle text-success d-inline-flex mb-3 shadow-xs">
                      <CheckCircle2 size={48} />
                    </div>
                    <h5 className="fw-bold text-dark mb-1">Reservation Request Sent!</h5>
                    <p className="text-muted small mb-3">
                      Your inquiry reference is <strong>#INQ-{lastInquiryId}</strong>. Our front desk staff will contact you promptly at <strong>{inquiryForm.guest_mobile}</strong>.
                    </p>

                    <div className="d-flex align-items-center justify-content-center gap-2 flex-wrap">
                      <a
                        href={generateWhatsAppUrl(selectedRoomForInquiry)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-success fw-bold rounded-pill px-4 py-2 d-inline-flex align-items-center gap-2 shadow-xs"
                      >
                        <MessageSquare size={16} />
                        <span>Confirm on WhatsApp</span>
                      </a>
                      <button
                        type="button"
                        className="btn btn-outline-secondary rounded-pill px-4 py-2 small"
                        onClick={() => setIsInquiryModalOpen(false)}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleInquirySubmit}>
                    {selectedRoomForInquiry && (
                      <div className="p-3 rounded-3 bg-primary-subtle text-primary mb-3 d-flex align-items-center justify-content-between small border border-primary-subtle">
                        <span>Selected Suite: <strong>{selectedRoomForInquiry.name}</strong></span>
                        <strong className="h6 m-0">{formatTariff(selectedRoomForInquiry.base_price)}/nt</strong>
                      </div>
                    )}

                    <div className="mb-3">
                      <label className="form-label extra-small fw-bold text-dark">Full Guest Name *</label>
                      <input
                        type="text"
                        required
                        className="form-control form-control-sm rounded-3"
                        placeholder="e.g. Rameshwar Patil"
                        value={inquiryForm.guest_name}
                        onChange={(e) => setInquiryForm({ ...inquiryForm, guest_name: e.target.value })}
                      />
                    </div>

                    <div className="row g-2 mb-3">
                      <div className="col-6">
                        <label className="form-label extra-small fw-bold text-dark">Mobile Number *</label>
                        <input
                          type="tel"
                          required
                          className="form-control form-control-sm rounded-3"
                          placeholder="10-digit Mobile"
                          value={inquiryForm.guest_mobile}
                          onChange={(e) => setInquiryForm({ ...inquiryForm, guest_mobile: e.target.value })}
                        />
                      </div>
                      <div className="col-6">
                        <label className="form-label extra-small fw-bold text-dark">Email (Optional)</label>
                        <input
                          type="email"
                          className="form-control form-control-sm rounded-3"
                          placeholder="guest@domain.com"
                          value={inquiryForm.guest_email}
                          onChange={(e) => setInquiryForm({ ...inquiryForm, guest_email: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="row g-2 mb-3">
                      <div className="col-6">
                        <label className="form-label extra-small fw-bold text-dark">Check-in Date</label>
                        <input
                          type="date"
                          min={getTodayDate()}
                          className="form-control form-control-sm rounded-3"
                          value={inquiryForm.check_in_date}
                          onChange={(e) => setInquiryForm({ ...inquiryForm, check_in_date: e.target.value })}
                        />
                      </div>
                      <div className="col-6">
                        <label className="form-label extra-small fw-bold text-dark">Check-out Date</label>
                        <input
                          type="date"
                          min={inquiryForm.check_in_date || getTodayDate()}
                          className="form-control form-control-sm rounded-3"
                          value={inquiryForm.check_out_date}
                          onChange={(e) => setInquiryForm({ ...inquiryForm, check_out_date: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="row g-2 mb-3">
                      <div className="col-6">
                        <label className="form-label extra-small fw-bold text-dark">Adults</label>
                        <select
                          className="form-select form-select-sm rounded-3"
                          value={inquiryForm.adults}
                          onChange={(e) => setInquiryForm({ ...inquiryForm, adults: parseInt(e.target.value) })}
                        >
                          <option value="1">1 Adult</option>
                          <option value="2">2 Adults</option>
                          <option value="3">3 Adults</option>
                          <option value="4">4+ Adults</option>
                        </select>
                      </div>
                      <div className="col-6">
                        <label className="form-label extra-small fw-bold text-dark">Children</label>
                        <select
                          className="form-select form-select-sm rounded-3"
                          value={inquiryForm.children}
                          onChange={(e) => setInquiryForm({ ...inquiryForm, children: parseInt(e.target.value) })}
                        >
                          <option value="0">0 Children</option>
                          <option value="1">1 Child</option>
                          <option value="2">2 Children</option>
                          <option value="3">3+ Children</option>
                        </select>
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label extra-small fw-bold text-dark">Special Requests / Preferences</label>
                      <textarea
                        rows="2"
                        className="form-control form-control-sm rounded-3"
                        placeholder="e.g. Quiet room, upper floor, late check-in..."
                        value={inquiryForm.message}
                        onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })}
                      ></textarea>
                    </div>

                    <div className="d-flex justify-content-end gap-2 pt-2 border-top">
                      <button
                        type="button"
                        className="btn btn-sm btn-light border rounded-pill px-3.5"
                        onClick={() => setIsInquiryModalOpen(false)}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={inquiryMutation.isPending}
                        className="btn btn-sm text-white fw-bold rounded-pill px-4 shadow-sm"
                        style={{ backgroundColor: palette.primary }}
                      >
                        {inquiryMutation.isPending ? 'Sending Request...' : 'Confirm & Send Request'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 16. DIGITAL BROCHURE & OFFICIAL CATALOGUE MODAL                           */}
      {/* ========================================================================= */}
      {isBrochureModalOpen && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: 'rgba(8, 13, 26, 0.88)', zIndex: 1150 }}
          onClick={() => setIsBrochureModalOpen(false)}
        >
          <div
            className="modal-dialog modal-dialog-centered modal-xl modal-dialog-scrollable"
            onClick={(e) => e.stopPropagation()}
            style={{ maxHeight: '92vh' }}
          >
            <div className="modal-content border-0 rounded-4 shadow-2xl overflow-hidden bg-white">
              {/* Modal Header */}
              <div className="modal-header bg-dark text-white py-3 px-3 px-md-4 d-flex align-items-center justify-content-between border-0">
                <div className="d-flex align-items-center gap-2.5">
                  <div className="p-2 bg-warning bg-opacity-20 text-warning rounded-circle flex-shrink-0">
                    <Download size={18} />
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold m-0 text-white text-truncate" style={{ maxWidth: '340px' }}>
                      Official Hotel Digital Catalogue
                    </h5>
                    <div className="extra-small text-white-50">Direct Tariff Sheet &amp; Comprehensive Suite Guide</div>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <button
                    type="button"
                    disabled={isDownloadingPdf}
                    className="btn btn-sm btn-success rounded-pill px-3 py-1.5 extra-small fw-bold d-none d-sm-inline-flex align-items-center gap-1.5 shadow-sm"
                    onClick={handleDownloadCataloguePDF}
                    title="Download Official PDF file"
                  >
                    {isDownloadingPdf ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" style={{ width: '12px', height: '12px' }}></span>
                        <span>Generating PDF...</span>
                      </>
                    ) : (
                      <>
                        <Download size={14} />
                        <span>Download PDF</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    className="btn btn-sm btn-outline-light rounded-pill px-3 py-1.5 extra-small fw-semibold d-none d-md-inline-flex align-items-center gap-1.5"
                    onClick={handlePrintCatalogueA4}
                    title="Print or Save A4 Preview"
                  >
                    <Printer size={14} />
                    <span>Print A4</span>
                  </button>

                  <button
                    type="button"
                    className="btn-close btn-close-white ms-1"
                    onClick={() => setIsBrochureModalOpen(false)}
                    aria-label="Close"
                  ></button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="modal-body p-3 p-md-4 bg-light" style={{ overflowY: 'auto' }}>
                {/* 1. Hotel Brand & Factsheet Card */}
                <div className="bg-white rounded-4 p-3 p-md-4 border shadow-xs mb-3">
                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 pb-3 border-bottom mb-3">
                    <div>
                      <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                        <span className="badge gold-shimmer-badge extra-small rounded-pill px-2.5 py-1">⭐ 4.9 LUXURY RATING</span>
                        <span className="badge bg-success-subtle text-success extra-small rounded-pill px-2.5 py-1">✓ VERIFIED DIRECT CATALOGUE</span>
                        <span className="badge bg-primary-subtle text-primary extra-small rounded-pill px-2.5 py-1">0% COMMISSION</span>
                      </div>
                      <h2 className="h4 fw-extrabold text-dark m-0">{hotel.name}</h2>
                      <div className="text-muted extra-small mt-1 d-flex align-items-center gap-1">
                        <MapPin size={12} className="text-warning flex-shrink-0" />
                        <span>{hotel.address || hotel.city || 'Central Hotel Location'}</span>
                      </div>
                    </div>

                    <div className="d-flex flex-row flex-md-column align-items-md-end gap-1">
                      <span className="extra-small text-muted">Direct Booking Privileges</span>
                      <span className="fw-bold extra-small text-success">Best Guaranteed Direct Tariffs</span>
                      <span className="extra-small text-secondary">Updated {new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </div>

                  {/* Contact & Location Details Grid */}
                  <div className="row g-2.5">
                    {/* Phone / Front Desk */}
                    <div className="col-12 col-sm-6 col-lg-3">
                      <div className="p-2.5 rounded-3 bg-light border h-100 d-flex align-items-start gap-2">
                        <div className="p-2 bg-primary-subtle text-primary rounded-2 flex-shrink-0">
                          <Phone size={15} />
                        </div>
                        <div className="overflow-hidden">
                          <div className="extra-small fw-bold text-dark text-uppercase">Front Desk / Phone</div>
                          {hotel.phone ? (
                            <a href={`tel:${hotel.phone}`} className="small text-primary text-decoration-none fw-semibold text-truncate d-block">
                              {hotel.phone}
                            </a>
                          ) : (
                            <span className="small text-muted">24/7 Active Desk</span>
                          )}
                          <div className="extra-small text-muted">Available 24 Hours</div>
                        </div>
                      </div>
                    </div>

                    {/* WhatsApp Desk */}
                    <div className="col-12 col-sm-6 col-lg-3">
                      <div className="p-2.5 rounded-3 bg-light border h-100 d-flex align-items-start gap-2">
                        <div className="p-2 bg-success-subtle text-success rounded-2 flex-shrink-0">
                          <MessageSquare size={15} />
                        </div>
                        <div className="overflow-hidden">
                          <div className="extra-small fw-bold text-dark text-uppercase">WhatsApp Concierge</div>
                          {hotel.whatsapp ? (
                            <a
                              href={generateWhatsAppUrl()}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="small text-success text-decoration-none fw-semibold text-truncate d-block"
                            >
                              {hotel.whatsapp}
                            </a>
                          ) : (
                            <span className="small text-muted">Instant Chat Desk</span>
                          )}
                          <div className="extra-small text-muted">Instant Booking Voucher</div>
                        </div>
                      </div>
                    </div>

                    {/* Check-In / Out Timings */}
                    <div className="col-12 col-sm-6 col-lg-3">
                      <div className="p-2.5 rounded-3 bg-light border h-100 d-flex align-items-start gap-2">
                        <div className="p-2 bg-warning-subtle text-warning rounded-2 flex-shrink-0">
                          <Clock size={15} />
                        </div>
                        <div>
                          <div className="extra-small fw-bold text-dark text-uppercase">Check-in / Check-out</div>
                          <div className="small fw-semibold text-dark">
                            In: {config.check_in_time || '12:00 PM'}
                          </div>
                          <div className="extra-small text-muted">
                            Out: {config.check_out_time || '11:00 AM'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Email / Govt ID Rules */}
                    <div className="col-12 col-sm-6 col-lg-3">
                      <div className="p-2.5 rounded-3 bg-light border h-100 d-flex align-items-start gap-2">
                        <div className="p-2 bg-info-subtle text-info rounded-2 flex-shrink-0">
                          <ShieldCheck size={15} />
                        </div>
                        <div className="overflow-hidden">
                          <div className="extra-small fw-bold text-dark text-uppercase">ID &amp; Inquiries</div>
                          {hotel.email ? (
                            <a href={`mailto:${hotel.email}`} className="small text-info text-decoration-none fw-semibold text-truncate d-block">
                              {hotel.email}
                            </a>
                          ) : (
                            <span className="small text-dark fw-semibold">Mandatory Govt ID</span>
                          )}
                          <div className="extra-small text-muted">Aadhaar / Passport / DL</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Signature Amenities & Facilities */}
                <div className="bg-white rounded-4 p-3 p-md-4 border shadow-xs mb-3">
                  <h6 className="fw-bold text-dark extra-small text-uppercase mb-2.5 d-flex align-items-center gap-1.5">
                    <Sparkles size={14} className="text-warning" />
                    <span>Signature Property Comforts &amp; Amenities:</span>
                  </h6>
                  <div className="d-flex flex-wrap gap-1.5">
                    {enabledFacilities.map((f, i) => (
                      <span key={i} className="badge bg-light text-dark border extra-small px-2.5 py-1.5 rounded-2 d-inline-flex align-items-center gap-1">
                        <Check size={12} className="text-success" />
                        <span>{f.label}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* 3. Category-Wise Suites Showcase */}
                <div className="mb-3">
                  <div className="d-flex align-items-center justify-content-between mb-2 px-1">
                    <h5 className="fw-extrabold text-dark m-0 d-flex align-items-center gap-2">
                      <BedDouble size={20} className="text-primary" />
                      <span>Accommodations &amp; Suites (Category-Wise)</span>
                    </h5>
                    <span className="badge bg-primary text-white extra-small rounded-pill px-2.5 py-1">
                      {roomTypes.length} Total Suites Available
                    </span>
                  </div>

                  {Object.entries(brochureCategoriesMap).map(([catTitle, rooms]) => (
                    <div key={catTitle} className="bg-white rounded-4 border shadow-xs mb-3 overflow-hidden">
                      {/* Category Header */}
                      <div
                        className="py-2.5 px-3 px-md-4 text-white d-flex align-items-center justify-content-between"
                        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)' }}
                      >
                        <div className="d-flex align-items-center gap-2">
                          <span className="text-warning fw-bold">❖</span>
                          <span className="fw-bold small text-uppercase tracking-wider">{catTitle}</span>
                        </div>
                        <span className="badge bg-white bg-opacity-20 text-white extra-small rounded-pill px-2.5 py-0.5">
                          {rooms.length} Suite Option{rooms.length > 1 ? 's' : ''}
                        </span>
                      </div>

                      {/* Rooms in this Category */}
                      <div className="p-3">
                        <div className="row g-3">
                          {rooms.map((room, rIdx) => {
                            const photoUrl = (room.photos && room.photos.length > 0 && room.photos[0]?.image)
                              ? room.photos[0].image
                              : (room.primary_photo || FALLBACK_ROOM_PHOTOS[rIdx % FALLBACK_ROOM_PHOTOS.length]);
                            
                            const amenitiesList = room.amenities
                              ? room.amenities.split(',').map(a => a.trim()).filter(Boolean)
                              : ['Air Conditioning', 'Free Wi-Fi', 'Smart TV', 'Hot Water 24/7'];

                            return (
                              <div key={room.id} className="col-12 col-md-6">
                                <div className="border rounded-3 p-3 bg-light h-100 d-flex flex-column justify-content-between">
                                  <div>
                                    {/* Room Image & Header */}
                                    <div className="d-flex gap-3 mb-2.5">
                                      <div
                                        className="rounded-3 overflow-hidden bg-secondary bg-opacity-25 flex-shrink-0 position-relative"
                                        style={{ width: '96px', height: '80px' }}
                                      >
                                        <img
                                          src={photoUrl}
                                          alt={room.name}
                                          className="w-100 h-100 object-fit-cover cursor-pointer"
                                          onClick={() => openLightbox(room.photos || [{ image: photoUrl, caption: room.name }], 0, room.name)}
                                          onError={(e) => { e.target.style.display = 'none'; }}
                                        />
                                        <div
                                          className="position-absolute bottom-0 end-0 bg-dark bg-opacity-75 text-white extra-small px-1 rounded-top-start"
                                          style={{ fontSize: '9px' }}
                                        >
                                          🔍 View
                                        </div>
                                      </div>

                                      <div className="flex-grow-1 overflow-hidden">
                                        <div className="d-flex align-items-start justify-content-between gap-1">
                                          <h6 className="fw-bold text-dark mb-1 text-truncate">{room.name}</h6>
                                          <span className="badge bg-success text-white extra-small rounded-pill px-2 py-0.5">
                                            Available
                                          </span>
                                        </div>

                                        <div className="extra-small text-muted d-flex align-items-center gap-1 mb-1">
                                          <Users size={12} className="text-secondary" />
                                          <span>Max {room.max_adults || 2} Adults {room.max_children ? `• 👶 ${room.max_children} Child` : ''}</span>
                                        </div>

                                        <div className="d-flex align-items-baseline gap-1.5">
                                          <span className="fw-extrabold text-primary h6 m-0">
                                            {formatTariff(room.base_price || 0)}
                                          </span>
                                          <span className="extra-small text-muted">/ night</span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Amenities pills */}
                                    <div className="d-flex flex-wrap gap-1 mb-2">
                                      {amenitiesList.slice(0, 4).map((am, amIdx) => (
                                        <span key={amIdx} className="badge bg-white text-secondary border extra-small px-2 py-0.5" style={{ fontSize: '10px' }}>
                                          ✓ {am}
                                        </span>
                                      ))}
                                      {amenitiesList.length > 4 && (
                                        <span className="badge bg-white text-muted border extra-small px-1.5 py-0.5" style={{ fontSize: '10px' }}>
                                          +{amenitiesList.length - 4} more
                                        </span>
                                      )}
                                    </div>

                                    {/* Description */}
                                    {room.description && (
                                      <p
                                        className="extra-small text-muted mb-2"
                                        style={{
                                          display: '-webkit-box',
                                          WebkitLineClamp: 2,
                                          WebkitBoxOrient: 'vertical',
                                          overflow: 'hidden',
                                          lineHeight: '1.4',
                                          fontSize: '11px'
                                        }}
                                      >
                                        {room.description}
                                      </p>
                                    )}
                                  </div>

                                  {/* Direct Inquiry Action */}
                                  <div className="pt-2 border-top d-flex align-items-center justify-content-between mt-auto">
                                    <span className="extra-small text-success fw-semibold">
                                      Direct Tariff Guarantee
                                    </span>
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-primary rounded-pill px-3 py-0.5 extra-small fw-bold"
                                      onClick={() => {
                                        setIsBrochureModalOpen(false);
                                        handleOpenInquiry(room);
                                      }}
                                    >
                                      Book / Inquire
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 4. Policies & Direct Booking Terms */}
                <div className="bg-warning-subtle border border-warning rounded-4 p-3 mb-2">
                  <div className="fw-bold text-dark extra-small text-uppercase mb-1.5 d-flex align-items-center gap-1.5">
                    <Award size={14} className="text-warning-emphasis" />
                    <span>Direct Guest Privileges &amp; Reception Policies:</span>
                  </div>
                  <div className="row g-2 extra-small text-dark">
                    <div className="col-12 col-md-4">
                      <strong>✓ Lowest Direct Rate Guarantee:</strong> Direct booking guarantees lowest tariff without booking surcharges or OTA commissions.
                    </div>
                    <div className="col-12 col-md-4">
                      <strong>✓ Check-in / Govt ID Policy:</strong> Valid Govt Photo ID (Aadhaar / Passport / DL) is required for each guest during check-in.
                    </div>
                    <div className="col-12 col-md-4">
                      <strong>✓ Cancellation:</strong> {config.cancellation_policy || 'Free cancellation available up to 24 hours before scheduled check-in.'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="modal-footer bg-white border-top py-2.5 px-3 px-md-4 d-flex flex-column flex-sm-row align-items-stretch align-items-sm-center justify-content-between gap-2">
                <div className="extra-small text-muted text-center text-sm-start">
                  <span>Front Desk: <strong>{hotel.phone || 'Available 24/7'}</strong> &bull; Official Digital Factsheet</span>
                </div>

                <div className="d-flex align-items-center justify-content-end gap-2 flex-wrap">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary rounded-pill px-3 py-2 small"
                    onClick={() => setIsBrochureModalOpen(false)}
                  >
                    Close
                  </button>

                  {hotel.whatsapp && (
                    <a
                      href={generateWhatsAppUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-outline-success rounded-pill px-3 py-2 small d-inline-flex align-items-center gap-1.5"
                    >
                      <MessageSquare size={14} />
                      <span>WhatsApp Desk</span>
                    </a>
                  )}

                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary rounded-pill px-3.5 py-2 small fw-bold d-inline-flex align-items-center gap-1.5 shadow-xs"
                    onClick={handlePrintCatalogueA4}
                    title="Open printable A4 Sheet with photos"
                  >
                    <Printer size={15} />
                    <span>Print / Save A4 Sheet</span>
                  </button>

                  <button
                    type="button"
                    disabled={isDownloadingPdf}
                    className="btn btn-sm btn-primary text-white fw-bold rounded-pill px-4 py-2 small d-inline-flex align-items-center gap-2 shadow-sm animated-pulse-btn"
                    style={{ backgroundColor: palette.primary }}
                    onClick={handleDownloadCataloguePDF}
                  >
                    {isDownloadingPdf ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" style={{ width: '14px', height: '14px' }}></span>
                        <span>Generating PDF...</span>
                      </>
                    ) : (
                      <>
                        <Download size={16} />
                        <span>Download Official PDF</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 17. INTERACTIVE FULLSCREEN LIGHTBOX WITH ZOOM IN/OUT & THUMBNAIL PREVIEW   */}
      {/* ========================================================================= */}
      {isLightboxOpen && lightboxImages.length > 0 && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: 'rgba(5, 10, 20, 0.96)', zIndex: 1300 }}
          onClick={() => setIsLightboxOpen(false)}
        >
          <div 
            className="modal-dialog modal-dialog-centered modal-xl h-100 my-0 d-flex flex-column justify-content-center p-2 p-sm-3" 
            style={{ maxWidth: '96vw', maxHeight: '96vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex flex-column h-100 w-100 position-relative">
              {/* Top Control Bar */}
              <div className="d-flex align-items-center justify-content-between p-2 px-3 text-white z-3 bg-dark bg-opacity-70 rounded-pill mb-2 backdrop-blur shadow-sm border border-white border-opacity-10">
                <div className="d-flex align-items-center gap-2 text-truncate" style={{ maxWidth: '45%' }}>
                  <span className="badge bg-primary rounded-pill px-2.5 py-1 extra-small fw-bold">
                    {lightboxIndex + 1} / {lightboxImages.length}
                  </span>
                  <span className="small text-white text-truncate fw-medium">
                    {lightboxImages[lightboxIndex]?.caption || hotel.name}
                  </span>
                </div>

                {/* Center Zoom In / Out / Reset Controls */}
                <div className="d-flex align-items-center gap-1.5 bg-black bg-opacity-60 px-2 py-1 rounded-pill border border-white border-opacity-20 shadow-xs">
                  <button
                    type="button"
                    className="btn btn-sm text-white p-1 rounded-circle d-flex align-items-center justify-content-center hover-scale"
                    style={{ width: '28px', height: '28px' }}
                    onClick={handleZoomOut}
                    disabled={lightboxZoom <= 1}
                    title="Zoom Out (-)"
                  >
                    <ZoomOut size={16} />
                  </button>

                  <span className="extra-small px-1 text-warning fw-bold text-nowrap" style={{ minWidth: '42px', textAlign: 'center' }}>
                    {Math.round(lightboxZoom * 100)}%
                  </span>

                  <button
                    type="button"
                    className="btn btn-sm text-white p-1 rounded-circle d-flex align-items-center justify-content-center hover-scale"
                    style={{ width: '28px', height: '28px' }}
                    onClick={handleZoomIn}
                    disabled={lightboxZoom >= 3.5}
                    title="Zoom In (+)"
                  >
                    <ZoomIn size={16} />
                  </button>

                  <button
                    type="button"
                    className="btn btn-sm text-white-50 p-1 rounded-circle d-flex align-items-center justify-content-center ms-1 hover-scale"
                    style={{ width: '28px', height: '28px' }}
                    onClick={handleZoomReset}
                    title="Reset Zoom (100%)"
                  >
                    <RotateCcw size={13} />
                  </button>
                </div>

                {/* Close Button */}
                <button
                  type="button"
                  className="btn btn-sm btn-light rounded-circle p-1.5 shadow-sm d-flex align-items-center justify-content-center hover-scale"
                  style={{ width: '32px', height: '32px' }}
                  onClick={() => setIsLightboxOpen(false)}
                  title="Close Lightbox (Esc)"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Main Image Stage with Pan & Zoom */}
              <div 
                className="flex-grow-1 position-relative overflow-hidden rounded-4 d-flex align-items-center justify-content-center border border-secondary border-opacity-25"
                style={{ 
                  backgroundColor: '#05070c',
                  cursor: lightboxZoom > 1 ? (isPanning ? 'grabbing' : 'grab') : 'zoom-in',
                  touchAction: 'none'
                }}
                onMouseDown={handleMouseDownPan}
                onMouseMove={handleMouseMovePan}
                onMouseUp={handleMouseUpPan}
                onMouseLeave={handleMouseUpPan}
                onWheel={handleWheelZoom}
                onDoubleClick={handleToggleZoom}
              >
                <img
                  key={lightboxIndex}
                  src={lightboxImages[lightboxIndex]?.image}
                  alt={lightboxImages[lightboxIndex]?.caption || "Hotel Gallery"}
                  className="img-fluid select-none"
                  style={{ 
                    maxHeight: '72vh', 
                    maxWidth: '92vw',
                    objectFit: 'contain',
                    transform: `scale(${lightboxZoom}) translate(${lightboxPan.x / lightboxZoom}px, ${lightboxPan.y / lightboxZoom}px)`,
                    transition: isPanning ? 'none' : 'transform 0.22s cubic-bezier(0.2, 0, 0, 1)',
                    userSelect: 'none',
                    pointerEvents: 'auto'
                  }}
                  draggable={false}
                />

                {/* Prev / Next Arrows */}
                {lightboxImages.length > 1 && (
                  <div className="d-flex align-items-center justify-content-between position-absolute top-50 start-0 end-0 px-2 px-sm-3 translate-middle-y pointer-events-none z-2">
                    <button
                      type="button"
                      className="btn btn-dark bg-opacity-75 text-white rounded-circle p-2.5 shadow-lg pointer-events-auto border border-white border-opacity-20 backdrop-blur"
                      onClick={handleLightboxPrev}
                      title="Previous Photo"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-dark bg-opacity-75 text-white rounded-circle p-2.5 shadow-lg pointer-events-auto border border-white border-opacity-20 backdrop-blur"
                      onClick={handleLightboxNext}
                      title="Next Photo"
                    >
                      <ChevronRight size={24} />
                    </button>
                  </div>
                )}
              </div>

              {/* Bottom Thumbnail Preview Strip inside Lightbox */}
              {lightboxImages.length > 1 && (
                <div className="pt-2 z-2">
                  <div 
                    className="d-flex align-items-center justify-content-center gap-2 overflow-x-auto py-1 px-2 flex-nowrap"
                    style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
                  >
                    {lightboxImages.map((imgItem, idx) => {
                      const isActive = idx === lightboxIndex;
                      return (
                        <button
                          key={idx}
                          type="button"
                          className={`btn p-0 rounded-2 overflow-hidden border-2 flex-shrink-0 transition-all ${
                            isActive ? 'border-primary shadow-sm ring-2 ring-primary' : 'border-secondary border-opacity-40 opacity-50'
                          }`}
                          style={{
                            width: '56px',
                            height: '38px',
                            transform: isActive ? 'scale(1.08)' : 'scale(1)',
                            transition: 'all 0.2s ease'
                          }}
                          onClick={() => handleLightboxSelectPhoto(idx)}
                          title={`Jump to photo ${idx + 1}`}
                        >
                          <img
                            src={imgItem.image}
                            alt={`Preview ${idx + 1}`}
                            className="w-100 h-100 object-fit-cover"
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicCatalogue;
