import React from 'react';

const NotificationBadge = ({ count, type = 'default', onClick, children }) => {
    const getColorClasses = () => {
        switch (type) {
            case 'danger':
                return 'bg-red-500 text-white border-red-600';
            case 'warning':
                return 'bg-orange-500 text-white border-orange-600';
            case 'success':
                return 'bg-green-500 text-white border-green-600';
            default:
                return 'bg-blue-500 text-white border-blue-600';
        }
    };

    return (
        <div className="relative inline-block" onClick={onClick}>
            {children}
            {count > 0 && (
                <span className={`absolute -top-2 -right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none rounded-full border-2 border-white ${getColorClasses()} animate-pulse`}>
                    {count > 99 ? '99+' : count}
                </span>
            )}
        </div>
    );
};

export default NotificationBadge;
