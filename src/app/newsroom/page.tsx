"use client";

import Link from "next/link";
import { Calendar, Users, TrendingUp, Award, ArrowRight, Newspaper, Video, Globe } from "lucide-react";

export default function NewsroomPage() {
  const featuredNews = [
    {
      category: "Company News",
      title: "TikTok Shop Reaches 1 Billion Global Users",
      excerpt: "Our platform continues to grow as we connect creators, businesses, and consumers worldwide through innovative shopping experiences.",
      date: "December 15, 2024",
      image: "/api/placeholder/400/250"
    },
    {
      category: "Product Update", 
      title: "New AI-Powered Shopping Features Launch",
      excerpt: "Enhanced discovery and personalization features help users find products they love while supporting creator economy growth.",
      date: "December 10, 2024",
      image: "/api/placeholder/400/250"
    },
    {
      category: "Partnership",
      title: "Major Retail Partnerships Expand Global Reach",
      excerpt: "Strategic partnerships with leading retailers bring exclusive products and experiences to TikTok Shop users worldwide.",
      date: "December 5, 2024",
      image: "/api/placeholder/400/250"
    }
  ];

  const recentNews = [
    {
      category: "Safety & Security",
      title: "Enhanced Security Measures Protect User Data",
      date: "December 12, 2024",
      excerpt: "New encryption and privacy features strengthen our commitment to user data protection."
    },
    {
      category: "Creator Economy",
      title: "Creator Fund Reaches $500M in Payouts",
      date: "December 8, 2024",
      excerpt: "Milestone achievement showcases our ongoing investment in creator success and community growth."
    },
    {
      category: "Sustainability",
      title: "Carbon Neutral Shipping Initiative Launches",
      date: "December 3, 2024",
      excerpt: "Environmental commitment includes carbon offset programs for all platform deliveries."
    },
    {
      category: "Innovation",
      title: "AR Shopping Experience Beta Testing Begins",
      date: "November 28, 2024",
      excerpt: "Virtual try-on technology revolutionizes online shopping with immersive AR features."
    },
    {
      category: "Community",
      title: "Small Business Success Stories Highlight Impact",
      date: "November 25, 2024",
      excerpt: "Local entrepreneurs share how TikTok Shop transformed their businesses and communities."
    }
  ];

  const stats = [
    { icon: Users, value: "1B+", label: "Global Users" },
    { icon: TrendingUp, value: "300%", label: "YoY Growth" },
    { icon: Globe, value: "150+", label: "Countries" },
    { icon: Award, value: "10M+", label: "Active Sellers" }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="bg-white bg-opacity-20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Newspaper className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Newsroom
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90">
            Stay updated with the latest news, product launches, partnerships, and insights 
            from TikTok Shop as we continue to revolutionize social commerce.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="#latest-news"
              className="bg-white text-blue-600 px-8 py-3 rounded-md hover:bg-gray-100 transition duration-200 font-semibold"
            >
              Latest News
            </Link>
            <Link
              href="/contact"
              className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-md hover:bg-white hover:text-blue-600 transition duration-200 font-semibold"
            >
              Media Inquiries
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white py-16 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="w-8 h-8 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Featured News */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20" id="latest-news">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Featured Stories</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            The biggest news and announcements from TikTok Shop.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {featuredNews.map((news, index) => (
            <article key={index} className="bg-white rounded-lg shadow-sm hover:shadow-md transition duration-200 overflow-hidden">
              <div className="h-48 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                <Video className="w-16 h-16 text-blue-600" />
              </div>
              <div className="p-6">
                <div className="text-sm text-blue-600 font-semibold mb-2">{news.category}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{news.title}</h3>
                <p className="text-gray-600 mb-4">{news.excerpt}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="w-4 h-4 mr-2" />
                    {news.date}
                  </div>
                  <Link href="#" className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center">
                    Read More <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Recent News */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Recent Updates</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Stay informed with our latest announcements and developments.
            </p>
          </div>

          <div className="space-y-6">
            {recentNews.map((news, index) => (
              <article key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-6 hover:shadow-md transition duration-200">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span className="text-sm text-blue-600 font-semibold">{news.category}</span>
                      <span className="mx-2 text-gray-400">•</span>
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-4 h-4 mr-1" />
                        {news.date}
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{news.title}</h3>
                    <p className="text-gray-600">{news.excerpt}</p>
                  </div>
                  <div className="mt-4 md:mt-0 md:ml-6">
                    <Link href="#" className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center">
                      Read More <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      {/* Media Resources */}
      <div className="bg-gray-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Media Resources</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Resources for journalists, bloggers, and media professionals covering TikTok Shop.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Newspaper className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Press Kit</h3>
              <p className="text-gray-600 mb-4">Official logos, images, and brand guidelines</p>
              <Link
                href="/contact"
                className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition duration-200"
              >
                Download
              </Link>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Executive Bios</h3>
              <p className="text-gray-600 mb-4">Leadership team information and photos</p>
              <Link
                href="/contact"
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition duration-200"
              >
                View Bios
              </Link>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Company Facts</h3>
              <p className="text-gray-600 mb-4">Key statistics and company information</p>
              <Link
                href="/about"
                className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700 transition duration-200"
              >
                View Facts
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="bg-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Media Inquiries</h2>
          <p className="text-lg text-gray-600 mb-8">
            For press inquiries, interview requests, or additional information, please contact our media team.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="bg-blue-600 text-white px-8 py-3 rounded-md hover:bg-blue-700 transition duration-200 font-semibold"
            >
              Contact Media Team
            </Link>
            <Link
              href="/about"
              className="bg-white text-blue-600 border border-blue-600 px-8 py-3 rounded-md hover:bg-blue-50 transition duration-200 font-semibold"
            >
              Learn About Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
