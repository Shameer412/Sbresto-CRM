import { useExportLeadsQuery } from '../../features/leads/leadsApiSlice';
import React from 'react';

const ExportButton = () => {
  const { data: downloadLink, isLoading, isError, refetch } = useExportLeadsQuery();

  const handleExport = async () => {
    if (!downloadLink) {
      try {
        await refetch();
        if (downloadLink) window.open(downloadLink, '_blank');
      } catch (err) {
        console.error('Failed to export leads:', err);
      }
    } else {
      window.open(downloadLink, '_blank');
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleExport}
        disabled={isLoading || isError}
        className={`
          relative inline-flex items-center justify-center 
          px-6 py-3 rounded-lg font-medium text-white
          transition-all duration-200 ease-out
          shadow-md hover:shadow-lg
          ${isLoading || isError
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
          }
          overflow-hidden
          min-w-[180px]
          group
        `}
      >
        {/* Animated background for active state */}
        {!(isLoading || isError) && (
          <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
        )}

        {/* Button content */}
        <span className="flex items-center gap-3">
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Preparing Export...</span>
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform group-hover:translate-y-[-2px]" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              <span>Export Leads</span>
            </>
          )}
        </span>
      </button>

      {isError && (
        <div className="flex items-start gap-2 text-red-500 text-sm animate-fade-in">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="font-medium">Export failed</p>
            <p className="text-red-400">Please check your connection and try again</p>
          </div>
        </div>
      )}

      {!isError && !isLoading && (
        <p className="text-gray-500 text-xs mt-1 flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
          </svg>
          Exports will download as CSV files
        </p>
      )}
    </div>
  );
};

export default ExportButton;