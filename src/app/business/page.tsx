"use client";

import Link from "next/link";
import { ArrowRight, Target, TrendingUp, Users, BarChart3, Video, Megaphone } from "lucide-react";

export default function BusinessPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            TikTok for Business
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90">
            Unlock the power of TikTok's creative ecosystem to grow your business. 
            Reach billions of users with authentic, engaging content and drive real results.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-white text-purple-600 px-8 py-3 rounded-md hover:bg-gray-100 transition duration-200 font-semibold"
            >
              Get Started
            </Link>
            <Link
              href="/contact"
              className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-md hover:bg-white hover:text-purple-600 transition duration-200 font-semibold"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </div>

      {/* Solutions Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Business Solutions</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Whether you're a small business or enterprise, we have the tools and solutions to help you succeed on TikTok.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition duration-200">
            <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Advertising Solutions</h3>
            <p className="text-gray-600 mb-4">
              Reach your target audience with precision using TikTok's advanced advertising platform and creative tools.
            </p>
            <Link href="/contact" className="text-purple-600 hover:text-purple-700 font-medium inline-flex items-center">
              Learn More <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition duration-200">
            <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Video className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Content Creation</h3>
            <p className="text-gray-600 mb-4">
              Create engaging video content that resonates with TikTok's community using our creative studio and tools.
            </p>
            <Link href="/contact" className="text-purple-600 hover:text-purple-700 font-medium inline-flex items-center">
              Explore Tools <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition duration-200">
            <div className="bg-cyan-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <BarChart3 className="w-6 h-6 text-cyan-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Analytics & Insights</h3>
            <p className="text-gray-600 mb-4">
              Measure campaign performance and understand audience behavior with comprehensive analytics and reporting.
            </p>
            <Link href="/contact" className="text-purple-600 hover:text-purple-700 font-medium inline-flex items-center">
              View Analytics <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition duration-200">
            <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Audience Targeting</h3>
            <p className="text-gray-600 mb-4">
              Connect with the right audience using advanced targeting options based on interests, demographics, and behavior.
            </p>
            <Link href="/contact" className="text-purple-600 hover:text-purple-700 font-medium inline-flex items-center">
              Target Audience <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition duration-200">
            <div className="bg-pink-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <Megaphone className="w-6 h-6 text-pink-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Brand Partnerships</h3>
            <p className="text-gray-600 mb-4">
              Collaborate with TikTok creators and influencers to amplify your brand message and reach new audiences.
            </p>
            <Link href="/contact" className="text-purple-600 hover:text-purple-700 font-medium inline-flex items-center">
              Find Partners <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition duration-200">
            <div className="bg-yellow-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-yellow-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Performance Marketing</h3>
            <p className="text-gray-600 mb-4">
              Drive conversions and ROI with performance-based marketing solutions designed for business growth.
            </p>
            <Link href="/contact" className="text-purple-600 hover:text-purple-700 font-medium inline-flex items-center">
              Optimize Performance <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>
      </div>

      {/* Success Stories Section */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Success Stories</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              See how businesses of all sizes are achieving remarkable results with TikTok for Business.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">5x</div>
              <div className="text-gray-600">Average ROI increase</div>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">85%</div>
              <div className="text-gray-600">Audience engagement rate</div>
            </div>
            <div className="text-center">
              <div className="bg-cyan-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-cyan-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">60%</div>
              <div className="text-gray-600">Conversion rate improvement</div>
            </div>
          </div>
        </div>
      </div>

      {/* Industries Section */}
      <div className="bg-gray-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Industries We Serve</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              From retail to technology, we help businesses across all industries connect with their audience.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              "Fashion & Beauty",
              "Technology", 
              "Food & Beverage",
              "Entertainment",
              "Health & Fitness",
              "Home & Garden",
              "Travel & Tourism",
              "Education"
            ].map((industry, index) => (
              <div key={index} className="bg-white p-4 rounded-lg text-center shadow-sm hover:shadow-md transition duration-200">
                <div className="font-semibold text-gray-900">{industry}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Grow Your Business?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join millions of businesses using TikTok to reach and engage their customers in creative new ways.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-white text-purple-600 px-8 py-3 rounded-md hover:bg-gray-100 transition duration-200 font-semibold"
            >
              Get Started Today
            </Link>
            <Link
              href="/contact"
              className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-md hover:bg-white hover:text-purple-600 transition duration-200 font-semibold"
            >
              Speak with Expert
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
