// Types for tracking page enrichment data

export interface AdConfig {
  id: string;
  imageUrl: string;
  linkUrl: string;
  altText: string;
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
}

export interface PointsData {
  current_balance: number;
  total_earned: number;
  total_redeemed: number;
}

export interface ReferralData {
  code: string;
  totalReferrals: number;
  totalPointsEarned: number;
}

// Invoice items are already in the Orders type, but we can enhance display
export interface InvoiceItemDisplay {
  shoe_name: string;
  services: Array<{
    service: string;
    amount: number;
    quantity?: number;
  }>;
  // For enhanced display features
  thumbnailUrl?: string;
  category?: string;
}

// Dummy ads configuration
export const DUMMY_ADS: AdConfig[] = [
  {
    id: 'ad-1',
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&h=400&fit=crop',
    linkUrl: 'https://inspirasinee.com/promo',
    altText: 'Special Promo - Get 20% off on your first order!',
    isActive: true,
  },
  {
    id: 'ad-2',
    imageUrl: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=1200&h=400&fit=crop',
    linkUrl: 'https://inspirasinee.com/membership',
    altText: 'Join our membership program for exclusive benefits',
    isActive: true,
  },
];
