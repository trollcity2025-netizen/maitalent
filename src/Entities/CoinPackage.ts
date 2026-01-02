export interface CoinPackage {
  id: string;
  name: string;
  coins: number;
  price: number;
  bonus_coins?: number;
  is_popular?: boolean;
  icon?: string;
}
