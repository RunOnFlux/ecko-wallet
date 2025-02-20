import { Store, configureStore } from '@reduxjs/toolkit';
import { combineReducers } from 'redux';
import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { setStoreWallet, storeWallet } from './slices/wallet';
import { setStoreExtensions, storeExtensions } from './slices/extensions';
import { authSlice } from './slices/auth';
import { notificationsSlice } from './slices/notifications';
import { analyticsSlice } from './slices/analytics';

let customStore: Store | undefined;

const setStore = (store: Store) => {
  customStore = store;
};

export const getStore = (): Store<RootState> => {
  if (!customStore) {
    throw new Error('Please implement setStore before using this function');
  }
  return customStore;
};

const appReducer = combineReducers({
  wallet: storeWallet.reducer,
  extensions: storeExtensions.reducer,
  auth: authSlice.reducer,
  notifications: notificationsSlice.reducer,
  analytics_v1: analyticsSlice.reducer,
});

const rootReducer = (state: any, action: any) => appReducer(state, action);

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'notifications', 'analytics_v1'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production'
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

setStore(store);
setStoreWallet(store);
setStoreExtensions(store);

export default store;