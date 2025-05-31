"use client";

import Link from "next/link";
import { Users, MessageCircle, Heart, Shield, CheckCircle, AlertTriangle, Flag, ThumbsUp } from "lucide-react";

export default function CommunityGuidelinesPage() {
  const guidelines = [
    {
      icon: Heart,
      title: "Be Kind and Respectful",
      description: "Treat all community members with respect and kindness. Harassment, bullying, or discriminatory behavior is not tolerated.",
      rules: [
        "Use respectful language in all interactions",
        "Respect different opinions and perspectives",
        "No harassment, bullying, or hate speech",
        "Be constructive in your feedback and criticism"
      ]
    },
    {
      icon: Shield,
      title: "Keep the Community Safe",
      description: "Help maintain a safe environment for all users by following safety guidelines and reporting inappropriate content.",
      rules: [
        "Don't share personal information publicly",
        "Report suspicious or inappropriate behavior",
        "Don't engage in fraudulent activities",
        "Protect minors and vulnerable users"
      ]
    },
    {
      icon: CheckCircle,
      title: "Share Authentic Content",
      description: "Post genuine, original content and authentic reviews. Fake reviews and misleading information harm the community.",
      rules: [
        "Write honest and authentic reviews",
        "Don't create fake accounts or reviews",
        "Share accurate product information",
        "Credit original creators when sharing content"
      ]
    },
    {
      icon: ThumbsUp,
      title: "Support Fellow Community Members",
      description: "Help create a supportive environment where everyone can succeed and learn from each other.",
      rules: [
        "Help newcomers learn the platform",
        "Share helpful tips and advice",
        "Support small businesses and creators",
        "Celebrate others' successes"
      ]
    }
  ];

  const prohibitedContent = [
    "Hate speech or discriminatory content",
    "Harassment, bullying, or threatening behavior",
    "Spam, scams, or fraudulent activities",
    "Inappropriate sexual content",
    "Violence or harmful activities",
    "Counterfeit or illegal products",
    "Misleading or false information",
    "Copyright infringement"
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-purple-600 via-pink-600 to-red-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="bg-white bg-opacity-20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Community Guidelines
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90">
            Our community guidelines help create a safe, welcoming, and inclusive environment 
            for everyone to shop, sell, and connect on TikTok Shop.
          </p>
          <Link
            href="/safety-center"
            className="bg-white text-purple-600 px-8 py-3 rounded-md hover:bg-gray-100 transition duration-200 font-semibold"
          >
            Visit Safety Center
          </Link>
        </div>
      </div>

      {/* Core Guidelines */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Core Values</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            These fundamental principles guide how we interact with each other and build our community.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {guidelines.map((guideline, index) => (
            <div key={index} className="bg-white p-8 rounded-lg shadow-sm hover:shadow-md transition duration-200">
              <div className="flex items-center mb-4">
                <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mr-4">
                  <guideline.icon className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">{guideline.title}</h3>
              </div>
              <p className="text-gray-600 mb-6">{guideline.description}</p>
              <ul className="space-y-2">
                {guideline.rules.map((rule, ruleIndex) => (
                  <li key={ruleIndex} className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Prohibited Content */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">What's Not Allowed</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              To maintain a safe and positive environment, the following types of content and behavior are prohibited.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {prohibitedContent.map((item, index) => (
              <div key={index} className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0" />
                  <span className="text-red-800 font-medium">{item}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Consequences */}
      <div className="bg-gray-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Enforcement & Consequences</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Violations of our community guidelines may result in various actions to protect our community.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">First Warning</h3>
              <p className="text-gray-600">Educational notice and content removal for minor violations</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Temporary Restriction</h3>
              <p className="text-gray-600">Limited access to certain features for repeated violations</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Flag className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Account Suspension</h3>
              <p className="text-gray-600">Permanent ban for serious or repeated violations</p>
            </div>
          </div>
        </div>
      </div>

      {/* Reporting */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Report Violations</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Help us maintain our community standards by reporting content or behavior that violates our guidelines.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">How to Report</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Use the report button on any content or profile</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Contact our support team directly</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Provide detailed information about the violation</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Include screenshots or evidence when possible</span>
                </li>
              </ul>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">What Happens Next</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">We review all reports within 24 hours</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Appropriate action is taken if guidelines are violated</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">You receive an update on the outcome</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Your identity remains confidential</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">Questions About Our Guidelines?</h2>
          <p className="text-xl mb-8 opacity-90">
            Our support team is here to help clarify any questions about our community standards.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="bg-white text-purple-600 px-8 py-3 rounded-md hover:bg-gray-100 transition duration-200 font-semibold"
            >
              Contact Support
            </Link>
            <Link
              href="/help-center"
              className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-md hover:bg-white hover:text-purple-600 transition duration-200 font-semibold"
            >
              Visit Help Center
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
