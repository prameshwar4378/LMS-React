import React from 'react';
import DeveloperSidebar from '../components/DeveloperSidebar';
import DeveloperNavbar from '../components/DeveloperNavbar';

const DeveloperLayout = ({ children, activeTab, onSelectTab, onOpenOnboardModal }) => {
  return (
    <div className="lms-wrapper" style={{ backgroundColor: '#F8FAFC' }}>
      <DeveloperSidebar activeTab={activeTab} onSelectTab={onSelectTab} />
      <div className="lms-content">
        <DeveloperNavbar activeTab={activeTab} onSelectTab={onSelectTab} onOpenOnboardModal={onOpenOnboardModal} />
        <main className="p-3 p-md-4 flex-grow-1">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DeveloperLayout;
