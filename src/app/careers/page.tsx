"use client";

import Link from "next/link";
import { Briefcase, MapPin, Clock, Users, TrendingUp, Heart, Globe, ArrowRight } from "lucide-react";

export default function CareersPage() {
  const jobCategories = [
    { name: "Engineering", count: 45, icon: "💻" },
    { name: "Product", count: 23, icon: "🚀" },
    { name: "Design", count: 18, icon: "🎨" },
    { name: "Marketing", count: 31, icon: "📢" },
    { name: "Sales", count: 27, icon: "💼" },
    { name: "Operations", count: 19, icon: "⚙️" }
  ];

  const openPositions = [
    {
      title: "Senior Full Stack Engineer",
      department: "Engineering",
      location: "San Francisco, CA",
      type: "Full-time",
      description: "Join our engineering team to build the next generation of social commerce experiences.",
      requirements: ["5+ years React/Node.js experience", "E-commerce platform experience", "Microservices architecture"]
    },
    {
      title: "Product Manager - Creator Tools",
      department: "Product",
      location: "New York, NY",
      type: "Full-time", 
      description: "Lead product development for creator monetization and engagement tools.",
      requirements: ["3+ years product management", "Creator economy experience", "Data-driven decision making"]
    },
    {
      title: "UX Designer - Mobile Experience",
      department: "Design",
      location: "Los Angeles, CA",
      type: "Full-time",
      description: "Design intuitive mobile shopping experiences that delight millions of users.",
      requirements: ["4+ years UX design", "Mobile-first design", "User research skills"]
    },
    {
      title: "Global Marketing Manager",
      department: "Marketing",
      location: "Remote",
      type: "Full-time",
      description: "Drive global marketing campaigns and brand awareness across multiple markets.",
      requirements: ["5+ years marketing experience", "Global campaign management", "Digital marketing expertise"]
    }
  ];

  const benefits = [
    { icon: Heart, title: "Health & Wellness", description: "Comprehensive health insurance, mental health support, and wellness programs" },
    { icon: TrendingUp, title: "Career Growth", description: "Learning stipends, mentorship programs, and clear advancement paths" },
    { icon: Globe, title: "Work Flexibility", description: "Hybrid work options, flexible hours, and remote work opportunities" },
    { icon: Users, title: "Team Culture", description: "Diverse, inclusive environment with team events and collaboration spaces" }
  ];

  const values = [
    {
      title: "Innovation First",
      description: "We embrace creativity and push boundaries to create revolutionary shopping experiences."
    },
    {
      title: "User-Centric",
      description: "Every decision we make is guided by what's best for our users and community."
    },
    {
      title: "Collaborative Spirit", 
      description: "We believe the best solutions come from diverse teams working together."
    },
    {
      title: "Global Impact",
      description: "We're building technology that connects people and businesses worldwide."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="bg-white bg-opacity-20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Briefcase className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Join Our Team
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90">
            Help us revolutionize social commerce and create the future of shopping. 
            Join a team that's passionate about connecting creators, businesses, and consumers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="#open-positions"
              className="bg-white text-indigo-600 px-8 py-3 rounded-md hover:bg-gray-100 transition duration-200 font-semibold"
            >
              View Open Positions
            </Link>
            <Link
              href="#company-culture"
              className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-md hover:bg-white hover:text-indigo-600 transition duration-200 font-semibold"
            >
              Learn About Culture
            </Link>
          </div>
        </div>
      </div>

      {/* Job Categories */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Open Opportunities</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Explore career opportunities across different departments and find the perfect role for your skills.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-16">
          {jobCategories.map((category, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition duration-200 text-center cursor-pointer">
              <div className="text-3xl mb-3">{category.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-1">{category.name}</h3>
              <p className="text-sm text-gray-600">{category.count} positions</p>
            </div>
          ))}
        </div>
      </div>

      {/* Open Positions */}
      <div className="bg-white py-20" id="open-positions">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Featured Positions</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Join our growing team and help shape the future of social commerce.
            </p>
          </div>

          <div className="space-y-6">
            {openPositions.map((job, index) => (
              <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-6 hover:shadow-md transition duration-200">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-4 mb-3">
                      <h3 className="text-xl font-semibold text-gray-900">{job.title}</h3>
                      <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
                        {job.department}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {job.location}
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {job.type}
                      </div>
                    </div>
                    <p className="text-gray-700 mb-3">{job.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {job.requirements.map((req, reqIndex) => (
                        <span key={reqIndex} className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-sm">
                          {req}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 lg:mt-0 lg:ml-6">
                    <Link
                      href="/contact"
                      className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition duration-200 font-medium inline-flex items-center"
                    >
                      Apply Now <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Company Values */}
      <div className="bg-gray-100 py-20" id="company-culture">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Values</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              These core values guide everything we do and define our company culture.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {values.map((value, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Why Work With Us</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              We offer comprehensive benefits and a supportive environment to help you thrive.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="w-8 h-8 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-indigo-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold">2,000+</div>
              <div className="text-indigo-200">Team Members</div>
            </div>
            <div>
              <div className="text-3xl font-bold">40+</div>
              <div className="text-indigo-200">Countries</div>
            </div>
            <div>
              <div className="text-3xl font-bold">95%</div>
              <div className="text-indigo-200">Employee Satisfaction</div>
            </div>
            <div>
              <div className="text-3xl font-bold">4.8★</div>
              <div className="text-indigo-200">Glassdoor Rating</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Ready to Join Us?</h2>
          <p className="text-lg text-gray-600 mb-8">
            Don't see the perfect role? We're always looking for talented individuals who share our passion.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="bg-indigo-600 text-white px-8 py-3 rounded-md hover:bg-indigo-700 transition duration-200 font-semibold"
            >
              Send Your Resume
            </Link>
            <Link
              href="/about"
              className="bg-white text-indigo-600 border border-indigo-600 px-8 py-3 rounded-md hover:bg-indigo-50 transition duration-200 font-semibold"
            >
              Learn More About Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
