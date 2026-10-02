import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSpotlightGuide } from '../context/SpotlightGuideContext';
import { MapPin, X, Sparkles } from 'lucide-react';

const SPOTLIGHT_DURATION = 2000; // 2 seconds visible
const FADE_DURATION = 500;

const SpotlightOverlay = () => {
  const { spotlight, dismissSpotlight } = useSpotlightGuide();
  const [targetRect, setTargetRect] = useState(null);
  const [phase, setPhase] = useState('idle'); // idle | entering | visible | exiting
  const [tooltipSide, setTooltipSide] = useState('bottom'); // bottom | top
  const timerRef = useRef(null);
  const pollRef = useRef(null);
  const targetElRef = useRef(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (pollRef.current) clearTimeout(pollRef.current);
    timerRef.current = null;
    pollRef.current = null;
    // Remove highlight class from target element
    if (targetElRef.current) {
      targetElRef.current.classList.remove('spotlight-target-active');
      targetElRef.current = null;
    }
  }, []);

  const handleDismiss = useCallback(() => {
    setPhase('exiting');
    timerRef.current = setTimeout(() => {
      cleanup();
      dismissSpotlight();
      setPhase('idle');
      setTargetRect(null);
    }, FADE_DURATION);
  }, [dismissSpotlight, cleanup]);

  useEffect(() => {
    if (!spotlight) {
      cleanup();
      setPhase('idle');
      setTargetRect(null);
      return;
    }

    // Poll for the target element (page may still be rendering after navigation)
    let attempts = 0;
    const maxAttempts = 30; // 30 × 100ms = 3 seconds max wait

    const findTarget = () => {
      const el = document.querySelector(`[data-spotlight-id="${spotlight.spotlightId}"]`);
      if (el) {
        targetElRef.current = el;

        // Scroll element into view smoothly
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Add highlight class to the target element
        el.classList.add('spotlight-target-active');

        // Wait for scroll to settle, then measure position
        timerRef.current = setTimeout(() => {
          const rect = el.getBoundingClientRect();
          setTargetRect(rect);

          // Decide tooltip position: if target is in top half, show below; otherwise above
          const viewportMid = window.innerHeight / 2;
          setTooltipSide(rect.top < viewportMid ? 'bottom' : 'top');

          // Start enter animation
          setPhase('entering');

          // Transition to visible
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              setPhase('visible');
            });
          });

          // Auto-dismiss after duration
          timerRef.current = setTimeout(() => {
            handleDismiss();
          }, SPOTLIGHT_DURATION);
        }, 400);
      } else if (attempts < maxAttempts) {
        attempts++;
        pollRef.current = setTimeout(findTarget, 100);
      }
    };

    // Start polling after a short navigation delay
    pollRef.current = setTimeout(findTarget, 250);

    return () => cleanup();
  }, [spotlight?.triggeredAt]);

  // Update rect on scroll/resize
  useEffect(() => {
    if (phase !== 'visible' && phase !== 'entering') return;

    const updateRect = () => {
      if (targetElRef.current) {
        const rect = targetElRef.current.getBoundingClientRect();
        setTargetRect(rect);
      }
    };

    window.addEventListener('scroll', updateRect, true);
    window.addEventListener('resize', updateRect);
    return () => {
      window.removeEventListener('scroll', updateRect, true);
      window.removeEventListener('resize', updateRect);
    };
  }, [phase]);

  if (!spotlight || !targetRect || phase === 'idle') return null;

  const padding = 8;
  const ringLeft = targetRect.left - padding;
  const ringTop = targetRect.top - padding;
  const ringWidth = targetRect.width + padding * 2;
  const ringHeight = targetRect.height + padding * 2;

  // Tooltip card position
  const tooltipWidth = 340;
  let tooltipLeft = ringLeft + ringWidth / 2 - tooltipWidth / 2;
  // Keep tooltip within viewport
  tooltipLeft = Math.max(12, Math.min(tooltipLeft, window.innerWidth - tooltipWidth - 12));
  const tooltipTop = tooltipSide === 'bottom'
    ? ringTop + ringHeight + 16
    : ringTop - 16; // will use transform for top positioning

  const opacity = phase === 'entering' ? 0 : phase === 'exiting' ? 0 : 1;

  return (
    <>
      {/* Inject keyframe animations */}
      <style>{`
        @keyframes spotlightPulseRing {
          0% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.45), 0 0 20px 2px rgba(37, 99, 235, 0.15); }
          50% { box-shadow: 0 0 0 8px rgba(37, 99, 235, 0), 0 0 30px 6px rgba(37, 99, 235, 0.2); }
          100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0), 0 0 20px 2px rgba(37, 99, 235, 0.15); }
        }
        @keyframes spotlightBounceArrow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(6px); }
        }
        @keyframes spotlightShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .spotlight-target-active {
          position: relative;
          z-index: 10001 !important;
        }
      `}</style>

      {/* Semi-transparent backdrop */}
      <div
        onClick={handleDismiss}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10000,
          backgroundColor: `rgba(15, 23, 42, ${phase === 'visible' ? 0.35 : 0})`,
          transition: `background-color ${FADE_DURATION}ms ease`,
          cursor: 'pointer'
        }}
      />

      {/* Pulsing ring around target element */}
      <div
        style={{
          position: 'fixed',
          left: ringLeft,
          top: ringTop,
          width: ringWidth,
          height: ringHeight,
          borderRadius: '12px',
          border: '2.5px solid rgba(37, 99, 235, 0.7)',
          animation: phase === 'visible' ? 'spotlightPulseRing 1.5s ease-in-out infinite' : 'none',
          zIndex: 10002,
          pointerEvents: 'none',
          opacity,
          transition: `opacity ${FADE_DURATION}ms ease`
        }}
      />

      {/* Directional arrow */}
      <div
        style={{
          position: 'fixed',
          left: ringLeft + ringWidth / 2 - 12,
          top: tooltipSide === 'bottom' ? ringTop + ringHeight + 2 : ringTop - 26,
          zIndex: 10003,
          pointerEvents: 'none',
          opacity,
          transition: `opacity ${FADE_DURATION}ms ease`,
          animation: phase === 'visible' ? 'spotlightBounceArrow 1s ease-in-out infinite' : 'none'
        }}
      >
        <svg width="24" height="14" viewBox="0 0 24 14" fill="none">
          {tooltipSide === 'bottom' ? (
            <path d="M12 0L24 14H0L12 0Z" fill="white" />
          ) : (
            <path d="M12 14L0 0H24L12 14Z" fill="white" />
          )}
        </svg>
      </div>

      {/* Guide tooltip card */}
      <div
        onClick={handleDismiss}
        style={{
          position: 'fixed',
          left: tooltipLeft,
          top: tooltipSide === 'bottom' ? tooltipTop : 'auto',
          bottom: tooltipSide === 'top' ? (window.innerHeight - ringTop + 16) : 'auto',
          width: tooltipWidth,
          zIndex: 10003,
          opacity,
          transform: `translateY(${phase === 'entering' ? (tooltipSide === 'bottom' ? '8px' : '-8px') : '0'})`,
          transition: `opacity ${FADE_DURATION}ms ease, transform ${FADE_DURATION}ms ease`,
          cursor: 'pointer'
        }}
      >
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            boxShadow: '0 20px 50px -12px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(226, 232, 240, 0.8)',
            overflow: 'hidden'
          }}
        >
          {/* Shimmer header bar */}
          <div
            style={{
              height: '4px',
              background: 'linear-gradient(90deg, #2563EB 0%, #7C3AED 25%, #EC4899 50%, #2563EB 75%, #7C3AED 100%)',
              backgroundSize: '200% 100%',
              animation: 'spotlightShimmer 2s linear infinite'
            }}
          />

          <div style={{ padding: '14px 16px' }}>
            {/* Header with icon */}
            <div className="d-flex align-items-center gap-2 mb-2">
              <div
                className="d-flex align-items-center justify-content-center flex-shrink-0"
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                  boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)'
                }}
              >
                <Sparkles size={14} color="#FFFFFF" strokeWidth={2.4} />
              </div>
              <div className="flex-grow-1 overflow-hidden">
                <div className="fw-bold text-dark text-truncate" style={{ fontSize: '0.88rem', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                  {spotlight.title}
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
                className="btn p-0 border-0 d-flex align-items-center justify-content-center flex-shrink-0"
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '6px',
                  backgroundColor: '#F1F5F9',
                  color: '#94A3B8'
                }}
              >
                <X size={12} />
              </button>
            </div>

            {/* Description */}
            <p
              className="mb-2 text-secondary"
              style={{ fontSize: '0.75rem', lineHeight: 1.5, margin: 0 }}
            >
              {spotlight.description}
            </p>

            {/* Direction indicator */}
            <div className="d-flex align-items-center gap-1.5" style={{ marginTop: '6px' }}>
              <MapPin size={11} className="text-primary" />
              <span className="text-muted" style={{ fontSize: '0.65rem', fontWeight: 600 }}>
                Feature highlighted above • Click anywhere to dismiss
              </span>
            </div>

            {/* Auto-dismiss progress bar */}
            <div
              style={{
                marginTop: '8px',
                height: '2px',
                borderRadius: '1px',
                backgroundColor: '#F1F5F9',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: phase === 'visible' ? '0%' : '100%',
                  backgroundColor: '#2563EB',
                  borderRadius: '1px',
                  transition: phase === 'visible' ? `width ${SPOTLIGHT_DURATION}ms linear` : 'none'
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SpotlightOverlay;
