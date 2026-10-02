import React, { createContext, useContext, useState, useCallback } from 'react';

const SpotlightGuideContext = createContext(null);

export const useSpotlightGuide = () => useContext(SpotlightGuideContext);

export const SpotlightGuideProvider = ({ children }) => {
  const [spotlight, setSpotlight] = useState(null);

  const triggerSpotlight = useCallback((spotlightId, title, description) => {
    setSpotlight({ spotlightId, title, description, triggeredAt: Date.now() });
  }, []);

  const dismissSpotlight = useCallback(() => {
    setSpotlight(null);
  }, []);

  return (
    <SpotlightGuideContext.Provider value={{ spotlight, triggerSpotlight, dismissSpotlight }}>
      {children}
    </SpotlightGuideContext.Provider>
  );
};
