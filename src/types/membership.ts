// Membership Program Types

export interface MembershipLevel {
  id: number;
  name: 'Bronze' | 'Silver' | 'Gold';
  level_index: number;
  points_multiplier: number;
  discount_percent: number;
  discount_max_amount: number;
  transaction_threshold: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MembershipBenefit {
  id: number;
  membership_level_id: number;
  icon_name: string;
  title: string;
  description: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface CustomerMembership {
  id: number;
  customer_id: string;
  membership_level_id: number;
  progress_percent: number;
  total_transactions: number;
  shine_points: number;
  created_at: string;
  updated_at: string;
}

export interface MembershipLevelHistory {
  id: string;
  customer_id: string;
  from_level_id: number | null;
  to_level_id: number;
  changed_at: string;
  trigger_reason: string | null;
}

export interface MembershipLevelWithBenefits extends MembershipLevel {
  benefits: MembershipBenefit[];
}

export interface CustomerMembershipWithDetails extends CustomerMembership {
  level: MembershipLevel;
  customer?: {
    username: string | null;
    email: string | null;
    whatsapp: string | null;
  };
}

// Form input types
export interface MembershipLevelUpdateInput {
  points_multiplier?: number;
  discount_percent?: number;
  discount_max_amount?: number;
  transaction_threshold?: number;
  is_active?: boolean;
}

export interface MembershipBenefitInput {
  membership_level_id: number;
  icon_name: string;
  title: string;
  description?: string;
  display_order?: number;
}

export interface MembershipBenefitUpdateInput {
  icon_name?: string;
  title?: string;
  description?: string;
  display_order?: number;
}

// Icon names for membership benefits
export const MEMBERSHIP_ICON_NAMES = [
  'Flame',
  'Percent',
  'Sparkles',
  'Cake',
  'Gift',
  'Crown'
] as const;

export type MembershipIconName = typeof MEMBERSHIP_ICON_NAMES[number];

// Level colors for UI
export const MEMBERSHIP_LEVEL_COLORS = {
  Bronze: {
    primary: 'text-amber-600',
    bg: 'bg-amber-100',
    border: 'border-amber-300',
    hex: '#D97706'
  },
  Silver: {
    primary: 'text-slate-600',
    bg: 'bg-slate-100',
    border: 'border-slate-300',
    hex: '#64748B'
  },
  Gold: {
    primary: 'text-yellow-500',
    bg: 'bg-yellow-100',
    border: 'border-yellow-300',
    hex: '#EAB308'
  }
} as const;
