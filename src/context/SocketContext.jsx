import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { tokenStorage } from '@/utils/tokenStorage';
import { toast } from 'react-toastify';
import { appConfig } from '@/config/appConfig';

// Extract base URL (remove /api/v1 if present)
const getSocketUrl = () => {
    try {
        const url = new URL(appConfig.apiBaseUrl);
        return url.origin; // Returns http://localhost:5000
    } catch (e) {
        return 'http://localhost:5000';
    }
};

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
    const { isAuthenticated, user } = useAuth();
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        // Only connect if authenticated and user object exists
        if (!isAuthenticated || !user) {
            if (socket) {
                console.log('Disconnecting socket (user logged out)');
                socket.disconnect();
                setSocket(null);
            }
            return;
        }

        // Prepare token
        const token = tokenStorage.getAccessToken();
        if (!token) return;

        // Connect
        const socketUrl = getSocketUrl();
        console.log(`Connecting socket to ${socketUrl}...`);

        const newSocket = io(socketUrl, {
            auth: {
                token: token
            },
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        newSocket.on('connect', () => {
            console.log('✅ Socket connected:', newSocket.id);
        });

        // Listen for general notifications
        newSocket.on('notification', (data) => {
            console.log('🔔 New Notification:', data);
            // data structure: { type, title, message, ...props }

            // Show toast
            const message = data.message || 'Yeni Bildirim';
            const type = data.type || 'info'; // success, error, info, warning

            // Map notification types to toast types if needed, or just use default
            toast(message, {
                type: ['success', 'error', 'info', 'warning'].includes(type) ? type : 'info',
                autoClose: 5000,
                icon: '🔔'
            });

            // You could also update a global notification store/context here if you have one
        });

        newSocket.on('connect_error', (err) => {
            console.error('❌ Socket connection error:', err.message);
        });

        newSocket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
        });

        setSocket(newSocket);

        // Cleanup
        return () => {
            if (newSocket) {
                newSocket.disconnect();
            }
        };
    }, [isAuthenticated, user?.id]); // Re-connect only if auth/user changes

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => {
    return useContext(SocketContext);
};
