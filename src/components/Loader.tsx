import React from "react";

const Loader = () => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-green-100 dark:border-green-900/30"></div>
          <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-4 border-green-600 border-t-transparent animate-spin"></div>
        </div>
        <p className="text-lg font-medium text-gray-600 dark:text-gray-300 animate-pulse">Loading...</p>
      </div>
    </div>
  );
};

export default Loader;
