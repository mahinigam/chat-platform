/**
 * Multi-Device React Hooks
 * 
 * Provides React integration for multi-device E2E encryption management.
 */

import { useState, useEffect, useCallback } from 'react';
import { multiDeviceService, type DeviceInfo, type KeyBackup } from '../crypto/MultiDeviceService';

// ============================================
// DEVICE LIST HOOK
// ============================================

interface UseDevicesReturn {
    devices: DeviceInfo[];
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
    removeDevice: (deviceId: string) => Promise<void>;
    verifyDevice: (deviceId: string) => Promise<void>;
}

export function useDevices(): UseDevicesReturn {
    const [devices, setDevices] = useState<DeviceInfo[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const refresh = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            const deviceList = await multiDeviceService.getDevices();
            setDevices(deviceList);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load devices');
        } finally {
            setLoading(false);
        }
    }, []);
    
    const removeDevice = useCallback(async (deviceId: string) => {
        try {
            await multiDeviceService.removeDevice(deviceId);
            setDevices(prev => prev.filter(d => d.deviceId !== deviceId));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to remove device');
            throw err;
        }
    }, []);
    
    const verifyDevice = useCallback(async (deviceId: string) => {
        try {
            await multiDeviceService.verifyDevice(deviceId);
            setDevices(prev => prev.map(d => 
                d.deviceId === deviceId ? { ...d, isVerified: true } : d
            ));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to verify device');
            throw err;
        }
    }, []);
    
    useEffect(() => {
        refresh();
    }, [refresh]);
    
    return { devices, loading, error, refresh, removeDevice, verifyDevice };
}

// ============================================
// DEVICE LINKING HOOK
// ============================================

interface UseDeviceLinkingReturn {
    // For existing device (generating code)
    linkingCode: string | null;
    codeExpiresAt: Date | null;
    generateCode: () => Promise<void>;
    
    // For new device (using code)
    linkWithCode: (code: string) => Promise<boolean>;
    
    // Link requests
    pendingRequests: Array<{
        requestId: string;
        newDeviceId: string;
        newDeviceName: string;
        newDeviceFingerprint: string;
    }>;
    refreshRequests: () => Promise<void>;
    approveRequest: (requestId: string) => Promise<void>;
    rejectRequest: (requestId: string) => Promise<void>;
    
    loading: boolean;
    error: string | null;
}

export function useDeviceLinking(): UseDeviceLinkingReturn {
    const [linkingCode, setLinkingCode] = useState<string | null>(null);
    const [codeExpiresAt, setCodeExpiresAt] = useState<Date | null>(null);
    const [pendingRequests, setPendingRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const generateCode = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            const { code, expiresAt } = await multiDeviceService.generateLinkingCode();
            setLinkingCode(code);
            setCodeExpiresAt(expiresAt);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate linking code');
        } finally {
            setLoading(false);
        }
    }, []);
    
    const linkWithCode = useCallback(async (code: string): Promise<boolean> => {
        setLoading(true);
        setError(null);
        
        try {
            const success = await multiDeviceService.linkWithCode(code);
            return success;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to link device');
            return false;
        } finally {
            setLoading(false);
        }
    }, []);
    
    const refreshRequests = useCallback(async () => {
        try {
            const requests = await multiDeviceService.getPendingLinkRequests();
            setPendingRequests(requests);
        } catch (err) {
            console.error('Failed to refresh link requests:', err);
        }
    }, []);
    
    const approveRequest = useCallback(async (requestId: string) => {
        setLoading(true);
        try {
            await multiDeviceService.respondToLinkRequest(requestId, true);
            setPendingRequests(prev => prev.filter(r => r.requestId !== requestId));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to approve request');
        } finally {
            setLoading(false);
        }
    }, []);
    
    const rejectRequest = useCallback(async (requestId: string) => {
        setLoading(true);
        try {
            await multiDeviceService.respondToLinkRequest(requestId, false);
            setPendingRequests(prev => prev.filter(r => r.requestId !== requestId));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to reject request');
        } finally {
            setLoading(false);
        }
    }, []);
    
    useEffect(() => {
        refreshRequests();
        // Poll for requests every 5 seconds
        const interval = setInterval(refreshRequests, 5000);
        return () => clearInterval(interval);
    }, [refreshRequests]);
    
    return {
        linkingCode,
        codeExpiresAt,
        generateCode,
        linkWithCode,
        pendingRequests,
        refreshRequests,
        approveRequest,
        rejectRequest,
        loading,
        error,
    };
}

// ============================================
// KEY BACKUP HOOK
// ============================================

interface UseKeyBackupReturn {
    hasBackup: boolean;
    backup: KeyBackup | null;
    createBackup: (password: string) => Promise<KeyBackup>;
    restoreBackup: (backup: KeyBackup, password: string) => Promise<boolean>;
    loading: boolean;
    error: string | null;
}

export function useKeyBackup(): UseKeyBackupReturn {
    const [backup, setBackup] = useState<KeyBackup | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    useEffect(() => {
        // Check for existing backup in localStorage
        const storedBackup = localStorage.getItem('e2e_key_backup');
        if (storedBackup) {
            try {
                setBackup(JSON.parse(storedBackup));
            } catch {
                // Invalid backup data
            }
        }
    }, []);
    
    const createBackup = useCallback(async (password: string): Promise<KeyBackup> => {
        setLoading(true);
        setError(null);
        
        try {
            const newBackup = await multiDeviceService.createKeyBackup(password);
            setBackup(newBackup);
            return newBackup;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create backup';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);
    
    const restoreBackup = useCallback(async (backupToRestore: KeyBackup, password: string): Promise<boolean> => {
        setLoading(true);
        setError(null);
        
        try {
            const success = await multiDeviceService.restoreKeyBackup(backupToRestore, password);
            if (success) {
                setBackup(backupToRestore);
            }
            return success;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to restore backup');
            return false;
        } finally {
            setLoading(false);
        }
    }, []);
    
    return {
        hasBackup: backup !== null,
        backup,
        createBackup,
        restoreBackup,
        loading,
        error,
    };
}

// ============================================
// DEVICE VERIFICATION HOOK
// ============================================

interface UseDeviceVerificationReturn {
    qrData: string | null;
    generateQR: () => Promise<void>;
    verifyByQR: (qrData: string) => Promise<{ success: boolean; error?: string }>;
    loading: boolean;
}

export function useDeviceVerification(): UseDeviceVerificationReturn {
    const [qrData, setQrData] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    
    const generateQR = useCallback(async () => {
        setLoading(true);
        try {
            const data = await multiDeviceService.getVerificationQRData();
            setQrData(data);
        } catch (err) {
            console.error('Failed to generate QR data:', err);
        } finally {
            setLoading(false);
        }
    }, []);
    
    const verifyByQR = useCallback(async (data: string) => {
        setLoading(true);
        try {
            return await multiDeviceService.verifyDeviceByQR(data);
        } finally {
            setLoading(false);
        }
    }, []);
    
    return { qrData, generateQR, verifyByQR, loading };
}
