import {
  User, Users, Heart, HeartHandshake, Handshake, Shield, Clock, BookOpen,
  Home, Info, Phone, Star, Accessibility, Stethoscope, Activity, Lightbulb,
  MessageCircle, Calendar, MapPin, Smile, HelpCircle, Award, Briefcase, Bus
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { LandingPageConfig } from '../../../shared/types';

// Icon library available in the landing page editor. Keys are stored in
// content data, so renaming a key orphans any content that uses it.
export const LANDING_ICONS: Record<string, LucideIcon> = {
  User, Users, Heart, HeartHandshake, Handshake, Shield, Clock, BookOpen,
  Home, Info, Phone, Star, Accessibility, Stethoscope, Activity, Lightbulb,
  MessageCircle, Calendar, MapPin, Smile, HelpCircle, Award, Briefcase, Bus
};

export const LANDING_ICON_NAMES = Object.keys(LANDING_ICONS);

// "BookOpen" -> "Book Open" for display in the dropdown
export function iconLabel(name: string): string {
  return name.replace(/([a-z])([A-Z])/g, '$1 $2');
}

export function LandingIcon({ name, size, fallback }: { name?: string; size: number; fallback: string }) {
  const Icon = (name && LANDING_ICONS[name]) || LANDING_ICONS[fallback] || Info;
  return <Icon size={size} />;
}

// Fill a stored landing page config (possibly partial or from an older
// release without icon/features) with defaults. The ONLY merge rule for
// landing data - admin editor, public homepage, and store all use this,
// so they can never disagree. Empty feature lists fall back to defaults.
export function mergeLandingPage(stored?: Partial<LandingPageConfig> | null): LandingPageConfig {
  const caregiverCard = { ...DEFAULT_LANDING_PAGE.caregiverCard, ...stored?.caregiverCard };
  const careRecipientCard = { ...DEFAULT_LANDING_PAGE.careRecipientCard, ...stored?.careRecipientCard };
  if (!caregiverCard.features?.length) {
    caregiverCard.features = DEFAULT_LANDING_PAGE.caregiverCard.features;
  }
  if (!careRecipientCard.features?.length) {
    careRecipientCard.features = DEFAULT_LANDING_PAGE.careRecipientCard.features;
  }
  return {
    ...DEFAULT_LANDING_PAGE,
    ...stored,
    caregiverCard,
    careRecipientCard
  };
}

// Single source of truth for landing page defaults, matching what the
// public homepage displayed before these fields became editable.
export const DEFAULT_LANDING_PAGE: LandingPageConfig = {
  heroTitle: 'Welcome to RAGE4INFO',
  heroSubtitle: 'Your comprehensive resource for caregiving information and support',
  caregiverCard: {
    title: 'INFO4 Caregivers',
    description: 'Access resources, training materials, and support tools designed specifically for professional and family caregivers.',
    buttonText: 'Explore Caregiver Resources',
    icon: 'User',
    features: [
      { icon: 'Shield', text: 'Professional Development' },
      { icon: 'Clock', text: 'Time Management Tools' },
      { icon: 'BookOpen', text: 'Training Resources' }
    ]
  },
  careRecipientCard: {
    title: 'INFO4 People with Disabilities',
    description: 'Find information about care options, support services, and resources to help maintain independence and quality of life.',
    buttonText: 'Explore Care Recipient Resources',
    icon: 'Heart',
    features: [
      { icon: 'Users', text: 'Support Networks' },
      { icon: 'Shield', text: 'Safety Resources' },
      { icon: 'Heart', text: 'Wellness Programs' }
    ]
  }
};
