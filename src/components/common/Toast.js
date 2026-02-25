import React, { useEffect } from 'react';
import '../../styles/Global.css';

const Toast = ({ message, type = 'info', onClose, duration = 3000 }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);
        return () => clearTimeout(timer);
    }, [onClose, duration]);

    const getIcon = () => {
        switch (type) {
            case 'success': return 'fa-check-circle';
            case 'error': return 'fa-exclamation-circle';
            case 'warning': return 'fa-exclamation-triangle';
            default: return 'fa-info-circle';
        }
    };

    return (
        <div className={`custom-toast toast-${type} show`}>
            <div className="toast-content">
                <i className={`fas ${getIcon()} me-2`}></i>
                <span>{message}</span>
            </div>
            <button className="toast-close" onClick={onClose}>
                <i className="fas fa-times"></i>
            </button>
        </div>
    );
};

export default Toast;
