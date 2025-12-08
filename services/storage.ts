
import { UserProfile, SessionAnalysis } from '../types';

const STORAGE_KEY = 'psysense_user_data';

export const StorageService = {
  saveUser: (user: UserProfile) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } catch (e) {
      console.error('Failed to save user to storage', e);
    }
  },

  getUser: (): UserProfile | null => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Failed to load user from storage', e);
      return null;
    }
  },

  addSessionAnalysis: (analysis: SessionAnalysis) => {
    try {
      const user = StorageService.getUser();
      if (user) {
        const updatedUser = {
          ...user,
          history: [...(user.history || []), analysis]
        };
        StorageService.saveUser(updatedUser);
        return updatedUser;
      }
    } catch (e) {
      console.error('Failed to save session analysis', e);
    }
    return null;
  },
  
  clear: () => {
      localStorage.removeItem(STORAGE_KEY);
  }
};
