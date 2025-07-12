import React from 'react';
import { FaChartLine, FaRobot, FaCloud, FaShieldAlt } from 'react-icons/fa';

const Features = () => {
  const features = [
    {
      name: 'Advanced Analytics',
      description: 'Deep dive into your data with powerful analytics tools',
      icon: <FaChartLine className="w-5 h-5" />,
    },
    {
      name: 'Automation',
      description: 'Automate repetitive tasks and save time',
      icon: <FaRobot className="w-5 h-5" />,
    },
    {
      name: 'Cloud Integration',
      description: 'Seamless integration with cloud storage',
      icon: <FaCloud className="w-5 h-5" />,
    },
    {
      name: 'Enterprise Security',
      description: 'Bank-level security for your data',
      icon: <FaShieldAlt className="w-5 h-5" />,
    },
  ];

  return (
    <div className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Key Features
          </h2>
          <p className="mt-2 text-lg leading-8 text-gray-600">
            Discover the powerful features that make Excel Analytics Platform stand out
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-4">
            {features.map((feature) => (
              <div key={feature.name} className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                    {React.cloneElement(feature.icon, { className: 'w-5 h-5 animate-bounce' })}
                  </div>
                  {feature.name}
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">{feature.description}</p>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
};

export default Features;