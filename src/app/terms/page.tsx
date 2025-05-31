"use client";

import { DocumentTextIcon, ScaleIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <DocumentTextIcon className="h-16 w-16 text-white/80" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Terms of Service
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-white/90">
              Last updated: May 31, 2025
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg p-8 md:p-12">
            
            {/* Introduction */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">1. Introduction</h2>
              <p className="text-gray-600 mb-4">
                Welcome to TikTok Shop ("we," "our," or "us"). These Terms of Service ("Terms") govern your use of our website, mobile application, and services (collectively, the "Service").
              </p>
              <p className="text-gray-600">
                By accessing or using our Service, you agree to be bound by these Terms. If you disagree with any part of these terms, then you may not access the Service.
              </p>
            </section>

            {/* Account Terms */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">2. Account Terms</h2>
              <div className="space-y-4 text-gray-600">
                <p>• You must be 18 years or older to create an account</p>
                <p>• You are responsible for maintaining the security of your account</p>
                <p>• You must provide accurate and complete information when creating your account</p>
                <p>• You are responsible for all activities that occur under your account</p>
                <p>• You must immediately notify us of any unauthorized use of your account</p>
              </div>
            </section>

            {/* User Conduct */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">3. User Conduct</h2>
              <p className="text-gray-600 mb-4">You agree not to:</p>
              <div className="space-y-4 text-gray-600">
                <p>• Use the Service for any unlawful purpose or to solicit others to perform unlawful acts</p>
                <p>• Violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</p>
                <p>• Infringe upon or violate our intellectual property rights or the intellectual property rights of others</p>
                <p>• Harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</p>
                <p>• Submit false or misleading information</p>
                <p>• Upload viruses or any other type of malicious code</p>
                <p>• Spam, phish, pharm, pretext, spider, crawl, or scrape</p>
              </div>
            </section>

            {/* Seller Terms */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">4. Seller Terms</h2>
              <div className="space-y-4 text-gray-600">
                <p>If you are selling products on our platform:</p>
                <p>• You must provide accurate product descriptions and pricing</p>
                <p>• You are responsible for fulfilling orders in a timely manner</p>
                <p>• You must comply with all applicable laws and regulations</p>
                <p>• You grant us the right to display your products and content</p>
                <p>• You are responsible for handling returns and customer service</p>
              </div>
            </section>

            {/* Payment Terms */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">5. Payment Terms</h2>
              <div className="space-y-4 text-gray-600">
                <p>• All prices are displayed in USD unless otherwise stated</p>
                <p>• Payment is due at the time of purchase</p>
                <p>• We accept various payment methods as displayed during checkout</p>
                <p>• You are responsible for any taxes applicable to your purchases</p>
                <p>• Refunds are subject to our return policy</p>
              </div>
            </section>

            {/* Intellectual Property */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">6. Intellectual Property</h2>
              <p className="text-gray-600 mb-4">
                The Service and its original content, features, and functionality are and will remain the exclusive property of TikTok Shop and its licensors. The Service is protected by copyright, trademark, and other laws.
              </p>
              <p className="text-gray-600">
                Our trademarks and trade dress may not be used in connection with any product or service without our prior written consent.
              </p>
            </section>

            {/* Privacy */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">7. Privacy</h2>
              <p className="text-gray-600">
                Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service, to understand our practices.
              </p>
            </section>

            {/* Termination */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">8. Termination</h2>
              <p className="text-gray-600 mb-4">
                We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.
              </p>
              <p className="text-gray-600">
                If you wish to terminate your account, you may simply discontinue using the Service.
              </p>
            </section>

            {/* Disclaimer */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">9. Disclaimer</h2>
              <p className="text-gray-600">
                The information on this website is provided on an "as is" basis. To the fullest extent permitted by law, this Company excludes all representations, warranties, conditions and terms.
              </p>
            </section>

            {/* Limitation of Liability */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">10. Limitation of Liability</h2>
              <p className="text-gray-600">
                In no event shall TikTok Shop, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the Service.
              </p>
            </section>

            {/* Governing Law */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">11. Governing Law</h2>
              <p className="text-gray-600">
                These Terms shall be interpreted and governed by the laws of the State of California, United States, without regard to its conflict of law provisions.
              </p>
            </section>

            {/* Changes to Terms */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">12. Changes to Terms</h2>
              <p className="text-gray-600">
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect.
              </p>
            </section>

            {/* Contact Information */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">13. Contact Information</h2>
              <p className="text-gray-600 mb-4">
                If you have any questions about these Terms, please contact us:
              </p>
              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-gray-700">Email: legal@tiktokshop.com</p>
                <p className="text-gray-700">Address: 123 Commerce Street, San Francisco, CA 94102</p>
                <p className="text-gray-700">Phone: +1 (555) 123-4567</p>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
