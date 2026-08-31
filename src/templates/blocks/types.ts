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
  /**
   * Books this specific service, rather than dropping the visitor on a menu to
   * find it again. Square Appointments gives a per-service link from its own
   * dashboard; paste that here.
   *
   * Deliberately pasted rather than derived. Square's URL shape is theirs to
   * change, and a link built from a guessed pattern fails as a booking page
   * that will not load — which nobody notices until a customer gives up.
   *
   * Falls back to the business's general booking URL when absent.
   */
  bookingUrl?: string;
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

export interface BeforeAfterItem {
  before: string;
  after: string;
  /** e.g. "Balayage correction" — shown under the slider. */
  label?: string;
  /** Which service produced it, for context. */
  service?: string;
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
   * The person, for the card over the hero image.
   *
   * These replaced a hardcoded "Top Rated Service · Fast Response · 100%
   * Guaranteed · Verified" badge that was rendered on every non-campaign site
   * and was true of nobody in particular. A name and a face are true of exactly
   * one person, which is the whole difference — and for a salon it is also the
   * better sell, since choosing a colourist is choosing a person.
   *
   * All optional. With no name the card is not drawn at all: an image with no
   * badge looks finished, an invented badge does not.
   */
  ownerPhoto?: string;
  ownerName?: string;
  /** e.g. "Owner & Master Colorist". Defaults to "Owner" when a name is set. */
  ownerRole?: string;
  /** Real review data only, never a default — see HeroBlock. */
  rating?: number;
  reviewCount?: number;
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
