import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Server,
  Building2,
  ShieldCheck,
  Activity,
  Layers,
  ChevronLeft,
  ChevronRight,
  LogOut,
  BarChart3,
  Globe,
  Sparkles,
  Zap,
  CheckCircle2
} from 'lucide-react';

const DeveloperSidebar = ({ activeTab, onSelectTab }) => {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapse = () => setCollapsed(!collapsed);

  const navItems = [
    {
      id: 'overview',
      label: 'Platform Overview',
      desc: 'Telemetry & SaaS Metrics',
      icon: BarChart3,
      badge: 'Live',
      color: '#38BDF8',
      bg: 'rgba(56, 189, 248, 0.14)',
      border: 'rgba(56, 189, 248, 0.35)',
      glow: '0 6px 20px rgba(56, 189, 248, 0.45)',
      gradient: 'linear-gradient(135deg, #0284C7 0%, #38BDF8 100%)'
    },
    {
      id: 'properties',
      label: 'Hotels Directory',
      desc: 'Properties & Limits',
      icon: Building2,
      badge: 'Hotels',
      color: '#34D399',
      bg: 'rgba(52, 211, 153, 0.14)',
      border: 'rgba(52, 211, 153, 0.35)',
      glow: '0 6px 20px rgba(52, 211, 153, 0.45)',
      gradient: 'linear-gradient(135deg, #059669 0%, #34D399 100%)'
    },
    {
      id: 'subscriptions',
      label: 'Subscription Plans',
      desc: 'Tiers & Pricing Matrix',
      icon: Layers,
      badge: 'Tiers',
      color: '#A78BFA',
      bg: 'rgba(167, 139, 250, 0.14)',
      border: 'rgba(167, 139, 250, 0.35)',
      glow: '0 6px 20px rgba(167, 139, 250, 0.45)',
      gradient: 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)'
    },
    {
      id: 'health',
      label: 'System Health',
      desc: 'Infrastructure & DB',
      icon: Activity,
      badge: 'Optimal',
      color: '#FB7185',
      bg: 'rgba(251, 113, 133, 0.14)',
      border: 'rgba(251, 113, 133, 0.35)',
      glow: '0 6px 20px rgba(251, 113, 133, 0.45)',
      gradient: 'linear-gradient(135deg, #E11D48 0%, #FB7185 100%)'
    },
  ];

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {!collapsed && (
        <div
          className="d-lg-none position-fixed top-0 start-0 w-100 h-100"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 1045
          }}
          onClick={toggleCollapse}
        />
      )}

      <aside
        className={`lms-sidebar-dark no-print ${collapsed ? 'lms-sidebar-collapsed' : ''}`}
        style={{
          backgroundColor: '#070D1E',
          backgroundImage: 'radial-gradient(ellipse 120% 60% at 50% -20%, rgba(14, 165, 233, 0.12), transparent 70%), radial-gradient(ellipse 80% 50% at 50% 110%, rgba(99, 102, 241, 0.08), transparent 70%)',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '4px 0 24px rgba(0, 0, 0, 0.35)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 1050
        }}
      >
        {/* Brand Header */}
        <div
          className="d-flex align-items-center justify-content-between px-3.5 py-3"
          style={{
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            minHeight: '74px',
            background: 'rgba(255, 255, 255, 0.02)'
          }}
        >
          <div className="d-flex align-items-center gap-3 overflow-hidden text-decoration-none">
            {/* Logo Badge */}
            <div
              className="d-flex align-items-center justify-content-center flex-shrink-0 text-white shadow-sm"
              style={{
                width: '42px',
                height: '42px',
                minWidth: '42px',
                borderRadius: '13px',
                background: 'linear-gradient(135deg, #0284C7 0%, #2563EB 60%, #4F46E5 100%)',
                boxShadow: '0 4px 16px rgba(2, 132, 199, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.4)',
                border: '1px solid rgba(56, 189, 248, 0.4)'
              }}
            >
              <Server size={21} className="text-white" />
            </div>

            {!collapsed && (
              <div className="overflow-hidden">
                <div
                  className="fw-bold text-white text-truncate lh-1"
                  style={{ fontSize: '0.95rem', letterSpacing: '-0.02em' }}
                >
                  LMS SaaS Engine
                </div>
                <div className="mt-1.5 d-flex align-items-center gap-1.5">
                  <span
                    className="badge rounded-pill extra-small px-2 py-0.5 font-monospace fw-semibold d-inline-flex align-items-center gap-1"
                    style={{
                      backgroundColor: 'rgba(56, 189, 248, 0.15)',
                      color: '#38BDF8',
                      border: '1px solid rgba(56, 189, 248, 0.28)',
                      fontSize: '0.675rem'
                    }}
                  >
                    <span className="rounded-circle" style={{ width: '5px', height: '5px', backgroundColor: '#38BDF8', boxShadow: '0 0 6px #38BDF8' }} />
                    v2.4.0 LTS
                  </span>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={toggleCollapse}
            className="btn btn-sm border-0 d-flex align-items-center justify-content-center p-0 flex-shrink-0 transition-all"
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '9px',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              color: '#94A3B8',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-grow-1 overflow-y-auto py-3 px-0" style={{ scrollbarWidth: 'none' }}>
          {!collapsed && (
            <div className="px-3.5 pb-2.5 mb-1.5">
              <div
                className="d-flex align-items-center justify-content-between text-uppercase"
                style={{
                  fontSize: '0.675rem',
                  letterSpacing: '0.1em',
                  fontWeight: 700,
                  color: '#64748B'
                }}
              >
                <span>Platform Governance</span>
                <span
                  className="badge rounded-pill"
                  style={{
                    fontSize: '0.6rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.07)',
                    color: '#94A3B8',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    padding: '2px 7px'
                  }}
                >
                  4 Engines
                </span>
              </div>
              <div
                style={{
                  height: '1px',
                  background: 'linear-gradient(90deg, rgba(56, 189, 248, 0.35) 0%, rgba(255, 255, 255, 0.06) 60%, transparent 100%)',
                  marginTop: '8px'
                }}
              />
            </div>
          )}

          <div className="d-flex flex-column" style={{ padding: collapsed ? '0 6px' : '0 10px' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab && onSelectTab(item.id)}
                  className="w-100 text-start border-0 transition-all d-flex align-items-center position-relative"
                  style={{
                    padding: collapsed ? '10px 0' : '9px 12px',
                    justifyContent: collapsed ? 'center' : 'space-between',
                    borderRadius: '14px',
                    backgroundColor: isActive ? 'rgba(255, 255, 255, 0.09)' : 'transparent',
                    border: isActive ? `1px solid ${item.border}` : '1px solid transparent',
                    boxShadow: isActive ? `0 6px 20px -2px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.15)` : 'none',
                    margin: '3px 0',
                    cursor: 'pointer',
                    outline: 'none',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.transform = collapsed ? 'none' : 'translateX(3px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.borderColor = 'transparent';
                      e.currentTarget.style.transform = 'none';
                    }
                  }}
                  title={collapsed ? item.label : undefined}
                >
                  {/* Left Active Accent Pill Bar */}
                  {isActive && !collapsed && (
                    <span
                      className="position-absolute"
                      style={{
                        left: '-5px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '4px',
                        height: '26px',
                        borderRadius: '99px',
                        backgroundColor: item.color,
                        boxShadow: `0 0 12px ${item.color}, 0 0 2px ${item.color}`
                      }}
                    />
                  )}

                  <div className="d-flex align-items-center overflow-hidden" style={{ gap: '14px' }}>
                    {/* Colorful Icon Badge Box */}
                    <div
                      className="d-flex align-items-center justify-content-center flex-shrink-0 transition-all shadow-sm"
                      style={{
                        width: '40px',
                        height: '40px',
                        minWidth: '40px',
                        borderRadius: '12px',
                        background: isActive ? item.gradient : item.bg,
                        color: isActive ? '#FFFFFF' : item.color,
                        border: `1px solid ${isActive ? 'rgba(255, 255, 255, 0.35)' : item.border}`,
                        boxShadow: isActive ? item.glow : `0 2px 8px ${item.bg}`
                      }}
                    >
                      <Icon size={20} strokeWidth={isActive ? 2.4 : 2.1} />
                    </div>

                    {/* Label & Subtitle Description */}
                    {!collapsed && (
                      <div className="overflow-hidden">
                        <div
                          className="fw-bold text-truncate transition-all lh-sm"
                          style={{
                            fontSize: '0.885rem',
                            color: isActive ? '#FFFFFF' : '#E2E8F0',
                            letterSpacing: '-0.01em'
                          }}
                        >
                          {item.label}
                        </div>
                        <div
                          className="extra-small text-truncate"
                          style={{
                            fontSize: '0.715rem',
                            color: isActive ? 'rgba(255, 255, 255, 0.8)' : '#94A3B8',
                            marginTop: '2px'
                          }}
                        >
                          {item.desc}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Badges / Status Indicators */}
                  {!collapsed && (
                    <div className="d-flex align-items-center gap-1.5 flex-shrink-0 ms-2">
                      {item.id === 'overview' ? (
                        <span
                          className="badge rounded-pill extra-small px-2 py-0.5 d-inline-flex align-items-center gap-1 shadow-2xs"
                          style={{
                            backgroundColor: 'rgba(16, 185, 129, 0.18)',
                            color: '#34D399',
                            border: '1px solid rgba(52, 211, 153, 0.35)',
                            fontSize: '0.675rem',
                            fontWeight: 700
                          }}
                        >
                          <span
                            className="rounded-circle bg-success"
                            style={{ width: '5px', height: '5px', boxShadow: '0 0 6px #10B981' }}
                          />
                          {item.badge}
                        </span>
                      ) : isActive ? (
                        <div
                          className="rounded-circle"
                          style={{
                            width: '7px',
                            height: '7px',
                            backgroundColor: item.color,
                            boxShadow: `0 0 10px ${item.color}`
                          }}
                        />
                      ) : (
                        <span
                          className="extra-small text-muted font-monospace opacity-50"
                          style={{ fontSize: '0.65rem' }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Bottom Superuser Profile Card */}
        <div
          className="border-top"
          style={{
            padding: collapsed ? '14px 0' : '16px 18px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: 'rgba(0, 0, 0, 0.35)',
            background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.5) 100%)'
          }}
        >
          <div className={`d-flex align-items-center ${collapsed ? 'justify-content-center' : 'justify-content-between'}`}>
            <div className="d-flex align-items-center gap-2.5 overflow-hidden">
              <div
                className="rounded-circle text-white d-flex align-items-center justify-content-center fw-bold flex-shrink-0 shadow-sm"
                style={{
                  width: '38px',
                  height: '38px',
                  fontSize: '0.875rem',
                  background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                  boxShadow: '0 2px 10px rgba(2, 132, 199, 0.4)',
                  border: '1px solid rgba(56, 189, 248, 0.3)'
                }}
                title={collapsed ? (user?.full_name || user?.username || 'Admin') : undefined}
              >
                <ShieldCheck size={19} className="text-white" />
              </div>
              {!collapsed && (
                <div className="overflow-hidden">
                  <div className="text-white fw-bold text-truncate lh-sm" style={{ fontSize: '0.85rem' }}>
                    {user?.full_name || user?.username || 'Platform Developer'}
                  </div>
                  <div className="mt-0.5 d-flex align-items-center gap-1" style={{ fontSize: '0.7rem', color: '#38BDF8', fontWeight: 600 }}>
                    <span className="d-inline-block rounded-circle bg-success" style={{ width: '6px', height: '6px', boxShadow: '0 0 6px #10B981' }}></span>
                    Superuser Host
                  </div>
                </div>
              )}
            </div>
            {!collapsed && (
              <button
                type="button"
                onClick={logout}
                className="btn btn-sm border-0 d-flex align-items-center justify-content-center rounded-3 p-1.5 ms-1 transition-all"
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  color: '#F87171',
                  border: '1px solid rgba(239, 68, 68, 0.2)'
                }}
                title="Sign Out Developer Session"
              >
                <LogOut size={15} />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default DeveloperSidebar;
