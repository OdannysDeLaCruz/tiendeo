export interface MeasurementUnit {
  id: string;
  name: string;
  abbreviation: string;
}

export interface StoreProductPrice {
  id: string;
  price: number;
  measurementUnitId: string;
  measurementUnit: MeasurementUnit;
  minQuantity: number;
  stepQuantity: number;
}

export interface ProductModalData {
  storeProductId: string;
  name: string;
  description: string | null;
  imageUrl: string;
  prices: StoreProductPrice[];
}
