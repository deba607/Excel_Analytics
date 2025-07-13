// src/pages/Contact.jsx
import React, { useState } from 'react';
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaPaperPlane, FaCheckCircle, FaTwitter, FaLinkedin, FaGithub, FaYoutube } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Replace with your actual API endpoint
      const response = await fetch('http://localhost:8000/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        setIsSubmitted(true);
        setFormData({ name: '', email: '', subject: '', message: '' });
        setTimeout(() => setIsSubmitted(false), 5000);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: <FaMapMarkerAlt className="text-3xl text-blue-600" />,
      title: 'Our Location',
      description: '123 Analytics Street, Data City, 100001, India',
      link: 'https://maps.google.com'
    },
    {
      icon: <FaPhone className="text-3xl text-blue-600" />,
      title: 'Phone Number',
      description: '+91 98765 43210',
      link: 'tel:+919876543210'
    },
    {
      icon: <FaEnvelope className="text-3xl text-blue-600" />,
      title: 'Email Address',
      description: 'support@excelanalytics.com',
      link: 'mailto:support@excelanalytics.com'
    }
  ];

  // Animation variants
  const formContainer = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, type: 'spring' } }
  };
  const fieldVariant = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({ opacity: 1, y: 0, transition: { delay: 0.1 + i * 0.08, duration: 0.4 } })
  };
  const buttonVariant = {
    rest: { scale: 1 },
    hover: { scale: 1.04, boxShadow: '0 4px 16px rgba(59,130,246,0.15)' },
    tap: { scale: 0.97 }
  };
  const successVariant = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            Get in Touch
          </h1>
          <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
            Have questions or feedback? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <motion.div 
            variants={formContainer}
            initial="hidden"
            animate="visible"
            className="bg-white p-8 rounded-2xl shadow-lg"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a message</h2>
            <AnimatePresence mode="wait">
              {isSubmitted ? (
                <motion.div
                  key="success"
                  variants={successVariant}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="text-center py-8"
                >
                  <FaCheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
                  <h3 className="text-2xl font-medium text-gray-900 mb-2">Thank you!</h3>
                  <p className="text-gray-600">Your message has been sent successfully. We'll get back to you soon!</p>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  onSubmit={handleSubmit}
                  className="space-y-10"
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                >
                  {['name', 'email', 'subject', 'message'].map((field, i) => (
                    <motion.div key={field} custom={i} variants={fieldVariant}>
                      <label htmlFor={field} className="block text-sm font-medium text-gray-700 capitalize">
                        {field === 'name' ? 'Full Name' : field.charAt(0).toUpperCase() + field.slice(1)}
                      </label>
                      {field !== 'message' ? (
                        <input
                          type={field === 'email' ? 'email' : 'text'}
                          id={field}
                          name={field}
                          value={formData[field]}
                          onChange={handleChange}
                          required
                          className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          placeholder={
                            field === 'name' ? 'John Doe' :
                            field === 'email' ? 'you@example.com' :
                            field === 'subject' ? 'How can we help you?' : ''
                          }
                        />
                      ) : (
                        <textarea
                          id="message"
                          name="message"
                          rows="14"
                          value={formData.message}
                          onChange={handleChange}
                          required
                          className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Tell us more about your needs..."
                        ></textarea>
                      )}
                    </motion.div>
                  ))}
                  <motion.div variants={fieldVariant} custom={4}>
                    <motion.button
                      type="submit"
                      disabled={isSubmitting}
                      variants={buttonVariant}
                      initial="rest"
                      whileHover="hover"
                      whileTap="tap"
                      className={`w-full flex justify-center items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      {isSubmitting ? (
                        'Sending...'
                      ) : (
                        <>
                          <FaPaperPlane className="mr-2" />
                          Send Message
                        </>
                      )}
                    </motion.button>
                  </motion.div>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Contact Information */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-8"
          >
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h2>
              <p className="text-gray-600 mb-8">
                Have questions about our services or need support? Fill out the form and our team will get back to you within 24 hours.
              </p>
            </div>
            <div className="space-y-6">
              {contactInfo.map((item, index) => (
                <a
                  key={index}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start p-4 rounded-xl hover:bg-gray-50 transition-colors duration-200 group"
                >
                  <div className="flex-shrink-0 bg-blue-50 p-3 rounded-lg group-hover:bg-blue-100 transition-colors duration-200">
                    {item.icon}
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">{item.title}</h3>
                    <p className="mt-1 text-gray-600">{item.description}</p>
                  </div>
                </a>
              ))}
            </div>
            {/* Social Media Links */}
            <div className="pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Follow Us</h3>
              <div className="flex space-x-4">
                {[
                  { name: 'Twitter', icon: FaTwitter, url: '#' },
                  { name: 'LinkedIn', icon: FaLinkedin, url: '#' },
                  { name: 'GitHub', icon: FaGithub, url: '#' },
                  { name: 'YouTube', icon: FaYoutube, url: '#' }
                ].map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.name}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-blue-600 transition-colors duration-200"
                      aria-label={social.name}
                    >
                      <Icon className="h-6 w-6" />
                    </a>
                  );
                })}
              </div>
            </div>
            {/* Map Embed */}
            <div className="pt-6">
              <div className="aspect-w-16 aspect-h-9 rounded-xl overflow-hidden">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3502.292033518165!2d77.20955031508246!3d28.62826798242149!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390cfd5b347eb62d%3A0x52c2b7494e204dce!2sNew%20Delhi%2C%20Delhi!5e0!3m2!1sen!2sin!4v1620000000000!5m2!1sen!2sin"
                  width="100%"
                  height="300"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  title="Our Location"
                  className="rounded-xl"
                ></iframe>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Contact;