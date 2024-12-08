import React from 'react';
import { useDrag } from 'react-dnd';
import {
  Plus,
  Code,
  Cpu,
  GitBranch,
  CloudUpload,
  CheckCircle2,
  ShieldAlert,
  Lock,
  Github,
  Briefcase,
  DollarSign,
  Coins,
  RefreshCcw,
  UserPlus,
  ShoppingCart,
  Globe,
  Database,
  Lightbulb,
  EyeOff,
  Leaf,
  PartyPopper,
  Music,
  Video,
  Gamepad,
  Tv,
  Book,
  Newspaper,
  HeartPulse,
  Coffee,
  Activity,
  Calendar,
  CalendarCheck,
  BookOpen,
  FlaskRound,
  Type,
  Search,
  Palette,
  Camera,
  Car,
  Truck,
  MapPin,
  PawPrint,
  CloudDrizzle,
  FileText,
  Link2,
  FlaskConical,
  Map,
  Mail,
  User,
  UserCheck,
  Bookmark,
  BookmarkX
} from 'lucide-react';

const subcategoryIconMap = {
  // Technology & Development
  "Programming": Code,
  "Development": Cpu,
  "Machine Learning": Cpu,
  "Continuous Integration": GitBranch,
  "Cloud Storage & File Sharing": CloudUpload,
  "Data Validation": CheckCircle2,
  "Anti-Malware": ShieldAlert,
  "Security": Lock,
  "Open Source Projects": Github,

  // Business & Finance
  "Business": Briefcase,
  "Finance": DollarSign,
  "Cryptocurrency": Coins,
  "Currency Exchange": RefreshCcw,
  "Jobs": UserPlus,
  "Shopping": ShoppingCart,

  // Government & Society
  "Government": Globe,
  "Open Data": Database,
  "Patent": Lightbulb,
  "Fraud Prevention": EyeOff,
  "Environment": Leaf,

  // Entertainment & Media
  "Entertainment": PartyPopper,
  "Music": Music,
  "Video": Video,
  "Games & Comics": Gamepad,
  "Anime": Tv,
  "Books": Book,
  "News": Newspaper,

  // Lifestyle & Health
  "Health": HeartPulse,
  "Food & Drink": Coffee,
  "Sports & Fitness": Activity,
  "Events": Calendar,
  "Calendar": CalendarCheck,

  // Education & Knowledge
  "Education": BookOpen,
  "Science & Math": FlaskRound,
  "Dictionaries": Type,
  "Text Analysis": Search,

  // Arts & Culture
  "Art & Design": Palette,
  "Photography": Camera,

  // Transportation & Location
  "Transportation": Car,
  "Vehicle": Truck,
  "Geocoding": MapPin,

  // Nature & Animals
  "Animals": PawPrint,
  "Weather": CloudDrizzle,

  // Utilities & Tools
  "Documents & Productivity": FileText,
  "URL Shorteners": Link2,
  "Test Data": FlaskConical,
  "Tracking": Map,
  "Email": Mail,

  // Social & Personal
  "Social": User,
  "Personality": UserCheck
};

const DEFAULT_ICON = 'https://www.google.com/s2/favicons?domain=google.com&sz=128';

const getIconFromCache = (domain) => {
  try {
    const cachedIcons = JSON.parse(localStorage.getItem('apiIconCache') || '{}');
    return cachedIcons[domain];
  } catch (error) {
    return null;
  }
};

const saveIconToCache = (domain, iconUrl) => {
  try {
    const cachedIcons = JSON.parse(localStorage.getItem('apiIconCache') || '{}');
    cachedIcons[domain] = iconUrl;
    localStorage.setItem('apiIconCache', JSON.stringify(cachedIcons));
  } catch (error) {
    console.error('Error saving icon to cache:', error);
  }
};

const ApiCard = ({ api, getCategoryColor, onDragStart, onDragEnd, onSelect, isSelected, onBookmark, isBookmarked }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'API_CARD',
    item: () => {
      onDragStart();
      return { api };
    },
    end: () => {
      onDragEnd();
    },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });

  const handleClick = (e) => {
    if (e.target.closest('.add-to-workspace')) {
      e.stopPropagation();
      if (typeof onSelect === 'function') {
        onSelect(api, true);
      }
      return;
    }

    if (e.target.closest('.bookmark-button')) {
      e.stopPropagation();
      if (typeof onBookmark === 'function') {
        onBookmark(api);
      }
      return;
    }

    window.open(api.URL, '_blank', 'noopener,noreferrer');
  };

  const categoryColor = api.Category ? getCategoryColor(api.Category) : "#000000";

  const getDomain = (url) => {
    try {
      const hostname = new URL(url).hostname;
      const parts = hostname.split('.');
      // If there's a subdomain, we just take the last two parts (e.g. caiyunapp.com)
      // This logic can be refined if you want to handle co.uk or other TLDs differently.
      if (parts.length > 2) {
        return parts.slice(-2).join('.');
      }
      return hostname;
    } catch (error) {
      return null;
    }
  };

  const domain = getDomain(api.URL);
  const iconHorseUrl = domain ? `https://icon.horse/icon/${domain}` : null;
  const [iconUrl, setIconUrl] = React.useState(() => {
    // Try to get icon from cache first
    const cachedIcon = domain ? getIconFromCache(domain) : null;
    return cachedIcon || iconHorseUrl;
  });

  const handleFaviconError = (e) => {
    const googleFaviconUrl = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : null;
    
    // If the current src is Icon Horse, try Google favicon
    if (e.currentTarget.src === iconHorseUrl && googleFaviconUrl) {
      setIconUrl(googleFaviconUrl);
      if (domain) saveIconToCache(domain, googleFaviconUrl);
    } else {
      // If Google favicon also fails or we don't have a domain, use default icon
      setIconUrl(DEFAULT_ICON);
      if (domain) saveIconToCache(domain, DEFAULT_ICON);
    }
  };

  const CategoryIcon = subcategoryIconMap[api.Category] || null;

  return (
    <div
      ref={drag}
      className={`api-card ${isDragging ? 'dragging' : ''} ${isSelected ? 'selected' : ''}`}
      onClick={handleClick}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <div className="card-actions">
        {!isSelected && (
          <div className="add-to-workspace">
            <Plus size={16} />
          </div>
        )}
        <div className="bookmark-button" title={isBookmarked ? "Remove from bookmarks" : "Add to bookmarks"}>
          {isBookmarked ? <BookmarkX size={16} /> : <Bookmark size={16} />}
        </div>
      </div>
      <div className="api-logo-container">
        {domain && (
          <div className="api-logo">
            <img
              src={iconUrl}
              alt={`${api.Name} logo`}
              loading="lazy"
              onError={handleFaviconError}
              onLoad={() => {
                if (domain && iconUrl) saveIconToCache(domain, iconUrl);
              }}
            />
          </div>
        )}
      </div>
      <div className="api-content">
        <div className="api-name">{api.Name}</div>
        {api.Category && (
          <div className="category" style={{ marginLeft: '-15px' }}>
            {CategoryIcon && (
              <CategoryIcon size={16} color={categoryColor} style={{ marginRight: '4px' }} />
            )}
            {api.Category}
          </div>
        )}
        <div className="api-description">{api.Description}</div>
      </div>
    </div>
  );
};

export default ApiCard;
