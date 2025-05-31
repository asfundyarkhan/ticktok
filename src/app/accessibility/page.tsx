"use client";

import { EyeIcon, HandRaisedIcon, SpeakerWaveIcon, DevicePhoneMobileIcon, ComputerDesktopIcon, GlobeAltIcon } from "@heroicons/react/24/outline";

export default function AccessibilityPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <HandRaisedIcon className="h-16 w-16 text-white/80" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Accessibility Statement
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-white/90">
              We're committed to making TikTok Shop accessible to everyone, regardless of ability or technology.
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Our Commitment */}
          <section className="mb-16">
            <div className="bg-white rounded-xl shadow-lg p-8 md:p-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Commitment</h2>
              <p className="text-lg text-gray-600 mb-6">
                TikTok Shop is committed to ensuring digital accessibility for people with disabilities. We are continually improving the user experience for everyone and applying the relevant accessibility standards to achieve these goals.
              </p>
              <p className="text-gray-600">
                We strive to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 at the AA level. These guidelines help make web content more accessible to people with disabilities and create a better experience for all users.
              </p>
            </div>
          </section>

          {/* Accessibility Features */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Accessibility Features</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl p-8 shadow-lg">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center mb-6">
                  <EyeIcon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Visual Accessibility</h3>
                <ul className="space-y-3 text-gray-600">
                  <li>• High contrast color schemes</li>
                  <li>• Scalable text up to 200% without loss of functionality</li>
                  <li>• Alternative text for all images</li>
                  <li>• Clear visual hierarchy and typography</li>
                  <li>• Focus indicators for keyboard navigation</li>
                </ul>
              </div>

              <div className="bg-white rounded-xl p-8 shadow-lg">
                <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg flex items-center justify-center mb-6">
                  <SpeakerWaveIcon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Audio & Screen Readers</h3>
                <ul className="space-y-3 text-gray-600">
                  <li>• Compatible with popular screen readers</li>
                  <li>• Descriptive link text and button labels</li>
                  <li>• Proper heading structure and landmarks</li>
                  <li>• ARIA labels and descriptions</li>
                  <li>• Audio descriptions for video content</li>
                </ul>
              </div>

              <div className="bg-white rounded-xl p-8 shadow-lg">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-500 rounded-lg flex items-center justify-center mb-6">
                  <ComputerDesktopIcon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Keyboard Navigation</h3>
                <ul className="space-y-3 text-gray-600">
                  <li>• Full keyboard accessibility</li>
                  <li>• Logical tab order</li>
                  <li>• Skip links to main content</li>
                  <li>• Keyboard shortcuts for common actions</li>
                  <li>• No keyboard traps</li>
                </ul>
              </div>

              <div className="bg-white rounded-xl p-8 shadow-lg">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-red-500 rounded-lg flex items-center justify-center mb-6">
                  <DevicePhoneMobileIcon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Mobile Accessibility</h3>
                <ul className="space-y-3 text-gray-600">
                  <li>• Touch target size optimization</li>
                  <li>• Gesture-based navigation alternatives</li>
                  <li>• Voice control compatibility</li>
                  <li>• Screen reader support on mobile</li>
                  <li>• Responsive design for all devices</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Assistive Technologies */}
          <section className="mb-16">
            <div className="bg-white rounded-xl shadow-lg p-8 md:p-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Supported Assistive Technologies</h2>
              <p className="text-gray-600 mb-6">
                Our website has been tested with the following assistive technologies:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Screen Readers</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• JAWS (Windows)</li>
                    <li>• NVDA (Windows)</li>
                    <li>• VoiceOver (macOS/iOS)</li>
                    <li>• TalkBack (Android)</li>
                    <li>• Dragon NaturallySpeaking</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Browsers</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Chrome (Windows, macOS, Linux)</li>
                    <li>• Firefox (Windows, macOS, Linux)</li>
                    <li>• Safari (macOS, iOS)</li>
                    <li>• Edge (Windows)</li>
                    <li>• Mobile browsers (iOS Safari, Chrome Mobile)</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Standards Compliance */}
          <section className="mb-16">
            <div className="bg-white rounded-xl shadow-lg p-8 md:p-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Standards & Compliance</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-blue-50 rounded-lg">
                  <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <GlobeAltIcon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">WCAG 2.1</h3>
                  <p className="text-sm text-gray-600">Level AA Compliance</p>
                </div>
                
                <div className="text-center p-6 bg-green-50 rounded-lg">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <HandRaisedIcon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">ADA</h3>
                  <p className="text-sm text-gray-600">Americans with Disabilities Act</p>
                </div>
                
                <div className="text-center p-6 bg-purple-50 rounded-lg">
                  <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <EyeIcon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Section 508</h3>
                  <p className="text-sm text-gray-600">Federal Accessibility</p>
                </div>
              </div>
              
              <p className="text-gray-600 mt-6">
                We regularly audit our website to ensure ongoing compliance with these standards and implement improvements based on user feedback and evolving best practices.
              </p>
            </div>
          </section>

          {/* Feedback & Support */}
          <section className="mb-16">
            <div className="bg-white rounded-xl shadow-lg p-8 md:p-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Feedback & Support</h2>
              <p className="text-gray-600 mb-6">
                We welcome your feedback on the accessibility of TikTok Shop. If you encounter any accessibility barriers or have suggestions for improvement, please let us know.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Methods</h3>
                  <div className="space-y-3">
                    <p className="text-gray-600">
                      <strong>Email:</strong> accessibility@tiktokshop.com
                    </p>
                    <p className="text-gray-600">
                      <strong>Phone:</strong> +1 (555) 123-HELP (4357)
                    </p>
                    <p className="text-gray-600">
                      <strong>Mail:</strong> TikTok Shop Accessibility Team<br />
                      123 Commerce Street<br />
                      San Francisco, CA 94102
                    </p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Response Time</h3>
                  <p className="text-gray-600 mb-3">
                    We aim to respond to accessibility feedback within 2 business days and work to resolve issues as quickly as possible.
                  </p>
                  <p className="text-gray-600">
                    For urgent accessibility issues that prevent you from using our services, please call our accessibility hotline for immediate assistance.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Alternative Formats */}
          <section className="mb-16">
            <div className="bg-white rounded-xl shadow-lg p-8 md:p-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Alternative Formats</h2>
              <p className="text-gray-600 mb-4">
                If you need information from our website in an alternative format, we can provide:
              </p>
              <ul className="space-y-2 text-gray-600 mb-6">
                <li>• Large print documents</li>
                <li>• Audio recordings</li>
                <li>• Braille materials</li>
                <li>• Plain text versions</li>
                <li>• Sign language interpretation (for video content)</li>
              </ul>
              <p className="text-gray-600">
                Please contact our accessibility team to request alternative formats. We will work to provide these within 5 business days of your request.
              </p>
            </div>
          </section>

          {/* Ongoing Efforts */}
          <section className="mb-8">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8 md:p-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Ongoing Efforts</h2>
              <p className="text-gray-600 mb-6">
                Accessibility is not a one-time effort but an ongoing commitment. Here's what we're continuously working on:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Current Initiatives</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Regular accessibility audits</li>
                    <li>• User testing with people with disabilities</li>
                    <li>• Staff training on accessibility best practices</li>
                    <li>• Integration of accessibility into our design process</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Future Plans</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Enhanced mobile app accessibility</li>
                    <li>• Voice navigation features</li>
                    <li>• Improved color contrast options</li>
                    <li>• Advanced screen reader optimizations</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
