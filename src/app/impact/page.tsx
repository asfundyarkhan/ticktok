"use client";

import { HeartIcon, GlobeAltIcon, AcademicCapIcon, UsersIcon, HandRaisedIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

export default function SocialImpactPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <HeartIcon className="h-16 w-16 text-white/80" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Social Impact
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-white/90">
              Making a positive difference in communities worldwide through technology, education, and sustainable practices.
            </p>
            <Link href="/impact/programs">
              <button className="bg-white text-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                Explore Our Programs
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Our Mission for Change
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto">              We believe that technology and commerce should serve as forces for good. Through our social impact initiatives, 
              we&apos;re committed to creating positive change in communities around the world.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center mb-6">
                <AcademicCapIcon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Education & Skills</h3>
              <p className="text-gray-600 mb-4">
                Empowering individuals with digital literacy, entrepreneurship skills, and technology education to create better opportunities.
              </p>
              <ul className="text-sm text-gray-500 space-y-2">
                <li>• Digital marketing training programs</li>
                <li>• Small business development workshops</li>
                <li>• STEM education initiatives</li>
                <li>• Scholarships for underrepresented students</li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">              <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg flex items-center justify-center mb-6">
                <GlobeAltIcon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Environmental Sustainability</h3>
              <p className="text-gray-600 mb-4">
                Promoting sustainable practices and environmental responsibility across our platform and supply chain.
              </p>
              <ul className="text-sm text-gray-500 space-y-2">
                <li>• Carbon-neutral shipping initiatives</li>
                <li>• Sustainable packaging programs</li>
                <li>• Renewable energy adoption</li>
                <li>• Eco-friendly product promotion</li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-500 rounded-lg flex items-center justify-center mb-6">
                <UsersIcon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Community Support</h3>
              <p className="text-gray-600 mb-4">
                Supporting local communities through economic empowerment, disaster relief, and social welfare programs.
              </p>
              <ul className="text-sm text-gray-500 space-y-2">
                <li>• Small business grants and funding</li>
                <li>• Emergency response and relief</li>
                <li>• Mental health awareness campaigns</li>
                <li>• Community development projects</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Impact Numbers */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Impact in Numbers
            </h2>
            <p className="text-xl text-gray-600">
              Measurable change across our global initiatives
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { number: "500K+", label: "People Trained", color: "bg-blue-500" },
              { number: "$10M+", label: "Grants Distributed", color: "bg-green-500" },
              { number: "1M+", label: "Trees Planted", color: "bg-emerald-500" },
              { number: "50+", label: "Countries Reached", color: "bg-purple-500" }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className={`w-20 h-20 ${stat.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <span className="text-white font-bold text-lg">{stat.number}</span>
                </div>
                <p className="text-gray-900 font-semibold text-lg">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Programs Section */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Featured Programs
            </h2>
            <p className="text-xl text-gray-600">
              Discover our key initiatives making a difference worldwide
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-8">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-6">
                <GlobeAltIcon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Digital Bridge Initiative</h3>
              <p className="text-gray-600 mb-6">
                Connecting underserved communities to digital opportunities through technology access, 
                training, and infrastructure development.
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Launched in 2023</p>
                  <p className="text-sm text-gray-500">150+ communities served</p>
                </div>
                <Link href="/impact/digital-bridge">
                  <button className="text-blue-600 font-semibold hover:text-blue-700">
                    Learn More →
                  </button>
                </Link>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-8">              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mb-6">
                <GlobeAltIcon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Green Commerce Program</h3>
              <p className="text-gray-600 mb-6">
                Promoting sustainable shopping practices and supporting eco-friendly businesses 
                to reduce environmental impact.
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Carbon neutral since 2024</p>
                  <p className="text-sm text-gray-500">5K+ green sellers certified</p>
                </div>
                <Link href="/impact/green-commerce">
                  <button className="text-green-600 font-semibold hover:text-green-700">
                    Learn More →
                  </button>
                </Link>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-8">
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mb-6">
                <HandRaisedIcon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Creator Support Fund</h3>
              <p className="text-gray-600 mb-6">
                Supporting content creators and small businesses with funding, resources, 
                and mentorship opportunities.
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">$5M fund established</p>
                  <p className="text-sm text-gray-500">2K+ creators supported</p>
                </div>
                <Link href="/impact/creator-fund">
                  <button className="text-purple-600 font-semibold hover:text-purple-700">
                    Learn More →
                  </button>
                </Link>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-8">
              <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mb-6">
                <HeartIcon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Crisis Response Network</h3>
              <p className="text-gray-600 mb-6">
                Rapid response to natural disasters and humanitarian crises through 
                emergency funding and relief efforts.
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">24/7 response team</p>
                  <p className="text-sm text-gray-500">30+ crisis responses</p>
                </div>
                <Link href="/impact/crisis-response">
                  <button className="text-orange-600 font-semibold hover:text-orange-700">
                    Learn More →
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Get Involved Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Join Our Mission
          </h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto text-white/90">
            Whether you&apos;re a creator, business owner, or community member, there are many ways to get involved 
            and make a positive impact together.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/impact/volunteer">
              <button className="bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                Volunteer With Us
              </button>
            </Link>
            <Link href="/impact/apply">
              <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors">
                Apply for Funding
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
