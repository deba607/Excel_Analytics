// src/pages/Pricing.jsx
import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { FaCheck, FaRocket, FaChartLine, FaBriefcase, FaCrown, FaStar, FaShieldAlt, FaUsers, FaInfinity, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const Pricing = () => {
  const [selectedPlan, setSelectedPlan] = useState(1); // Professional plan
  const [currentSlide, setCurrentSlide] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const plans = [
    {
      id: 0,
      name: 'Starter',
      price: 0,
      period: 'month',
      description: 'Perfect for individuals getting started with data analysis',
      icon: <FaChartLine className="w-6 h-6" />,
      color: 'from-green-500 to-emerald-600',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      features: [
        'Up to 10,000 rows per file',
        'Basic analytics tools',
        '5 reports per month',
        'Email support',
        'CSV & Excel support'
      ],
      popular: false,
      buttonText: 'Get Started',
      buttonVariant: 'outline-primary',
      badge: null
    },
    {
      id: 1,
      name: 'Professional',
      price: 29,
      period: 'month',
      description: 'For professionals who need more power and flexibility',
      icon: <FaRocket className="w-6 h-6" />,
      color: 'from-blue-500 to-purple-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
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
      buttonVariant: 'primary',
      badge: 'Most Popular'
    },
    {
      id: 2,
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'For organizations with advanced data needs',
      icon: <FaCrown className="w-6 h-6" />,
      color: 'from-purple-500 to-pink-600',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
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
      buttonVariant: 'outline-primary',
      badge: 'Enterprise'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { 
      x: 100, 
      opacity: 0,
      scale: 0.9
    },
    visible: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15
      }
    },
    hover: {
      y: -10,
      scale: 1.02,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 20
      }
    },
    exit: {
      x: -100,
      opacity: 0,
      scale: 0.9,
      transition: {
        duration: 0.3
      }
    }
  };

  const headerVariants = {
    hidden: { opacity: 0, y: -30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.04, 0.62, 0.23, 0.98]
      }
    }
  };

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset, velocity) => {
    return Math.abs(offset) * velocity;
  };

  const paginate = (newDirection) => {
    setCurrentSlide((prev) => {
      if (newDirection === 1) {
        return prev === plans.length - 1 ? 0 : prev + 1;
      } else {
        return prev === 0 ? plans.length - 1 : prev - 1;
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 py-16 px-4 sm:px-6 lg:px-8" ref={ref}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          className="text-center mb-16"
          variants={headerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-800 text-sm font-medium mb-6"
          >
            <FaStar className="w-4 h-4 mr-2" />
            Simple, transparent pricing
          </motion.div>
          
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl mb-6">
            Choose Your{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Perfect Plan
            </span>
          </h1>
          <p className="mt-5 max-w-2xl mx-auto text-xl text-gray-600 leading-relaxed">
            Start with our free plan and scale as you grow. All plans include our core features with no hidden fees.
          </p>
        </motion.div>

        {/* Mobile Sliding Carousel */}
        <div className="lg:hidden">
          <motion.div 
            className="relative overflow-hidden rounded-3xl"
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
          >
            <AnimatePresence initial={false} custom={currentSlide}>
              <motion.div
                key={currentSlide}
                custom={currentSlide}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 }
                }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={1}
                onDragEnd={(e, { offset, velocity }) => {
                  const swipe = swipePower(offset.x, velocity.x);
                  if (swipe < -swipeConfidenceThreshold) {
                    paginate(1);
                  } else if (swipe > swipeConfidenceThreshold) {
                    paginate(-1);
                  }
                }}
                className="w-full"
              >
                <div className="px-4">
                  {(() => {
                    const plan = plans[currentSlide];
                    return (
                      <motion.div
                        className={`relative p-8 bg-white/80 backdrop-blur-xl border-2 rounded-3xl shadow-lg ${
                          plan.popular 
                            ? 'border-blue-500 shadow-blue-500/20' 
                            : 'border-gray-200'
                        }`}
                        whileHover={{ 
                          boxShadow: plan.popular 
                            ? "0 25px 50px rgba(59, 130, 246, 0.25)" 
                            : "0 20px 40px rgba(0, 0, 0, 0.1)"
                        }}
                      >
                        {/* Popular Badge */}
                        {plan.badge && (
                          <motion.div 
                            className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                          >
                            <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold shadow-lg ${
                              plan.popular 
                                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' 
                                : 'bg-gradient-to-r from-purple-500 to-pink-600 text-white'
                            }`}>
                              {plan.popular && <FaStar className="w-3 h-3 mr-1" />}
                              {plan.badge}
                            </span>
                          </motion.div>
                        )}

                        {/* Plan Icon */}
                        <motion.div
                          className={`w-12 h-12 rounded-2xl ${plan.bgColor} flex items-center justify-center mb-6`}
                          whileHover={{ rotate: 360, scale: 1.1 }}
                          transition={{ duration: 0.6 }}
                        >
                          <div className={plan.iconColor}>
                            {plan.icon}
                          </div>
                        </motion.div>
                      
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                          
                          {/* Price */}
                          <div className="mb-4">
                            {plan.price === 0 ? (
                              <div className="flex items-baseline">
                                <span className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                                  Free
                                </span>
                              </div>
                            ) : plan.price === 'Custom' ? (
                              <div className="flex items-baseline">
                                <span className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                                  Custom
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-baseline">
                                <span className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                  ${plan.price}
                                </span>
                                <span className="ml-2 text-xl font-semibold text-gray-500">/month</span>
                              </div>
                            )}
                          </div>
                          
                          <p className="text-gray-600 mb-6 leading-relaxed">{plan.description}</p>
                          
                          {/* Features */}
                          <ul className="space-y-4 mb-8">
                            {plan.features.map((feature, i) => (
                              <motion.li 
                                key={i} 
                                className="flex items-start"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 + i * 0.05 }}
                              >
                                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mr-3 mt-0.5">
                                  <FaCheck className="h-3 w-3 text-green-600" />
                                </div>
                                <span className="text-gray-700 leading-relaxed">{feature}</span>
                              </motion.li>
                            ))}
                          </ul>
                        </div>

                        {/* CTA Button */}
                        <div className="mt-auto">
                          <Link to={plan.name === 'Enterprise' ? '/contact' : '/signup'}>
                            <motion.button 
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className={`w-full relative overflow-hidden px-6 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl ${
                                plan.popular 
                                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700' 
                                  : 'bg-gradient-to-r from-gray-800 to-gray-900 text-white hover:from-gray-900 hover:to-black'
                              }`}
                            >
                              <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"
                                initial={false}
                              />
                              <span className="relative z-10 flex items-center justify-center">
                                {plan.buttonText}
                                {plan.popular && <FaRocket className="ml-2 w-4 h-4" />}
                              </span>
                            </motion.button>
                          </Link>
                        </div>
                      </motion.div>
                    );
                  })()}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation Arrows */}
            <motion.button
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-blue-600 transition-colors z-10"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => paginate(-1)}
            >
              <FaChevronLeft className="w-4 h-4" />
            </motion.button>
            
            <motion.button
              className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-blue-600 transition-colors z-10"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => paginate(1)}
            >
              <FaChevronRight className="w-4 h-4" />
            </motion.button>

            {/* Dots Indicator */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {plans.map((_, index) => (
                <motion.button
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentSlide ? 'bg-blue-600 w-6' : 'bg-gray-300'
                  }`}
                  onClick={() => setCurrentSlide(index)}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.8 }}
                />
              ))}
            </div>
          </motion.div>
        </div>

        {/* Desktop Pricing Tiers */}
        <motion.div 
          className="hidden lg:block mt-12 space-y-8 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-x-8"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {plans.map((plan, index) => (
            <motion.div 
              key={plan.id}
              variants={cardVariants}
              whileHover="hover"
              className={`relative group cursor-pointer ${
                selectedPlan === plan.id ? 'ring-2 ring-blue-500 ring-offset-4' : ''
              }`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              <motion.div
                className={`relative p-8 bg-white/80 backdrop-blur-xl border-2 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 flex flex-col h-full ${
                  plan.popular 
                    ? 'border-blue-500 shadow-blue-500/20' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                whileHover={{ 
                  boxShadow: plan.popular 
                    ? "0 25px 50px rgba(59, 130, 246, 0.25)" 
                    : "0 20px 40px rgba(0, 0, 0, 0.1)"
                }}
              >
                {/* Popular Badge */}
                {plan.badge && (
                  <motion.div 
                    className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                  >
                    <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold shadow-lg ${
                      plan.popular 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' 
                        : 'bg-gradient-to-r from-purple-500 to-pink-600 text-white'
                    }`}>
                      {plan.popular && <FaStar className="w-3 h-3 mr-1" />}
                      {plan.badge}
                    </span>
                  </motion.div>
                )}

                {/* Plan Icon */}
                <motion.div
                  className={`w-12 h-12 rounded-2xl ${plan.bgColor} flex items-center justify-center mb-6`}
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.6 }}
                >
                  <div className={plan.iconColor}>
                    {plan.icon}
                  </div>
                </motion.div>
              
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  
                  {/* Price */}
                  <div className="mb-4">
                    {plan.price === 0 ? (
                      <div className="flex items-baseline">
                        <span className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                          Free
                        </span>
                      </div>
                    ) : plan.price === 'Custom' ? (
                      <div className="flex items-baseline">
                        <span className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                          Custom
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-baseline">
                        <span className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          ${plan.price}
                        </span>
                        <span className="ml-2 text-xl font-semibold text-gray-500">/month</span>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-gray-600 mb-6 leading-relaxed">{plan.description}</p>
                  
                  {/* Features */}
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, i) => (
                      <motion.li 
                        key={i} 
                        className="flex items-start"
                        initial={{ opacity: 0, x: -20 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ delay: 0.4 + index * 0.1 + i * 0.05 }}
                      >
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mr-3 mt-0.5">
                          <FaCheck className="h-3 w-3 text-green-600" />
                        </div>
                        <span className="text-gray-700 leading-relaxed">{feature}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button */}
                <div className="mt-auto">
                  <Link to={plan.name === 'Enterprise' ? '/contact' : '/signup'}>
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`w-full relative overflow-hidden px-6 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl ${
                        plan.popular 
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700' 
                          : 'bg-gradient-to-r from-gray-800 to-gray-900 text-white hover:from-gray-900 hover:to-black'
                      }`}
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"
                        initial={false}
                      />
                      <span className="relative z-10 flex items-center justify-center">
                        {plan.buttonText}
                        {plan.popular && <FaRocket className="ml-2 w-4 h-4" />}
                      </span>
                    </motion.button>
                  </Link>
                </div>

                {/* Hover Effect Overlay */}
                <motion.div
                  className="absolute inset-0 rounded-3xl bg-gradient-to-r opacity-0 group-hover:opacity-5 transition-opacity duration-500"
                  style={{
                    background: `linear-gradient(135deg, ${plan.color.split(' ')[0].replace('from-', '')} 0%, ${plan.color.split(' ')[1].replace('to-', '')} 100%)`
                  }}
                />
              </motion.div>
            </motion.div>
          ))}
        </motion.div>

        {/* FAQ Section */}
        {/* Removed FAQ section as requested */}
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