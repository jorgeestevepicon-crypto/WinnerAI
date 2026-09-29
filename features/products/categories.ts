// A curated list of common dropshipping/e-commerce categories, used as a
// picker for the Product Finder's discovery search. Not AliExpress's own
// official category taxonomy (that would need their category-tree API,
// which hasn't been wired up yet — see the roadmap) — this is a
// general-purpose list that works for tagging and filtering regardless of
// source.
export const COMMON_PRODUCT_CATEGORIES = [
  "Technology",
  "Electronics",
  "Beauty",
  "Health & Wellness",
  "Home & Garden",
  "Kitchen",
  "Pet Supplies",
  "Sports & Outdoors",
  "Fashion & Accessories",
  "Toys & Games",
  "Office",
  "Automotive",
] as const;

/**
 * Sources whose search is a real product-title text search (AliExpress's
 * ds.text.search, notably) return zero results for an abstract category
 * word on its own — sellers don't title products just "Technology". This
 * maps each category to an actual product-ish search phrase to send
 * instead, while the category itself is still what gets saved/filtered on.
 */
export const CATEGORY_SEARCH_TERMS: Record<(typeof COMMON_PRODUCT_CATEGORIES)[number], string> = {
  Technology: "gadgets",
  Electronics: "electronics accessories",
  Beauty: "beauty tools",
  "Health & Wellness": "health wellness",
  "Home & Garden": "home decor",
  Kitchen: "kitchen gadgets",
  "Pet Supplies": "pet accessories",
  "Sports & Outdoors": "sports gear",
  "Fashion & Accessories": "fashion accessories",
  "Toys & Games": "toys",
  Office: "office supplies",
  Automotive: "car accessories",
};
