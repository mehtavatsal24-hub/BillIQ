import React from 'react';

export const MobileOptimizedFormLayout: React.FC = () => {
  return (
    // pb-24 ensures floating bottom nav bar does not cover submit/action buttons
    <div className="w-full max-w-5xl mx-auto px-3.5 py-4 sm:px-6 sm:py-6 pb-24 space-y-6">
      
      {/* Mobile-Responsive Section Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6 space-y-4">
        <div className="border-b border-gray-100 pb-3">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
            🏛️ Business Profile & Settings
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Configure company details, tax defaults, and PDF styling options.
          </p>
        </div>

        {/* Form Inputs Grid: 1 column on mobile, 2 on tablet, 3 on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          
          {/* Business Name Input */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Business Name
            </label>
            <input
              type="text"
              placeholder="Full business name"
              className="w-full h-11 px-3 text-sm bg-gray-50/50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
            />
          </div>

          {/* Industry Selection */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Industry / Business Line
            </label>
            <select className="w-full h-11 px-3 text-sm bg-gray-50/50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none">
              <option>⚙️ Industrial Hardware, Piping & Valves</option>
              <option>🧪 Chemicals & Petrochemicals</option>
              <option>🏗️ Metals, Steel & Fabrication</option>
            </select>
          </div>

          {/* Country Selection */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Country / Region
            </label>
            <select className="w-full h-11 px-3 text-sm bg-gray-50/50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none">
              <option>🇮🇳 India (INR)</option>
              <option>🇺🇸 United States (USD)</option>
              <option>🇬🇧 United Kingdom (GBP)</option>
            </select>
          </div>
        </div>

        {/* Action Button Optimized for Thumb Tapping on Mobile */}
        <div className="pt-2">
          <button
            type="button"
            className="w-full sm:w-auto h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            💾 Save Settings & Business Profile
          </button>
        </div>
      </div>
    </div>
  );
};
