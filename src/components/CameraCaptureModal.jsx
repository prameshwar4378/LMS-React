import React, { useRef, useState, useEffect } from 'react';

const CameraCaptureModal = ({ show, onClose, onCapture }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [cameraError, setCameraError] = useState('');

  useEffect(() => {
    if (show) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [show]);

  const startCamera = async () => {
    setCameraError('');
    setCapturedImage(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Camera error:', err);
      setCameraError('Unable to access webcam. Please check permissions or upload file manually.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedImage(dataUrl);
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  const handleSave = () => {
    if (!capturedImage) return;
    // Convert dataUrl to Blob file
    fetch(capturedImage)
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], `captured_photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
        onCapture(file, capturedImage);
        stopCamera();
        onClose();
      });
  };

  if (!show) return null;

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} tabIndex="-1">
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content border-0 shadow-lg">
          <div className="modal-header bg-dark text-white">
            <h5 className="modal-title">
              <i className="bi bi-camera me-2"></i>Capture Guest Photo
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={() => { stopCamera(); onClose(); }}></button>
          </div>
          <div className="modal-body text-center p-4">
            {cameraError ? (
              <div className="alert alert-warning">
                <i className="bi bi-exclamation-triangle me-2"></i>
                {cameraError}
              </div>
            ) : (
              <div className="position-relative d-inline-block bg-black rounded overflow-hidden" style={{ minWidth: '320px', minHeight: '240px' }}>
                {!capturedImage ? (
                  <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', maxHeight: '420px', objectFit: 'cover' }} />
                ) : (
                  <img src={capturedImage} alt="Captured" style={{ width: '100%', maxHeight: '420px', objectFit: 'cover' }} />
                )}
                <canvas ref={canvasRef} className="d-none" />
              </div>
            )}
          </div>
          <div className="modal-footer bg-light justify-content-between">
            <button className="btn btn-secondary" onClick={() => { stopCamera(); onClose(); }}>
              Cancel
            </button>
            <div className="d-flex gap-2">
              {capturedImage ? (
                <>
                  <button className="btn btn-outline-primary" onClick={handleRetake}>
                    <i className="bi bi-arrow-counterclockwise me-1"></i> Retake
                  </button>
                  <button className="btn btn-success" onClick={handleSave}>
                    <i className="bi bi-check-lg me-1"></i> Use Photo
                  </button>
                </>
              ) : (
                <button className="btn btn-primary" onClick={takePhoto} disabled={!!cameraError}>
                  <i className="bi bi-camera-fill me-1"></i> Take Snapshot
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraCaptureModal;
