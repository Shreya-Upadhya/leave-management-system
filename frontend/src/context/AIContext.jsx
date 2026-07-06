// frontend/src/context/AIContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AIContext = createContext();

export const useAI = () => useContext(AIContext);

export const AIProvider = ({ children }) => {
  const [aiStatus, setAiStatus] = useState({
    isActive: false,
    source: 'checking',
    geminiKey: false,
    keyPrefix: 'none',
    lastChecked: null,
    error: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAIStatus();
  }, []);

  const checkAIStatus = async () => {
    setLoading(true);
    
    try {
      // First check localStorage
      const storedStatus = localStorage.getItem('aiStatus');
      if (storedStatus) {
        const parsed = JSON.parse(storedStatus);
        // Check if stored status is recent (within last 5 minutes)
        if (parsed.lastChecked && Date.now() - parsed.lastChecked < 300000) {
          console.log('📦 Using cached AI status from localStorage:', parsed);
          setAiStatus(parsed);
          setLoading(false);
          return;
        }
      }

      console.log('🔍 Checking AI status from backend...');
      
      // ✅ NO authentication required for health check
      const response = await axios.get('http://localhost:5000/api/ai/health');
      
      console.log('📊 AI Health Response:', response.data);
      
      const status = {
        isActive: response.data.isActive || false,
        source: response.data.source || 'unknown',
        geminiKey: response.data.geminiKey || false,
        keyPrefix: response.data.keyPrefix || 'none',
        lastChecked: Date.now(),
        error: null
      };

      // ✅ Store in localStorage
      localStorage.setItem('aiStatus', JSON.stringify(status));
      console.log('💾 AI status saved to localStorage:', status);
      
      setAiStatus(status);

    } catch (error) {
      console.error('❌ Failed to check AI status:', error);
      console.error('Error details:', error.response?.data || error.message);
      
      // If error, check if we have cached status
      const cachedStatus = localStorage.getItem('aiStatus');
      if (cachedStatus) {
        const parsed = JSON.parse(cachedStatus);
        setAiStatus({
          ...parsed,
          error: 'Using cached status',
          lastChecked: Date.now()
        });
      } else {
        const status = {
          isActive: false,
          source: 'error',
          geminiKey: false,
          keyPrefix: 'none',
          lastChecked: Date.now(),
          error: error.response?.data?.error || error.message || 'Failed to check AI status'
        };
        localStorage.setItem('aiStatus', JSON.stringify(status));
        setAiStatus(status);
      }
    }
    setLoading(false);
  };

  const refreshAIStatus = () => {
    // Force refresh by removing cached status
    localStorage.removeItem('aiStatus');
    checkAIStatus();
  };

  const value = {
    aiStatus,
    loading,
    checkAIStatus,
    refreshAIStatus,
    isAIActive: aiStatus.isActive && aiStatus.source === 'gemini-ai'
  };

  return (
    <AIContext.Provider value={value}>
      {children}
    </AIContext.Provider>
  );
};