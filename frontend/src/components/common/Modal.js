import React from 'react';
import '../../styles/Global.css';

const Modal = ({ isOpen, onClose, title, children, footer }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content-pro shadow-lg" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header-pro border-bottom p-3 d-flex justify-content-between align-items-center">
                    <h5 className="fw-bold mb-0 text-dark">{title}</h5>
                    <button className="btn-close-pro" onClick={onClose}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                <div className="modal-body-pro p-4">
                    {children}
                </div>
                {footer && (
                    <div className="modal-footer-pro border-top p-3 d-flex justify-content-end gap-2">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Modal;
