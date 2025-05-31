"use client";

import Link from "next/link";
import { Users, Building, Award, Globe } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold sm:text-5xl">
              About TikTok Shop
            </h1>
            <p className="mt-4 text-xl text-pink-100 max-w-3xl mx-auto">
              We're revolutionizing e-commerce by connecting creators, brands, and consumers
              through the power of short-form video content and social commerce.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        {/* Mission Section */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
          <p className="text-lg text-gray-600 max-w-4xl mx-auto">
            To inspire creativity and bring joy by enabling a new generation of commerce
            where entertainment meets shopping. We believe that shopping should be fun,
            social, and seamlessly integrated into the content you love.
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-20">
          <div className="text-center">
            <div className="bg-pink-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-pink-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">1B+</div>
            <div className="text-gray-600">Global Users</div>
          </div>
          <div className="text-center">
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building className="w-8 h-8 text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">10M+</div>
            <div className="text-gray-600">Active Sellers</div>
          </div>
          <div className="text-center">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="w-8 h-8 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">150+</div>
            <div className="text-gray-600">Countries</div>
          </div>
          <div className="text-center">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Globe className="w-8 h-8 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">500M+</div>
            <div className="text-gray-600">Products Sold</div>
          </div>
        </div>

        {/* Story Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
            <div className="space-y-4 text-gray-600">
              <p>
                TikTok Shop was born from the vision of transforming how people discover
                and purchase products online. We recognized that traditional e-commerce
                was missing the human connection and entertainment value that makes
                shopping truly enjoyable.
              </p>
              <p>
                By integrating shopping directly into the TikTok ecosystem, we've created
                a platform where creators can showcase products through authentic,
                engaging content, and users can discover items that truly resonate with
                their interests and lifestyle.
              </p>
              <p>
                Today, TikTok Shop serves millions of users worldwide, empowering small
                businesses, creators, and global brands to reach new audiences and build
                meaningful connections with their customers.
              </p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-pink-100 to-purple-100 rounded-lg p-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Innovation at Our Core
              </h3>
              <p className="text-gray-600 mb-6">
                We're constantly pushing the boundaries of what's possible in social
                commerce, from AI-powered recommendations to immersive AR try-on
                experiences.
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-white rounded-lg p-4">
                  <div className="font-semibold text-pink-600">AI Discovery</div>
                  <div className="text-gray-600">Personalized recommendations</div>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <div className="font-semibold text-purple-600">Live Shopping</div>
                  <div className="text-gray-600">Real-time interactions</div>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <div className="font-semibold text-blue-600">Creator Tools</div>
                  <div className="text-gray-600">Professional features</div>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <div className="font-semibold text-green-600">Secure Payments</div>
                  <div className="text-gray-600">Protected transactions</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Authenticity</h3>
              <p className="text-gray-600">
                We believe in genuine connections between creators and their communities,
                fostering trust through authentic content and transparent practices.
              </p>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Innovation</h3>
              <p className="text-gray-600">
                We continuously push boundaries to create new ways for people to discover,
                engage with, and purchase products they love.
              </p>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Community</h3>
              <p className="text-gray-600">
                We're building a global community where creativity, commerce, and
                connection come together to create meaningful experiences.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Join Our Journey
          </h2>
          <p className="text-gray-600 mb-6">
            Be part of the future of social commerce. Whether you're a creator, seller, or shopper,
            there's a place for you in the TikTok Shop community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/careers"
              className="bg-pink-600 text-white px-6 py-3 rounded-md hover:bg-pink-700 transition duration-200"
            >
              View Careers
            </Link>
            <Link
              href="/contact"
              className="bg-white text-pink-600 border border-pink-600 px-6 py-3 rounded-md hover:bg-pink-50 transition duration-200"
            >
              Get in Touch
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
