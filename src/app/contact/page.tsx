"use client";

import { useState } from "react";
import { PhoneIcon, EnvelopeIcon, MapPinIcon, ChatBubbleLeftRightIcon, ClockIcon, GlobeAltIcon } from "@heroicons/react/24/outline";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    category: "",
    message: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission logic here
    console.log("Form submitted:", formData);
    alert("Thank you for your message! We'll get back to you within 24 hours.");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <ChatBubbleLeftRightIcon className="h-16 w-16 text-white/80" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Contact Us
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-white/90">
              We're here to help! Get in touch with our team for support, partnerships, or any questions about TikTok Shop.
            </p>
          </div>
        </div>
      </div>

      {/* Contact Methods */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Get In Touch
            </h2>
            <p className="text-xl text-gray-600">
              Choose the best way to reach us based on your needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white rounded-xl p-8 shadow-lg text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <PhoneIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Phone Support</h3>
              <p className="text-gray-600 mb-4">
                Speak directly with our support team for immediate assistance.
              </p>
              <div className="space-y-2">
                <p className="font-semibold text-gray-900">+1 (555) 123-4567</p>
                <p className="text-sm text-gray-500">Mon-Fri: 9 AM - 8 PM PST</p>
                <p className="text-sm text-gray-500">Sat-Sun: 10 AM - 6 PM PST</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <EnvelopeIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Email Support</h3>
              <p className="text-gray-600 mb-4">
                Send us a detailed message and we'll respond within 24 hours.
              </p>
              <div className="space-y-2">
                <p className="font-semibold text-gray-900">support@tiktokshop.com</p>
                <p className="text-sm text-gray-500">Response within 24 hours</p>
                <p className="text-sm text-gray-500">Available 24/7</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <ChatBubbleLeftRightIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Live Chat</h3>
              <p className="text-gray-600 mb-4">
                Get instant help through our live chat support system.
              </p>
              <div className="space-y-2">
                <button className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                  Start Chat
                </button>
                <p className="text-sm text-gray-500">Average response: 2 minutes</p>
                <p className="text-sm text-gray-500">Available 24/7</p>
              </div>
            </div>
          </div>

          {/* Contact Form and Office Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Send us a Message</h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="your.email@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    id="category"
                    name="category"
                    required
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Select a category</option>
                    <option value="general">General Inquiry</option>
                    <option value="support">Customer Support</option>
                    <option value="seller">Seller Support</option>
                    <option value="partnership">Partnership Opportunities</option>
                    <option value="press">Press & Media</option>
                    <option value="bug">Report a Bug</option>
                    <option value="feedback">Feedback & Suggestions</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Brief description of your inquiry"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={6}
                    value={formData.message}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Please provide as much detail as possible..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-colors"
                >
                  Send Message
                </button>
              </form>
            </div>

            {/* Office Information */}
            <div className="space-y-8">
              <div className="bg-white rounded-xl shadow-lg p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Our Offices</h3>
                
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                      <MapPinIcon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Headquarters</h4>
                      <p className="text-gray-600">123 Commerce Street</p>
                      <p className="text-gray-600">San Francisco, CA 94102</p>
                      <p className="text-gray-600">United States</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                      <GlobeAltIcon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">International</h4>
                      <p className="text-gray-600">456 Tech Park Avenue</p>
                      <p className="text-gray-600">London, EC1A 1BB</p>
                      <p className="text-gray-600">United Kingdom</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                      <ClockIcon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Business Hours</h4>
                      <p className="text-gray-600">Monday - Friday: 9:00 AM - 8:00 PM PST</p>
                      <p className="text-gray-600">Saturday - Sunday: 10:00 AM - 6:00 PM PST</p>
                      <p className="text-gray-600">Holidays: Limited support available</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Quick Links</h3>
                <div className="space-y-4">
                  <a href="/help-center" className="block text-purple-600 hover:text-purple-700 hover:underline">
                    → Help Center & FAQ
                  </a>
                  <a href="/seller-center" className="block text-purple-600 hover:text-purple-700 hover:underline">
                    → Seller Support Center
                  </a>
                  <a href="/safety-center" className="block text-purple-600 hover:text-purple-700 hover:underline">
                    → Safety & Security Center
                  </a>
                  <a href="/community-guidelines" className="block text-purple-600 hover:text-purple-700 hover:underline">
                    → Community Guidelines
                  </a>
                  <a href="/terms" className="block text-purple-600 hover:text-purple-700 hover:underline">
                    → Terms of Service
                  </a>
                  <a href="/privacy" className="block text-purple-600 hover:text-purple-700 hover:underline">
                    → Privacy Policy
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Quick answers to common questions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">How can I track my order?</h3>
                <p className="text-gray-600">You can track your order by logging into your account and visiting the "Orders" section, or by using the tracking link sent to your email.</p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">What payment methods do you accept?</h3>
                <p className="text-gray-600">We accept major credit cards, PayPal, Apple Pay, Google Pay, and other secure payment methods depending on your region.</p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">How do I become a seller?</h3>
                <p className="text-gray-600">Visit our Seller Center to learn about requirements and start your application. The process typically takes 3-5 business days for approval.</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">What is your return policy?</h3>
                <p className="text-gray-600">Most items can be returned within 30 days of delivery. Check individual product pages for specific return policies and conditions.</p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">How do I report a problem with a seller?</h3>
                <p className="text-gray-600">You can report seller issues through your order page, our Safety Center, or by contacting customer support directly.</p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Is my personal information secure?</h3>
                <p className="text-gray-600">Yes, we use industry-standard encryption and security measures to protect your personal and payment information. Read our Privacy Policy for details.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
