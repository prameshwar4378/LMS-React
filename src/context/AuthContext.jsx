import React, { createContext, useState, useContext, useEffect } from 'react';
import { loginApi, getProfileApi } from '../api/authApi';
import { getHotelBranchesApi } from '../api/settingsApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('access_token'));
  const [loading, setLoading] = useState(false);

  // Multi-Branch Selection State for Hotel Owners
  const [branches, setBranches] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(() => {
    try {
      const saved = localStorage.getItem('lms_selected_property');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (token) {
      getProfileApi()
        .then((data) => {
          setUser(data);
          localStorage.setItem('user', JSON.stringify(data));
        })
        .catch((err) => {
          if (err.response?.status === 401) logout();
        });
    }
  }, [token]);

  useEffect(() => {
    if (token && user) {
      if (['HOTEL_OWNER', 'SUPER_ADMIN', 'SUPERUSER'].includes(user.role) || user.is_superuser) {
        getHotelBranchesApi()
          .then((data) => {
            const list = Array.isArray(data) ? data : [];
            setBranches(list);
            if (list.length > 0) {
              const savedId = localStorage.getItem('lms_selected_property_id');
              const matched = list.find((b) => String(b.id) === String(savedId));
              const active = matched || list.find((b) => b.is_primary) || list[0];
              setSelectedProperty(active);
              localStorage.setItem('lms_selected_property_id', active.id);
              localStorage.setItem('lms_selected_property', JSON.stringify(active));
            }
          })
          .catch((err) => console.error('Failed to load branches:', err));
      } else if (user.property || user.property_name) {
        const propObj = {
          id: user.property || user.property_id,
          name: user.property_name,
          property_code: user.property_code,
          code: user.property_code,
          is_primary: true,
          is_branch: Boolean(user.is_branch),
          operation_mode: user.operation_mode || 'SHIFT_WISE',
          is_shift_wise: user.is_shift_wise !== false
        };
        setSelectedProperty(propObj);
        setBranches([propObj]);
        localStorage.setItem('lms_selected_property_id', propObj.id);
        localStorage.setItem('lms_selected_property', JSON.stringify(propObj));
      }
    }
  }, [token, user?.id, user?.role]);

  const switchProperty = (branch) => {
    if (!branch) return;
    setSelectedProperty(branch);
    localStorage.setItem('lms_selected_property_id', branch.id);
    localStorage.setItem('lms_selected_property', JSON.stringify(branch));
    window.location.reload();
  };

  const login = async (username, password) => {
    setLoading(true);
    try {
      const data = await loginApi(username, password);
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      localStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.access);
      setUser(data.user);
      setLoading(false);
      return data.user;
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('lms_selected_property_id');
    localStorage.removeItem('lms_selected_property');
    setToken(null);
    setUser(null);
    setSelectedProperty(null);
    setBranches([]);
  };

  const hasRole = (allowedRoles) => {
    if (!user) return false;
    if (user.is_superuser) return true;
    if (typeof allowedRoles === 'string') return user.role === allowedRoles;
    return allowedRoles.includes(user.role);
  };

  const isSuperUser = Boolean(
    user && (user.is_superuser || user.role === 'SUPERUSER' || (user.role === 'SUPER_ADMIN' && !user.property_code && !user.property))
  );

  const isHotelOwner = Boolean(
    user && !isSuperUser && (user.role === 'HOTEL_OWNER' || user.role === 'SUPER_ADMIN')
  );

  const isManager = Boolean(
    user && !isSuperUser && (user.role === 'MANAGER' || isHotelOwner)
  );

  const isReceptionist = Boolean(
    user && !isSuperUser && user.role === 'RECEPTIONIST'
  );

  const isAdmin = Boolean(
    user && (user.is_superuser || user.role === 'SUPERUSER' || user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'HOTEL_OWNER' || user.role === 'MANAGER')
  );

  const can = (permission) => {
    if (!user) return false;
    if (isSuperUser || isHotelOwner) return true;
    return true;
  };

  const hasPermission = (module, action) => {
    if (!user) return false;
    if (user.is_superuser || ['HOTEL_OWNER', 'SUPER_ADMIN', 'SUPERUSER'].includes(user.role)) return true;
    const mod = user.permissions?.[module];
    if (!mod) return false;
    return Boolean(mod[action]);
  };

  const getPermissionLimit = (module, key, fallback = 0) => {
    if (!user) return fallback;
    if (user.is_superuser || ['HOTEL_OWNER', 'SUPER_ADMIN', 'SUPERUSER'].includes(user.role)) return Infinity;
    const val = user.permissions?.[module]?.[key];
    return typeof val === 'number' ? val : fallback;
  };


  const checkSubExpired = (sub) => {
    if (!sub) return false;
    if (sub.valid_until) {
      const target = new Date(sub.valid_until);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      target.setHours(0, 0, 0, 0);
      return target < today;
    }
    return Boolean(sub.is_expired);
  };

  const isSubscriptionExpired = Boolean(
    user && !isSuperUser && checkSubExpired(user.subscription)
  );

  const isPropertySuspended = Boolean(
    user && !isSuperUser && (user.subscription?.is_suspended || user.subscription?.is_active === false)
  );

  const daysRemaining = user?.subscription?.days_remaining ?? null;
  const subscription = user?.subscription || null;

  const isSubscriptionNearExpiry = Boolean(
    user && !isSuperUser && !isSubscriptionExpired && !isPropertySuspended &&
    (user.subscription?.is_near_expiry || (typeof daysRemaining === 'number' && daysRemaining <= 15 && daysRemaining > 0))
  );

  const urgencyLevel = (() => {
    if (isSubscriptionExpired) return 'EXPIRED';
    if (!isSubscriptionNearExpiry || daysRemaining === null) return 'NORMAL';
    if (daysRemaining <= 5) return 'CRITICAL';
    if (daysRemaining <= 10) return 'HIGH';
    if (daysRemaining <= 15) return 'MODERATE';
    return user?.subscription?.urgency_level || 'NORMAL';
  })();

  const refreshProfile = async () => {
    try {
      const data = await getProfileApi();
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
      return data;
    } catch (err) {
      console.error('Failed to refresh user profile:', err);
      throw err;
    }
  };

  const operationMode = selectedProperty?.operation_mode || user?.operation_mode || 'SHIFT_WISE';
  const isShiftWise = operationMode !== 'SINGLE_OWNER' && user?.operation_mode !== 'SINGLE_OWNER';
  const isSingleOwner = !isShiftWise;

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      logout,
      hasRole,
      isSuperUser,
      isHotelOwner,
      isManager,
      isReceptionist,
      isAdmin,
      can,
      hasPermission,
      getPermissionLimit,
      subscription,
      isSubscriptionExpired,
      isPropertySuspended,
      isSubscriptionNearExpiry,
      daysRemaining,
      urgencyLevel,
      refreshProfile,
      branches,
      selectedProperty,
      switchProperty,
      operationMode,
      isShiftWise,
      isSingleOwner,
      loading
    }}>

      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
