"use client";

import Link from "next/link";
import { Shield, Lock, Eye, AlertTriangle, UserCheck, MessageSquare, Flag, CheckCircle } from "lucide-react";

export default function SafetyCenterPage() {
  const safetyFeatures = [
    {
      icon: Lock,
      title: "Secure Payments",
      description: "All transactions are protected with industry-standard encryption and fraud detection."
    },
    {
      icon: UserCheck,
      title: "Verified Sellers",
      description: "Our verification process ensures you're buying from legitimate, trusted sellers."
    },
    {
      icon: Eye,
      title: "Content Moderation",
      description: "AI and human moderation keep our platform safe from inappropriate content."
    },
    {
      icon: Shield,
      title: "Privacy Protection",
      description: "Your personal information is protected with advanced security measures."
    }
  ];

  const safetyTips = [
    {
      title: "Verify Seller Information",
      tips: [
        "Check seller ratings and reviews",
        "Look for verified seller badges",
        "Read product descriptions carefully",
        "Review return and refund policies"
      ]
    },
    {
      title: "Secure Your Account",
      tips: [
        "Use a strong, unique password",
        "Enable two-factor authentication",
        "Don't share your login credentials",
        "Log out from shared devices"
      ]
    },
    {
      title: "Safe Shopping Practices",
      tips: [
        "Only use official payment methods",
        "Be cautious of deals that seem too good to be true",
        "Keep records of your purchases",
        "Report suspicious activity immediately"
      ]
    },
    {
      title: "Protect Your Privacy",
      tips: [
        "Review your privacy settings regularly",
        "Be mindful of what you share publicly",
        "Use privacy-friendly payment methods",
        "Limit personal information in profiles"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="bg-white bg-opacity-20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Safety Center
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90">
            Your safety and security are our top priorities. Learn about our safety features, 
            best practices, and how to shop and sell safely on TikTok Shop.
          </p>
          <Link
            href="/community-guidelines"
            className="bg-white text-green-600 px-8 py-3 rounded-md hover:bg-gray-100 transition duration-200 font-semibold"
          >
            View Community Guidelines
          </Link>
        </div>
      </div>

      {/* Safety Features */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">How We Keep You Safe</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            We've built comprehensive safety measures into every aspect of the TikTok Shop experience.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {safetyFeatures.map((feature, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition duration-200 text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <feature.icon className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Safety Tips */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Safety Best Practices</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Follow these guidelines to ensure a safe and secure experience on TikTok Shop.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {safetyTips.map((category, index) => (
              <div key={index} className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{category.title}</h3>
                <ul className="space-y-3">
                  {category.tips.map((tip, tipIndex) => (
                    <li key={tipIndex} className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reporting Section */}
      <div className="bg-gray-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Report Safety Concerns</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Help us maintain a safe community by reporting any suspicious activity or violations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Flag className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Report Content</h3>
              <p className="text-gray-600 mb-4">Report inappropriate or harmful content</p>
              <Link
                href="/contact"
                className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition duration-200"
              >
                Report Now
              </Link>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Report Fraud</h3>
              <p className="text-gray-600 mb-4">Report suspected fraudulent activity</p>
              <Link
                href="/contact"
                className="bg-orange-600 text-white px-6 py-2 rounded-md hover:bg-orange-700 transition duration-200"
              >
                Report Fraud
              </Link>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Safety Support</h3>
              <p className="text-gray-600 mb-4">Get help with safety-related questions</p>
              <Link
                href="/contact"
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition duration-200"
              >
                Get Help
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Resources */}
      <div className="bg-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Emergency Resources</h2>
          <p className="text-lg text-gray-600 mb-8">
            If you're experiencing an emergency or immediate safety concern, please contact local authorities or use these resources.
          </p>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600 mr-3" />
              <h3 className="text-xl font-semibold text-red-800">In Case of Emergency</h3>
            </div>
            <p className="text-red-700 mb-4">
              If you're in immediate danger, contact your local emergency services immediately.
            </p>
            <div className="text-red-600 font-semibold">
              Emergency: 911 (US) | 999 (UK) | 112 (EU)
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="bg-green-600 text-white px-8 py-3 rounded-md hover:bg-green-700 transition duration-200 font-semibold"
            >
              Contact Safety Team
            </Link>
            <Link
              href="/help-center"
              className="bg-white text-green-600 border border-green-600 px-8 py-3 rounded-md hover:bg-green-50 transition duration-200 font-semibold"
            >
              Visit Help Center
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
