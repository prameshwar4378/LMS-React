import React, { useRef, useEffect } from 'react';
import DeveloperSidebar from '../components/DeveloperSidebar';
import DeveloperNavbar from '../components/DeveloperNavbar';

const DeveloperLayout = ({ children, activeTab, onSelectTab, onOpenOnboardModal }) => {
  const contentRef = useRef(null);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
      contentRef.current.scrollLeft = 0;
    }
  }, [activeTab]);

  return (
    <div className="lms-wrapper" style={{ backgroundColor: '#F8FAFC' }}>
      <DeveloperSidebar activeTab={activeTab} onSelectTab={onSelectTab} />
      <div className="lms-content" ref={contentRef}>
        <DeveloperNavbar activeTab={activeTab} onSelectTab={onSelectTab} onOpenOnboardModal={onOpenOnboardModal} />
        <main className="p-3 p-md-4 flex-grow-1">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DeveloperLayout;
