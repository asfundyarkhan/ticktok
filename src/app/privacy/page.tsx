"use client";

import { ShieldCheckIcon, EyeIcon, LockClosedIcon } from "@heroicons/react/24/outline";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <ShieldCheckIcon className="h-16 w-16 text-white/80" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Privacy Policy
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
                At TikTok Shop, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our services.
              </p>
              <p className="text-gray-600">
                Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site.
              </p>
            </section>

            {/* Information We Collect */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">2. Information We Collect</h2>
              
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Personal Information</h3>
                <div className="space-y-3 text-gray-600">
                  <p>• Name, email address, and contact information</p>
                  <p>• Billing and shipping addresses</p>
                  <p>• Payment information (processed securely by third-party processors)</p>
                  <p>• Phone number and other contact details</p>
                  <p>• Account credentials and profile information</p>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Usage Information</h3>
                <div className="space-y-3 text-gray-600">
                  <p>• Pages visited and time spent on our platform</p>
                  <p>• Search queries and browsing behavior</p>
                  <p>• Device information and IP address</p>
                  <p>• Browser type and operating system</p>
                  <p>• Cookies and similar tracking technologies</p>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Business Information (For Sellers)</h3>
                <div className="space-y-3 text-gray-600">
                  <p>• Business name and registration details</p>
                  <p>• Tax identification numbers</p>
                  <p>• Bank account information for payments</p>
                  <p>• Product information and inventory data</p>
                </div>
              </div>
            </section>

            {/* How We Use Information */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">3. How We Use Your Information</h2>
              <div className="space-y-4 text-gray-600">
                <p>• To provide, operate, and maintain our services</p>
                <p>• To process transactions and send purchase confirmations</p>
                <p>• To improve, personalize, and expand our services</p>
                <p>• To understand and analyze how you use our platform</p>
                <p>• To develop new products, services, features, and functionality</p>
                <p>• To communicate with you about updates, promotions, and customer service</p>
                <p>• To send you marketing communications (with your consent)</p>
                <p>• To detect, prevent, and address fraud and security issues</p>
                <p>• To comply with legal obligations and protect our rights</p>
              </div>
            </section>

            {/* Information Sharing */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">4. How We Share Your Information</h2>
              
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">We may share your information with:</h3>
                <div className="space-y-4 text-gray-600">
                  <p><strong>Service Providers:</strong> Third-party companies that help us operate our business (payment processors, shipping companies, cloud hosting)</p>
                  <p><strong>Sellers:</strong> When you make a purchase, we share necessary information with sellers to fulfill your order</p>
                  <p><strong>Legal Compliance:</strong> When required by law or to protect our rights and safety</p>
                  <p><strong>Business Transfers:</strong> In connection with mergers, acquisitions, or sale of assets</p>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">We do NOT sell your personal information</h3>
                <p className="text-blue-800">
                  We do not sell, trade, or otherwise transfer your personal information to third parties for their marketing purposes without your explicit consent.
                </p>
              </div>
            </section>

            {/* Data Security */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">5. Data Security</h2>
              <p className="text-gray-600 mb-4">
                We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
              </p>
              <div className="space-y-3 text-gray-600">
                <p>• SSL encryption for data transmission</p>
                <p>• Secure data storage with encryption at rest</p>
                <p>• Regular security assessments and monitoring</p>
                <p>• Limited access to personal information on a need-to-know basis</p>
                <p>• Employee training on data protection practices</p>
              </div>
            </section>

            {/* Cookies and Tracking */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">6. Cookies and Tracking Technologies</h2>
              <p className="text-gray-600 mb-4">
                We use cookies and similar tracking technologies to enhance your experience on our platform:
              </p>
              <div className="space-y-4 text-gray-600">
                <p><strong>Essential Cookies:</strong> Required for basic site functionality</p>
                <p><strong>Analytics Cookies:</strong> Help us understand how visitors use our site</p>
                <p><strong>Advertising Cookies:</strong> Used to deliver relevant advertisements</p>
                <p><strong>Preference Cookies:</strong> Remember your settings and preferences</p>
              </div>
              <p className="text-gray-600 mt-4">
                You can control cookie preferences through your browser settings or our cookie consent manager.
              </p>
            </section>

            {/* Your Rights */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">7. Your Privacy Rights</h2>
              <p className="text-gray-600 mb-4">
                Depending on your location, you may have the following rights regarding your personal information:
              </p>
              <div className="space-y-4 text-gray-600">
                <p>• <strong>Access:</strong> Request access to your personal information</p>
                <p>• <strong>Correction:</strong> Request correction of inaccurate information</p>
                <p>• <strong>Deletion:</strong> Request deletion of your personal information</p>
                <p>• <strong>Portability:</strong> Request transfer of your data to another service</p>
                <p>• <strong>Opt-out:</strong> Unsubscribe from marketing communications</p>
                <p>• <strong>Restrict Processing:</strong> Limit how we use your information</p>
              </div>
              <p className="text-gray-600 mt-4">
                To exercise these rights, please contact us using the information provided below.
              </p>
            </section>

            {/* Children's Privacy */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">8. Children's Privacy</h2>
              <p className="text-gray-600">
                Our services are not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you become aware that a child has provided us with personal information, please contact us immediately.
              </p>
            </section>

            {/* International Transfers */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">9. International Data Transfers</h2>
              <p className="text-gray-600">
                Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your information in accordance with applicable data protection laws.
              </p>
            </section>

            {/* Retention */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">10. Data Retention</h2>
              <p className="text-gray-600">
                We retain your personal information only for as long as necessary to fulfill the purposes outlined in this privacy policy, unless a longer retention period is required or permitted by law.
              </p>
            </section>

            {/* Updates to Policy */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">11. Updates to This Privacy Policy</h2>
              <p className="text-gray-600">
                We may update this privacy policy from time to time. We will notify you of any changes by posting the new privacy policy on this page and updating the "Last updated" date.
              </p>
            </section>

            {/* Contact Information */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">12. Contact Us</h2>
              <p className="text-gray-600 mb-4">
                If you have any questions about this Privacy Policy, please contact us:
              </p>
              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-gray-700">Email: privacy@tiktokshop.com</p>
                <p className="text-gray-700">Address: 123 Commerce Street, San Francisco, CA 94102</p>
                <p className="text-gray-700">Phone: +1 (555) 123-4567</p>
                <p className="text-gray-700 mt-3">
                  <strong>Data Protection Officer:</strong> dpo@tiktokshop.com
                </p>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
