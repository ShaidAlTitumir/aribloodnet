export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  district: string | null;
  thana: string | null;
  blood_type: string | null;
  height_cm: number | null;
  height_ft?: string;
  height_in?: string;
  weight_kg: number | null;
  gender: string | null;
  date_of_birth: string | null;
  last_donation_date: string | null;
  total_donations: number;
  is_donor: boolean;
  donor_id: string | null;
  created_at: string;
}

export interface Donor {
  id: string;
  user_id: string | null;
  full_name: string;
  blood_type: BloodType;
  date_of_birth: string;
  gender: 'Male' | 'Female' | 'Other';
  district: string;
  thana: string;
  phone: string;
  email: string;
  weight_kg: number;
  height_cm: number | null;
  height_ft?: string;
  height_in?: string;
  last_donation_date: string | null;
  medical_conditions: string | null;
  organ_donor: boolean;
  availability: 'Available' | 'Not Available' | 'Emergency Only';
  verified: boolean;
  total_donations: number;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

export interface EmergencyRequest {
  id: string;
  user_id: string | null;
  blood_type_needed: BloodType;
  patient_name: string;
  hospital_name: string;
  reason: string | null;
  needed_date: string | null;
  district: string;
  thana: string;
  urgency: 'Critical' | 'Urgent' | 'Within 24 hours';
  contact_number: string;
  bags_needed: number;
  status: 'Active' | 'Fulfilled' | 'Expired' | 'Cancelled';
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

export interface Hospital {
  id: string;
  hospital_name: string;
  district: string;
  contact_person: string;
  phone: string;
  email: string;
  token_balance: number;
  subscription_plan: 'Starter' | 'Basic' | 'Pro' | 'Enterprise';
  verified: boolean;
  created_at: string;
}

export interface TokenTransaction {
  id: string;
  user_id: string;
  user_type: 'Individual' | 'Hospital' | 'Clinic' | 'NGO';
  tokens_used: number;
  action: string;
  donor_id: string | null;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
  district: string;
  thana: string;
  created_by: string | null;
  logo_url: string | null;
  facebook_url: string | null;
  website_url: string | null;
  created_at: string;
  member_count?: number;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'Admin' | 'Member';
  joined_at: string;
  profile?: Profile;
}
