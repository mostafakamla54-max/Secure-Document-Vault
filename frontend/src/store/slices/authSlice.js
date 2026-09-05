import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '../../services/authService';

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue, dispatch }) => {
    try {
      const response = await authService.register(userData);
      const loginResult = await dispatch(loginUser({
        username: userData.username,
        password: userData.password,
      }));
      if (loginResult.type === 'auth/login/rejected') {
        return rejectWithValue(loginResult.payload);
      }
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials);
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      const profileRes = await authService.getProfile();
      return { ...response.data, user: profileRes.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchProfile = createAsyncThunk(
  'auth/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.getProfile();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  user: null,
  token: localStorage.getItem('access_token') || null,
  isAuthenticated: false,
  loading: false,
  error: null,
  themeMode: localStorage.getItem('theme_mode') || 'light',
  lang: localStorage.getItem('app_lang') || 'ar',
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    },
    clearError: (state) => {
      state.error = null;
    },
    toggleTheme: (state) => {
      state.themeMode = state.themeMode === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme_mode', state.themeMode);
    },
    toggleLang: (state) => {
      state.lang = state.lang === 'ar' ? 'en' : 'ar';
      localStorage.setItem('app_lang', state.lang);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.access;
        state.user = action.payload.user || null;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        const payload = action.payload;
        state.error =
          (payload && typeof payload === 'object' && payload.message) ||
          (typeof payload === 'string' && payload) ||
          'بيانات الدخول غير صحيحة';
      })
      .addCase(fetchProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { logout, clearError, toggleTheme, toggleLang } = authSlice.actions;
export default authSlice.reducer;
