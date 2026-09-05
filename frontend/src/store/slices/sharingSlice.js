import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { sharingService } from '../../services/sharingService';

export const fetchShares = createAsyncThunk(
  'sharing/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const response = await sharingService.list();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const createShare = createAsyncThunk(
  'sharing/create',
  async (data, { rejectWithValue }) => {
    try {
      const response = await sharingService.create(data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const revokeShare = createAsyncThunk(
  'sharing/revoke',
  async (id, { rejectWithValue }) => {
    try {
      await sharingService.revoke(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  items: [],
  loading: false,
  error: null,
};

const sharingSlice = createSlice({
  name: 'sharing',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchShares.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchShares.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.results || action.payload;
      })
      .addCase(fetchShares.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createShare.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(revokeShare.fulfilled, (state, action) => {
        const i = state.items.findIndex((s) => s.id === action.payload);
        if (i !== -1) state.items[i] = { ...state.items[i], is_active: false };
      });
  },
});

export default sharingSlice.reducer;
