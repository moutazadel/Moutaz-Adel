export const sendNotification = (title: string, options?: NotificationOptions) => {
  if (!('Notification' in window)) {
    console.error('This browser does not support desktop notification');
    return;
  }

  if (Notification.permission === 'granted') {
    const finalOptions = {
        icon: '/vite.svg',
        badge: '/vite.svg',
        ...options,
    };
    new Notification(title, finalOptions);
  }
};
