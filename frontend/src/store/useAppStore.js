import { create } from 'zustand';
import socket from '../lib/socket.js';
import axios from 'axios';

const API_URL = 'http://localhost:5001/api';

const useAppStore = create((set, get) => ({
  user: null,
  token: null,
  wards: [],
  patients: [],
  notifications: [],

  // Setup generic actions
  setUser: (user, token) => set({ user, token }),
  clearNotifications: () => set({ notifications: [] }),
  logout: () => {
    set({ user: null, token: null, wards: [], patients: [], notifications: [] });
    socket.disconnect();
  },

  socketInitialized: false,

  // Initialize Socket.io integration
  initSocket: () => {
    if (get().socketInitialized) return;
    
    socket.connect();
    
    // Listening to backend broadcasts
    socket.on('bedUpdate', () => {
      // Refresh wards when bed updates (simplified approach for consistency)
      // Ideal way: targeted Zustand state slice update
      get().fetchWards();
      get().fetchPatients();
    });

    socket.on('notification', (notif) => {
      set((state) => {
        // Filter by role if targetRoles is provided
        if (notif.targetRoles && state.user && !notif.targetRoles.includes(state.user.role.toUpperCase())) {
          return state;
        }
        return { notifications: [notif, ...state.notifications] };
      });
    });

    socket.on('patientDischarged', () => {
      get().fetchPatients();
      get().fetchWards();
    });

    set({ socketInitialized: true });
  },

  // Fetching data
  fetchWards: async () => {
    try {
      const res = await axios.get(`${API_URL}/wards`);
      set({ wards: res.data });
    } catch (e) {
      console.error(e);
    }
  },

  fetchPatients: async () => {
    try {
      const res = await axios.get(`${API_URL}/patients`);
      set({ patients: res.data });
    } catch (e) {
      console.error(e);
    }
  },

  admitPatient: async (patientData, wardId) => {
    try {
      await axios.post(`${API_URL}/patients`, { ...patientData, wardId });
      // Immediate refresh for better UX
      get().fetchWards();
      get().fetchPatients();
    } catch (err) {
      console.error("Admission error", err);
      throw err;
    }
  },

  // Actions
  dischargePatient: async (patientId) => {
    try {
      await axios.post(`${API_URL}/patients/${patientId}/discharge`);
      await get().fetchWards();
      await get().fetchPatients();
    } catch (e) {
      console.error(e);
      throw e;
    }
  },

  updateBedStatus: async (bedId, status) => {
    try {
      await axios.put(`${API_URL}/beds/${bedId}/status`, { status });
    } catch (e) {
      console.error(e);
    }
  },

  requestReview: async (patientId) => {
    try {
      await axios.put(`${API_URL}/patients/${patientId}/request-review`);
    } catch (e) {
      console.error(e);
    }
  }

}));

export default useAppStore;
