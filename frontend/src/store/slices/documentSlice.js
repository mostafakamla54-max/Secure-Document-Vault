import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { documentService } from '../../services/documentService';

export const fetchDocuments = createAsyncThunk(
  'documents/fetch',
  async (params, { rejectWithValue }) => {
    try {
      const response = await documentService.list(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const uploadDocument = createAsyncThunk(
  'documents/upload',
  async ({ data, onUploadProgress }, { rejectWithValue }) => {
    try {
      const response = await documentService.create(data, onUploadProgress);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const deleteDocument = createAsyncThunk(
  'documents/delete',
  async (id, { rejectWithValue }) => {
    try {
      await documentService.remove(id);
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

const documentSlice = createSlice({
  name: 'documents',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDocuments.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDocuments.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.results || action.payload;
      })
      .addCase(fetchDocuments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(uploadDocument.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(deleteDocument.fulfilled, (state, action) => {
        state.items = state.items.filter((doc) => doc.id !== action.payload);
      });
  },
});

export default documentSlice.reducer;
