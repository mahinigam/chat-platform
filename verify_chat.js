const io = require('socket.io-client');
const axios = require('axios');

const API_URL = 'http://localhost:3000/api';
const SOCKET_URL = 'http://localhost:3000';

async function verify() {
    try {
        console.log('1. Registering user...');
        const username = `testuser_${Date.now()}`;
        const email = `${username}@example.com`;
        const password = 'password123';

        try {
            await axios.post(`${API_URL}/auth/register`, {
                username,
                email,
                password,
                displayName: 'Test User'
            });
        } catch (e) {
            // Ignore if already exists (unlikely with timestamp)
            console.log('User might already exist');
        }

        console.log('2. Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email,
            password
        });

        const { token, user } = loginRes.data;
        console.log('   Login successful. Token received.');

        console.log('3. Connecting to Socket.io...');
        const socket = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket'],
            reconnection: false
        });

        await new Promise((resolve, reject) => {
            socket.on('connect', () => {
                console.log('   Socket connected:', socket.id);
                resolve();
            });
            socket.on('connect_error', (err) => {
                reject(new Error(`Socket connection failed: ${err.message}`));
            });
            setTimeout(() => reject(new Error('Socket timeout')), 5000);
        });

        console.log('3.5. Creating Room via API...');
        let roomId;
        try {
            const roomRes = await axios.post(`${API_URL}/rooms`, {
                roomType: 'group',
                name: 'Test Room ' + Date.now()
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            roomId = roomRes.data.room.id;
            console.log('   Room created:', roomId);
        } catch (e) {
            console.error('   Failed to create room:', e.response?.data || e.message);
            throw e;
        }

        console.log(`4. Joining Room ${roomId}...`);
        socket.emit('room:join', { roomId });
        await new Promise(r => setTimeout(r, 1000));

        console.log('5. Sending Message...');
        await new Promise((resolve, reject) => {
            socket.emit('message:send', {
                roomId: roomId,
                content: 'Hello World from Script',
                tempId: 'temp-' + Date.now()
            }, (response) => {
                if (response.success) {
                    console.log('   Message acknowledged by server:', response.message.id);
                    resolve();
                } else {
                    reject(new Error('Message send failed: ' + response.error));
                }
            });
        });
        console.log('6. Verification Complete: SUCCESS');

        socket.disconnect();
        process.exit(0);

    } catch (error) {
        console.error('Verification FAILED:', error.message);
        if (error.response) {
            console.error('API Response:', error.response.data);
        }
        process.exit(1);
    }
}

verify();
