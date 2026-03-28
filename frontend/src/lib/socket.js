import { io } from 'socket.io-client';

const socket = io('http://localhost:5001', {
  autoConnect: false // We will connect manually when user logs in
});

export default socket;
