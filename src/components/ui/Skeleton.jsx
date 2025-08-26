import React from 'react';

export function Skeleton({ 
  className = '',
  circle = false,
  ...props
}) {
  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 ${circle ? 'rounded-full' : 'rounded-md'} ${className}`}
      {...props}
    />
  );
}