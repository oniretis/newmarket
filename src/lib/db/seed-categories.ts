import { db } from "./index";
import { categories } from "./schema/category-schema";
import { shops } from "./schema/shop-schema";
import { v4 as uuidv4 } from "uuid";

const sampleCategories = [
  // Level 0 Categories (Main Categories)
  {
    name: "Electronics",
    slug: "electronics",
    description: "Latest gadgets, smartphones, laptops, and electronic accessories",
    image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&q=80",
    icon: "📱",
    level: 0,
    productCount: 245,
    isActive: true,
    featured: true,
    sortOrder: 1,
  },
  {
    name: "Fashion",
    slug: "fashion",
    description: "Trendy clothing, shoes, and accessories for all ages",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80",
    icon: "👕",
    level: 0,
    productCount: 432,
    isActive: true,
    featured: true,
    sortOrder: 2,
  },
  {
    name: "Home & Living",
    slug: "home-living",
    description: "Furniture, decor, kitchen essentials, and home improvement",
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80",
    icon: "🏠",
    level: 0,
    productCount: 189,
    isActive: true,
    featured: true,
    sortOrder: 3,
  },
  {
    name: "Sports & Outdoors",
    slug: "sports-outdoors",
    description: "Sports equipment, activewear, and outdoor adventure gear",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80",
    icon: "⚽",
    level: 0,
    productCount: 156,
    isActive: true,
    featured: false,
    sortOrder: 4,
  },
  {
    name: "Books & Media",
    slug: "books-media",
    description: "Books, movies, music, and educational content",
    image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&q=80",
    icon: "📚",
    level: 0,
    productCount: 523,
    isActive: true,
    featured: false,
    sortOrder: 5,
  },
  {
    name: "Beauty & Health",
    slug: "beauty-health",
    description: "Skincare, makeup, health supplements, and personal care",
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&q=80",
    icon: "💄",
    level: 0,
    productCount: 278,
    isActive: true,
    featured: false,
    sortOrder: 6,
  },

  // Level 1 Categories (Subcategories)
  // Electronics Subcategories
  {
    name: "Smartphones",
    slug: "smartphones",
    description: "Latest smartphones and mobile accessories",
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80",
    icon: "📱",
    level: 1,
    productCount: 87,
    isActive: true,
    featured: true,
    sortOrder: 1,
  },
  {
    name: "Laptops",
    slug: "laptops",
    description: "Laptops, notebooks, and computer accessories",
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80",
    icon: "💻",
    level: 1,
    productCount: 64,
    isActive: true,
    featured: true,
    sortOrder: 2,
  },
  {
    name: "Audio",
    slug: "audio",
    description: "Headphones, speakers, and audio equipment",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
    icon: "🎧",
    level: 1,
    productCount: 94,
    isActive: true,
    featured: false,
    sortOrder: 3,
  },

  // Fashion Subcategories
  {
    name: "Men's Clothing",
    slug: "mens-clothing",
    description: "Clothing and apparel for men",
    image: "https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?w=800&q=80",
    icon: "👔",
    level: 1,
    productCount: 178,
    isActive: true,
    featured: true,
    sortOrder: 1,
  },
  {
    name: "Women's Clothing",
    slug: "womens-clothing",
    description: "Clothing and apparel for women",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80",
    icon: "👗",
    level: 1,
    productCount: 203,
    isActive: true,
    featured: true,
    sortOrder: 2,
  },
  {
    name: "Footwear",
    slug: "footwear",
    description: "Shoes, sandals, and footwear for all occasions",
    image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&q=80",
    icon: "👟",
    level: 1,
    productCount: 51,
    isActive: true,
    featured: false,
    sortOrder: 3,
  },

  // Home & Living Subcategories
  {
    name: "Furniture",
    slug: "furniture",
    description: "Furniture for every room in your home",
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80",
    icon: "🪑",
    level: 1,
    productCount: 76,
    isActive: true,
    featured: true,
    sortOrder: 1,
  },
  {
    name: "Kitchen",
    slug: "kitchen",
    description: "Kitchen appliances, cookware, and dining essentials",
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80",
    icon: "🍳",
    level: 1,
    productCount: 68,
    isActive: true,
    featured: false,
    sortOrder: 2,
  },
  {
    name: "Decor",
    slug: "decor",
    description: "Home decor, lighting, and decorative accessories",
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80",
    icon: "🖼️",
    level: 1,
    productCount: 45,
    isActive: true,
    featured: false,
    sortOrder: 3,
  },

  // Level 2 Categories (Sub-subcategories)
  // Smartphones Subcategories
  {
    name: "Android Phones",
    slug: "android-phones",
    description: "Android smartphones from various brands",
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80",
    icon: "🤖",
    level: 2,
    productCount: 52,
    isActive: true,
    featured: false,
    sortOrder: 1,
  },
  {
    name: "iPhones",
    slug: "iphones",
    description: "Apple iPhone models and accessories",
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80",
    icon: "🍎",
    level: 2,
    productCount: 35,
    isActive: true,
    featured: true,
    sortOrder: 2,
  },

  // Men's Clothing Subcategories
  {
    name: "Shirts",
    slug: "mens-shirts",
    description: "Casual and formal shirts for men",
    image: "https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?w=800&q=80",
    icon: "👔",
    level: 2,
    productCount: 67,
    isActive: true,
    featured: false,
    sortOrder: 1,
  },
  {
    name: "Pants",
    slug: "mens-pants",
    description: "Jeans, trousers, and pants for men",
    image: "https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?w=800&q=80",
    icon: "👖",
    level: 2,
    productCount: 54,
    isActive: true,
    featured: false,
    sortOrder: 2,
  },
];

export async function seedCategories() {
  try {
    console.log("Seeding categories...");

    // First, get or create a default shop
    let defaultShop = await db.query.shops.findFirst();
    
    if (!defaultShop) {
      // Create a default shop if none exists
      const shopId = uuidv4();
      await db.insert(shops).values({
        id: shopId,
        vendorId: uuidv4(), // This would normally be a real vendor ID
        name: "Default Shop",
        slug: "default-shop",
        description: "Default shop for seeding data",
        status: "active",
      });
      
      defaultShop = await db.query.shops.findFirst({
        where: (shops, { eq }) => eq(shops.slug, "default-shop"),
      });
    }

    if (!defaultShop) {
      throw new Error("Failed to create or find default shop");
    }

    // Clear existing categories
    await db.delete(categories);

    // Create categories with parent relationships
    const categoryMap = new Map<string, string>();
    
    for (const categoryData of sampleCategories) {
      const categoryId = uuidv4();
      categoryMap.set(categoryData.slug, categoryId);
      
      // Find parent ID if this is a subcategory
      let parentId = null;
      if (categoryData.level === 1) {
        // Level 1 categories need to find their parent (level 0)
        const parentSlug = getParentSlug(categoryData.slug);
        if (parentSlug && categoryMap.has(parentSlug)) {
          parentId = categoryMap.get(parentSlug)!;
        }
      } else if (categoryData.level === 2) {
        // Level 2 categories need to find their parent (level 1)
        const parentSlug = getParentSlug(categoryData.slug);
        if (parentSlug && categoryMap.has(parentSlug)) {
          parentId = categoryMap.get(parentSlug)!;
        }
      }

      await db.insert(categories).values({
        id: categoryId,
        shopId: defaultShop.id,
        name: categoryData.name,
        slug: categoryData.slug,
        description: categoryData.description,
        image: categoryData.image,
        icon: categoryData.icon,
        parentId,
        level: categoryData.level,
        sortOrder: categoryData.sortOrder,
        isActive: categoryData.isActive,
        featured: categoryData.featured,
        productCount: categoryData.productCount,
      });
    }

    console.log("Categories seeded successfully!");
  } catch (error) {
    console.error("Error seeding categories:", error);
    throw error;
  }
}

// Helper function to determine parent slug based on category structure
function getParentSlug(slug: string): string | null {
  const level1Mapping: Record<string, string> = {
    "smartphones": "electronics",
    "laptops": "electronics",
    "audio": "electronics",
    "mens-clothing": "fashion",
    "womens-clothing": "fashion",
    "footwear": "fashion",
    "furniture": "home-living",
    "kitchen": "home-living",
    "decor": "home-living",
  };

  const level2Mapping: Record<string, string> = {
    "android-phones": "smartphones",
    "iphones": "smartphones",
    "mens-shirts": "mens-clothing",
    "mens-pants": "mens-clothing",
  };

  return level2Mapping[slug] || level1Mapping[slug] || null;
}

// Run the seed function if this file is executed directly
// Note: This check works differently in ES modules
if (import.meta.url === `file://${process.argv[1]}`) {
  seedCategories()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
