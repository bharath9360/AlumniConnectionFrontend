import React, { useState, useEffect } from 'react';
import { legalService } from '../../services/api';
import { ClipLoader } from 'react-spinners';
import { handleError } from '../../utils/errorHandler';
import toast from 'react-hot-toast';

const LegalPage = ({ type }) => {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Reset state when type changes
    setLoading(true);
    setError(null);
    window.scrollTo(0, 0);

    const fetchContent = async () => {
      try {
        const { data } = await legalService.getContent(type);
        setContent(data.data);
      } catch (err) {
        console.error('Failed to fetch legal content:', err);
        const errMessage = handleError(err);
        setError(errMessage);
        toast.error(errMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [type]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <ClipLoader color="#c84022" size={40} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5 text-center mt-5">
        <div className="alert alert-danger d-inline-block shadow-sm">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4 my-5">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-10 col-xl-9">
          <div className="card shadow-sm border-0" style={{ borderRadius: '12px' }}>
            <div 
              className="card-header text-white text-center py-4" 
              style={{ backgroundColor: '#c84022', borderRadius: '12px 12px 0 0' }}
            >
              <h2 className="mb-0 fw-bold">{content?.title}</h2>
              {content?.lastUpdated && (
                <p className="text-white-50 mt-2 mb-0 small">
                  Last updated: {new Date(content.lastUpdated).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="card-body p-4 p-md-5 bg-white" style={{ borderRadius: '0 0 12px 12px' }}>
              <div 
                className="legal-content readability-optimized" 
                dangerouslySetInnerHTML={{ __html: content?.content }} 
                // Inline styles for responsiveness via simple global css rule fallback
                style={{ lineHeight: '1.8', fontSize: '1.05rem', color: '#333' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalPage;
