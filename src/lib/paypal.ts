// PayPal Helper Module

export const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID || 'test';

export interface PayPalOrder {
  id: string;
  status: string;
  purchase_units: {
    amount: {
      value: string;
    };
  }[];
}

// Helper to load script or configuration if needed
export const getPayPalConfig = () => {
  return {
    "client-id": PAYPAL_CLIENT_ID,
    currency: "USD",
  };
};
