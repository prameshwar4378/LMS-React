import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  getCatalogueConfigApi,
  updateCatalogueConfigApi,
  copyBrandDefaultsApi,
  getRoomTypePhotosApi,
  uploadRoomPhotoApi,
  deleteRoomPhotoApi,
  setPrimaryRoomPhotoApi,
  getCatalogueInquiriesApi,
  updateInquiryStatusApi,
  getHotelGalleryPhotosApi,
  uploadHotelGalleryPhotoApi,
  deleteHotelGalleryPhotoApi,
  updateHotelGalleryPhotoApi
} from '../api/catalogueApi';
import { getRoomTypesApi, patchRoomTypeApi } from '../api/roomApi';
import { getSettingsApi } from '../api/settingsApi';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/dateUtils';
import { jsPDF } from 'jspdf';
import {
  Globe,
  Settings,
  Image as ImageIcon,
  CheckSquare,
  MapPin,
  QrCode,
  Inbox,
  Eye,
  ExternalLink,
  Upload,
  Trash2,
  Star,
  Copy,
  Check,
  Building,
  Save,
  RefreshCw,
  Phone,
  MessageSquare,
  Mail,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Send,
  AlertCircle,
  Plus,
  BedDouble,
  Smartphone,
  Tablet,
  Monitor,
  HelpCircle,
  MessageCircle,
  Layers,
  Navigation,
  Compass,
  Edit2,
  X,
  FileText,
  CheckCircle,
  ThumbsUp
} from 'lucide-react';

const THEME_OPTIONS = [
  { key: 'BLUE', label: 'Royal Blue', color: '#2563eb', gradient: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)' },
  { key: 'EMERALD', label: 'Emerald Luxury', color: '#059669', gradient: 'linear-gradient(135deg, #065f46 0%, #10b981 100%)' },
  { key: 'GOLD', label: 'Golden Amber', color: '#d97706', gradient: 'linear-gradient(135deg, #92400e 0%, #f59e0b 100%)' },
  { key: 'ROSE', label: 'Rose Elegance', color: '#e11d48', gradient: 'linear-gradient(135deg, #9f1239 0%, #f43f5e 100%)' },
  { key: 'SLATE', label: 'Modern Dark Slate', color: '#0f172a', gradient: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)' },
];

const DEFAULT_FACILITIES = [
  { key: 'wifi', label: 'Free High-Speed Wi-Fi', icon: 'Wifi', enabled: true },
  { key: 'ac', label: 'Air Conditioning', icon: 'Wind', enabled: true },
  { key: 'power', label: '24/7 Power Backup', icon: 'Zap', enabled: true },
  { key: 'elevator', label: 'Elevator / Lift Access', icon: 'ArrowUpDown', enabled: true },
  { key: 'parking', label: 'Free Guest Parking', icon: 'Car', enabled: true },
  { key: 'restaurant', label: 'Dining & Room Service', icon: 'Utensils', enabled: true },
  { key: 'security', label: '24/7 CCTV & Security', icon: 'ShieldCheck', enabled: true },
  { key: 'reception', label: '24-Hour Front Desk', icon: 'Bell', enabled: true },
  { key: 'hot_water', label: '24/7 Hot Water', icon: 'Droplets', enabled: true },
  { key: 'first_aid', label: 'First Aid & Medical Support', icon: 'HeartPulse', enabled: true },
  { key: 'housekeeping', label: 'Daily Housekeeping', icon: 'Sparkles', enabled: true },
  { key: 'laundry', label: 'Express Laundry Service', icon: 'Sparkles', enabled: false },
];

const DEFAULT_FAQS = [
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
    icon: 'CheckCircle',
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

const CatalogueManage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showSuccess, showError, showWarning } = useNotification();
  const { user, selectedProperty, branches: authBranches } = useAuth();

  const [activeTab, setActiveTab] = useState('customizer'); // customizer, rooms, facilities, location, qr, inquiries
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [previewDevice, setPreviewDevice] = useState('mobile'); // mobile, desktop

  // General Settings Query
  const { data: settings = {} } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettingsApi,
  });

  const branches = authBranches && authBranches.length > 0 ? authBranches : (settings?.branches || []);
  const isMultiBranch = branches.length > 1;

  // Active property ID for queries
  const activeBranch = branches.find(b => String(b.id) === String(selectedBranchId));
  const currentProperty = activeBranch || selectedProperty || {};
  const effectivePropertyId = selectedBranchId || currentProperty.id || user?.property || 1;

  // Catalogue Config Query
  const {
    data: config = {},
    isLoading: isConfigLoading,
    refetch: refetchConfig
  } = useQuery({
    queryKey: ['catalogue-config', effectivePropertyId],
    queryFn: () => getCatalogueConfigApi(effectivePropertyId),
  });

  // Room Types Query
  const {
    data: roomTypes = [],
    isLoading: isRoomsLoading,
    refetch: refetchRooms
  } = useQuery({
    queryKey: ['room-types', effectivePropertyId],
    queryFn: getRoomTypesApi,
  });

  // Inquiries Query
  const {
    data: inquiries = [],
    isLoading: isInquiriesLoading,
    refetch: refetchInquiries
  } = useQuery({
    queryKey: ['catalogue-inquiries', effectivePropertyId],
    queryFn: () => getCatalogueInquiriesApi(),
  });

  // Hotel Gallery Photos Query
  const {
    data: hotelGalleryPhotos = [],
    isLoading: isGalleryLoading,
    refetch: refetchGalleryPhotos
  } = useQuery({
    queryKey: ['hotel-gallery-photos', effectivePropertyId],
    queryFn: () => getHotelGalleryPhotosApi(effectivePropertyId),
  });

  // Resolved property code
  const activePropertyCode =
    (activeBranch && activeBranch.code) ||
    config?.property_code ||
    currentProperty.code ||
    currentProperty.property_code ||
    user?.property_code ||
    '';

  const propertyDisplayName =
    (activeBranch && activeBranch.name) ||
    config?.property_name ||
    currentProperty.name ||
    user?.property_name ||
    'Hotel Digital Catalogue';

  // Form State for Config
  const [formData, setFormData] = useState({
    is_published: true,
    hero_headline: '',
    hero_tagline: '',
    about_title: 'Our Heritage & Signature Hospitality',
    about_text: '',
    accent_theme: 'BLUE',
    contact_phone: '',
    whatsapp_number: '',
    contact_email: '',
    address_override: '',
    city_override: '',
    google_maps_embed_url: '',
    google_maps_directions_url: '',
    landmark: '',
    check_in_time: '12:00 PM',
    check_out_time: '11:00 AM',
    cancellation_policy: '',
    house_rules: '',
    instagram_url: '',
    facebook_url: '',
    website_url: '',
  });

  const [heroBannerFile, setHeroBannerFile] = useState(null);
  const [heroBannerPreview, setHeroBannerPreview] = useState(null);

  // Dynamic feature states
  const [facilities, setFacilities] = useState(DEFAULT_FACILITIES);
  const [faqs, setFaqs] = useState(DEFAULT_FAQS);
  const [showReviews, setShowReviews] = useState(true);
  const [ratingSummary, setRatingSummary] = useState(DEFAULT_RATING_SUMMARY);
  const [reviews, setReviews] = useState(DEFAULT_REVIEWS);
  const [nearbyPlaces, setNearbyPlaces] = useState(DEFAULT_NEARBY_PLACES);
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [directPrivileges, setDirectPrivileges] = useState(DEFAULT_PRIVILEGES);

  // Gallery photo upload state
  const [galleryUploadFile, setGalleryUploadFile] = useState(null);
  const [galleryUploadPreview, setGalleryUploadPreview] = useState(null);
  const [galleryCaption, setGalleryCaption] = useState('');
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);

  // FAQ Modal / Form State
  const [editingFaqId, setEditingFaqId] = useState(null);
  const [faqForm, setFaqForm] = useState({ q: '', a: '', category: 'checkin', highlights: '' });
  const [isAddingFaq, setIsAddingFaq] = useState(false);

  // Review Modal / Form State
  const [reviewForm, setReviewForm] = useState({ guest_name: '', stay_type: 'Family Stay', rating: 5, stay_date: 'Stayed Recent', review_text: '' });
  const [isAddingReview, setIsAddingReview] = useState(false);

  // Nearby Place Form State
  const [placeForm, setPlaceForm] = useState({ name: '', icon: 'train', distance: '~ 2 km', duration: '5 mins' });
  const [isAddingPlace, setIsAddingPlace] = useState(false);

  // Quick stat input state
  const [newStat, setNewStat] = useState({ label: '', value: '', color: 'primary' });
  const [newPrivilege, setNewPrivilege] = useState('');

  // Sync loaded config to form
  useEffect(() => {
    if (config && (config.id || config.hero_headline !== undefined)) {
      setFormData({
        is_published: config.is_published ?? true,
        hero_headline: config.hero_headline || propertyDisplayName || '',
        hero_tagline: config.hero_tagline || '',
        about_title: config.about_title || 'Our Heritage & Signature Hospitality',
        about_text: config.about_text || '',
        accent_theme: config.accent_theme || 'BLUE',
        contact_phone: config.contact_phone || '',
        whatsapp_number: config.whatsapp_number || '',
        contact_email: config.contact_email || '',
        address_override: config.address_override || '',
        city_override: config.city_override || '',
        google_maps_embed_url: config.google_maps_embed_url || '',
        google_maps_directions_url: config.google_maps_directions_url || '',
        landmark: config.landmark || '',
        check_in_time: config.check_in_time || '12:00 PM',
        check_out_time: config.check_out_time || '11:00 AM',
        cancellation_policy: config.cancellation_policy || '',
        house_rules: config.house_rules || '',
        instagram_url: config.instagram_url || '',
        facebook_url: config.facebook_url || '',
        website_url: config.website_url || '',
      });
      setHeroBannerPreview(config.hero_banner_url || null);

      if (Array.isArray(config.facilities_json) && config.facilities_json.length > 0) {
        const existingKeys = new Set(config.facilities_json.map(f => f.key));
        const merged = [
          ...config.facilities_json,
          ...DEFAULT_FACILITIES.filter(f => !existingKeys.has(f.key)).map(f => ({ ...f, enabled: false }))
        ];
        setFacilities(merged);
      } else {
        setFacilities(DEFAULT_FACILITIES);
      }

      if (Array.isArray(config.faqs_json) && config.faqs_json.length > 0) {
        setFaqs(config.faqs_json);
      } else {
        setFaqs(DEFAULT_FAQS);
      }

      setShowReviews(config.show_reviews ?? true);

      if (config.rating_summary_json && typeof config.rating_summary_json === 'object' && config.rating_summary_json.overall_rating) {
        setRatingSummary(config.rating_summary_json);
      } else {
        setRatingSummary(DEFAULT_RATING_SUMMARY);
      }

      if (Array.isArray(config.reviews_json) && config.reviews_json.length > 0) {
        setReviews(config.reviews_json);
      } else {
        setReviews(DEFAULT_REVIEWS);
      }

      if (Array.isArray(config.nearby_places_json) && config.nearby_places_json.length > 0) {
        setNearbyPlaces(config.nearby_places_json);
      } else {
        setNearbyPlaces(DEFAULT_NEARBY_PLACES);
      }

      if (Array.isArray(config.stats_json) && config.stats_json.length > 0) {
        setStats(config.stats_json);
      } else {
        setStats(DEFAULT_STATS);
      }

      if (Array.isArray(config.direct_privileges_json) && config.direct_privileges_json.length > 0) {
        setDirectPrivileges(config.direct_privileges_json);
      } else {
        setDirectPrivileges(DEFAULT_PRIVILEGES);
      }
    }
  }, [config, propertyDisplayName]);

  // Public URL
  const publicCatalogueUrl = activePropertyCode ? `${window.location.origin}/#/catalogue/${activePropertyCode}` : '';

  // Save Config Mutation
  const saveConfigMutation = useMutation({
    mutationFn: async () => {
      const dataToSend = new FormData();
      Object.keys(formData).forEach((key) => {
        dataToSend.append(key, formData[key] ?? '');
      });
      dataToSend.append('facilities_json', JSON.stringify(facilities || []));
      dataToSend.append('faqs_json', JSON.stringify(faqs || []));
      dataToSend.append('show_reviews', showReviews ? 'true' : 'false');
      dataToSend.append('rating_summary_json', JSON.stringify(ratingSummary || DEFAULT_RATING_SUMMARY));
      dataToSend.append('reviews_json', JSON.stringify(reviews || []));
      dataToSend.append('nearby_places_json', JSON.stringify(nearbyPlaces || []));
      dataToSend.append('stats_json', JSON.stringify(stats || []));
      dataToSend.append('direct_privileges_json', JSON.stringify(directPrivileges || []));
      if (heroBannerFile) {
        dataToSend.append('hero_banner', heroBannerFile);
      }
      return updateCatalogueConfigApi(dataToSend, effectivePropertyId);
    },
    onSuccess: () => {
      showSuccess('Catalogue settings published and updated successfully!');
      queryClient.invalidateQueries(['catalogue-config', effectivePropertyId]);
      refetchConfig();
    },
    onError: (err) => {
      const errDetail = err?.response?.data;
      let msg = 'Failed to update catalogue settings.';
      if (typeof errDetail === 'string') msg = errDetail;
      else if (errDetail && typeof errDetail === 'object') {
        const firstKey = Object.keys(errDetail)[0];
        msg = `${firstKey}: ${Array.isArray(errDetail[firstKey]) ? errDetail[firstKey].join(', ') : errDetail[firstKey]}`;
      }
      showError(msg);
    }
  });

  // Copy Brand Defaults Mutation
  const copyDefaultsMutation = useMutation({
    mutationFn: () => copyBrandDefaultsApi(effectivePropertyId),
    onSuccess: (data) => {
      showSuccess(data.message || 'Brand defaults copied from primary hotel!');
      refetchConfig();
    },
    onError: (err) => {
      showWarning(err?.response?.data?.detail || 'Unable to copy defaults.');
    }
  });

  // Toggle Facility
  const handleToggleFacility = (key) => {
    setFacilities(facilities.map(f => f.key === key ? { ...f, enabled: !f.enabled } : f));
  };

  // Banner File Change
  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setHeroBannerFile(file);
      setHeroBannerPreview(URL.createObjectURL(file));
    }
  };

  // Copy Public Link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicCatalogueUrl);
    setCopiedLink(true);
    showSuccess('Public catalogue URL copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 3000);
  };

  // Hotel Gallery Photo Handlers
  const handleUploadGalleryPhoto = async (e) => {
    e.preventDefault();
    if (!galleryUploadFile) {
      showWarning('Please select an image file to upload.');
      return;
    }
    try {
      setIsUploadingGallery(true);
      const fd = new FormData();
      fd.append('image', galleryUploadFile);
      fd.append('caption', galleryCaption.trim() || propertyDisplayName);
      fd.append('display_order', hotelGalleryPhotos.length + 1);
      await uploadHotelGalleryPhotoApi(fd);
      showSuccess('Property photo added to hotel gallery!');
      setGalleryUploadFile(null);
      setGalleryUploadPreview(null);
      setGalleryCaption('');
      refetchGalleryPhotos();
    } catch (err) {
      showError('Failed to upload hotel photo.');
    } finally {
      setIsUploadingGallery(false);
    }
  };

  const handleDeleteGalleryPhoto = async (photoId) => {
    if (!window.confirm('Delete this photo from hotel gallery?')) return;
    try {
      await deleteHotelGalleryPhotoApi(photoId);
      showSuccess('Photo removed from hotel gallery.');
      refetchGalleryPhotos();
    } catch (err) {
      showError('Failed to delete gallery photo.');
    }
  };

  // FAQ Handlers
  const handleSaveFaq = (e) => {
    e.preventDefault();
    if (!faqForm.q.trim() || !faqForm.a.trim()) {
      showWarning('Question and Answer are required.');
      return;
    }
    const highlightsArr = faqForm.highlights
      ? faqForm.highlights.split(',').map(h => h.trim()).filter(Boolean)
      : [];
    if (editingFaqId) {
      setFaqs(faqs.map(f => f.id === editingFaqId ? {
        ...f,
        q: faqForm.q.trim(),
        a: faqForm.a.trim(),
        category: faqForm.category,
        highlights: highlightsArr
      } : f));
      showSuccess('FAQ updated! Remember to click "Save & Publish".');
    } else {
      const newFaqItem = {
        id: `faq-${Date.now()}`,
        category: faqForm.category || 'checkin',
        icon: 'HelpCircle',
        q: faqForm.q.trim(),
        a: faqForm.a.trim(),
        highlights: highlightsArr
      };
      setFaqs([newFaqItem, ...faqs]);
      showSuccess('FAQ added! Click "Save & Publish" to commit.');
    }
    setFaqForm({ q: '', a: '', category: 'checkin', highlights: '' });
    setEditingFaqId(null);
    setIsAddingFaq(false);
  };

  const handleDeleteFaq = (faqId) => {
    if (!window.confirm('Delete this FAQ?')) return;
    setFaqs(faqs.filter(f => f.id !== faqId));
    showSuccess('FAQ removed. Click "Save & Publish" to update live catalogue.');
  };

  const handleEditFaq = (faq) => {
    setEditingFaqId(faq.id);
    setFaqForm({
      q: faq.q,
      a: faq.a,
      category: faq.category || 'checkin',
      highlights: Array.isArray(faq.highlights) ? faq.highlights.join(', ') : ''
    });
    setIsAddingFaq(true);
  };

  // Review Handlers
  const handleSaveReview = (e) => {
    e.preventDefault();
    if (!reviewForm.guest_name.trim() || !reviewForm.review_text.trim()) {
      showWarning('Guest Name and Review Text are required.');
      return;
    }
    const newRev = {
      id: `rev-${Date.now()}`,
      guest_name: reviewForm.guest_name.trim(),
      stay_type: reviewForm.stay_type.trim() || 'Verified Guest',
      rating: Number(reviewForm.rating) || 5,
      stay_date: reviewForm.stay_date.trim() || 'Recent Stay',
      review_text: reviewForm.review_text.trim()
    };
    setReviews([newRev, ...reviews]);
    showSuccess('Review card added! Click "Save & Publish" to apply.');
    setReviewForm({ guest_name: '', stay_type: 'Family Stay', rating: 5, stay_date: 'Stayed Recent', review_text: '' });
    setIsAddingReview(false);
  };

  const handleDeleteReview = (revId) => {
    if (!window.confirm('Delete this review testimonial?')) return;
    setReviews(reviews.filter(r => r.id !== revId));
    showSuccess('Review removed. Click "Save & Publish" to update.');
  };

  // Nearby Places Handlers
  const handleSavePlace = (e) => {
    e.preventDefault();
    if (!placeForm.name.trim()) {
      showWarning('Landmark / transit name is required.');
      return;
    }
    const newP = {
      id: `place-${Date.now()}`,
      icon: placeForm.icon || 'train',
      name: placeForm.name.trim(),
      distance: placeForm.distance.trim() || '~ 1 km',
      duration: placeForm.duration.trim() || '5 mins'
    };
    setNearbyPlaces([...nearbyPlaces, newP]);
    showSuccess('Transit landmark added! Click "Save & Publish" to apply.');
    setPlaceForm({ name: '', icon: 'train', distance: '~ 2 km', duration: '5 mins' });
    setIsAddingPlace(false);
  };

  const handleDeletePlace = (placeId) => {
    setNearbyPlaces(nearbyPlaces.filter(p => p.id !== placeId));
    showSuccess('Transit point removed.');
  };

  // Stat & Privilege Handlers
  const handleAddStat = (e) => {
    e.preventDefault();
    if (!newStat.label.trim() || !newStat.value.trim()) return;
    setStats([...stats, { ...newStat }]);
    setNewStat({ label: '', value: '', color: 'primary' });
    showSuccess('Stat added! Click "Save & Publish" to update.');
  };

  const handleDeleteStat = (idx) => {
    setStats(stats.filter((_, i) => i !== idx));
  };

  const handleAddPrivilege = (e) => {
    e.preventDefault();
    if (!newPrivilege.trim()) return;
    setDirectPrivileges([...directPrivileges, newPrivilege.trim()]);
    setNewPrivilege('');
    showSuccess('Perk added! Click "Save & Publish" to update.');
  };

  const handleDeletePrivilege = (idx) => {
    setDirectPrivileges(directPrivileges.filter((_, i) => i !== idx));
  };

  // Generate Table Standee PDF
  const handleGeneratePdfStandee = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [148, 210] // A5 dimensions
      });

      const primaryColor = THEME_OPTIONS.find(t => t.key === formData.accent_theme)?.color || '#2563eb';

      // Header Banner
      doc.setFillColor(15, 23, 42); // Deep Slate
      doc.rect(0, 0, 148, 45, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text(propertyDisplayName || 'Hotel Guest Showcase', 74, 18, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(203, 213, 225);
      doc.text(formData.hero_tagline || 'Digital Room Catalogue & Direct Booking Rates', 74, 26, { align: 'center' });

      doc.setFontSize(8);
      doc.setTextColor(245, 158, 11);
      doc.text('SCAN WITH SMARTPHONE CAMERA', 74, 35, { align: 'center' });

      // QR Code Box
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(publicCatalogueUrl)}`;
      const qrImg = new Image();
      qrImg.crossOrigin = 'Anonymous';
      qrImg.src = qrApiUrl;
      qrImg.onload = () => {
        doc.addImage(qrImg, 'PNG', 44, 55, 60, 60);

        // QR Frame
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(40, 51, 68, 68, 4, 4);

        // Callout text
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text('Explore Our Rooms & Amenities', 74, 130, { align: 'center' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text('Direct Best Rate Guarantee &bull; Instant Confirmation', 74, 137, { align: 'center' });

        // Information Cards
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(20, 145, 108, 38, 3, 3, 'FD');

        doc.setFontSize(9);
        doc.setTextColor(30, 41, 59);
        doc.setFont('helvetica', 'bold');
        doc.text('Reception & Assistance:', 25, 153);
        doc.setFont('helvetica', 'normal');
        doc.text(`Phone: ${formData.contact_phone || currentProperty.owner_phone || 'Available at desk'}`, 25, 160);
        doc.text(`WhatsApp: ${formData.whatsapp_number || formData.contact_phone || 'Available'}`, 25, 167);
        doc.text(`Check-in: ${formData.check_in_time}  |  Check-out: ${formData.check_out_time}`, 25, 174);

        // Footer
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text('Powered by InnVetrix • Stay Ahead. Beyond Expectations.', 74, 200, { align: 'center' });

        doc.save(`${activePropertyCode || 'hotel'}_table_standee.pdf`);
        showSuccess('Table Standee PDF generated successfully!');
      };
    } catch (err) {
      showError('Error creating PDF standee.');
    }
  };

  // Convert Inquiry to Booking
  const handleConvertToBooking = (inquiry) => {
    navigate(
      `/bookings/create?guest_name=${encodeURIComponent(inquiry.guest_name)}&mobile=${encodeURIComponent(inquiry.guest_mobile)}&email=${encodeURIComponent(inquiry.guest_email || '')}&check_in=${inquiry.check_in_date || ''}&check_out=${inquiry.check_out_date || ''}&room_type_id=${inquiry.requested_room_type || ''}`
    );
  };

  // Toggle Room In Catalogue
  const handleToggleRoomVisibility = async (roomId, currentVal) => {
    try {
      await patchRoomTypeApi(roomId, { show_in_catalogue: !currentVal });
      showSuccess('Room visibility updated!');
      refetchRooms();
    } catch (err) {
      showError('Failed to update room visibility.');
    }
  };

  // Update Room Badge
  const handleUpdateRoomBadge = async (roomId, badgeText) => {
    try {
      await patchRoomTypeApi(roomId, { catalogue_badge: badgeText });
      showSuccess('Room promotional badge saved!');
      refetchRooms();
    } catch (err) {
      showError('Failed to save room badge.');
    }
  };

  // Photo Upload Handler for a Room
  const handlePhotoUpload = async (roomId, file, caption = '') => {
    if (!file) return;
    try {
      const data = new FormData();
      data.append('room_type', roomId);
      data.append('image', file);
      if (caption) data.append('caption', caption);
      await uploadRoomPhotoApi(data);
      showSuccess('Room photo uploaded!');
      refetchRooms();
    } catch (err) {
      showError('Failed to upload photo.');
    }
  };

  // Photo Delete Handler
  const handleDeletePhoto = async (photoId) => {
    if (!window.confirm('Delete this photo from room catalogue?')) return;
    try {
      await deleteRoomPhotoApi(photoId);
      showSuccess('Photo removed!');
      refetchRooms();
    } catch (err) {
      showError('Failed to delete photo.');
    }
  };

  // Set Primary Photo Handler
  const handleSetPrimaryPhoto = async (photoId) => {
    try {
      await setPrimaryRoomPhotoApi(photoId);
      showSuccess('Primary thumbnail set!');
      refetchRooms();
    } catch (err) {
      showError('Failed to update primary thumbnail.');
    }
  };

  return (
    <div className="container-fluid py-4 max-w-7xl">
      {/* 1. TOP HEADER & ACTION BAR */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <div>
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill extra-small px-2.5 py-0.5 fw-bold">
              Marketing &amp; Digital Storefront
            </span>
            <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill extra-small px-2.5 py-0.5 fw-bold">
              {formData.is_published ? '● Live Online' : '○ Private'}
            </span>
          </div>
          <h3 className="fw-bold text-dark m-0 mt-1 d-flex align-items-center gap-2">
            <Globe size={26} className="text-primary" /> Hotel Digital Catalogue &amp; Showcase
          </h3>
          <span className="text-muted small">
            Manage your public landing page, room photo galleries, amenities, Google Map location, and direct inquiries.
          </span>
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          {/* Multi-Branch Selector if applicable */}
          {isMultiBranch && branches.length > 0 && (
            <div className="d-flex align-items-center gap-2 bg-light p-1.5 rounded-3 border">
              <Building size={16} className="text-muted ms-1" />
              <select
                className="form-select form-select-sm border-0 bg-transparent fw-semibold"
                style={{ width: 'auto', minWidth: '170px' }}
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
              >
                <option value="">{selectedProperty?.name || user?.property_name || 'Primary Hotel'}</option>
                {branches.filter(b => String(b.id) !== String(selectedProperty?.id)).map(b => (
                  <option key={b.id} value={b.id}>{b.name} ({b.city || 'Branch'})</option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            className="btn btn-outline-secondary btn-sm rounded-3 fw-semibold d-inline-flex align-items-center gap-1.5"
            onClick={handleCopyLink}
          >
            {copiedLink ? <Check size={15} className="text-success" /> : <Copy size={15} />}
            <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
          </button>

          <a
            href={publicCatalogueUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-sm btn-outline-primary rounded-3 fw-semibold d-inline-flex align-items-center gap-1.5"
          >
            <ExternalLink size={15} />
            <span>Open Public Page</span>
          </a>

          <button
            type="button"
            className="btn btn-sm btn-primary rounded-3 fw-bold d-inline-flex align-items-center gap-1.5 px-3.5 shadow-xs"
            disabled={saveConfigMutation.isPending}
            onClick={() => saveConfigMutation.mutate()}
          >
            <Save size={15} />
            <span>{saveConfigMutation.isPending ? 'Publishing...' : 'Save & Publish'}</span>
          </button>
        </div>
      </div>

      {/* 2. TABBED NAVIGATION */}
      <div className="bg-white rounded-3 shadow-xs border mb-4 p-1">
        <ul className="nav nav-pills nav-fill flex-nowrap overflow-auto gap-1">
          <li className="nav-item">
            <button
              type="button"
              className={`nav-link py-2.5 px-2.5 extra-small fw-bold d-inline-flex align-items-center gap-1.5 rounded-2 ${activeTab === 'customizer' ? 'active shadow-xs' : 'text-secondary'}`}
              onClick={() => setActiveTab('customizer')}
            >
              <Settings size={15} /> Customizer
            </button>
          </li>
          <li className="nav-item">
            <button
              type="button"
              className={`nav-link py-2.5 px-2.5 extra-small fw-bold d-inline-flex align-items-center gap-1.5 rounded-2 ${activeTab === 'gallery' ? 'active shadow-xs' : 'text-secondary'}`}
              onClick={() => setActiveTab('gallery')}
            >
              <ImageIcon size={15} /> Hotel Photos ({hotelGalleryPhotos.length})
            </button>
          </li>
          <li className="nav-item">
            <button
              type="button"
              className={`nav-link py-2.5 px-2.5 extra-small fw-bold d-inline-flex align-items-center gap-1.5 rounded-2 ${activeTab === 'rooms' ? 'active shadow-xs' : 'text-secondary'}`}
              onClick={() => setActiveTab('rooms')}
            >
              <BedDouble size={15} /> Room Showcase ({roomTypes.length})
            </button>
          </li>
          <li className="nav-item">
            <button
              type="button"
              className={`nav-link py-2.5 px-2.5 extra-small fw-bold d-inline-flex align-items-center gap-1.5 rounded-2 ${activeTab === 'facilities' ? 'active shadow-xs' : 'text-secondary'}`}
              onClick={() => setActiveTab('facilities')}
            >
              <CheckSquare size={15} /> Facilities ({facilities.filter(f => f.enabled).length})
            </button>
          </li>
          <li className="nav-item">
            <button
              type="button"
              className={`nav-link py-2.5 px-2.5 extra-small fw-bold d-inline-flex align-items-center gap-1.5 rounded-2 ${activeTab === 'faqs' ? 'active shadow-xs' : 'text-secondary'}`}
              onClick={() => setActiveTab('faqs')}
            >
              <HelpCircle size={15} /> FAQs ({faqs.length})
            </button>
          </li>
          <li className="nav-item">
            <button
              type="button"
              className={`nav-link py-2.5 px-2.5 extra-small fw-bold d-inline-flex align-items-center gap-1.5 rounded-2 ${activeTab === 'reviews' ? 'active shadow-xs' : 'text-secondary'}`}
              onClick={() => setActiveTab('reviews')}
            >
              <Star size={15} /> Reviews &amp; Rating ({reviews.length})
            </button>
          </li>
          <li className="nav-item">
            <button
              type="button"
              className={`nav-link py-2.5 px-2.5 extra-small fw-bold d-inline-flex align-items-center gap-1.5 rounded-2 ${activeTab === 'location' ? 'active shadow-xs' : 'text-secondary'}`}
              onClick={() => setActiveTab('location')}
            >
              <MapPin size={15} /> Maps &amp; Transit ({nearbyPlaces.length})
            </button>
          </li>
          <li className="nav-item">
            <button
              type="button"
              className={`nav-link py-2.5 px-2.5 extra-small fw-bold d-inline-flex align-items-center gap-1.5 rounded-2 ${activeTab === 'qr' ? 'active shadow-xs' : 'text-secondary'}`}
              onClick={() => setActiveTab('qr')}
            >
              <QrCode size={15} /> Standee QR
            </button>
          </li>
          <li className="nav-item">
            <button
              type="button"
              className={`nav-link py-2.5 px-2.5 extra-small fw-bold d-inline-flex align-items-center gap-1.5 rounded-2 position-relative ${activeTab === 'inquiries' ? 'active shadow-xs' : 'text-secondary'}`}
              onClick={() => setActiveTab('inquiries')}
            >
              <Inbox size={15} /> Leads ({inquiries.length})
              {inquiries.filter(i => i.status === 'NEW').length > 0 && (
                <span className="badge bg-danger rounded-pill extra-small ms-1">
                  {inquiries.filter(i => i.status === 'NEW').length}
                </span>
              )}
            </button>
          </li>
        </ul>
      </div>

      {/* 3. TAB CONTENT */}

      {/* TAB 1: LIVE CUSTOMIZER (SPLIT-SCREEN EDITOR & SIMULATOR) */}
      {activeTab === 'customizer' && (
        <div className="row g-4">
          {/* Left Editor Panel */}
          <div className="col-lg-7">
            <div className="card border-0 rounded-4 shadow-sm bg-white p-4 mb-4">
              <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-3">
                <div>
                  <h5 className="fw-bold text-dark m-0">Branding &amp; Hero Settings</h5>
                  <span className="text-muted extra-small">Customize the banner, headline, and public theme</span>
                </div>
                {isMultiBranch && selectedBranchId && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-xs rounded-pill px-2.5 py-1 extra-small fw-semibold d-inline-flex align-items-center gap-1"
                    onClick={() => copyDefaultsMutation.mutate()}
                  >
                    <Copy size={12} /> Copy Brand Defaults
                  </button>
                )}
              </div>

              {/* Public Published Switch */}
              <div className="form-check form-switch p-3 bg-light rounded-3 border d-flex align-items-center justify-content-between mb-4">
                <div>
                  <label className="form-check-label fw-bold text-dark m-0 small" htmlFor="isPublishedSwitch">
                    Publish Digital Catalogue Online
                  </label>
                  <div className="text-muted extra-small">
                    When enabled, guests can scan QR codes or open the link to view your rooms and rates.
                  </div>
                </div>
                <input
                  className="form-check-input ms-3"
                  type="checkbox"
                  id="isPublishedSwitch"
                  checked={formData.is_published}
                  onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                />
              </div>

              {/* Headline & Tagline */}
              <div className="mb-3">
                <label className="form-label extra-small fw-bold text-dark">Hotel Headline / Title</label>
                <input
                  type="text"
                  className="form-control form-control-sm rounded-3"
                  placeholder={propertyDisplayName || 'e.g. Grand Royal Hotel & Suites'}
                  value={formData.hero_headline}
                  onChange={(e) => setFormData({ ...formData, hero_headline: e.target.value })}
                />
              </div>

              <div className="mb-3">
                <label className="form-label extra-small fw-bold text-dark">Marketing Subtitle / Tagline</label>
                <input
                  type="text"
                  className="form-control form-control-sm rounded-3"
                  placeholder="e.g. Centrally located luxury stay with world-class amenities"
                  value={formData.hero_tagline}
                  onChange={(e) => setFormData({ ...formData, hero_tagline: e.target.value })}
                />
              </div>

              {/* Theme Color Picker */}
              <div className="mb-4">
                <label className="form-label extra-small fw-bold text-dark d-block">Luxury Accent Color Theme</label>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  {THEME_OPTIONS.map((theme) => (
                    <button
                      key={theme.key}
                      type="button"
                      className={`btn btn-sm rounded-3 px-3 py-1.5 extra-small fw-bold d-inline-flex align-items-center gap-2 border ${
                        formData.accent_theme === theme.key ? 'border-dark shadow-sm ring-2' : 'border-light'
                      }`}
                      style={{ backgroundColor: theme.color, color: '#ffffff' }}
                      onClick={() => setFormData({ ...formData, accent_theme: theme.key })}
                    >
                      {formData.accent_theme === theme.key && <Check size={14} />}
                      <span>{theme.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Hero Banner Upload */}
              <div className="mb-4">
                <label className="form-label extra-small fw-bold text-dark d-block">Hero Cover Banner Image</label>
                {heroBannerPreview ? (
                  <div className="position-relative rounded-3 overflow-hidden border mb-2" style={{ maxHeight: '180px' }}>
                    <img src={heroBannerPreview} alt="Cover Preview" className="w-100 h-100 object-fit-cover" />
                    <button
                      type="button"
                      className="btn btn-danger btn-xs position-absolute top-0 end-0 m-2 rounded-circle p-1.5 shadow"
                      onClick={() => {
                        setHeroBannerFile(null);
                        setHeroBannerPreview(null);
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ) : (
                  <div className="border border-dashed rounded-3 p-4 text-center bg-light mb-2">
                    <ImageIcon size={32} className="text-muted mb-2" />
                    <div className="extra-small text-dark fw-bold">Upload high-resolution hotel exterior or lobby photo</div>
                    <div className="text-muted extra-small mb-2">Recommended: 1600 x 600 px (JPEG or PNG)</div>
                    <input
                      type="file"
                      accept="image/*"
                      id="heroBannerInput"
                      className="d-none"
                      onChange={handleBannerChange}
                    />
                    <label htmlFor="heroBannerInput" className="btn btn-sm btn-outline-primary rounded-pill px-3 extra-small fw-semibold cursor-pointer">
                      <Upload size={13} className="me-1 d-inline" /> Choose Banner Image
                    </label>
                  </div>
                )}
              </div>

              {/* Public Contact Channels */}
              <h6 className="fw-bold text-dark mb-3 mt-4 border-bottom pb-2">Direct Contact &amp; Inquiry Channels</h6>
              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label extra-small fw-bold text-dark">Front Desk Calling Phone</label>
                  <div className="input-group input-group-sm">
                    <span className="input-group-text"><Phone size={14} /></span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. +91 9876543210"
                      value={formData.contact_phone}
                      onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="form-label extra-small fw-bold text-dark">WhatsApp Direct Number</label>
                  <div className="input-group input-group-sm">
                    <span className="input-group-text text-success"><MessageSquare size={14} /></span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. 9876543210"
                      value={formData.whatsapp_number}
                      onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                    />
                  </div>
                </div>

                <div className="col-12">
                  <label className="form-label extra-small fw-bold text-dark">Public Contact Email</label>
                  <div className="input-group input-group-sm">
                    <span className="input-group-text"><Mail size={14} /></span>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="reservations@yourhotel.com"
                      value={formData.contact_email}
                      onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Check-in / Check-out Timings & Policies */}
              <h6 className="fw-bold text-dark mb-3 mt-4 border-bottom pb-2">Timings &amp; Guest Policies</h6>
              <div className="row g-3 mb-3">
                <div className="col-6">
                  <label className="form-label extra-small fw-bold text-dark">Check-in Time</label>
                  <input
                    type="text"
                    className="form-control form-control-sm rounded-3"
                    value={formData.check_in_time}
                    onChange={(e) => setFormData({ ...formData, check_in_time: e.target.value })}
                  />
                </div>
                <div className="col-6">
                  <label className="form-label extra-small fw-bold text-dark">Check-out Time</label>
                  <input
                    type="text"
                    className="form-control form-control-sm rounded-3"
                    value={formData.check_out_time}
                    onChange={(e) => setFormData({ ...formData, check_out_time: e.target.value })}
                  />
                </div>
                <div className="col-12">
                  <label className="form-label extra-small fw-bold text-dark">Cancellation Policy</label>
                  <textarea
                    rows="2"
                    className="form-control form-control-sm rounded-3"
                    value={formData.cancellation_policy}
                    onChange={(e) => setFormData({ ...formData, cancellation_policy: e.target.value })}
                  ></textarea>
                </div>
                <div className="col-12">
                  <label className="form-label extra-small fw-bold text-dark">House Rules &amp; ID Guidelines</label>
                  <textarea
                    rows="2"
                    className="form-control form-control-sm rounded-3"
                    value={formData.house_rules}
                    onChange={(e) => setFormData({ ...formData, house_rules: e.target.value })}
                  ></textarea>
                </div>
              </div>

              {/* About Hotel Section & Story */}
              <h6 className="fw-bold text-dark mb-3 mt-4 border-bottom pb-2">About Property &amp; Brand Story</h6>
              <div className="mb-3">
                <label className="form-label extra-small fw-bold text-dark">About Section Title</label>
                <input
                  type="text"
                  className="form-control form-control-sm rounded-3"
                  placeholder="Our Heritage &amp; Signature Hospitality"
                  value={formData.about_title}
                  onChange={(e) => setFormData({ ...formData, about_title: e.target.value })}
                />
              </div>
              <div className="mb-3">
                <label className="form-label extra-small fw-bold text-dark">About Property Story &amp; Welcome Message</label>
                <textarea
                  rows="3"
                  className="form-control form-control-sm rounded-3"
                  placeholder="Welcome guests to your lodge or hotel with a warm story..."
                  value={formData.about_text}
                  onChange={(e) => setFormData({ ...formData, about_text: e.target.value })}
                ></textarea>
              </div>

              {/* Key Quick Stats Badges */}
              <div className="mb-4">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <label className="form-label extra-small fw-bold text-dark m-0">About Section Quick Stats:</label>
                </div>
                <div className="row g-2 mb-2">
                  {stats.map((st, idx) => (
                    <div key={idx} className="col-6">
                      <div className="p-2.5 bg-light rounded-3 border d-flex align-items-center justify-content-between">
                        <div>
                          <strong className="d-block text-dark small">{st.value}</strong>
                          <span className="extra-small text-muted">{st.label}</span>
                        </div>
                        <button
                          type="button"
                          className="btn btn-link btn-xs text-danger p-0"
                          onClick={() => handleDeleteStat(idx)}
                          title="Delete Stat"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Stat Inline */}
                <div className="d-flex align-items-center gap-2 mt-2">
                  <input
                    type="text"
                    className="form-control form-control-sm rounded-2 extra-small"
                    style={{ maxWidth: '100px' }}
                    placeholder="e.g. 100%"
                    value={newStat.value}
                    onChange={(e) => setNewStat({ ...newStat, value: e.target.value })}
                  />
                  <input
                    type="text"
                    className="form-control form-control-sm rounded-2 extra-small flex-grow-1"
                    placeholder="e.g. Direct Rate Guarantee"
                    value={newStat.label}
                    onChange={(e) => setNewStat({ ...newStat, label: e.target.value })}
                  />
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary rounded-2 extra-small fw-bold d-inline-flex align-items-center gap-1 flex-shrink-0"
                    onClick={handleAddStat}
                  >
                    <Plus size={13} /> Add Stat
                  </button>
                </div>
              </div>

              {/* Direct Booking Privileges */}
              <div className="mb-4">
                <label className="form-label extra-small fw-bold text-dark d-block mb-2">Direct Booking Privileges &amp; Guarantees:</label>
                <div className="d-flex flex-column gap-1.5 mb-2">
                  {directPrivileges.map((priv, pIdx) => (
                    <div key={pIdx} className="d-flex align-items-center justify-content-between p-2 rounded-2 bg-light border extra-small">
                      <span className="text-dark fw-medium">✓ {priv}</span>
                      <button
                        type="button"
                        className="btn btn-link btn-xs text-danger p-0"
                        onClick={() => handleDeletePrivilege(pIdx)}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="d-flex align-items-center gap-2">
                  <input
                    type="text"
                    className="form-control form-control-sm rounded-2 extra-small"
                    placeholder="e.g. Complimentary Early Check-in Priority"
                    value={newPrivilege}
                    onChange={(e) => setNewPrivilege(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddPrivilege(e);
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary rounded-2 extra-small fw-bold d-inline-flex align-items-center gap-1 flex-shrink-0"
                    onClick={handleAddPrivilege}
                  >
                    <Plus size={13} /> Add Perk
                  </button>
                </div>
              </div>

              <div className="d-flex justify-content-end pt-3">
                <button
                  type="button"
                  className="btn btn-primary fw-bold px-4 py-2 rounded-3 shadow-xs d-inline-flex align-items-center gap-1.5"
                  disabled={saveConfigMutation.isPending}
                  onClick={() => saveConfigMutation.mutate()}
                >
                  <Save size={16} />
                  <span>{saveConfigMutation.isPending ? 'Publishing...' : 'Save & Publish Changes'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Live Simulator Panel */}
          <div className="col-lg-5">
            <div className="card border-0 rounded-4 shadow-sm bg-white p-3 sticky-top" style={{ top: '20px' }}>
              <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2 flex-wrap gap-2">
                <div className="d-flex align-items-center gap-2">
                  <Eye size={18} className="text-primary" />
                  <span className="fw-bold text-dark small">Live Guest Simulator</span>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <div className="btn-group btn-group-sm">
                    <button
                      type="button"
                      className={`btn btn-xs ${previewDevice === 'mobile' ? 'btn-dark fw-bold' : 'btn-light border'}`}
                      onClick={() => setPreviewDevice('mobile')}
                      title="Mobile View (390px)"
                    >
                      <Smartphone size={13} />
                      <span className="ms-1 d-none d-md-inline">Mobile (390px)</span>
                    </button>
                    <button
                      type="button"
                      className={`btn btn-xs ${previewDevice === 'tablet' ? 'btn-dark fw-bold' : 'btn-light border'}`}
                      onClick={() => setPreviewDevice('tablet')}
                      title="Tablet View (768px)"
                    >
                      <Tablet size={13} />
                      <span className="ms-1 d-none d-md-inline">Tablet (768px)</span>
                    </button>
                    <button
                      type="button"
                      className={`btn btn-xs ${previewDevice === 'desktop' ? 'btn-dark fw-bold' : 'btn-light border'}`}
                      onClick={() => setPreviewDevice('desktop')}
                      title="Desktop View (100%)"
                    >
                      <Monitor size={13} />
                      <span className="ms-1 d-none d-md-inline">Desktop</span>
                    </button>
                  </div>

                  {publicCatalogueUrl && (
                    <a
                      href={publicCatalogueUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-xs btn-primary text-white rounded-pill px-3 py-1 extra-small fw-bold d-inline-flex align-items-center gap-1 shadow-xs"
                      title="Open full landing page in separate browser tab"
                    >
                      <ExternalLink size={12} />
                      <span>Fullscreen View</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Simulator Frame with smooth scrolling and device shell */}
              <div
                className="mx-auto rounded-4 overflow-hidden border shadow-lg position-relative bg-dark"
                style={{
                  width: previewDevice === 'mobile' ? '390px' : previewDevice === 'tablet' ? '768px' : '100%',
                  maxWidth: '100%',
                  height: '760px',
                  borderWidth: previewDevice === 'desktop' ? '3px' : '10px',
                  borderColor: '#0f172a',
                  transition: 'width 0.35s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                {/* Mobile Camera Notch & Speaker Indicator */}
                {previewDevice === 'mobile' && (
                  <div className="position-absolute top-0 start-50 translate-middle-x z-3 pt-1 pointer-events-none">
                    <div className="bg-dark rounded-pill shadow-xs" style={{ width: '90px', height: '14px', border: '1px solid #334155' }}></div>
                  </div>
                )}

                {publicCatalogueUrl ? (
                  <iframe
                    key={`${publicCatalogueUrl}-${config.updated_at || 'live'}`}
                    src={publicCatalogueUrl}
                    title="Live Preview"
                    className="w-100 h-100 border-0 bg-white"
                    scrolling="yes"
                    style={{
                      overflowY: 'auto',
                      WebkitOverflowScrolling: 'touch',
                      display: 'block'
                    }}
                  ></iframe>
                ) : (
                  <div className="w-100 h-100 d-flex flex-column align-items-center justify-content-center p-4 text-center text-muted bg-white">
                    <div className="spinner-border text-primary mb-2" role="status" style={{ width: '2rem', height: '2rem' }}></div>
                    <span className="small fw-semibold">Loading Live Preview...</span>
                  </div>
                )}
              </div>

              <div className="d-flex align-items-center justify-content-between mt-2.5 px-1 text-muted extra-small">
                <span>💡 Tip: Scroll inside the frame or click Fullscreen to open in new tab</span>
                <span className="d-flex align-items-center gap-1 text-primary fw-semibold cursor-pointer" onClick={() => refetchConfig()}>
                  <RefreshCw size={11} /> Refresh Preview
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: HOTEL PROPERTY GALLERY PHOTOS */}
      {activeTab === 'gallery' && (
        <div className="card border-0 rounded-4 shadow-sm bg-white p-4">
          <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
            <div>
              <h5 className="fw-bold text-dark m-0 d-flex align-items-center gap-2">
                <ImageIcon size={20} className="text-primary" /> Hotel Property Photo Gallery &amp; Slider
              </h5>
              <span className="text-muted extra-small">
                Upload real photos of your hotel reception, exterior, lobby, dining, and property for the dynamic public slideshow.
              </span>
            </div>
            <span className="badge bg-primary-subtle text-primary border border-primary-subtle extra-small px-3 py-1.5 fw-bold">
              {hotelGalleryPhotos.length} Photos in Gallery
            </span>
          </div>

          {/* Upload Form */}
          <form onSubmit={handleUploadGalleryPhoto} className="p-3.5 mb-4 rounded-3 border bg-light">
            <h6 className="fw-bold text-dark mb-2 extra-small text-uppercase">Upload New Hotel Photo:</h6>
            <div className="row g-3 align-items-end">
              <div className="col-md-5">
                <label className="form-label extra-small fw-bold text-dark mb-1">Select Image File</label>
                <input
                  type="file"
                  accept="image/*"
                  className="form-control form-control-sm"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setGalleryUploadFile(file);
                      setGalleryUploadPreview(URL.createObjectURL(file));
                    }
                  }}
                />
              </div>
              <div className="col-md-5">
                <label className="form-label extra-small fw-bold text-dark mb-1">Photo Caption / Description</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="e.g. Grand Heritage Architecture &amp; Arrival Porch"
                  value={galleryCaption}
                  onChange={(e) => setGalleryCaption(e.target.value)}
                />
              </div>
              <div className="col-md-2">
                <button
                  type="submit"
                  disabled={!galleryUploadFile || isUploadingGallery}
                  className="btn btn-sm btn-primary w-100 fw-bold d-inline-flex align-items-center justify-content-center gap-1.5"
                >
                  <Upload size={14} />
                  <span>{isUploadingGallery ? 'Uploading...' : 'Upload'}</span>
                </button>
              </div>
            </div>
            {galleryUploadPreview && (
              <div className="mt-3 d-flex align-items-center gap-2">
                <img src={galleryUploadPreview} alt="Preview" className="rounded-2 border object-fit-cover" style={{ width: '80px', height: '56px' }} />
                <span className="extra-small text-muted">Ready to upload</span>
              </div>
            )}
          </form>

          {/* Gallery Photos Grid */}
          <div className="row g-3">
            {hotelGalleryPhotos.length === 0 ? (
              <div className="col-12 py-5 text-center text-muted">
                <ImageIcon size={44} className="mb-2 text-secondary opacity-50" />
                <div className="fw-bold">No hotel property photos uploaded yet.</div>
                <div className="extra-small mt-1">Upload photos above to display your real property images in the public slideshow and PDF brochure.</div>
              </div>
            ) : (
              hotelGalleryPhotos.map((photo, pIdx) => (
                <div key={photo.id} className="col-6 col-md-4 col-lg-3">
                  <div className="card h-100 border rounded-3 overflow-hidden shadow-xs">
                    <div className="position-relative" style={{ height: '140px' }}>
                      <img src={photo.image_url || photo.image} alt={photo.caption || 'Hotel'} className="w-100 h-100 object-fit-cover" />
                      <span className="badge bg-dark bg-opacity-75 text-white position-absolute top-0 start-0 m-2 extra-small">
                        #{pIdx + 1}
                      </span>
                      <button
                        type="button"
                        className="btn btn-sm btn-danger position-absolute top-0 end-0 m-2 p-1 rounded-circle"
                        title="Delete Photo"
                        onClick={() => handleDeleteGalleryPhoto(photo.id)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <div className="p-2.5 bg-white">
                      <div className="fw-bold extra-small text-dark text-truncate" title={photo.caption}>
                        {photo.caption || 'Hotel Property Photo'}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ROOM SHOWCASE & PHOTOS */}
      {activeTab === 'rooms' && (
        <div className="card border-0 rounded-4 shadow-sm bg-white p-4">
          <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
            <div>
              <h5 className="fw-bold text-dark m-0">Room Inventory Showcase &amp; Photos</h5>
              <span className="text-muted extra-small">
                Control which rooms appear on the digital catalogue and attach high-definition photos
              </span>
            </div>
            <span className="badge bg-light text-dark border extra-small px-3 py-1.5">
              {roomTypes.filter(r => r.show_in_catalogue).length} of {roomTypes.length} Rooms Visible
            </span>
          </div>

          <div className="space-y-4">
            {roomTypes.map((room) => {
              const photos = room.photos || [];

              return (
                <div key={room.id} className="p-3.5 mb-3.5 rounded-3 border bg-light">
                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-3 border-bottom pb-3">
                    <div className="d-flex align-items-center gap-3">
                      <div className="rounded-3 bg-white border p-2 shadow-xs d-flex align-items-center justify-content-center" style={{ width: '42px', height: '42px' }}>
                        <BedDouble size={22} className="text-primary" />
                      </div>
                      <div>
                        <h6 className="fw-bold text-dark m-0 d-flex align-items-center gap-2">
                          {room.name}
                          <span className="badge bg-primary text-white rounded-pill extra-small">
                            ₹{formatCurrency(room.base_price)}/night
                          </span>
                        </h6>
                        <span className="text-muted extra-small">
                          Capacity: {room.max_adults} Adults &bull; {room.max_children} Children
                        </span>
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-3 flex-wrap">
                      {/* Promotional Badge Input */}
                      <div className="d-flex align-items-center gap-1.5">
                        <span className="extra-small text-muted fw-semibold">Promo Chip:</span>
                        <input
                          type="text"
                          className="form-control form-control-sm rounded-2 py-1 px-2 extra-small"
                          style={{ width: '130px' }}
                          placeholder="e.g. Best Value"
                          defaultValue={room.catalogue_badge || ''}
                          onBlur={(e) => handleUpdateRoomBadge(room.id, e.target.value)}
                        />
                      </div>

                      {/* Visibility Toggle */}
                      <div className="form-check form-switch m-0 d-flex align-items-center gap-2">
                        <input
                          className="form-check-input cursor-pointer"
                          type="checkbox"
                          id={`showRoom_${room.id}`}
                          checked={room.show_in_catalogue ?? true}
                          onChange={() => handleToggleRoomVisibility(room.id, room.show_in_catalogue ?? true)}
                        />
                        <label className="form-check-label extra-small fw-bold text-dark cursor-pointer" htmlFor={`showRoom_${room.id}`}>
                          {room.show_in_catalogue ? 'Visible' : 'Hidden'}
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Photos Grid & Uploader */}
                  <div>
                    <span className="extra-small fw-bold text-muted text-uppercase d-block mb-2">
                      Attached Photos ({photos.length}):
                    </span>

                    <div className="d-flex align-items-center gap-2.5 flex-wrap">
                      {photos.map((photo) => (
                        <div
                          key={photo.id}
                          className="position-relative rounded-3 overflow-hidden border shadow-xs bg-dark"
                          style={{ width: '110px', height: '80px' }}
                        >
                          <img src={photo.image} alt={photo.caption || 'Room'} className="w-100 h-100 object-fit-cover" />

                          {/* Primary indicator */}
                          {photo.is_primary && (
                            <div className="position-absolute top-0 start-0 m-1">
                              <span className="badge bg-warning text-dark p-1 rounded-circle" title="Primary Thumbnail">
                                <Star size={10} fill="currentColor" />
                              </span>
                            </div>
                          )}

                          {/* Actions overlay */}
                          <div className="position-absolute bottom-0 start-0 end-0 p-1 bg-dark bg-opacity-75 d-flex align-items-center justify-content-between">
                            {!photo.is_primary && (
                              <button
                                type="button"
                                className="btn btn-link btn-xs text-warning p-0"
                                title="Set as primary"
                                onClick={() => handleSetPrimaryPhoto(photo.id)}
                              >
                                <Star size={12} />
                              </button>
                            )}
                            <button
                              type="button"
                              className="btn btn-link btn-xs text-danger p-0 ms-auto"
                              title="Delete photo"
                              onClick={() => handleDeletePhoto(photo.id)}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Upload Button */}
                      <label
                        className="rounded-3 border border-dashed d-flex flex-column align-items-center justify-content-center text-muted cursor-pointer hover-bg-white transition-all"
                        style={{ width: '110px', height: '80px', cursor: 'pointer' }}
                      >
                        <Upload size={18} className="text-primary mb-1" />
                        <span className="extra-small fw-semibold">+ Add Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="d-none"
                          onChange={(e) => handlePhotoUpload(room.id, e.target.files[0])}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: HOTEL FACILITIES */}
      {activeTab === 'facilities' && (
        <div className="card border-0 rounded-4 shadow-sm bg-white p-4">
          <div className="d-flex align-items-center justify-content-between mb-4">
            <div>
              <h5 className="fw-bold text-dark m-0">Hotel Facilities &amp; Amenities</h5>
              <span className="text-muted extra-small">Toggle amenities displayed on the public landing page</span>
            </div>
          </div>

          <div className="row g-3 row-cols-1 row-cols-sm-2 row-cols-md-3">
            {facilities.map((facility) => (
              <div key={facility.key} className="col">
                <div
                  className={`p-3 rounded-3 border d-flex align-items-center justify-content-between cursor-pointer transition-all ${
                    facility.enabled ? 'bg-primary-subtle border-primary-subtle' : 'bg-light'
                  }`}
                  onClick={() => handleToggleFacility(facility.key)}
                >
                  <span className="small fw-semibold text-dark">{facility.label}</span>
                  <div className="form-check form-switch m-0">
                    <input
                      className="form-check-input cursor-pointer"
                      type="checkbox"
                      checked={facility.enabled}
                      onChange={() => handleToggleFacility(facility.key)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="d-flex justify-content-end pt-4 mt-3 border-top">
            <button
              type="button"
              className="btn btn-primary fw-bold px-4 py-2 rounded-3 shadow-xs d-inline-flex align-items-center gap-1.5"
              disabled={saveConfigMutation.isPending}
              onClick={() => saveConfigMutation.mutate()}
            >
              <Save size={16} />
              <span>Save Facilities</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB: FREQUENTLY ASKED QUESTIONS (FAQS) */}
      {activeTab === 'faqs' && (
        <div className="card border-0 rounded-4 shadow-sm bg-white p-4">
          <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
            <div>
              <h5 className="fw-bold text-dark m-0 d-flex align-items-center gap-2">
                <HelpCircle size={20} className="text-primary" /> Frequently Asked Questions (FAQs)
              </h5>
              <span className="text-muted extra-small">
                Manage questions, answers, category badges, and quick-highlight pills on the public catalogue.
              </span>
            </div>
            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm rounded-3 extra-small fw-semibold"
                onClick={() => {
                  if (window.confirm('Reset FAQs to standard hospitality questions?')) {
                    setFaqs(DEFAULT_FAQS);
                    showSuccess('Reset to default FAQs. Click "Save & Publish" to commit.');
                  }
                }}
              >
                Reset Defaults
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm rounded-3 fw-bold extra-small d-inline-flex align-items-center gap-1.5"
                onClick={() => {
                  setEditingFaqId(null);
                  setFaqForm({ q: '', a: '', category: 'checkin', highlights: '' });
                  setIsAddingFaq(!isAddingFaq);
                }}
              >
                <Plus size={14} />
                <span>{isAddingFaq ? 'Cancel' : 'Add Question'}</span>
              </button>
            </div>
          </div>

          {/* Add / Edit FAQ Form */}
          {isAddingFaq && (
            <form onSubmit={handleSaveFaq} className="p-3.5 mb-4 rounded-3 border bg-light">
              <h6 className="fw-bold text-dark mb-3 small">
                {editingFaqId ? 'Edit FAQ Item:' : 'Create New FAQ Item:'}
              </h6>
              <div className="row g-3">
                <div className="col-md-8">
                  <label className="form-label extra-small fw-bold text-dark">Question *</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="e.g. What are the standard check-in and check-out timings?"
                    value={faqForm.q}
                    onChange={(e) => setFaqForm({ ...faqForm, q: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label extra-small fw-bold text-dark">Category Filter</label>
                  <select
                    className="form-select form-select-sm"
                    value={faqForm.category}
                    onChange={(e) => setFaqForm({ ...faqForm, category: e.target.value })}
                  >
                    <option value="checkin">Check-in &amp; Rules</option>
                    <option value="amenities">Amenities &amp; Wi-Fi</option>
                    <option value="dining">Dining &amp; Food</option>
                    <option value="booking">Booking &amp; Tariffs</option>
                    <option value="location">Location &amp; Transit</option>
                    <option value="general">General Stay</option>
                  </select>
                </div>
                <div className="col-12">
                  <label className="form-label extra-small fw-bold text-dark">Answer / Explanation *</label>
                  <textarea
                    rows="3"
                    className="form-control form-control-sm"
                    placeholder="Provide a detailed, helpful answer for your guests..."
                    value={faqForm.a}
                    onChange={(e) => setFaqForm({ ...faqForm, a: e.target.value })}
                    required
                  ></textarea>
                </div>
                <div className="col-12">
                  <label className="form-label extra-small fw-bold text-dark">
                    Highlight Badges (comma-separated, e.g. "Standard Check-in: 12:00 PM, 24/7 Front Desk")
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="e.g. Free Cancellation, 100% Refund, Free Wi-Fi"
                    value={faqForm.highlights}
                    onChange={(e) => setFaqForm({ ...faqForm, highlights: e.target.value })}
                  />
                </div>
              </div>
              <div className="d-flex justify-content-end gap-2 mt-3">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary extra-small fw-semibold"
                  onClick={() => setIsAddingFaq(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-sm btn-primary extra-small fw-bold px-3"
                >
                  {editingFaqId ? 'Update FAQ' : 'Add FAQ'}
                </button>
              </div>
            </form>
          )}

          {/* FAQs List */}
          <div className="d-flex flex-column gap-3">
            {faqs.length === 0 ? (
              <div className="py-5 text-center text-muted">
                <HelpCircle size={40} className="mb-2 text-secondary opacity-50" />
                <div className="fw-bold">No FAQ items defined.</div>
                <div className="extra-small">Click "Add Question" or "Reset Defaults" above.</div>
              </div>
            ) : (
              faqs.map((faq, idx) => (
                <div key={faq.id || idx} className="p-3.5 rounded-3 border bg-light">
                  <div className="d-flex align-items-start justify-content-between gap-3 mb-2">
                    <div>
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <span className="badge bg-primary-subtle text-primary border border-primary-subtle extra-small text-uppercase fw-bold">
                          {faq.category || 'general'}
                        </span>
                        <span className="extra-small text-muted">#{idx + 1}</span>
                      </div>
                      <h6 className="fw-bold text-dark m-0 small">{faq.q}</h6>
                    </div>
                    <div className="d-flex align-items-center gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-xs p-1 rounded-2"
                        title="Edit FAQ"
                        onClick={() => handleEditFaq(faq)}
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-xs p-1 rounded-2"
                        title="Delete FAQ"
                        onClick={() => handleDeleteFaq(faq.id)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <p className="text-secondary extra-small mb-2" style={{ lineHeight: '1.6' }}>
                    {faq.a}
                  </p>

                  {Array.isArray(faq.highlights) && faq.highlights.length > 0 && (
                    <div className="d-flex align-items-center gap-1.5 flex-wrap pt-2 border-top">
                      {faq.highlights.map((hl, hIdx) => (
                        <span key={hIdx} className="badge bg-white text-secondary border extra-small fw-semibold py-1 px-2">
                          ✓ {hl}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="d-flex justify-content-end pt-4 mt-3 border-top">
            <button
              type="button"
              className="btn btn-primary fw-bold px-4 py-2 rounded-3 shadow-xs d-inline-flex align-items-center gap-1.5"
              disabled={saveConfigMutation.isPending}
              onClick={() => saveConfigMutation.mutate()}
            >
              <Save size={16} />
              <span>{saveConfigMutation.isPending ? 'Publishing...' : 'Save FAQs'}</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB: GUEST REVIEWS & RATINGS */}
      {activeTab === 'reviews' && (
        <div className="card border-0 rounded-4 shadow-sm bg-white p-4">
          <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
            <div>
              <h5 className="fw-bold text-dark m-0 d-flex align-items-center gap-2">
                <Star size={20} className="text-warning fill-current" /> Verified Guest Reviews &amp; Ratings
              </h5>
              <span className="text-muted extra-small">
                Control rating summary score, 4-pillar breakdown progress bars, and authentic guest testimonial cards.
              </span>
            </div>
            <div className="d-flex align-items-center gap-3">
              <div className="form-check form-switch m-0 d-flex align-items-center gap-2 bg-light p-2 rounded-3 border">
                <input
                  className="form-check-input ms-0 cursor-pointer"
                  type="checkbox"
                  id="showReviewsSwitch"
                  checked={showReviews}
                  onChange={(e) => setShowReviews(e.target.checked)}
                />
                <label className="form-check-label extra-small fw-bold text-dark cursor-pointer" htmlFor="showReviewsSwitch">
                  {showReviews ? '● Reviews Visible' : '○ Section Hidden'}
                </label>
              </div>
            </div>
          </div>

          {/* Rating Summary Breakdown Box */}
          <div className="p-3.5 mb-4 rounded-3 border bg-light">
            <h6 className="fw-bold text-dark mb-3 small text-uppercase">Overall Hotel Score &amp; Breakdown:</h6>
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label extra-small fw-bold text-dark">Overall Rating Score (out of 5.0)</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  className="form-control form-control-sm fw-bold text-primary"
                  value={ratingSummary.overall_rating || 4.9}
                  onChange={(e) => setRatingSummary({ ...ratingSummary, overall_rating: parseFloat(e.target.value) || 4.9 })}
                />
              </div>
              <div className="col-md-9">
                <label className="form-label extra-small fw-bold text-dark">Total Reviews Subtitle</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="e.g. Based on 420+ authentic verified guest stay experiences"
                  value={ratingSummary.total_reviews_text || ''}
                  onChange={(e) => setRatingSummary({ ...ratingSummary, total_reviews_text: e.target.value })}
                />
              </div>

              {/* 4 Category Breakdown Bars */}
              <div className="col-12 mt-2">
                <span className="extra-small fw-bold text-muted text-uppercase d-block mb-2">Category Score Breakdown Bars:</span>
                <div className="row g-2">
                  {(ratingSummary.categories || []).map((cat, cIdx) => (
                    <div key={cIdx} className="col-md-6">
                      <div className="p-2.5 bg-white rounded-2 border">
                        <div className="d-flex align-items-center justify-content-between mb-1.5 extra-small fw-bold">
                          <span className="text-dark">{cat.label}</span>
                          <span className="text-primary">{cat.score} / 5.0 ({cat.progress}%)</span>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <input
                            type="range"
                            min="80"
                            max="100"
                            className="form-range flex-grow-1"
                            value={cat.progress}
                            onChange={(e) => {
                              const prog = parseInt(e.target.value, 10);
                              const newScore = parseFloat((prog / 20).toFixed(1));
                              const updated = [...ratingSummary.categories];
                              updated[cIdx] = { ...updated[cIdx], progress: prog, score: newScore };
                              setRatingSummary({ ...ratingSummary, categories: updated });
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Testimonials Management */}
          <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
            <h6 className="fw-bold text-dark m-0 small text-uppercase">
              Guest Testimonial Cards ({reviews.length})
            </h6>
            <button
              type="button"
              className="btn btn-sm btn-outline-primary rounded-3 extra-small fw-bold d-inline-flex align-items-center gap-1"
              onClick={() => setIsAddingReview(!isAddingReview)}
            >
              <Plus size={14} />
              <span>{isAddingReview ? 'Cancel' : 'Add Guest Review'}</span>
            </button>
          </div>

          {/* Add Review Form */}
          {isAddingReview && (
            <form onSubmit={handleSaveReview} className="p-3.5 mb-3 rounded-3 border bg-light">
              <h6 className="fw-bold text-dark mb-2 extra-small text-uppercase">Add New Testimonial Card:</h6>
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label extra-small fw-bold text-dark">Guest Name *</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="e.g. Rameshwar Patil"
                    value={reviewForm.guest_name}
                    onChange={(e) => setReviewForm({ ...reviewForm, guest_name: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label extra-small fw-bold text-dark">Stay Badge / Type</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="e.g. Family Stay, Business Trip"
                    value={reviewForm.stay_type}
                    onChange={(e) => setReviewForm({ ...reviewForm, stay_type: e.target.value })}
                  />
                </div>
                <div className="col-md-2">
                  <label className="form-label extra-small fw-bold text-dark">Rating (1-5)</label>
                  <select
                    className="form-select form-select-sm"
                    value={reviewForm.rating}
                    onChange={(e) => setReviewForm({ ...reviewForm, rating: parseInt(e.target.value, 10) })}
                  >
                    <option value={5}>5 Stars ★★★★★</option>
                    <option value={4}>4 Stars ★★★★</option>
                    <option value={3}>3 Stars ★★★</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label extra-small fw-bold text-dark">Stay Date Tag</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="e.g. Stayed Aug 2026"
                    value={reviewForm.stay_date}
                    onChange={(e) => setReviewForm({ ...reviewForm, stay_date: e.target.value })}
                  />
                </div>
                <div className="col-12">
                  <label className="form-label extra-small fw-bold text-dark">Review Feedback *</label>
                  <textarea
                    rows="2"
                    className="form-control form-control-sm"
                    placeholder="Guest's comments about cleanliness, food, front desk service..."
                    value={reviewForm.review_text}
                    onChange={(e) => setReviewForm({ ...reviewForm, review_text: e.target.value })}
                    required
                  ></textarea>
                </div>
              </div>
              <div className="d-flex justify-content-end gap-2 mt-3">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary extra-small"
                  onClick={() => setIsAddingReview(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-sm btn-primary extra-small fw-bold px-3"
                >
                  Save Review Card
                </button>
              </div>
            </form>
          )}

          {/* Review Cards Grid */}
          <div className="row g-3">
            {reviews.map((rev, rIdx) => (
              <div key={rev.id || rIdx} className="col-md-4">
                <div className="p-3 rounded-3 border bg-light h-100 d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex align-items-center justify-content-between mb-1.5">
                      <div className="d-flex align-items-center gap-0.5 text-warning">
                        {[...Array(rev.rating || 5)].map((_, i) => (
                          <Star key={i} size={12} className="fill-current" />
                        ))}
                      </div>
                      <div className="d-flex align-items-center gap-1">
                        <span className="badge bg-white text-secondary border extra-small">
                          {rev.stay_type || 'Verified'}
                        </span>
                        <button
                          type="button"
                          className="btn btn-link btn-xs text-danger p-0 ms-1"
                          onClick={() => handleDeleteReview(rev.id)}
                          title="Delete Review"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                    <p className="extra-small text-secondary mb-2 fst-italic" style={{ lineHeight: '1.5' }}>
                      "{rev.review_text}"
                    </p>
                  </div>
                  <div className="pt-2 border-top">
                    <span className="fw-bold small text-dark d-block">{rev.guest_name}</span>
                    <span className="extra-small text-muted">{rev.stay_date || 'Verified Guest'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="d-flex justify-content-end pt-4 mt-3 border-top">
            <button
              type="button"
              className="btn btn-primary fw-bold px-4 py-2 rounded-3 shadow-xs d-inline-flex align-items-center gap-1.5"
              disabled={saveConfigMutation.isPending}
              onClick={() => saveConfigMutation.mutate()}
            >
              <Save size={16} />
              <span>{saveConfigMutation.isPending ? 'Publishing...' : 'Save Reviews & Ratings'}</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: LOCATION & GOOGLE MAPS */}
      {activeTab === 'location' && (
        <div className="card border-0 rounded-4 shadow-sm bg-white p-4">
          <h5 className="fw-bold text-dark mb-1">Google Maps Location &amp; Directions</h5>
          <span className="text-muted extra-small d-block mb-4">
            Help guests find your hotel instantly with embedded maps and GPS navigation
          </span>

          <div className="row g-4">
            <div className="col-lg-6">
              <div className="mb-3">
                <label className="form-label extra-small fw-bold text-dark">Physical Address (Catalogue Display)</label>
                <textarea
                  rows="2"
                  className="form-control form-control-sm rounded-3"
                  placeholder={currentProperty.address || 'Full address'}
                  value={formData.address_override}
                  onChange={(e) => setFormData({ ...formData, address_override: e.target.value })}
                ></textarea>
              </div>

              <div className="mb-3">
                <label className="form-label extra-small fw-bold text-dark">City</label>
                <input
                  type="text"
                  className="form-control form-control-sm rounded-3"
                  placeholder={currentProperty.city || 'e.g. Pune'}
                  value={formData.city_override}
                  onChange={(e) => setFormData({ ...formData, city_override: e.target.value })}
                />
              </div>

              <div className="mb-3">
                <label className="form-label extra-small fw-bold text-dark">Prominent Landmark Note</label>
                <input
                  type="text"
                  className="form-control form-control-sm rounded-3"
                  placeholder="e.g. Opposite Central Railway Station, next to City Mall"
                  value={formData.landmark}
                  onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                />
              </div>

              <div className="mb-3">
                <label className="form-label extra-small fw-bold text-dark">Google Maps Embed Iframe URL</label>
                <input
                  type="text"
                  className="form-control form-control-sm rounded-3"
                  placeholder="https://www.google.com/maps/embed?pb=..."
                  value={formData.google_maps_embed_url}
                  onChange={(e) => setFormData({ ...formData, google_maps_embed_url: e.target.value })}
                />
                <div className="extra-small text-muted mt-1">
                  On Google Maps: Share &gt; Embed a map &gt; Copy HTML (paste the src URL here)
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label extra-small fw-bold text-dark">Google Maps Directions Link</label>
                <input
                  type="url"
                  className="form-control form-control-sm rounded-3"
                  placeholder="https://maps.app.goo.gl/..."
                  value={formData.google_maps_directions_url}
                  onChange={(e) => setFormData({ ...formData, google_maps_directions_url: e.target.value })}
                />
              </div>

              <button
                type="button"
                className="btn btn-primary fw-bold px-4 py-2 rounded-3 shadow-xs d-inline-flex align-items-center gap-1.5"
                disabled={saveConfigMutation.isPending}
                onClick={() => saveConfigMutation.mutate()}
              >
                <Save size={16} />
                <span>Save Location</span>
              </button>
            </div>

            <div className="col-lg-6">
              <span className="extra-small fw-bold text-muted text-uppercase d-block mb-2">Live Map Preview:</span>
              {formData.google_maps_embed_url ? (
                <div className="rounded-3 overflow-hidden border shadow-xs" style={{ height: '320px' }}>
                  <iframe
                    title="Map Preview"
                    src={formData.google_maps_embed_url}
                    width="100%"
                    height="320"
                    style={{ border: 0 }}
                  ></iframe>
                </div>
              ) : (
                <div className="rounded-3 border border-dashed bg-light d-flex flex-column align-items-center justify-content-center p-5 text-center" style={{ height: '320px' }}>
                  <MapPin size={38} className="text-muted mb-2" />
                  <div className="small fw-semibold text-dark">No Map Embed URL Configured</div>
                  <div className="extra-small text-muted max-w-xs mt-1">
                    Paste your Google Maps embed link on the left to show interactive maps to guests.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Nearby Transit Hubs & Landmarks Section */}
          <div className="mt-4 pt-4 border-top">
            <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
              <div>
                <h6 className="fw-bold text-dark m-0 small text-uppercase">
                  Nearby Transit Hubs &amp; Landmarks ({nearbyPlaces.length})
                </h6>
                <span className="text-muted extra-small">
                  Display travel distances and transit hubs (Railway, Bus, Airport, Temples) on your catalogue.
                </span>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-outline-primary rounded-3 extra-small fw-bold d-inline-flex align-items-center gap-1"
                onClick={() => setIsAddingPlace(!isAddingPlace)}
              >
                <Plus size={14} />
                <span>{isAddingPlace ? 'Cancel' : 'Add Landmark / Hub'}</span>
              </button>
            </div>

            {/* Add Landmark Form */}
            {isAddingPlace && (
              <form onSubmit={handleSavePlace} className="p-3.5 mb-3 rounded-3 border bg-light">
                <h6 className="fw-bold text-dark mb-2 extra-small text-uppercase">Add New Transit Point or Landmark:</h6>
                <div className="row g-3">
                  <div className="col-md-2">
                    <label className="form-label extra-small fw-bold text-dark">Category / Icon</label>
                    <select
                      className="form-select form-select-sm"
                      value={placeForm.icon}
                      onChange={(e) => setPlaceForm({ ...placeForm, icon: e.target.value })}
                    >
                      <option value="train">🚆 Railway Station</option>
                      <option value="bus">🚌 Bus Terminal</option>
                      <option value="plane">✈️ Airport</option>
                      <option value="monument">🏛️ Temple / Landmark</option>
                      <option value="car">🚖 Taxi / Highway</option>
                    </select>
                  </div>
                  <div className="col-md-5">
                    <label className="form-label extra-small fw-bold text-dark">Point / Landmark Name *</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="e.g. Central Railway Junction"
                      value={placeForm.name}
                      onChange={(e) => setPlaceForm({ ...placeForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label extra-small fw-bold text-dark">Distance</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="e.g. ~ 2.5 km"
                      value={placeForm.distance}
                      onChange={(e) => setPlaceForm({ ...placeForm, distance: e.target.value })}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label extra-small fw-bold text-dark">Duration (Driving)</label>
                    <div className="input-group input-group-sm">
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. 7 mins"
                        value={placeForm.duration}
                        onChange={(e) => setPlaceForm({ ...placeForm, duration: e.target.value })}
                      />
                      <button type="submit" className="btn btn-primary fw-bold px-3">
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            )}

            {/* List of Landmarks */}
            <div className="row g-2">
              {nearbyPlaces.map((pl, pIdx) => {
                const getIconEmoji = (ic) => {
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
                  <div key={pl.id || pIdx} className="col-md-4">
                    <div className="p-2.5 rounded-3 border bg-light d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-2 min-w-0">
                        <span className="flex-shrink-0" style={{ fontSize: '1.2rem' }}>
                          {getIconEmoji(pl.icon)}
                        </span>
                        <div className="min-w-0">
                          <span className="fw-bold small text-dark d-block text-truncate">{pl.name}</span>
                          <span className="extra-small text-muted">{pl.distance} ({pl.duration})</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-link btn-xs text-danger p-0 ms-2"
                        onClick={() => handleDeletePlace(pl.id)}
                        title="Delete Landmark"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: TABLE STANDEE QR SUITE */}
      {activeTab === 'qr' && (
        <div className="card border-0 rounded-4 shadow-sm bg-white p-4">
          <div className="row g-4 align-items-center">
            <div className="col-lg-6">
              <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill extra-small px-3 py-1 fw-bold">
                Front-Desk Collateral
              </span>
              <h4 className="fw-bold text-dark mt-2 mb-2">Printable Table Standee QR Code</h4>
              <p className="text-muted small mb-4">
                Place this branded QR code standee on your hotel reception desk, billing counter, and guest room tables. Guests scan with any smartphone camera to instantly view your room catalog, direct booking tariffs, and amenities!
              </p>

              <div className="card bg-light border p-3.5 rounded-3 mb-4">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="extra-small text-muted fw-bold text-uppercase">Public Showcase URL:</span>
                  <span className="badge bg-success-subtle text-success extra-small fw-bold">Ready</span>
                </div>
                <div className="bg-white p-2.5 rounded-2 border text-break font-monospace extra-small text-primary fw-semibold">
                  {publicCatalogueUrl}
                </div>
              </div>

              <div className="d-flex align-items-center gap-2.5 flex-wrap">
                <button
                  type="button"
                  className="btn btn-primary fw-bold px-4 py-2.5 rounded-3 shadow-sm d-inline-flex align-items-center gap-2"
                  onClick={handleGeneratePdfStandee}
                >
                  <QrCode size={18} />
                  <span>Download / Print Standee PDF (A5)</span>
                </button>

                <button
                  type="button"
                  className="btn btn-outline-secondary fw-semibold px-3 py-2.5 rounded-3 d-inline-flex align-items-center gap-1.5"
                  onClick={handleCopyLink}
                >
                  <Copy size={16} />
                  <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                </button>
              </div>
            </div>

            {/* Standee Mockup Visual */}
            <div className="col-lg-6 text-center">
              <div
                className="mx-auto rounded-4 shadow-2xl p-4 bg-white border text-center position-relative"
                style={{
                  maxWidth: '340px',
                  background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
                  borderColor: '#e2e8f0'
                }}
              >
                <div className="p-2.5 rounded-3 bg-dark text-white mb-3 shadow-xs">
                  <div className="fw-bold small">{propertyDisplayName || 'Grand Hotel'}</div>
                  <div className="extra-small text-white-50">Room Showcase &amp; Amenities</div>
                </div>

                <div className="p-3 bg-white rounded-3 border shadow-xs d-inline-block mb-3">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(publicCatalogueUrl)}`}
                    alt="Catalogue QR Code"
                    className="img-fluid"
                    style={{ width: '170px', height: '170px' }}
                  />
                </div>

                <div className="fw-bold text-dark small mb-1">SCAN WITH SMARTPHONE CAMERA</div>
                <p className="text-muted extra-small mb-3">
                  To view Room Tariffs, HD Photos &amp; Hotel Amenities
                </p>

                <div className="p-2 bg-light rounded-2 border extra-small text-muted">
                  📞 Front Desk: {formData.contact_phone || currentProperty.owner_phone || 'Call Desk'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: LEADS & INQUIRIES INBOX */}
      {activeTab === 'inquiries' && (
        <div className="card border-0 rounded-4 shadow-sm bg-white p-4">
          <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
            <div>
              <h5 className="fw-bold text-dark m-0">Catalogue Inquiries &amp; Booking Leads</h5>
              <span className="text-muted extra-small">
                Incoming booking requests submitted by guests from the public catalogue
              </span>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary rounded-3 d-inline-flex align-items-center gap-1.5"
              onClick={() => refetchInquiries()}
            >
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          {inquiries.length === 0 ? (
            <div className="p-5 text-center text-muted">
              <Inbox size={44} className="mx-auto mb-2 text-secondary opacity-50" />
              <h6 className="fw-bold text-dark">No Inquiries Received Yet</h6>
              <p className="small max-w-sm mx-auto">
                When guests submit inquiry forms on your digital catalogue, they will appear here instantly for follow-up and reservation conversion.
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle extra-small">
                <thead className="table-light">
                  <tr>
                    <th>Date</th>
                    <th>Guest Name</th>
                    <th>Mobile &amp; Contact</th>
                    <th>Requested Room</th>
                    <th>Stay Dates</th>
                    <th>Guests</th>
                    <th>Status</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {inquiries.map((inq) => (
                    <tr key={inq.id}>
                      <td className="text-muted">{formatDate(inq.created_at)}</td>
                      <td className="fw-bold text-dark">{inq.guest_name}</td>
                      <td>
                        <div className="fw-semibold text-primary">📞 {inq.guest_mobile}</div>
                        {inq.guest_email && <div className="text-muted extra-small">{inq.guest_email}</div>}
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border">
                          {inq.requested_room_type_name || 'General Inquiry'}
                        </span>
                      </td>
                      <td>
                        {inq.check_in_date ? (
                          <span>{inq.check_in_date} ➔ {inq.check_out_date || 'N/A'}</span>
                        ) : (
                          <span className="text-muted fst-italic">Flexible</span>
                        )}
                      </td>
                      <td>{inq.adults} Adults, {inq.children} Children</td>
                      <td>
                        <select
                          className={`form-select form-select-xs border rounded-2 py-0.5 px-2 extra-small fw-bold ${
                            inq.status === 'NEW'
                              ? 'bg-danger-subtle text-danger border-danger-subtle'
                              : inq.status === 'CONVERTED'
                              ? 'bg-success-subtle text-success border-success-subtle'
                              : 'bg-light text-dark'
                          }`}
                          value={inq.status}
                          onChange={async (e) => {
                            await updateInquiryStatusApi(inq.id, e.target.value);
                            showSuccess('Inquiry status updated!');
                            refetchInquiries();
                          }}
                        >
                          <option value="NEW">New Lead</option>
                          <option value="CONTACTED">Contacted</option>
                          <option value="CONVERTED">Converted to Booking</option>
                          <option value="DECLINED">Declined</option>
                        </select>
                      </td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-sm btn-primary fw-bold rounded-2 px-2.5 py-1 extra-small shadow-xs d-inline-flex align-items-center gap-1"
                          onClick={() => handleConvertToBooking(inq)}
                        >
                          <span>Convert to Reservation</span>
                          <ArrowRight size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CatalogueManage;
