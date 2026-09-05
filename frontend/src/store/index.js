import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import documentReducer from './slices/documentSlice';
import sharingReducer from './slices/sharingSlice';
import notificationReducer from './slices/notificationSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    documents: documentReducer,
    sharing: sharingReducer,
    notifications: notificationReducer,
  },
});
