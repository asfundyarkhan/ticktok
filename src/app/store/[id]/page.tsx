"use client";

import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import { Toaster, toast } from "react-hot-toast";
import { Star, Minus, Plus, ArrowLeft } from "lucide-react";
import { Tab } from "@headlessui/react";
import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import { FreeMode, Navigation, Thumbs } from "swiper/modules";
import { StockItem } from "@/types/marketplace";
import { StockService } from "@/services/stockService";
import { UserService } from "@/services/userService";
import Breadcrumb from "@/app/components/Breadcrumb";
import EnhancedQuickAddButton from "@/app/components/EnhancedQuickAddButton";
import AddToCartButton from "@/app/components/AddToCartButton";
import AnimatedCartIcon from "@/app/components/AnimatedCartIcon";
import CartDrawer from "@/app/components/CartDrawer";
import { FlyToCartAnimation } from "@/app/components/CartAnimations";
import { useCart } from "@/app/components/NewCartContext";
import { getBestProductImage, normalizeProductImages } from "@/app/utils/imageHelpers";
import { generateUniqueId } from "@/utils/idGenerator";
import { useAuth } from "@/context/AuthContext";
import LoginModal from "@/app/components/LoginModal";
import SellerProfileCard from "@/app/components/SellerProfileCard";
import SellerProfileModal from "@/app/components/SellerProfileModal";
import styles from "./page.module.css";
import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/navigation";
import "swiper/css/thumbs";

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id as string;
  const { user } = useAuth();
  const [product, setProduct] = useState<StockItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [quantity, setQuantity] = useState<number>(1);
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null);
  const [showAnimation, setShowAnimation] = useState(false);
  const [animationStartPosition, setAnimationStartPosition] = useState({
    x: 0,
    y: 0,
  });
  const [animationEndPosition, setAnimationEndPosition] = useState({
    x: 0,
    y: 0,
  });
  const [relatedProducts, setRelatedProducts] = useState<StockItem[]>([]);
  const [showSellerModal, setShowSellerModal] = useState(false);
  const addToCartButtonRef = useRef<HTMLDivElement>(null);
  const cartIconRef = useRef<HTMLDivElement>(null);
  const { addToCart, isCartOpen, setIsCartOpen } = useCart();
  // Get cart icon position for animation
  useEffect(() => {
    const updateCartPosition = () => {
      const cartIcon = document.querySelector(".cart-icon-target");
      if (cartIcon) {
        const rect = cartIcon.getBoundingClientRect();
        setAnimationEndPosition({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        });
      }
    };

    // Initialize positions and update on resize
    updateCartPosition();
    window.addEventListener("resize", updateCartPosition);

    return () => {
      window.removeEventListener("resize", updateCartPosition);
    };
  }, []);  // Load product data from Firebase
  useEffect(() => {
    const loadProduct = async () => {
      if (!productId) return;
      
      console.log("ProductDetailPage: Loading product with ID:", productId);
      
      setLoading(true);
      try {
        // Try multiple approaches to find the product
        let productData = null;
        let errorMessage = "";
        
        // 1. Try to get stock item by ID directly
        try {
          console.log("ProductDetailPage: Trying to find by ID:", productId);
          productData = await StockService.getStockItem(productId, false);
          if (productData) {
            console.log("ProductDetailPage: Found by ID:", productData);
          }
        } catch (error) {
          errorMessage = "Product not found by ID";
          console.log(errorMessage, error);
        }
        
        // 2. If not found, try by product code
        if (!productData) {
          try {
            console.log("ProductDetailPage: Trying to find by product code:", productId);
            productData = await StockService.getStockItem(productId, true);
            if (productData) {
              console.log("ProductDetailPage: Found by product code:", productData);
            }
          } catch (error) {
            errorMessage += ", Product not found by code";
            console.log("Product not found by code:", error);
          }
        }
        
        // 3. Try looking for it in listings as a last resort
        if (!productData) {
          try {
            console.log("ProductDetailPage: Trying to find in listings:", productId);
            const listingResults = await StockService.searchListingsByProductId(productId);
            if (listingResults && listingResults.length > 0) {
              console.log("ProductDetailPage: Found in listings:", listingResults[0]);
              // Convert the first listing to a StockItem format
              const listing = listingResults[0];
              const reviews = Array.isArray(listing.reviews) ? listing.reviews :
                     (typeof listing.reviews === 'number' ? 
                      Array(listing.reviews).fill({
                        rating: listing.rating || 0,
                        content: "Legacy review",
                        date: new Date().toISOString()
                      }) : []);              productData = {
                id: listing.id,
                productId: listing.productId,
                name: listing.name,
                description: listing.description,
                price: listing.price,
                features: "",
                stock: listing.quantity,
                mainImage: listing.mainImage || listing.image,
                images: listing.images || [listing.image],
                rating: typeof listing.rating === 'number' ? listing.rating : 0,
                reviews: reviews,
                reviewCount: reviews.length,
                isSale: false,
                salePrice: undefined,
                salePercentage: 0,
                listed: true,
                productCode: listing.productId,
                category: listing.category,
                sellerId: listing.sellerId,
                sellerName: listing.sellerName
              };
            }
          } catch (error) {
            errorMessage += ", Not found in listings";
            console.log("Product not found in listings:", error);
          }
        }
        
        if (productData) {
          console.log("ProductDetailPage: Successfully loaded product:", productData);
          console.log("ProductDetailPage: Seller info - ID:", productData.sellerId, "Name:", productData.sellerName);
          
          // If we have a sellerId but no sellerName, fetch it
          if (productData.sellerId && !productData.sellerName) {
            try {
              console.log("ProductDetailPage: Fetching seller name for ID:", productData.sellerId);
              const sellerProfile = await UserService.getUserProfile(productData.sellerId);
              if (sellerProfile) {
                productData.sellerName = sellerProfile.displayName || sellerProfile.email || 'Unknown Seller';
                console.log("ProductDetailPage: Found seller name:", productData.sellerName);
              }
            } catch (error) {
              console.log("ProductDetailPage: Error fetching seller profile:", error);
              productData.sellerName = 'Unknown Seller';
            }
          }
          
          setProduct(productData);
          
          // Load related products from the same category
          try {
            const allProducts = await StockService.getAllStockItems();
            const related = allProducts
              .filter(p => p.category === productData.category && p.id !== productData.id)
              .slice(0, 4);
            setRelatedProducts(related);
          } catch (error) {
            console.log("Error loading related products:", error);
          }
        } else {
          console.error("ProductDetailPage: Product not found after all attempts:", errorMessage);
          console.error("ProductDetailPage: Searched for product ID:", productId);
        }
      } catch (error) {
        console.error("Error loading product:", error);
        toast.error("Failed to load product");
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [productId]);
  // Types
  type Review = {
    id?: string | number;
    author?: string;
    userName?: string;
    rating: number;
    date?: string;
    timestamp?: number;
    content?: string;
    text?: string;
    comment?: string;
    verified?: boolean;
  };
  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/store" },
    { label: product?.category || "Category", href: `/store?category=${product?.category}` },
  ];
  interface CartItem {
    id: string;
    productId: string;
    name: string;
    price: number;
    salePrice?: number;
    image: string;
    quantity: number;
    sellerId: string;
    category: string;
    description: string;
    stock: number;
    rating: number;
  }

  // Safe quantity helpers
  const safeStock = typeof product?.stock === 'number' ? product.stock : 0;
  const safeQuantity = typeof quantity === 'number' ? quantity : 1;

  // Quantity handlers
  const handleQuantityDecrease = () => {
    if (safeStock === 0) return;
    setQuantity(Math.max(1, safeQuantity - 1));
  };

  const handleQuantityIncrease = () => {
    if (safeStock === 0) return;
    setQuantity(Math.min(safeStock, safeQuantity + 1));
  };

  const handleSellerClick = () => {
    if (product?.sellerId) {
      setShowSellerModal(true);
    }
  };

  // Handler for related product quick add
  const handleRelatedProductQuickAdd = () => {
    // Check if user is authenticated
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    // If authenticated, let the default behavior handle the cart addition
  };

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Check if user is authenticated
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    if (!product) {
      toast.error("Product not found");
      return;
    }

    if (safeStock === 0) {
      toast.error("This product is out of stock");
      return;
    }

    // Get animation start position from the click event
    if (addToCartButtonRef.current) {
      const rect = addToCartButtonRef.current.getBoundingClientRect();
      setAnimationStartPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
    } else {
      // Fallback to click position if ref not available
      setAnimationStartPosition({
        x: e.clientX,
        y: e.clientY,
      });
    }

    // Show animation
    setShowAnimation(true);

    // Add to cart with a slight delay to allow animation to start
    setTimeout(() => {
      const finalQuantity = Math.min(safeQuantity, safeStock);
      
      if (finalQuantity <= 0) {
        toast.error("Invalid quantity selected");
        return;
      }      const productToAdd: CartItem = {
        id: product.productId || product.id || generateUniqueId('PROD'),
        productId: product.productId || product.id || generateUniqueId('PROD'),
        name: product.name || "Unnamed Product",
        price: product.isSale && typeof product.salePrice === 'number' ? product.salePrice : (typeof product.price === 'number' ? product.price : 0),
        salePrice: typeof product.salePrice === 'number' ? product.salePrice : undefined,
        image: product.mainImage || "/images/placeholders/product.svg",
        quantity: finalQuantity,
        sellerId: product.sellerId || "",
        rating: typeof product.rating === 'number' ? product.rating : 0,
        category: product.category || "Uncategorized",
        description: product.description || "",
        stock: safeStock,
      };
      
      addToCart(productToAdd);
      toast.success(`${finalQuantity} ${productToAdd.name} added to cart!`);
    }, 100);

    // Hide animation after it's complete
    setTimeout(() => {
      setShowAnimation(false);
    }, 1000);
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-white min-h-screen">
        <Toaster position="top-right" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF0059]"></div>
          </div>
        </div>
      </div>
    );
  }
  // Product not found
  if (!product) {
    return (
      <div className="bg-white min-h-screen">
        <Toaster position="top-right" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">          <div className="text-center py-20">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
            <p className="text-gray-600 mb-8">
              {productId.startsWith('PROD-') || /^[A-Z0-9]{8,}$/.test(productId) ? 
                'This product is no longer available or has been sold out.' : 
                'Sorry, we couldn\'t find the product you\'re looking for. It may have been removed or the URL is incorrect.'}
            </p>
            <Link
              href="/store"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#FF0059] hover:bg-[#E60050]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Store
            </Link>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="bg-white">
      <Toaster position="top-right" />
      
      {/* Login Modal */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />
      
      {/* Cart Animation */}
      {showAnimation && (
        <FlyToCartAnimation
          startPosition={animationStartPosition}
          endPosition={animationEndPosition}
          productImage={getBestProductImage(product) || undefined}
          onAnimationComplete={() => setShowAnimation(false)}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 relative">
        {/* Cart Icon - Target for animation */}{" "}
        <div className="absolute top-8 right-8">
          <div ref={cartIconRef} className="cart-icon-target">
            <AnimatedCartIcon
              size="lg"
              className="cursor-pointer"
              onClick={() => setIsCartOpen(true)}
            />
          </div>
        </div>
        <div className="mb-6">
          <Breadcrumb items={breadcrumbItems} />
        </div>        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Product Images */}
          <div className={styles.swiperContainer}>
            <Swiper
              spaceBetween={10}
              navigation={true}
              thumbs={{ swiper: thumbsSwiper }}
              modules={[FreeMode, Navigation, Thumbs]}
              className="rounded-lg overflow-hidden mb-4"
            >              {normalizeProductImages(product.images, product.mainImage).map((img, index) => (
                <SwiperSlide key={index}>
                  <div className="aspect-square">
                    <Image
                      src={img || "/images/placeholders/product.svg"}
                      alt={`${product.name} - View ${index + 1}`}
                      width={500}
                      height={500}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.log("Image failed to load:", e.currentTarget.src);
                        const originalSrc = e.currentTarget.src;
                        
                        // Skip if it's already a placeholder
                        if (originalSrc.includes('/images/placeholders/')) {
                          return;
                        }

                        // Try different image formats if the current one fails
                        if (!originalSrc.includes('firebasestorage.googleapis.com')) {
                          // First try as a direct Firebase Storage URL
                          const imageUrl = img.startsWith('http') ? img : `https://firebasestorage.googleapis.com/v0/b/ticktokshop-5f1e9.appspot.com/o/${encodeURIComponent(img)}?alt=media`;
                          e.currentTarget.src = imageUrl;
                        } else if (originalSrc.includes('?alt=media')) {
                          // If alt=media URL fails, try without it
                          e.currentTarget.src = originalSrc.split('?')[0];
                        } else if (!originalSrc.includes('/products/')) {
                          // If we haven't tried the products folder yet, try that
                          const productsUrl = originalSrc.replace('/o/', '/o/products%2F');
                          e.currentTarget.src = productsUrl;
                        } else {
                          // If all attempts fail, use placeholder
                          e.currentTarget.src = '/images/placeholders/product.svg';
                        }
                      }}
                      unoptimized={true}
                      priority
                    />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
            <Swiper
              onSwiper={setThumbsSwiper}
              spaceBetween={10}
              slidesPerView={4}
              freeMode={true}
              watchSlidesProgress={true}
              modules={[FreeMode, Navigation, Thumbs]}
              className={styles.thumbsSwiper}
            >              {normalizeProductImages(product.images, product.mainImage).map((img, index) => (
                <SwiperSlide key={index}>
                  <div className="aspect-square cursor-pointer">
                    <Image
                      src={img || "/images/placeholders/product.svg"}
                      alt={`${product.name} - Thumbnail ${index + 1}`}
                      width={100}
                      height={100}
                      className="w-full h-full object-cover rounded-md"
                      onError={(e) => {
                        console.log("Image failed to load:", e.currentTarget.src);
                        const originalSrc = e.currentTarget.src;
                        
                        // Skip if it's already a placeholder
                        if (originalSrc.includes('/images/placeholders/')) {
                          return;
                        }

                        // Try different image formats if the current one fails
                        if (!originalSrc.includes('firebasestorage.googleapis.com')) {
                          // First try as a direct Firebase Storage URL
                          const imageUrl = img.startsWith('http') ? img : `https://firebasestorage.googleapis.com/v0/b/ticktokshop-5f1e9.appspot.com/o/${encodeURIComponent(img)}?alt=media`;
                          e.currentTarget.src = imageUrl;
                        } else if (originalSrc.includes('?alt=media')) {
                          // If alt=media URL fails, try without it
                          e.currentTarget.src = originalSrc.split('?')[0];
                        } else if (!originalSrc.includes('/products/')) {
                          // If we haven't tried the products folder yet, try that
                          const productsUrl = originalSrc.replace('/o/', '/o/products%2F');
                          e.currentTarget.src = productsUrl;
                        } else {
                          // If all attempts fail, use placeholder
                          e.currentTarget.src = '/images/placeholders/product.svg';
                        }
                      }}
                      unoptimized={true}
                      priority
                    />
                  </div>
                </SwiperSlide>
              ))}</Swiper>
          </div>

          {/* Product Details */}
          <div className="flex flex-col">
            <h1 className="text-2xl font-semibold text-gray-900">
              {product.name}
            </h1>
            {/* Rating */}
            <div className="mt-2 flex items-center gap-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(product.rating || 0)
                        ? "text-yellow-400 fill-current"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600">
                {(product.rating || 0).toFixed(1)}/5 ({product.reviewCount || (Array.isArray(product.reviews) ? product.reviews.length : 0)} reviews)
              </span>
            </div>
            {/* Price */}
            <div className="mt-4">
              {product.isSale && product.salePrice ? (
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-semibold text-gray-900">
                    ${product.salePrice.toFixed(2)}
                  </span>
                  <span className="text-lg text-gray-500 line-through">
                    ${product.price.toFixed(2)}
                  </span>
                  <span className="px-2 py-1 text-xs font-bold text-white bg-red-500 rounded">
                    -{product.salePercentage}% OFF
                  </span>
                </div>
              ) : (
                <span className="text-2xl font-semibold text-gray-900">
                  ${product.price.toFixed(2)}
                </span>
              )}
            </div>
            {/* Description */}
            <p className="mt-4 text-gray-600">
              {product.description}
            </p>            {/* Features */}
            {product.features && (Array.isArray(product.features) ? product.features.length > 0 : product.features) && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Features</h3>
                {Array.isArray(product.features) ? (
                  <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                    {product.features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-600 whitespace-pre-line">{product.features}</p>
                )}
              </div>
            )}

            {/* Seller Profile Section */}
            {product.sellerId && (
              <div 
                className="mt-6 p-4 bg-gray-50 rounded-lg border cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={handleSellerClick}
              >
                <h3 className="text-sm font-medium text-gray-900 mb-3">Seller Information</h3>
                <SellerProfileCard 
                  sellerId={product.sellerId}
                  sellerName={product.sellerName}
                  compact={true}
                />
              </div>
            )}
            
            {/* Stock Info */}
            <div className="mt-4">
              <div className="flex flex-col gap-1">
                <p className="text-sm text-gray-600">
                  <span className={`font-medium ${product.stock > 10 ? 'text-green-600' : product.stock > 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                  </span>
                </p>
                {product.sellerName && (
                  <p className="text-sm text-gray-600">
                    <span className="text-gray-500">Sold by</span>
                    <span 
                      className="ml-1 font-medium text-blue-600 hover:text-blue-700 cursor-pointer"
                      onClick={handleSellerClick}
                    >
                      {product.sellerName}
                    </span>
                  </p>
                )}
              </div>
            </div>
            {/* Quantity */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-900">Quantity</h3>
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={handleQuantityDecrease}
                  className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={safeStock === 0}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center text-gray-900">{safeQuantity}</span>
                <button
                  onClick={handleQuantityIncrease}
                  className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={safeStock === 0 || safeQuantity >= safeStock}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            {/* Add to Cart Button */}
            <div ref={addToCartButtonRef}>              <AddToCartButton
                product={{
                  id: product.productId || product.id || "",
                  name: product.name,
                  price: product.isSale && product.salePrice ? product.salePrice : product.price,
                  salePrice: product.salePrice,
                  image: product.mainImage,
                  sellerId: product.sellerId || "",
                  category: product.category,
                  description: product.description,
                  stock: product.stock || 0,
                  rating: product.rating,
                  reviews: typeof product.reviews === 'number' ? product.reviews : 0,
                  productCode: product.productCode,
                  listed: product.listed,
                  isSale: product.isSale,
                  salePercentage: product.salePercentage,
                }}
                quantity={quantity}
                className="mt-8"
                fullWidth={true}
                requiresSize={false}
                buttonText={product.stock > 0 ? "Add to Cart" : "Out of Stock"}
                variant="filled"
                onClick={product.stock > 0 ? handleAddToCart : undefined}/>
            </div>
          </div>
        </div>
        
        {/* Product Tabs */}
        <div className="mb-12">
          <Tab.Group>
            <Tab.List className="flex space-x-8 border-b">
              <Tab
                className={({ selected }) =>
                  `py-4 text-sm font-medium border-b-2 ${
                    selected
                      ? "text-pink-600 border-pink-600"
                      : "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300"
                  }`
                }
              >
                Product Details
              </Tab>
              <Tab
                className={({ selected }) =>
                  `py-4 text-sm font-medium border-b-2 ${
                    selected
                      ? "text-pink-600 border-pink-600"
                      : "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300"
                  }`
                }
              >
                Rating & Reviews
              </Tab>
              <Tab
                className={({ selected }) =>
                  `py-4 text-sm font-medium border-b-2 ${
                    selected
                      ? "text-pink-600 border-pink-600"
                      : "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300"
                  }`
                }
              >
                FAQs
              </Tab>
            </Tab.List>
            <Tab.Panels className="mt-8">              <Tab.Panel>
                <div className="prose max-w-none">
                  <h3 className="text-lg font-medium mb-4">
                    Product Description
                  </h3>
                  <p className="mb-4">
                    {product.description}
                  </p>
                  {product.features && (
                    <>
                      <h4 className="text-md font-medium mt-4 mb-2">Features:</h4>
                      <p className="whitespace-pre-line">{product.features}</p>
                    </>
                  )}
                  {product.category && (
                    <div className="mt-4">
                      <h4 className="text-md font-medium mb-2">Product Details:</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Category: {product.category}</li>
                        <li>Product ID: {product.productId}</li>
                        {product.sellerName && <li>Sold by: {product.sellerName}</li>}
                        <li>Stock: {product.stock} available</li>
                      </ul>
                    </div>
                  )}
                </div>
              </Tab.Panel>              <Tab.Panel>
                <div className="space-y-8">
                  {Array.isArray(product.reviews) && product.reviews.length > 0 ? (
                    product.reviews.map((review: Review) => (
                      <div key={review.id || Math.random()} className="border-b pb-8">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">
                                {review.author || review.userName || "Anonymous"}
                              </span>
                              {review.verified && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                  Verified Purchase
                                </span>
                              )}
                            </div>
                            <div className="flex items-center mt-1">
                              <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < Math.floor(review.rating)
                                        ? "text-yellow-400 fill-current"
                                        : "text-gray-300"
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="ml-2 text-sm text-gray-500">
                                {review.date || (review.timestamp && new Date(review.timestamp).toLocaleDateString()) || 'No date'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <p className="mt-4 text-gray-600">{review.content || review.text || review.comment || 'No comment'}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No reviews yet</p>
                      <p className="text-sm text-gray-400 mt-2">Be the first to review this product!</p>
                    </div>
                  )}
                </div>
              </Tab.Panel>
              <Tab.Panel>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-base font-medium text-gray-900">
                      What size should I order?
                    </h4>
                    <p className="mt-2 text-gray-600">
                      Our t-shirts are true to size. For a regular fit, order
                      your usual size. If you prefer a looser fit, we recommend
                      sizing up.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-base font-medium text-gray-900">
                      How do I care for this t-shirt?
                    </h4>
                    <p className="mt-2 text-gray-600">
                      Machine wash cold with similar colors. Tumble dry low. Do
                      not bleach.
                    </p>
                  </div>
                </div>
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </div>        {/* Related Products */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            You Might Also Like
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((relatedProduct, index) => (
              <div
                key={`${relatedProduct.id}-${index}`}
                className="bg-white rounded-lg shadow-sm overflow-hidden"
              >
                <div className="relative aspect-square">
                  <Image
                    src={relatedProduct.mainImage || "/images/placeholders/t-shirt.svg"}
                    alt={relatedProduct.name}
                    width={300}
                    height={300}
                    className="w-full h-full object-cover"
                  />
                  {relatedProduct.isSale && (
                    <span className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 text-xs font-semibold rounded">
                      -{relatedProduct.salePercentage}% OFF
                    </span>
                  )}
                </div>                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        {relatedProduct.name}
                      </h3>
                      <div className="mt-1">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < Math.floor(relatedProduct.rating)
                                  ? "text-yellow-400 fill-current"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}                          <span className="ml-1 text-xs text-gray-500">
                            ({typeof relatedProduct.reviews === 'number' ? relatedProduct.reviews : 0})
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          {relatedProduct.isSale && relatedProduct.salePrice ? (
                            <>
                              <span className="text-sm font-medium text-gray-900">
                                ${relatedProduct.salePrice.toFixed(2)}
                              </span>
                              <span className="text-xs text-gray-500 line-through">
                                ${relatedProduct.price.toFixed(2)}
                              </span>
                            </>
                          ) : (
                            <span className="text-sm font-medium text-gray-900">
                              ${relatedProduct.price.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <EnhancedQuickAddButton
                      product={{
                        id: relatedProduct.id || "",
                        name: relatedProduct.name || "",
                        price: relatedProduct.isSale && relatedProduct.salePrice ? relatedProduct.salePrice : (relatedProduct.price || 0),
                        image: relatedProduct.mainImage || "",
                        category: relatedProduct.category || "",
                        description: relatedProduct.description || "",
                        quantity: relatedProduct.stock || 0,
                        sellerId: relatedProduct.sellerId || "",
                        sellerName: relatedProduct.sellerName || "",
                        productId: relatedProduct.productId || "",
                        isSale: relatedProduct.isSale || false,
                        salePrice: relatedProduct.salePrice || undefined,
                      }}
                      className="flex items-center justify-center"
                      showIcon={true}
                      variant="round"
                      size="sm"
                      onClick={handleRelatedProductQuickAdd}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      
      {/* Seller Profile Modal */}
      <SellerProfileModal
        isOpen={showSellerModal}
        onClose={() => setShowSellerModal(false)}
        sellerId={product?.sellerId || ""}
        sellerName={product?.sellerName || ""}
      />
    </div>
  );
}
