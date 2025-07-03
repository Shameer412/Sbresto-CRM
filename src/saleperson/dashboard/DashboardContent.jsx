import React from 'react';
import Schedule from '../Schedule';


const DashboardContent = ({ activeTab }) => {
  const renderContent = () => {
    switch(activeTab) {
      case 'schedule': return <Schedule />;
      case 'meetings': return <Schedule />;
      case 'leads': return <Schedule />;
      default: return <Schedule />;
    }
  };

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-900">
      {renderContent()}
    </main>
  );
};

export default DashboardContent;