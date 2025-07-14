import React, { useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { 
  FaChartLine, 
  FaRobot, 
  FaCloud, 
  FaShieldAlt, 
  FaFileExcel, 
  FaUsers,
  FaBolt,
  FaBrain
} from 'react-icons/fa';

const Features = () => {
  const [activeFeature, setActiveFeature] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  const features = [
    {
      id: 0,
      name: 'Advanced Data Analytics',
      description: 'Transform your raw data into actionable insights with our powerful analytics engine. Visualize trends, patterns, and correlations with interactive charts and real-time dashboards.',
      icon: <FaChartLine className="w-6 h-6" />,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      gif: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif', // Data analytics gif
      details: [
        'Real-time data processing',
        'Interactive visualizations',
        'Custom dashboard creation',
        'Predictive analytics'
      ]
    },
    {
      id: 1,
      name: 'AI-Powered Automation',
      description: 'Let artificial intelligence handle your repetitive tasks. Our smart automation learns from your workflows and optimizes processes for maximum efficiency.',
      icon: <FaRobot className="w-6 h-6" />,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      gif: 'https://media.giphy.com/media/3o7TKDEq4fNVjZ8G1y/giphy.gif', // AI automation gif
      details: [
        'Smart workflow automation',
        'Machine learning algorithms',
        'Process optimization',
        'Intelligent task scheduling'
      ]
    },
    {
      id: 2,
      name: 'Cloud Integration',
      description: 'Seamlessly connect with all your cloud storage and applications. Access your data from anywhere, anytime, with enterprise-grade security.',
      icon: <FaCloud className="w-6 h-6" />,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      gif: 'https://media.giphy.com/media/3o7TKDEq4fNVjZ8G1y/giphy.gif', // Cloud integration gif
      details: [
        'Multi-cloud support',
        'Real-time synchronization',
        'Secure data transfer',
        'Cross-platform compatibility'
      ]
    },
    {
      id: 3,
      name: 'Enterprise Security',
      description: 'Bank-level security protocols protect your sensitive data. End-to-end encryption, role-based access control, and compliance with industry standards.',
      icon: <FaShieldAlt className="w-6 h-6" />,
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
      gif: 'https://media.giphy.com/media/3o7TKDEq4fNVjZ8G1y/giphy.gif', // Security gif
      details: [
        'End-to-end encryption',
        'Role-based access control',
        'SOC 2 compliance',
        'Regular security audits'
      ]
    },
    {
      id: 4,
      name: 'Excel Integration',
      description: 'Work seamlessly with your existing Excel files. Import, export, and sync data between Excel and our platform with zero data loss.',
      icon: <FaFileExcel className="w-6 h-6" />,
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      gif: 'https://media.giphy.com/media/3o7TKDEq4fNVjZ8G1y/giphy.gif', // Excel integration gif
      details: [
        'One-click Excel import',
        'Bidirectional sync',
        'Format preservation',
        'Bulk data processing'
      ]
    },
    {
      id: 5,
      name: 'Team Collaboration',
      description: 'Collaborate with your team in real-time. Share insights, assign tasks, and track progress with built-in communication tools.',
      icon: <FaUsers className="w-6 h-6" />,
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
      gif: 'https://media.giphy.com/media/3o7TKDEq4fNVjZ8G1y/giphy.gif', // Collaboration gif
      details: [
        'Real-time collaboration',
        'Team workspaces',
        'Comment and annotation',
        'Version control'
      ]
    },
    {
      id: 6,
      name: 'Lightning Fast Performance',
      description: 'Experience blazing-fast data processing and analysis. Our optimized engine handles millions of records in seconds.',
      icon: <FaBolt className="w-6 h-6" />,
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
      gif: 'https://media.giphy.com/media/3o7TKDEq4fNVjZ8G1y/giphy.gif', // Performance gif
      details: [
        'Sub-second response times',
        'Parallel processing',
        'Memory optimization',
        'Scalable architecture'
      ]
    },
    {
      id: 7,
      name: 'Smart Insights',
      description: 'Get intelligent recommendations and insights powered by advanced algorithms. Discover hidden patterns and opportunities in your data.',
      icon: <FaBrain className="w-6 h-6" />,
      color: 'from-pink-500 to-pink-600',
      bgColor: 'bg-pink-50',
      iconColor: 'text-pink-600',
      gif: 'https://media.giphy.com/media/3o7TKDEq4fNVjZ8G1y/giphy.gif', // Smart insights gif
      details: [
        'AI-powered insights',
        'Predictive modeling',
        'Anomaly detection',
        'Trend analysis'
      ]
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15
      }
    }
  };

  const cardVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 200,
        damping: 20
      }
    },
    hover: {
      scale: 1.05,
      y: -10,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 20
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

  return (
    <section id="features" className="bg-gradient-to-br from-gray-50 to-white py-24 sm:py-32" ref={ref}>
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <motion.div 
          className="mx-auto max-w-2xl text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
            Powerful Features for{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Modern Analytics
            </span>
          </h2>
          <p className="mt-6 text-lg leading-8 text-gray-600 max-w-3xl mx-auto">
            Transform your data into actionable insights with our comprehensive suite of analytics tools. 
            From AI-powered automation to enterprise-grade security, we've got everything you need.
          </p>
        </motion.div>

        {/* Feature Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.id}
              variants={itemVariants}
              whileHover="hover"
              className="group cursor-pointer"
              onClick={() => setActiveFeature(feature.id)}
            >
              <motion.div
                variants={cardVariants}
                className={`relative p-6 rounded-2xl border-2 transition-all duration-300 ${
                  activeFeature === feature.id 
                    ? 'border-blue-500 shadow-2xl shadow-blue-500/20' 
                    : 'border-gray-200 hover:border-gray-300 shadow-lg hover:shadow-xl'
                } bg-white`}
              >
                {/* Icon */}
                <motion.div
                  className={`w-12 h-12 rounded-xl ${feature.bgColor} flex items-center justify-center mb-4`}
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <div className={feature.iconColor}>
                    {feature.icon}
                  </div>
                </motion.div>

                {/* Title */}
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                  {feature.name}
                </h3>

                {/* Description */}
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  {feature.description}
                </p>

                {/* Details List */}
                <ul className="space-y-2">
                  {feature.details.map((detail, idx) => (
                    <motion.li
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={isInView ? { opacity: 1, x: 0 } : {}}
                      transition={{ delay: 0.1 * idx }}
                      className="flex items-center text-sm text-gray-500"
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${feature.iconColor} mr-2`} />
                      {detail}
                    </motion.li>
                  ))}
                </ul>

                {/* Hover Effect */}
                <motion.div
                  className="absolute inset-0 rounded-2xl bg-gradient-to-r opacity-0 group-hover:opacity-5 transition-opacity duration-300"
                  style={{
                    background: `linear-gradient(135deg, ${feature.color.split(' ')[0].replace('from-', '')} 0%, ${feature.color.split(' ')[1].replace('to-', '')} 100%)`
                  }}
                />
              </motion.div>
            </motion.div>
          ))}
        </motion.div>

        {/* Feature Showcase */}
        {activeFeature !== null && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-16"
          >
            <div className="bg-white rounded-3xl shadow-2xl p-8 lg:p-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                {/* GIF/Animation */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6 }}
                  className="relative"
                >
                  <div className="aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                    <img
                      src={features[activeFeature].gif}
                      alt={features[activeFeature].name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="hidden w-full h-full items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
                      <div className="text-center">
                        <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl ${features[activeFeature].bgColor} flex items-center justify-center`}>
                          <div className={features[activeFeature].iconColor}>
                            {features[activeFeature].icon}
                          </div>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {features[activeFeature].name}
                        </h3>
                        <p className="text-gray-600">
                          Interactive demonstration
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Content */}
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <h3 className="text-3xl font-bold text-gray-900 mb-4">
                    {features[activeFeature].name}
                  </h3>
                  <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                    {features[activeFeature].description}
                  </p>
                  <div className="space-y-3">
                    {features[activeFeature].details.map((detail, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * idx }}
                        className="flex items-center"
                      >
                        <div className={`w-2 h-2 rounded-full ${features[activeFeature].iconColor} mr-3`} />
                        <span className="text-gray-700">{detail}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-20 text-center"
        >
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 lg:p-12">
            <h3 className="text-3xl font-bold text-white mb-4">
              Ready to Transform Your Data?
            </h3>
            <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
              Join thousands of users who are already leveraging the power of Excel Analytics Platform.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Start Free Trial
            </motion.button>
        </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Features;