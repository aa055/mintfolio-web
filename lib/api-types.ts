/**
 * TypeScript shape mirrors of the FastAPI Pydantic responses.
 * Kept hand-written for now — when the surface grows we can switch to
 * OpenAPI-generated types.
 */

export interface User {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  preferred_currency: string;
  timezone: string;
  default_pricing_mode: "live" | "manual";
  manual_gold_rate_per_gram: string | null;
  manual_silver_rate_per_gram: string | null;
  manual_rates_currency: string | null;
  created_at: string;
  updated_at: string;
}

export interface Portfolio {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface MeResponse {
  user: User;
  portfolio: Portfolio;
}

// ---------------- Purchases ----------------

export type Metal = "gold" | "silver";
export type HoldingForm = "coin" | "bar" | "bullion" | "jewelry" | "round" | "other";
export type WeightUnit = "g" | "kg" | "oz";
export type PaymentMethod = "cash" | "card";
export type HoldingStatus = "active" | "sold";

export interface Holding {
  id: string;
  metal: Metal;
  purity: string | null;
  form: HoldingForm | null;
  weight_value: string;          // decimals come over the wire as strings
  weight_unit: WeightUnit;
  weight_grams: string;
  quantity: number;
  brand: string | null;
  purchase_price: string;
  spot_rate_at_purchase: string | null;
  premium_paid: string | null;
  storage_location: string | null;
  status: HoldingStatus;
  comments: string | null;
  created_at: string;
  updated_at: string;
}

export interface Purchase {
  id: string;
  portfolio_id: string;
  purchase_date: string;         // ISO date (YYYY-MM-DD)
  dealer: string | null;
  purchase_currency: string;
  payment_method: PaymentMethod;
  card_premium_percentage: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items: Holding[];
  total_amount: string;
  files: UploadedFile[];
}

export interface PurchaseListResponse {
  purchases: Purchase[];
}

// ---------------- Files ----------------

export type FileMimeType = "image/jpeg" | "image/png" | "application/pdf";

export interface UploadedFile {
  id: string;
  filename: string;
  mime_type: FileMimeType | string;
  size_bytes: number;
  storage_path: string;
  uploaded_at: string;
  download_url: string | null;
}

export interface SignUploadResponse {
  upload_url: string;
  storage_path: string;
}

export interface SignUploadPayload {
  filename: string;
  mime_type: FileMimeType;
  size_bytes: number;
}

export interface RegisterFilePayload {
  storage_path: string;
  filename: string;
  mime_type: FileMimeType;
  size_bytes: number;
}

export interface HoldingCreatePayload {
  metal: Metal;
  purity?: string | null;
  form?: HoldingForm | null;
  weight_value: string;
  weight_unit: WeightUnit;
  quantity?: number;
  brand?: string | null;
  purchase_price: string;
  spot_rate_at_purchase?: string | null;
  premium_paid?: string | null;
  storage_location?: string | null;
  comments?: string | null;
}

export interface PurchaseCreatePayload {
  purchase_date: string;
  dealer?: string | null;
  purchase_currency: string;
  payment_method: PaymentMethod;
  card_premium_percentage?: string | null;
  notes?: string | null;
  items: HoldingCreatePayload[];
}
