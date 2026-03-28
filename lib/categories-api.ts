export type ApiCategory = {
  _id: string;
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CategoriesListResponse = {
  ok: boolean;
  categories?: ApiCategory[];
  error?: string;
};
