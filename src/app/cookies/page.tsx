"use client";

import { CakeIcon } from '@heroicons/react/24/solid';

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">            <div className="flex justify-center mb-6">
              <CakeIcon className="h-16 w-16 text-white/80" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Cookie Policy
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
              <h2 className="text-2xl font-bold text-gray-900 mb-6">1. What Are Cookies?</h2>
              <p className="text-gray-600 mb-4">
                Cookies are small text files that are placed on your device when you visit our website. They help us provide you with a better experience by remembering your preferences and understanding how you use our site.
              </p>
              <p className="text-gray-600">
                This Cookie Policy explains what cookies are, how we use them, the types of cookies we use, and how you can control your cookie preferences.
              </p>
            </section>

            {/* Types of Cookies */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">2. Types of Cookies We Use</h2>
              
              <div className="space-y-8">
                <div className="border-l-4 border-blue-500 pl-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Essential Cookies</h3>
                  <p className="text-gray-600 mb-3">
                    These cookies are necessary for the website to function properly. They enable core functionality such as security, network management, and accessibility.
                  </p>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-blue-800 text-sm font-medium">Examples:</p>
                    <ul className="text-blue-700 text-sm mt-2 space-y-1">
                      <li>• Authentication cookies to keep you logged in</li>
                      <li>• Shopping cart contents</li>
                      <li>• Security tokens</li>
                      <li>• Load balancing</li>
                    </ul>
                  </div>
                </div>

                <div className="border-l-4 border-green-500 pl-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Analytics Cookies</h3>
                  <p className="text-gray-600 mb-3">
                    These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.
                  </p>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-green-800 text-sm font-medium">Examples:</p>
                    <ul className="text-green-700 text-sm mt-2 space-y-1">
                      <li>• Google Analytics</li>
                      <li>• Page view tracking</li>
                      <li>• User behavior analysis</li>
                      <li>• Performance monitoring</li>
                    </ul>
                  </div>
                </div>

                <div className="border-l-4 border-purple-500 pl-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Functional Cookies</h3>
                  <p className="text-gray-600 mb-3">
                    These cookies enable enhanced functionality and personalization. They may be set by us or by third-party providers.
                  </p>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-purple-800 text-sm font-medium">Examples:</p>
                    <ul className="text-purple-700 text-sm mt-2 space-y-1">
                      <li>• Language preferences</li>
                      <li>• Region selection</li>
                      <li>• Theme preferences</li>
                      <li>• Recently viewed products</li>
                    </ul>
                  </div>
                </div>

                <div className="border-l-4 border-red-500 pl-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Advertising Cookies</h3>
                  <p className="text-gray-600 mb-3">
                    These cookies are used to deliver advertisements that are more relevant to you and your interests. They may also be used to limit the number of times you see an advertisement.
                  </p>
                  <div className="bg-red-50 rounded-lg p-4">
                    <p className="text-red-800 text-sm font-medium">Examples:</p>
                    <ul className="text-red-700 text-sm mt-2 space-y-1">
                      <li>• Targeted advertising</li>
                      <li>• Retargeting campaigns</li>
                      <li>• Social media advertising</li>
                      <li>• Conversion tracking</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Third-Party Cookies */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">3. Third-Party Cookies</h2>
              <p className="text-gray-600 mb-6">
                We also use third-party services that may set cookies on your device. These include:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Google Analytics</h3>
                  <p className="text-gray-600 text-sm mb-2">Used for website analytics and performance monitoring</p>                  <a href="https://policies.google.com/privacy" className="text-blue-600 text-sm hover:underline">
                    View Google&apos;s Privacy Policy →
                  </a>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Facebook Pixel</h3>
                  <p className="text-gray-600 text-sm mb-2">Used for advertising and conversion tracking</p>
                  <a href="https://www.facebook.com/privacy" className="text-blue-600 text-sm hover:underline">
                    View Facebook&apos;s Privacy Policy →
                  </a>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Stripe</h3>
                  <p className="text-gray-600 text-sm mb-2">Used for secure payment processing</p>
                  <a href="https://stripe.com/privacy" className="text-blue-600 text-sm hover:underline">
                    View Stripe&apos;s Privacy Policy →
                  </a>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Hotjar</h3>
                  <p className="text-gray-600 text-sm mb-2">Used for user experience analysis and heatmaps</p>
                  <a href="https://www.hotjar.com/privacy" className="text-blue-600 text-sm hover:underline">
                    View Hotjar&apos;s Privacy Policy →
                  </a>
                </div>
              </div>
            </section>

            {/* Cookie Management */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">4. How to Manage Cookies</h2>
              
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Browser Settings</h3>
                <p className="text-gray-600 mb-4">
                  You can control and/or delete cookies as you wish. You can delete all cookies that are already on your computer and you can set most browsers to prevent them from being placed.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">Chrome</h4>
                    <p className="text-blue-800 text-sm">Settings → Privacy and Security → Cookies and other site data</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">Firefox</h4>
                    <p className="text-blue-800 text-sm">Options → Privacy & Security → Cookies and Site Data</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">Safari</h4>
                    <p className="text-blue-800 text-sm">Preferences → Privacy → Manage Website Data</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">Edge</h4>
                    <p className="text-blue-800 text-sm">Settings → Site permissions → Cookies and site data</p>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Our Cookie Consent Tool</h3>
                <p className="text-gray-600 mb-4">
                  When you first visit our website, you&apos;ll see a cookie consent banner that allows you to:
                </p>
                <div className="space-y-2 text-gray-600 mb-4">
                  <p>• Accept all cookies</p>
                  <p>• Reject non-essential cookies</p>
                  <p>• Customize your cookie preferences</p>
                </div>
                <button className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors">
                  Manage Cookie Preferences
                </button>
              </div>

              <div className="bg-yellow-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-yellow-900 mb-3">Important Note</h3>
                <p className="text-yellow-800">
                  Please note that disabling certain cookies may affect the functionality of our website. Essential cookies cannot be disabled as they are necessary for the site to function properly.
                </p>
              </div>
            </section>

            {/* Mobile Devices */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">5. Mobile Devices and Apps</h2>
              <p className="text-gray-600 mb-4">
                If you access our services through a mobile device or app, we may collect similar information through mobile advertising identifiers and other tracking technologies.
              </p>
              <div className="space-y-4 text-gray-600">
                <p><strong>iOS:</strong> You can limit ad tracking in Settings → Privacy & Security → Apple Advertising</p>
                <p><strong>Android:</strong> You can reset your advertising ID in Settings → Google → Ads</p>
              </div>
            </section>

            {/* Updates */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">6. Updates to This Policy</h2>
              <p className="text-gray-600">
                We may update this Cookie Policy from time to time to reflect changes in technology, legislation, or our cookie practices. We will notify you of any significant changes by posting the updated policy on our website.
              </p>
            </section>

            {/* Contact Information */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">7. Contact Us</h2>
              <p className="text-gray-600 mb-4">
                If you have any questions about our use of cookies, please contact us:
              </p>
              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-gray-700">Email: privacy@tiktokshop.com</p>
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
