"use client";

import { useState, useRef, useEffect } from "react";
import { Toaster, toast } from "react-hot-toast";
import { Star, Minus, Plus } from "lucide-react";
import { Tab } from "@headlessui/react";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import { FreeMode, Navigation, Thumbs } from "swiper/modules";
import { Product } from "@/types/product";
import Breadcrumb from "@/app/components/Breadcrumb";
import EnhancedQuickAddButton from "@/app/components/EnhancedQuickAddButton";
import AddToCartButton from "@/app/components/AddToCartButton";
import RelatedProducts from "@/app/components/RelatedProducts";
import CartNotification from "@/app/components/CartNotification";
import AnimatedCartIcon from "@/app/components/AnimatedCartIcon";
import CartDrawer from "@/app/components/CartDrawer";
import { FlyToCartAnimation } from "@/app/components/CartAnimations";
import { useCart } from "@/app/components/CartContext";
import styles from "./page.module.css";
import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/navigation";
import "swiper/css/thumbs";

export default function ProductDetailPage() {
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
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
  }, []);

  const product: Product = {
    id: "graphic-tshirt-1",
    name: "One Life Graphic T-shirt",
    price: 260,
    category: "casual",
    rating: 4.5,
    image: "/images/placeholders/t-shirt.svg",
    reviews: 128,
    sizes: ["Small", "Medium", "Large", "X-Large"],
  };

  const productImages = [
    "/images/placeholders/t-shirt.svg",
    "/images/placeholders/t-shirt.svg",
    "/images/placeholders/t-shirt.svg",
    "/images/placeholders/t-shirt.svg",
  ];

  const similarProducts: Product[] = [
    {
      id: "polo-1",
      name: "Polo with Contrast Trims",
      price: 212,
      salePrice: 145,
      category: "casual",
      rating: 4.0,
      image: "/images/placeholders/t-shirt.svg",
      reviews: 85,
      isSale: true,
    },
    {
      id: "gradient-1",
      name: "Gradient Graphic T-shirt",
      price: 145,
      category: "casual",
      rating: 3.5,
      image: "/images/placeholders/t-shirt.svg",
      reviews: 35,
    },
    {
      id: "polo-2",
      name: "Polo with Tipping Details",
      price: 180,
      category: "casual",
      rating: 4.0,
      image: "/images/placeholders/t-shirt.svg",
      reviews: 92,
    },
    {
      id: "striped-1",
      name: "Black Striped T-shirt",
      price: 150,
      salePrice: 120,
      category: "casual",
      rating: 4.0,
      image: "/images/placeholders/t-shirt.svg",
      reviews: 78,
      isSale: true,
    },
  ];

  const reviews = [
    {
      id: 1,
      author: "Samantha D.",
      rating: 4.5,
      date: "August 15, 2023",
      content:
        "I received my shirt in the mail, and I'm super happy with the fabric quality and attention to detail. It's become my favorite go-to shirt.",
      verified: true,
    },
    {
      id: 2,
      author: "Alex M.",
      rating: 4.0,
      date: "August 15, 2023",
      content:
        "This is my first purchase from this shop, and I'm quite satisfied with the print quality. Being a perfectionist about aesthetics, this t-shirt definitely gets a thumbs up from me.",
      verified: true,
    },
  ];

  const colors = [
    { name: "Olive", class: "bg-olive-800" },
    { name: "Navy", class: "bg-navy-800" },
    { name: "Black", class: "bg-gray-900" },
  ];

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/store" },
    { label: "Men", href: "/store/men" },
    { label: "T-shirts", href: "/store/men/t-shirts" },
  ];
  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!selectedSize) {
      toast.error("Please select a size");
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
      addToCart({
        ...product,
        quantity: quantity,
        size: selectedSize,
      });

      // Show success message
      toast.success(`${quantity} ${product.name} added to cart!`);
    }, 100);

    // Hide animation after it's complete
    setTimeout(() => {
      setShowAnimation(false);
    }, 1000);
  };
  return (
    <div className="bg-white">
      <Toaster position="top-right" />

      {/* Cart Animation */}
      {showAnimation && (
        <FlyToCartAnimation
          startPosition={animationStartPosition}
          endPosition={animationEndPosition}
          productImage={product.image}
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
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Product Images */}
          <div className={styles.swiperContainer}>
            <Swiper
              spaceBetween={10}
              navigation={true}
              thumbs={{ swiper: thumbsSwiper }}
              modules={[FreeMode, Navigation, Thumbs]}
              className="rounded-lg overflow-hidden mb-4"
            >
              {productImages.map((img, index) => (
                <SwiperSlide key={index}>
                  <div className="aspect-square">
                    <img
                      src={img}
                      alt={`${product.name} - View ${index + 1}`}
                      className="w-full h-full object-cover"
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
            >
              {productImages.map((img, index) => (
                <SwiperSlide key={index}>
                  <div className="aspect-square cursor-pointer rounded-lg overflow-hidden">
                    <img
                      src={img}
                      alt={`${product.name} - Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
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
                      i < Math.floor(product.rating)
                        ? "text-yellow-400 fill-current"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600">
                {product.rating}/5 ({product.reviews} reviews)
              </span>
            </div>
            {/* Price */}
            <div className="mt-4">
              <span className="text-2xl font-semibold text-gray-900">
                ${product.price}
              </span>
            </div>
            {/* Description */}
            <p className="mt-4 text-gray-600">
              This graphic t-shirt which is perfect for any occasion. Crafted
              from a soft and breathable fabric, it offers superior comfort and
              style.
            </p>
            {/* Color Selection */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-900">
                Select Colors
              </h3>
              <div className="mt-2 flex gap-2">
                {colors.map((color) => (
                  <button
                    key={color.name}
                    className={`w-8 h-8 rounded-full ${color.class} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500`}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
            {/* Size Selection */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-900">Choose Size</h3>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {product.sizes?.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`py-2 px-4 text-sm font-medium rounded-lg border ${
                      selectedSize === size
                        ? "border-pink-500 bg-pink-50 text-pink-500"
                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
            {/* Quantity */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-900">Quantity</h3>
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 border rounded-lg hover:bg-gray-50"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center text-gray-900">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 border rounded-lg hover:bg-gray-50"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>{" "}
            {/* Add to Cart Button */}
            <div ref={addToCartButtonRef}>
              <AddToCartButton
                product={product}
                quantity={quantity}
                size={selectedSize}
                className="mt-8"
                fullWidth={true}
                requiresSize={true}
                buttonText="Add to Cart"
                variant="filled"
                onClick={handleAddToCart}
              />
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
            <Tab.Panels className="mt-8">
              <Tab.Panel>
                <div className="prose max-w-none">
                  <h3 className="text-lg font-medium mb-4">
                    Product Description
                  </h3>
                  <p>
                    Our One Life Graphic T-shirt is crafted from premium cotton,
                    ensuring breathability and comfort throughout the day. The
                    modern fit suits all body types, while the unique graphic
                    design adds a touch of personality to your outfit.
                  </p>
                  <h4 className="text-md font-medium mt-4 mb-2">Features:</h4>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>100% Premium Cotton</li>
                    <li>Regular Fit</li>
                    <li>Breathable Fabric</li>
                    <li>Reinforced Stitching</li>
                    <li>Machine Washable</li>
                  </ul>
                </div>
              </Tab.Panel>
              <Tab.Panel>
                <div className="space-y-8">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b pb-8">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">
                              {review.author}
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
                              {review.date}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="mt-4 text-gray-600">{review.content}</p>
                    </div>
                  ))}
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
        </div>
        {/* Similar Products */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            You Might Also Like
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {similarProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow-sm overflow-hidden"
              >
                <div className="relative aspect-square">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  {product.isSale && (
                    <span className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 text-xs font-semibold rounded">
                      SALE
                    </span>
                  )}
                </div>{" "}
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        {product.name}
                      </h3>
                      <div className="mt-1">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < Math.floor(product.rating)
                                  ? "text-yellow-400 fill-current"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                          <span className="ml-1 text-xs text-gray-500">
                            ({product.reviews})
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          {product.salePrice ? (
                            <>
                              <span className="text-sm font-medium text-gray-900">
                                ${product.salePrice}
                              </span>
                              <span className="text-xs text-gray-500 line-through">
                                ${product.price}
                              </span>
                            </>
                          ) : (
                            <span className="text-sm font-medium text-gray-900">
                              ${product.price}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <EnhancedQuickAddButton
                      product={product}
                      className="flex items-center justify-center"
                      showIcon={true}
                      variant="round"
                      size="sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>{" "}
        </div>
      </div>

      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
}
