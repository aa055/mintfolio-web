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
  sale: Sale | null;
}

export interface Sale {
  id: string;
  sale_price: string;
  sale_currency: string;
  sale_date: string;
  sold_to: string | null;
  spot_rate_at_sale: string | null;
  fees: string;
  comments: string | null;
  created_at: string;
}

export interface SaleCreatePayload {
  sale_price: string;
  sale_currency: string;
  sale_date: string;
  sold_to?: string | null;
  spot_rate_at_sale?: string | null;
  fees?: string;
  comments?: string | null;
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

export interface UserSettingsPayload {
  display_name?: string | null;
  preferred_currency?: string;
  timezone?: string;
  default_pricing_mode?: "live" | "manual";
}

export interface ManualRatesPayload {
  currency: string;
  gold_rate_per_gram: string | null;
  silver_rate_per_gram: string | null;
}

export interface LivePrice {
  metal: Metal;
  purity: string;
  currency: string;
  rate_per_gram: string;
  source: "goldapi";
  fetched_at: string;
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

// ---------------- Prices + summary ----------------

export interface Rate {
  metal: Metal;
  rate_per_gram: string;
  currency: string;
  source: "goldapi" | "manual";
  fetched_at: string | null;
}

export interface MetalSummary {
  metal: Metal;
  grams: string;
  current_value: string;
  cost_basis: string;
}

export interface HoldingValue {
  id: string;
  current_value: string | null;
  unrealized_pl: string | null;
  realized_pl: string | null;
}

export interface MarketRate {
  metal: Metal;
  currency: string;
  day: string;
  rate_per_gram: string;
  previous_day: string | null;
  previous_rate: string | null;
  change_pct: string | null;
}

export interface DayChange {
  day: string;
  previous_day: string;
  amount: string;
  pct: string | null;
}

export interface PortfolioSummary {
  currency: string;
  pricing_mode: "live" | "manual";
  rates: Rate[];
  market_rates: MarketRate[];
  total_value: string;
  cost_basis: string;
  total_invested: string;
  unrealized_pl: string;
  unrealized_pl_pct: string | null;
  realized_pl: string;
  all_time_pl: string;
  all_time_pl_pct: string | null;
  today_change: DayChange | null;
  active_count: number;
  sold_count: number;
  unvalued_count: number;
  other_currency_count: number;
  by_metal: MetalSummary[];
  holdings: HoldingValue[];
}

export type PurchaseUpdatePayload = Omit<PurchaseCreatePayload, "items"> & {
  items: (HoldingCreatePayload & { id?: string })[];
};

// ---------------- Performance + activity ----------------

export interface PortfolioPoint {
  day: string;
  value: string;
  invested: string;
  realized: string; // cumulative realized P/L up to this day
}

export interface PortfolioHistory {
  currency: string;
  range: string;
  points: PortfolioPoint[];
}

export interface Transaction {
  kind: "purchase" | "sale";
  date: string;
  created_at: string;
  purchase_id: string;
  holding_id: string | null;
  title: string;
  detail: string;
  currency: string;
  amount: string;
  realized_pl: string | null;
  item_count: number;
  receipt_count: number;
  metals: Metal[];
}

export interface TransactionList {
  transactions: Transaction[];
}
