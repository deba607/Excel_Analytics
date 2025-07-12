// src/pages/Pricing.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { FaCheck, FaRocket, FaChartLine, FaBriefcase, FaCrown } from 'react-icons/fa';

const Pricing = () => {
  const plans = [
    {
      name: 'Starter',
      price: 0,
      period: 'month',
      description: 'Perfect for individuals getting started with data analysis',
      features: [
        'Up to 10,000 rows per file',
        'Basic analytics tools',
        '5 reports per month',
        'Email support',
        'CSV & Excel support'
      ],
      popular: false,
      buttonText: 'Get Started',
      buttonVariant: 'outline-primary'
    },
    {
      name: 'Professional',
      price: 29,
      period: 'month',
      description: 'For professionals who need more power and flexibility',
      features: [
        'Up to 100,000 rows per file',
        'Advanced analytics tools',
        'Unlimited reports',
        'Priority email support',
        'API Access (1000 calls/month)',
        'Team collaboration (up to 5 users)'
      ],
      popular: true,
      buttonText: 'Start Free Trial',
      buttonVariant: 'primary'
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'For organizations with advanced data needs',
      features: [
        'Unlimited data processing',
        'All Professional features',
        'Dedicated account manager',
        '24/7 priority support',
        'Custom integrations',
        'On-premise deployment',
        'SLA & custom contracts'
      ],
      popular: false,
      buttonText: 'Contact Sales',
      buttonVariant: 'outline-primary'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            Simple, transparent pricing
          </h1>
          <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
            Choose the perfect plan for your business needs
          </p>
        </div>

        {/* Pricing Tiers */}
        <div className="mt-12 space-y-12 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-x-8">
          {plans.map((plan, index) => (
            <div 
              key={index}
              className={`relative p-8 bg-white border-2 rounded-2xl shadow-sm flex flex-col ${
                plan.popular ? 'border-blue-500' : 'border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white text-xs font-semibold px-4 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900">{plan.name}</h3>
                {plan.price === 0 ? (
                  <p className="mt-4 flex items-baseline text-gray-900">
                    <span className="text-5xl font-extrabold tracking-tight">Free</span>
                  </p>
                ) : plan.price === 'Custom' ? (
                  <p className="mt-4 flex items-baseline text-gray-900">
                    <span className="text-5xl font-extrabold tracking-tight">Custom</span>
                  </p>
                ) : (
                  <p className="mt-4 flex items-baseline text-gray-900">
                    <span className="text-5xl font-extrabold tracking-tight">${plan.price}</span>
                    <span className="ml-1 text-xl font-semibold text-gray-500">/month</span>
                  </p>
                )}
                <p className="mt-3 text-gray-500">{plan.description}</p>
                
                <ul className="mt-6 space-y-4">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <FaCheck className="flex-shrink-0 h-5 w-5 text-green-500" aria-hidden="true" />
                      <span className="ml-3 text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8">
                <Link
                  to={plan.name === 'Enterprise' ? '/contact' : '/signup'}
                  className={`w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    plan.popular ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-800 hover:bg-gray-900'
                  }`}
                >
                  {plan.buttonText}
                  {plan.popular && <FaRocket className="ml-2" />}
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-24">
          <h2 className="text-3xl font-extrabold text-center text-gray-900">Frequently asked questions</h2>
          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-medium text-gray-900">{faq.question}</h3>
                <p className="mt-2 text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const faqs = [
  {
    question: 'Can I change plans later?',
    answer: 'Yes, you can upgrade or downgrade your plan at any time. Your subscription will be prorated accordingly.'
  },
  {
    question: 'Is there a free trial?',
    answer: 'Yes, all paid plans come with a 14-day free trial. No credit card required to start your trial.'
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards including Visa, MasterCard, American Express, and PayPal.'
  },
  {
    question: 'How secure is my data?',
    answer: 'Your data security is our top priority. We use bank-level encryption and comply with industry standards.'
  },
  {
    question: 'Can I cancel anytime?',
    answer: 'Yes, you can cancel your subscription at any time. There are no cancellation fees.'
  },
  {
    question: 'Do you offer discounts for non-profits?',
    answer: 'Yes, we offer special pricing for non-profit organizations. Please contact our sales team for more information.'
  }
];

export default Pricing;