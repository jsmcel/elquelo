interface PackageProduct {
  productId: number
  defaultVariantId: number
  placement: string
  name: string
  estimatedPrice?: number // Precio estimado en euros (para referencia)
}

interface PackageConfig {
  id: string
  title: string
  emoji: string
  description: string
  products: PackageProduct[]
  category: 'essential' | 'special' | 'premium' | 'seasonal'
  targetGender?: 'male' | 'female' | 'unisex'
  onlyForNoviNovia?: boolean
  isMultiProduct: boolean
  estimatedTotalPrice?: number // Precio total estimado del paquete
}

export const PACKAGES: Record<string, PackageConfig> = {
  camisetas: {
    id: 'camisetas',
    title: '¡HAY CAMISETAS PARA TODOS!',
    emoji: '🎉',
    description: 'Camiseta unisex con QR personalizado para cada participante',
    products: [{
      productId: 71,
      defaultVariantId: 4013, // M White
      placement: 'front',
      name: 'Bella Canvas 3001',
      estimatedPrice: 14
    }],
    category: 'essential',
    isMultiProduct: false,
    estimatedTotalPrice: 14
  },
  sudaderas: {
    id: 'sudaderas',
    title: 'Por si refresca',
    emoji: '🥤',
    description: 'Sudaderas para el frío de la noche',
    products: [{
      productId: 145,
      defaultVariantId: 18759, // M Ash
      placement: 'front',
      name: 'Gildan 18000',
      estimatedPrice: 29
    }],
    category: 'essential',
    isMultiProduct: false,
    estimatedTotalPrice: 29
  },
  novio: {
    id: 'novio',
    title: 'Gadgets para el Novio',
    emoji: '💍',
    description: 'Pack premium: Taza + Gorra + Botella',
    products: [
      { 
        productId: 19, 
        defaultVariantId: 0, // Buscar 11oz variant
        placement: 'default', 
        name: 'Taza 11oz',
        estimatedPrice: 14
      },
      { 
        productId: 92, 
        defaultVariantId: 0, // Buscar variant
        placement: 'front', 
        name: 'Gorra 5 Panel',
        estimatedPrice: 21
      },
      { 
        productId: 382, 
        defaultVariantId: 16030, // Black 17oz
        placement: 'default', 
        name: 'Botella Stainless Steel',
        estimatedPrice: 18
      }
    ],
    category: 'premium',
    onlyForNoviNovia: true,
    targetGender: 'male',
    isMultiProduct: true,
    estimatedTotalPrice: 53
  },
  novia: {
    id: 'novia',
    title: 'Gadgets para la Novia',
    emoji: '💐',
    description: 'Pack premium: Taza + Tote Bag + Libreta',
    products: [
      { 
        productId: 19, 
        defaultVariantId: 0, // Buscar 11oz variant
        placement: 'default', 
        name: 'Taza 11oz',
        estimatedPrice: 14
      },
      { 
        productId: 0, // Buscar Tote Bag simple (no all-over)
        defaultVariantId: 0, 
        placement: 'default', 
        name: 'Tote Bag',
        estimatedPrice: 16
      },
      { 
        productId: 474, 
        defaultVariantId: 0, // Buscar variant
        placement: 'front', 
        name: 'Libreta Spiral',
        estimatedPrice: 12
      }
    ],
    category: 'premium',
    onlyForNoviNovia: true,
    targetGender: 'female',
    isMultiProduct: true,
    estimatedTotalPrice: 42
  },
  ellas: {
    id: 'ellas',
    title: 'Para ellas',
    emoji: '👗',
    description: 'Camisetas con corte femenino',
    products: [{
      productId: 0, // Buscar Women's T-Shirt ID exacto
      defaultVariantId: 0,
      placement: 'front',
      name: "Women's Crew Neck T-Shirt",
      estimatedPrice: 20
    }],
    category: 'special',
    targetGender: 'female',
    isMultiProduct: false,
    estimatedTotalPrice: 20
  },
  sexy: {
    id: 'sexy',
    title: 'Sexy',
    emoji: '🔥',
    description: 'Crop Top para despedidas atrevidas',
    products: [{
      productId: 0, // Buscar Crop Top ID
      defaultVariantId: 0,
      placement: 'front',
      name: 'Crop Top',
      estimatedPrice: 25
    }],
    category: 'premium',
    isMultiProduct: false,
    estimatedTotalPrice: 25
  },
  playa: {
    id: 'playa',
    title: 'Pack Playa',
    emoji: '🏖️',
    description: 'Toalla + Chanclas para el verano',
    products: [
      { 
        productId: 259, 
        defaultVariantId: 0, // Buscar Large variant
        placement: 'default', 
        name: 'Beach Towel Large',
        estimatedPrice: 35
      },
      { 
        productId: 0, // Buscar Flip-Flops ID
        defaultVariantId: 0, 
        placement: 'default', 
        name: 'Flip-Flops',
        estimatedPrice: 25
      }
    ],
    category: 'seasonal',
    isMultiProduct: true,
    estimatedTotalPrice: 60
  },
  recuerdo: {
    id: 'recuerdo',
    title: 'Pack Recuerdo',
    emoji: '🎁',
    description: 'Taza + Póster + Sticker para recordar',
    products: [
      { 
        productId: 19, 
        defaultVariantId: 0, // Buscar 11oz variant
        placement: 'default', 
        name: 'Taza 11oz',
        estimatedPrice: 14
      },
      { 
        productId: 1, 
        defaultVariantId: 0, // Buscar 12×16 variant
        placement: 'default', 
        name: 'Poster 12×16',
        estimatedPrice: 18
      },
      { 
        productId: 0, // Buscar Sticker Kiss Cut ID
        defaultVariantId: 0, 
        placement: 'default', 
        name: 'Sticker Kiss Cut',
        estimatedPrice: 8
      }
    ],
    category: 'special',
    isMultiProduct: true,
    estimatedTotalPrice: 40
  }
}

// Helper function para obtener configuración de paquete
export function getPackageConfig(packageId: string): PackageConfig | null {
  return PACKAGES[packageId] || null
}

// Helper function para obtener todos los paquetes
export function getAllPackages(): PackageConfig[] {
  return Object.values(PACKAGES)
}

// Helper function para obtener paquetes por categoría
export function getPackagesByCategory(category: PackageConfig['category']): PackageConfig[] {
  return Object.values(PACKAGES).filter(pkg => pkg.category === category)
}

// Helper function para obtener paquetes individuales (no multi-producto)
export function getIndividualPackages(): PackageConfig[] {
  return Object.values(PACKAGES).filter(pkg => !pkg.isMultiProduct)
}

// Helper function para obtener paquetes multi-producto
export function getMultiProductPackages(): PackageConfig[] {
  return Object.values(PACKAGES).filter(pkg => pkg.isMultiProduct)
}

// Helper function para obtener paquetes condicionales (solo novio/novia)
export function getConditionalPackages(): PackageConfig[] {
  return Object.values(PACKAGES).filter(pkg => pkg.onlyForNoviNovia === true)
}

export default PACKAGES
