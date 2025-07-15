import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaArrowRight, FaArrowLeft, FaChartLine, FaChartBar, FaChartPie, FaChartArea } from 'react-icons/fa';

const Hero = () => {
  const [currentChart, setCurrentChart] = useState(0);

  const charts = [
    {
      id: 1,
      title: "Interactive Line Charts",
      description: "Powerful analytics platform built for Excel users who want to take their data analysis to the next level",
      icon: <FaChartLine className="text-blue-500 text-4xl" />,
      color: "from-blue-600 to-blue-700",
      component: <LineChartDemo />
    },
    {
      id: 2,
      title: "Detailed Bar Analysis",
      description: "Compare different data points with our responsive bar charts and advanced analytics tools",
      icon: <FaChartBar className="text-green-500 text-4xl" />,
      color: "from-green-600 to-green-700",
      component: <BarChartDemo />
    },
    {
      id: 3,
      title: "Pie & Doughnut Charts",
      description: "Understand proportions and percentages with our beautiful, easy-to-read visualizations",
      icon: <FaChartPie className="text-purple-500 text-4xl" />,
      color: "from-purple-600 to-purple-700",
      component: <PieChartDemo />
    }
  ];

  // Auto-rotate charts
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentChart((prev) => (prev + 1) % charts.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [charts.length]);

  const nextChart = () => setCurrentChart((prev) => (prev + 1) % charts.length);
  const prevChart = () => setCurrentChart((prev) => (prev - 1 + charts.length) % charts.length);

  return (
    <div className="relative bg-gradient-to-r from-blue-50 to-blue-100 pt-16 pb-20 sm:pt-24 sm:pb-28 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-grid-blue-200/[0.1] bg-[length:40px_40px]"></div>
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-500/5 to-transparent -z-0"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Content */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentChart}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-white shadow-sm mb-6">
                  <span className="mr-2">{charts[currentChart].icon}</span>
                  <span className="font-medium text-sm text-gray-700">
                    {charts[currentChart].title}
                  </span>
                </div>
                
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                  Transform Your <span className={`bg-clip-text text-transparent bg-gradient-to-r ${charts[currentChart].color}`}>
                    Data
                  </span> Into Insights
                </h1>
                
                <p className="text-xl text-gray-700 mb-8 max-w-lg mx-auto lg:mx-0">
                  {charts[currentChart].description}
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link
                    to="/signup"
                    className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-300 transform hover:scale-105 text-center"
                  >
                    Start Free Trial
                  </Link>
                  <Link
                    to="/learn"
                    className="px-8 py-4 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-all duration-300 border border-gray-300 text-center"
                  >
                    Learn More
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Chart Navigation Dots */}
            <div className="flex justify-center lg:justify-start mt-12 space-x-2">
              {charts.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentChart(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    currentChart === index ? 'bg-blue-600 w-8' : 'bg-gray-300'
                  }`}
                  aria-label={`Go to chart ${index + 1}`}
                />
              ))}
            </div>
          </motion.div>

          {/* Right side - Animated Chart */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative h-80 md:h-[28rem]"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentChart}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                {charts[currentChart].component}
              </motion.div>
            </AnimatePresence>

            {/* Navigation Arrows */}
            <button
              onClick={prevChart}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white hover:bg-gray-50 rounded-full p-2 text-gray-700 shadow-md z-10 transition-all"
              aria-label="Previous chart"
            >
              <FaArrowLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextChart}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white hover:bg-gray-50 rounded-full p-2 text-gray-700 shadow-md z-10 transition-all"
              aria-label="Next chart"
            >
              <FaArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

// Sample Chart Components (Same as before, but with updated styling)
const LineChartDemo = () => (
  <div className="w-full h-full p-4">
    <div className="bg-white rounded-xl shadow-lg p-6 h-full w-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-gray-700 text-sm">Total Revenue</h3>
          <p className="text-2xl font-bold text-gray-900">$24,780</p>
        </div>
        <span className="text-green-500 text-sm flex items-center">
          <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1"></span>
          +12.5%
        </span>
      </div>
      <div className="relative flex-1">
        <div className="absolute inset-0 flex items-end space-x-1">
          {[40, 60, 30, 70, 50, 90, 60, 100, 80, 70, 90, 60].map((h, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${h}%` }}
              transition={{ duration: 1, delay: i * 0.05 }}
              className="w-2 bg-gradient-to-t from-blue-500 to-blue-300 rounded-t-full"
            ></motion.div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const BarChartDemo = () => (
  <div className="w-full h-full p-4">
    <div className="bg-white rounded-xl shadow-lg p-6 h-full w-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-gray-700 text-sm">Monthly Users</h3>
          <p className="text-2xl font-bold text-gray-900">12,458</p>
        </div>
        <span className="text-green-500 text-sm">+24%</span>
      </div>
      <div className="relative flex-1">
        <div className="absolute inset-0 flex items-end space-x-2">
          {[30, 50, 40, 60, 50, 80, 70].map((h, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${h}%` }}
              transition={{ duration: 1, delay: i * 0.1 }}
              className="w-6 bg-gradient-to-t from-green-500 to-green-300 rounded-t-lg"
            ></motion.div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const PieChartDemo = () => (
  <div className="w-full h-full p-4">
    <div className="bg-white rounded-xl shadow-lg p-6 h-full w-full flex items-center justify-center">
      <div className="relative w-48 h-48 md:w-56 md:h-56">
        <div className="absolute inset-0 rounded-full border-8 border-purple-100"></div>
        <motion.div
          className="absolute inset-0 rounded-full border-8 border-purple-500 border-t-transparent"
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        ></motion.div>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-gray-900">85%</span>
          <span className="text-sm text-gray-500">Success Rate</span>
        </div>
      </div>
    </div>
  </div>
);

export default Hero;