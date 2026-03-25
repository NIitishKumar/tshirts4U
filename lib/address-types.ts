export interface Address {
  _id: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  latitude: number;
  longitude: number;
}

export type CreateAddressPayload = Omit<Address, "_id">;

export type EditAddressPayload = Partial<CreateAddressPayload>;

