import { urlBase64ToUint8Array } from './vapid-helper';

async function subscribeToPush(registration, authModel, CONFIG) {
    try {
        if (!registration || !registration.pushManager) {
            return;
        }
        const convertedVapidKey = urlBase64ToUint8Array(CONFIG.VAPID_PUBLIC_KEY);
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedVapidKey,
        });


        const token = authModel.getToken();
        if (!token) {
            return;
        }

        const response = await fetch(`${CONFIG.BASE_URL}/notifications/subscribe`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                endpoint: subscription.endpoint,
                keys: {
                    p256dh: subscription.toJSON().keys.p256dh,
                    auth: subscription.toJSON().keys.auth,
                }
            }),
        });

        const responseData = await response.json();
        if (!response.ok && responseData.error) {
            console.error('Gagal mengirim langganan ke server (dari notif-helper):', responseData.message || response.statusText);
            if (response.status === 401) {
                subscription.unsubscribe().then(() => console.log('Unsubscribed from push manager due to server rejection (dari notif-helper)'));
            }
        }
    } catch (error) {
        console.error('Gagal berlangganan push (dari notif-helper):', error);
    }
}

export async function requestPermissionAndSubscribeNotifications(registration, authModel, CONFIG) {
    if (!('Notification' in window)) {
        return false;
    }

    const permissionResult = await Notification.requestPermission();
    if (permissionResult === 'granted') {
        if (registration && registration.pushManager) {
            await subscribeToPush(registration, authModel, CONFIG);
        } else {
            const swReg = await navigator.serviceWorker.ready;
            await subscribeToPush(swReg, authModel, CONFIG);
        }
        return true;
    }
    return false;
}

export async function unsubscribeFromPushNotifications(registration, authModel, CONFIG) {
    if (!registration || !registration.pushManager) {
        return false;
    }

    try {
        const currentSubscription = await registration.pushManager.getSubscription();

        if (currentSubscription) {
            const endpointToUnsubscribe = currentSubscription.endpoint;
            await currentSubscription.unsubscribe();

            const token = authModel.getToken();
            if (!token) {
                return true;
            }

            const response = await fetch(`${CONFIG.BASE_URL}/notifications/subscribe`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ endpoint: endpointToUnsubscribe }),
            });

            const responseData = await response.json();
            if (!response.ok && responseData.error) {
                console.error('Gagal mengirim permintaan unsubscribe ke server (dari notif-helper):', responseData.message || response.statusText);
            }
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.error('Gagal melakukan proses berhenti berlangganan (dari notif-helper):', error);
        return false;
    }
}
