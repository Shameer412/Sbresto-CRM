import React, { useState } from 'react';

export function Tooltip({ 
  content, 
  children, 
  position = 'top',
  delay = 200,
  disabled = false
}) {
  const [visible, setVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState(null);

  const showTooltip = () => {
    if (disabled) return;
    const id = setTimeout(() => setVisible(true), delay);
    setTimeoutId(id);
  };

  const hideTooltip = () => {
    clearTimeout(timeoutId);
    setVisible(false);
  };

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {visible && (
        <div 
          className={`absolute z-50 px-3 py-1.5 text-xs font-medium rounded-md bg-gray-800 text-gray-100 shadow-lg whitespace-nowrap ${positionClasses[position]}`}
          role="tooltip"
        >
          {content}
          <div className={`absolute w-2 h-2 bg-gray-800 transform rotate-45 ${getArrowPosition(position)}`} />
        </div>
      )}
    </div>
  );
}

function getArrowPosition(position) {
  switch(position) {
    case 'top': return '-bottom-1 left-1/2 -translate-x-1/2';
    case 'bottom': return '-top-1 left-1/2 -translate-x-1/2';
    case 'left': return 'right-1 top-1/2 -translate-y-1/2';
    case 'right': return 'left-1 top-1/2 -translate-y-1/2';
    default: return '';
  }
}