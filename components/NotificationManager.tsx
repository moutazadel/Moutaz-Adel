import React, { useState, useEffect } from 'react';
import { BellIcon, BellOffIcon } from './Icons';

interface NotificationManagerProps {
    t: (key: string) => string;
}

const NotificationManager: React.FC<NotificationManagerProps> = ({ t }) => {
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [isSupported, setIsSupported] = useState(false);

    useEffect(() => {
        if ('Notification' in window) {
            setIsSupported(true);
            setPermission(Notification.permission);
        }
    }, []);

    const requestPermission = async () => {
        if (!isSupported) return;
        const result = await Notification.requestPermission();
        setPermission(result);
    };

    if (!isSupported) {
        return null;
    }

    const getButtonContent = () => {
        switch (permission) {
            case 'granted':
                return <><BellIcon /><span>{t('notificationsEnabled')}</span></>;
            case 'denied':
                return <><BellOffIcon /><span>{t('notificationsBlocked')}</span></>;
            default:
                return <><BellIcon /><span>{t('enableNotifications')}</span></>;
        }
    };
    
    const getButtonClasses = () => {
        switch (permission) {
            case 'granted':
                return 'bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-800 cursor-default';
            case 'denied':
                return 'bg-red-700 dark:bg-red-800 hover:bg-red-800 dark:hover:bg-red-900 cursor-not-allowed';
            default:
                return 'bg-gray-500 dark:bg-gray-600 hover:bg-gray-600 dark:hover:bg-gray-500';
        }
    };

    const getTooltip = () => {
         switch (permission) {
            case 'granted':
                return t('notificationsEnabledTooltip');
            case 'denied':
                return t('notificationsBlockedTooltip');
            default:
                return t('enableNotificationsTooltip');
        }
    }

    return (
        <button
            onClick={requestPermission}
            disabled={permission !== 'default'}
            className={`w-full text-white font-bold py-3 px-4 rounded-md transition duration-300 ease-in-out flex items-center justify-center gap-2 ${getButtonClasses()}`}
            aria-label={getTooltip()}
            title={getTooltip()}
        >
            {getButtonContent()}
        </button>
    );
};

export default NotificationManager;