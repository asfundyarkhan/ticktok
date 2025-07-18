"use client";

import { motion } from "framer-motion";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import Image from "next/image";
import { MainPageService, CategoryWithImage, BestSellerProduct } from "@/services/mainPageService";
import { getBestProductImage } from "../utils/imageHelpers";

function MainPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const suspended = searchParams.get("suspended");
  
  const [categories, setCategories] = useState<CategoryWithImage[]>([]);
  const [bestSellers, setBestSellers] = useState<BestSellerProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // Load categories and best sellers
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [categoriesData, bestSellersData] = await Promise.all([
          MainPageService.getCategoriesWithImages(),
          MainPageService.getBestSellingProducts(8)
        ]);
        
        setCategories(categoriesData);
        setBestSellers(bestSellersData);
      } catch (error) {
        console.error('Error loading main page data:', error);
        toast.error('Failed to load page data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Show suspended message if applicable
  useEffect(() => {
    if (suspended === "true") {
      toast.error(
        "Your account has been suspended. Please contact support for assistance.",
        {
          duration: 10000,
          position: "top-center",
          style: {
            border: "1px solid #FF0000",
            padding: "16px",
            color: "#FF0000",
            maxWidth: "500px",
          },
        }
      );
    }
  }, [suspended]);

  const handleCategoryClick = (categoryId: string) => {
    // Navigate to store with category filter
    router.push(`/store?category=${categoryId}`);
  };

  const handleViewAllClick = () => {
    router.push("/store");
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Large Hero Image Section - Now First */}
      <section className="relative h-screen min-h-[600px] overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/placeholders/hero.jpg"
            alt="Fashion Collection"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          {/* Stronger overlay for better text readability */}
          <div className="absolute inset-0 bg-black/50" />
        </div>
        
        {/* Content overlay */}
        <div className="relative z-10 flex items-center justify-center h-full">
          <div className="text-center text-white px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6" style={{
                color: '#FFFFFF',
                textShadow: '4px 4px 8px rgba(0,0,0,1), 3px 3px 6px rgba(0,0,0,0.9), 2px 2px 4px rgba(0,0,0,0.8), 1px 1px 2px rgba(0,0,0,0.7), 0px 0px 10px rgba(0,0,0,0.6)',
                filter: 'contrast(1.3) brightness(1.2) drop-shadow(4px 4px 8px rgba(0,0,0,0.8))'
              }}>
                TikTok Shop
              </h2>
              <p className="text-xl md:text-3xl lg:text-4xl font-light mb-8" style={{
                color: '#FFFFFF',
                textShadow: '3px 3px 6px rgba(0,0,0,1), 2px 2px 4px rgba(0,0,0,0.9), 1px 1px 2px rgba(0,0,0,0.8), 0px 0px 8px rgba(0,0,0,0.7)',
                filter: 'contrast(1.2) brightness(1.15) drop-shadow(3px 3px 6px rgba(0,0,0,0.8))'
              }}>
                Create joy and sell more
              </p>
              <p className="text-lg md:text-xl lg:text-2xl font-light mb-8" style={{
                color: '#FFFFFF',
                textShadow: '2px 2px 4px rgba(0,0,0,1), 1px 1px 2px rgba(0,0,0,0.9), 0px 0px 6px rgba(0,0,0,0.6)',
                filter: 'contrast(1.1) brightness(1.1) drop-shadow(2px 2px 4px rgba(0,0,0,0.7))'
              }}>
                Let your customers discover and buy your products the fun way.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleViewAllClick}
                className="px-8 py-4 bg-white text-gray-900 rounded-md text-lg font-semibold hover:bg-gray-100 transition-all duration-300 shadow-xl"
                style={{
                  boxShadow: '0 10px 25px rgba(0,0,0,0.3), 0 6px 10px rgba(0,0,0,0.2)'
                }}
              >
                New In
              </motion.button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Hero Section - Now Second */}
      <section className="relative bg-gradient-to-br from-pink-50 via-white to-purple-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Discover Your
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">
                {" "}Perfect Style
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Explore our curated collection of fashion, accessories, and lifestyle products. 
              Find everything you need to express your unique style.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleViewAllClick}
              className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full text-lg font-semibold hover:shadow-lg transition-all duration-300"
            >
              Shop All Categories
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Shop by Category
            </h2>
            <p className="text-lg text-gray-600">
              Find exactly what you&apos;re looking for in our specialized collections
            </p>
          </motion.div>

          {/* Category Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {loading ? (
              // Loading skeleton
              Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="bg-gray-200 rounded-2xl h-64 lg:h-80"></div>
                </div>
              ))
            ) : categories.length > 0 ? (
              categories.map((category, index) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="group cursor-pointer"
                  onClick={() => handleCategoryClick(category.id)}
                >
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 transform group-hover:scale-105">
                    {/* Background Image */}
                    {category.image ? (
                      <div className="absolute inset-0">
                        <Image
                          src={category.image}
                          alt={category.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/30 group-hover:from-black/95 group-hover:via-black/70 group-hover:to-black/40 transition-all duration-300" />
                      </div>
                    ) : (
                      // Fallback gradient if no image
                      <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-80 group-hover:opacity-90 transition-opacity duration-300`} />
                    )}
                    
                    {/* Content */}
                    <div className="relative z-10 p-6 lg:p-8 h-64 lg:h-80 flex flex-col justify-end text-white">
                      <div className="transform group-hover:translate-y-[-10px] transition-transform duration-300">
                        <h3 className="text-xl lg:text-2xl font-bold mb-2 text-white drop-shadow-lg" style={{
                          color: '#FFFFFF',
                          textShadow: '3px 3px 6px rgba(0,0,0,1), 2px 2px 4px rgba(0,0,0,0.9), 1px 1px 2px rgba(0,0,0,0.8), 0px 0px 8px rgba(0,0,0,0.7)',
                          filter: 'contrast(1.2) brightness(1.1)'
                        }}>
                          {category.name}
                        </h3>
                        <p className="mb-2 text-sm lg:text-base drop-shadow-md" style={{
                          color: '#FFFFFF',
                          textShadow: '2px 2px 4px rgba(0,0,0,0.9), 1px 1px 3px rgba(0,0,0,0.8), 0px 0px 6px rgba(0,0,0,0.6)',
                          filter: 'contrast(1.1) brightness(1.05)'
                        }}>
                          {category.description}
                        </p>
                        <p className="mb-4 text-xs lg:text-sm drop-shadow-md" style={{
                          color: '#FFFFFF',
                          textShadow: '2px 2px 4px rgba(0,0,0,0.8), 1px 1px 2px rgba(0,0,0,0.7), 0px 0px 4px rgba(0,0,0,0.5)',
                          filter: 'contrast(1.1) brightness(1.05)'
                        }}>
                          {category.productCount} products
                        </p>
                        <div className="inline-flex items-center text-xs lg:text-sm font-medium drop-shadow-md" style={{
                          color: '#FFFFFF',
                          textShadow: '2px 2px 4px rgba(0,0,0,0.9), 1px 1px 2px rgba(0,0,0,0.8), 0px 0px 6px rgba(0,0,0,0.6)',
                          filter: 'contrast(1.1) brightness(1.05)'
                        }}>
                          Shop Now
                          <svg className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform duration-300 drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{
                            filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.8)) drop-shadow(1px 1px 2px rgba(0,0,0,0.9))'
                          }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Decorative Elements */}
                    <div className="absolute top-4 right-4 w-20 h-20 bg-white/10 rounded-full blur-xl" />
                    <div className="absolute bottom-4 left-4 w-12 h-12 bg-white/5 rounded-full blur-lg" />
                  </div>
                </motion.div>
              ))
            ) : (
              // No categories found
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500 text-lg mb-4">No categories available at the moment</p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleViewAllClick}
                  className="px-6 py-3 bg-pink-500 text-white rounded-full font-semibold hover:bg-pink-600 transition-colors"
                >
                  Browse All Products
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Best Sellers Section */}
      {bestSellers.length > 0 && (
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Best Sellers
              </h2>
              <p className="text-lg text-gray-600">
                Discover our most popular products loved by customers
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {bestSellers.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="group cursor-pointer bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
                  onClick={() => router.push(`/store/${product.id}`)}
                >
                  {/* Product Image */}
                  <div className="relative h-48 lg:h-56 overflow-hidden">
                    {(() => {
                      const imageUrl = getBestProductImage(product) || product.mainImage || (product.images && product.images[0]);
                      return imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      );
                    })()}
                    
                    {/* Trending Badge */}
                    {product.trending && (
                      <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                        🔥 Trending
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 overflow-hidden group-hover:text-pink-600 transition-colors" style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical' as const
                    }}>
                      {product.name}
                    </h3>
                    
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xl font-bold text-gray-900">
                        ${product.price.toFixed(2)}
                      </span>
                      {product.rating > 0 && (
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                          </svg>
                          <span className="ml-1 text-sm text-gray-600">{product.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>by {product.sellerName}</span>
                      {product.salesCount && (
                        <span>{product.salesCount} sold</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="text-center mt-12">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleViewAllClick}
                className="px-8 py-3 bg-pink-500 text-white rounded-full font-semibold hover:bg-pink-600 transition-colors"
              >
                View All Products
              </motion.button>
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose TikTok Shop?
            </h2>
            <p className="text-lg text-gray-600">
              Experience the best in online shopping with our premium features
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {[
              {
                icon: "🚚",
                title: "Fast Delivery",
                description: "Quick and reliable shipping to your doorstep"
              },
              {
                icon: "✨",
                title: "Premium Quality",
                description: "Carefully curated products from trusted sellers"
              },
              {
                icon: "🔒",
                title: "Secure Shopping",
                description: "Safe and secure payment processing"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center p-8 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-pink-500 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Start Shopping?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Join thousands of satisfied customers and discover your new favorite products today.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleViewAllClick}
              className="px-8 py-4 bg-white text-purple-600 rounded-full text-lg font-semibold hover:shadow-lg transition-all duration-300"
            >
              Browse All Products
            </motion.button>
          </motion.div>
        </div>
      </section>
    </main>
  );
}

export default function MainPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <MainPageContent />
    </Suspense>
  );
}
