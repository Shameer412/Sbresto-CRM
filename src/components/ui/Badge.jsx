import React from 'react';
import { X } from 'lucide-react';

export function Badge({ 
  children, 
  variant = 'default',
  className = '',
  onRemove,
  ...props
}) {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    dark: 'bg-gray-800 text-gray-100',
    red: 'bg-red-100 text-red-800',
    green: 'bg-green-100 text-green-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    blue: 'bg-blue-100 text-blue-800',
    indigo: 'bg-indigo-100 text-indigo-800',
    purple: 'bg-purple-100 text-purple-800',
    pink: 'bg-pink-100 text-pink-800',
    outline: 'bg-transparent border text-current',
  };

  return (
    <div
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-current hover:bg-current hover:bg-opacity-10 focus:outline-none"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}