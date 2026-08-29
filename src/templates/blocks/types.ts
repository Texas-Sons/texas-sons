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

export interface ProductItem {
  name: string;
  description?: string;
  price?: string;
  image?: string;
  /** External store link. Without one the card shows availability instead. */
  url?: string;
  availability?: string;
  featured?: boolean;
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
  /**
   * Additional real photos of the business, from Google Places or a client
   * upload. Carried on the blueprint so the data survives; no block renders a
   * gallery yet.
   */
  galleryImages?: string[];
  /**
   * External booking system (Square, Vagaro, Calendly…). When set, the primary
   * CTAs link here instead of scrolling to the contact form.
   *
   * A business that already takes bookings somewhere has real availability and
   * deposits there; sending visitors to a lead form instead adds a step and
   * loses the sale. The form stays as a secondary path for anything the booking
   * system does not cover — consultations, bridal enquiries, questions.
   */
  bookingUrl?: string;
  category?: string;
  primaryColor?: string;
  accentColor?: string;
  fontFamily?: 'sans' | 'serif' | 'display' | 'luxe';
  theme?: 'dark' | 'light' | 'luxury' | 'campaign-navy' | 'campaign-judicial' | 'crimson-bold' | 'emerald-gold' | 'custom';
  treasurerName?: string;
  faviconUrl?: string;
}
