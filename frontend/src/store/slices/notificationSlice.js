import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  unreadCount: 0,
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setNotifications: (state, action) => {
      state.items = action.payload.results || action.payload;
      state.unreadCount = action.payload.unread_count || 0;
    },
    markAllRead: (state) => {
      state.items = state.items.map((n) => ({ ...n, is_read: true }));
      state.unreadCount = 0;
    },
  },
});

export const { setNotifications, markAllRead } = notificationSlice.actions;
export default notificationSlice.reducer;
