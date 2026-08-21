export interface NavItem {
  label: string;
  href: string;
}

export interface ServiceItem {
  id?: string;
  title: string;
  description: string;
  price?: string;
  duration?: string;
  icon?: string;
  highlight?: boolean;
}

export interface TestimonialItem {
  id?: string;
  quote: string;
  author: string;
  role?: string;
  rating?: number;
  date?: string;
  verified?: boolean;
}

export interface EventItem {
  id?: string;
  name: string;
  date: string;
  time?: string;
  location: string;
  rsvpCount?: number;
}

export interface VolunteerItem {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  type: 'Volunteer' | 'Yard Sign' | 'RSVP' | 'Donor';
  status: 'Active' | 'Pending' | 'Attending';
}

export interface BusinessProfile {
  name: string;
  tagline?: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  hours?: string | string[];
  logoUrl?: string;
  heroImage?: string;
  category?: string;
  primaryColor?: string;
  accentColor?: string;
  fontFamily?: 'sans' | 'serif' | 'display';
  theme?: 'dark' | 'light' | 'luxury' | 'campaign-navy' | 'campaign-judicial' | 'crimson-bold' | 'emerald-gold' | 'custom';
  treasurerName?: string;
  faviconUrl?: string;
}
