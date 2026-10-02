import React, { useState, useEffect } from 'react';
import { getMediaUrl } from '../utils/mediaUtils';

/**
 * Reusable full-screen lightbox / viewer modal for guest identity documents and photos.
 * Supports image zoom (in/out/reset), 90-degree rotations, PDF embedding, and external downloads.
 */
const DocumentViewerModal = ({ isOpen, onClose, title = 'Document Full View', fileUrl, fileType }) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setRotation(0);
      setImgError(false);

      const handleKeyDown = (e) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, fileUrl, onClose]);

  if (!isOpen || !fileUrl) return null;

  const fullUrl = getMediaUrl(fileUrl);
  const cleanUrl = fullUrl.split('?')[0].toLowerCase();
  const isPdf = fileType === 'pdf' || cleanUrl.endsWith('.pdf');
  const isImage = !isPdf && !imgError;

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3.5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => {
    setZoom(1);
    setRotation(0);
  };
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      style={{
        backgroundColor: 'rgba(15, 23, 42, 0.88)',
        backdropFilter: 'blur(6px)',
        zIndex: 1070,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-dialog modal-dialog-centered modal-xl" style={{ maxWidth: '94vw', height: '94vh', margin: '3vh auto' }}>
        <div
          className="modal-content border-0 shadow-2xl rounded-4 overflow-hidden h-100 d-flex flex-column"
          style={{ backgroundColor: '#0f172a' }}
        >
          {/* Header Bar */}
          <div
            className="modal-header border-bottom border-secondary border-opacity-25 py-2.5 px-4 d-flex justify-content-between align-items-center text-white"
            style={{ backgroundColor: '#1e293b' }}
          >
            <div className="d-flex align-items-center gap-2 overflow-hidden">
              <i className="bi bi-file-earmark-medical text-primary fs-5"></i>
              <div className="text-truncate">
                <h6 className="m-0 fw-bold text-white text-truncate" style={{ fontSize: '1.05rem' }}>
                  {title}
                </h6>
                <span className="small text-muted text-truncate d-block" style={{ fontSize: '0.75rem' }}>
                  {fullUrl.split('/').pop()}
                </span>
              </div>
            </div>

            {/* Action Controls Toolbar */}
            <div className="d-flex align-items-center gap-2">
              {isImage && (
                <div className="btn-group btn-group-sm bg-dark rounded-3 p-1 border border-secondary border-opacity-25">
                  <button
                    type="button"
                    className="btn btn-dark text-light border-0 px-2.5 py-1"
                    onClick={handleZoomIn}
                    title="Zoom In"
                  >
                    <i className="bi bi-zoom-in"></i>
                  </button>
                  <button
                    type="button"
                    className="btn btn-dark text-light border-0 px-2.5 py-1"
                    onClick={handleZoomOut}
                    title="Zoom Out"
                  >
                    <i className="bi bi-zoom-out"></i>
                  </button>
                  <button
                    type="button"
                    className="btn btn-dark text-light border-0 px-2.5 py-1"
                    onClick={handleResetZoom}
                    title="Reset Zoom & Rotation"
                  >
                    <i className="bi bi-aspect-ratio"></i>
                  </button>
                  <button
                    type="button"
                    className="btn btn-dark text-light border-0 px-2.5 py-1"
                    onClick={handleRotate}
                    title="Rotate 90° Clockwise"
                  >
                    <i className="bi bi-arrow-clockwise"></i>
                  </button>
                </div>
              )}

              <a
                href={fullUrl}
                target="_blank"
                rel="noreferrer"
                download
                className="btn btn-sm btn-outline-light d-flex align-items-center gap-1.5 px-3 py-1.5 rounded-3 fw-semibold"
                title="Open in new window / Download"
              >
                <i className="bi bi-box-arrow-up-right"></i>
                <span className="d-none d-sm-inline">Open Original</span>
              </a>

              <button
                type="button"
                className="btn btn-sm btn-close btn-close-white ms-2"
                onClick={onClose}
                aria-label="Close"
              ></button>
            </div>
          </div>

          {/* Modal Body / Viewport */}
          <div
            className="modal-body p-0 flex-grow-1 overflow-auto d-flex align-items-center justify-content-center position-relative"
            style={{
              backgroundColor: '#0b0f19',
              backgroundImage: 'radial-gradient(#1e293b 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          >
            {isPdf ? (
              <iframe
                src={fullUrl}
                title={title}
                className="w-100 h-100 border-0"
                style={{ minHeight: '80vh' }}
              />
            ) : isImage ? (
              <div
                className="d-flex align-items-center justify-content-center p-3"
                style={{
                  minWidth: '100%',
                  minHeight: '100%',
                  transition: 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)',
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transformOrigin: 'center center',
                }}
              >
                <img
                  src={fullUrl}
                  alt={title}
                  onError={() => setImgError(true)}
                  className="img-fluid rounded shadow-lg"
                  style={{
                    maxHeight: '82vh',
                    maxWidth: '90vw',
                    objectFit: 'contain',
                    userSelect: 'none',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
                  }}
                />
              </div>
            ) : (
              <div className="text-center text-white py-5">
                <i className="bi bi-file-earmark-text text-secondary display-1 d-block mb-3"></i>
                <h5 className="fw-bold mb-2">Preview Not Directly Available</h5>
                <p className="text-muted small mb-4">This document cannot be previewed inline as an image.</p>
                <a
                  href={fullUrl}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="btn btn-primary fw-bold px-4 py-2 rounded-3"
                >
                  <i className="bi bi-download me-2"></i> Download / View File
                </a>
              </div>
            )}
          </div>

          {/* Footer Bar */}
          <div
            className="modal-footer border-top border-secondary border-opacity-25 py-2 px-4 d-flex justify-content-between align-items-center text-muted small"
            style={{ backgroundColor: '#1e293b', fontSize: '0.8rem' }}
          >
            <div className="d-flex align-items-center gap-3">
              {isImage && (
                <span>
                  Scale: <strong className="text-white">{Math.round(zoom * 100)}%</strong>
                  {rotation !== 0 && (
                    <span className="ms-2">
                      Rotation: <strong className="text-white">{rotation}°</strong>
                    </span>
                  )}
                </span>
              )}
              <span>Press <kbd className="bg-dark text-light border border-secondary px-1 py-0.5 rounded">ESC</kbd> to close</span>
            </div>
            <button type="button" className="btn btn-sm btn-secondary fw-semibold px-3" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewerModal;
