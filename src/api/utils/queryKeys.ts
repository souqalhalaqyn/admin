export const queryKeys = {
  all: ["api"] as const,

  auth: {
    all: ["api", "auth"] as const,
    me: () => ["api", "auth", "me"] as const,
  },

  resource: <T extends string>(name: T) => ({
    all: ["api", name] as const,
    list: (params?: Record<string, unknown>) => ["api", name, "list", params] as const,
    detail: (id: string | number) => ["api", name, "detail", id] as const,
  }),

  products: {
    all: ["api", "products"] as const,
    list: (params?: Record<string, unknown>) => ["api", "products", "list", params] as const,
    detail: (id: string | number) => ["api", "products", "detail", id] as const,
  },

  containers: {
    all: ["api", "containers"] as const,
    list: (params?: Record<string, unknown>) => ["api", "containers", "list", params] as const,
    detail: (id: string | number) => ["api", "containers", "detail", id] as const,
  },

  categories: {
    all: ["api", "categories"] as const,
    list: (params?: Record<string, unknown>) => ["api", "categories", "list", params] as const,
    detail: (id: string | number) => ["api", "categories", "detail", id] as const,
  },

  brands: {
    all: ["api", "brands"] as const,
    list: (params?: Record<string, unknown>) => ["api", "brands", "list", params] as const,
    detail: (id: string | number) => ["api", "brands", "detail", id] as const,
  },

  orders: {
    all: ["api", "orders"] as const,
    list: (params?: Record<string, unknown>) => ["api", "orders", "list", params] as const,
    detail: (id: string | number) => ["api", "orders", "detail", id] as const,
  },

  users: {
    all: ["api", "users"] as const,
    list: (params?: Record<string, unknown>) => ["api", "users", "list", params] as const,
    detail: (id: string | number) => ["api", "users", "detail", id] as const,
  },

  chargeRequests: {
    all: ["api", "charge-requests"] as const,
    list: () => ["api", "charge-requests", "list"] as const,
    detail: (id: string) => ["api", "charge-requests", "detail", id] as const,
  },

  offers: {
    all: ["api", "offers"] as const,
    list: () => ["api", "offers", "list"] as const,
    detail: (id: string) => ["api", "offers", "detail", id] as const,
    admin: {
      list: () => ["api", "offers", "admin", "list"] as const,
      detail: (id: string) => ["api", "offers", "admin", "detail", id] as const,
    },
  },

  admin: {
    all: ["api", "admin"] as const,
    settings: () => ["api", "admin", "settings"] as const,
    orders: {
      all: () => ["api", "admin", "orders"] as const,
      list: (params?: Record<string, unknown>) => ["api", "admin", "orders", "list", params] as const,
      detail: (id: string | number) => ["api", "admin", "orders", "detail", id] as const,
    },
  },

  locations: {
    all: ["api", "locations"] as const,
    tree: () => ["api", "locations", "tree"] as const,
    states: () => ["api", "locations", "states"] as const,
    regions: (stateId: string) => ["api", "locations", "regions", stateId] as const,
    ways: (regionId: string) => ["api", "locations", "ways", regionId] as const,
  },
};
