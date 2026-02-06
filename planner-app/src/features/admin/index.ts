/**
 * Admin Feature Index
 *
 * Central export point for admin feature.
 */

export { default as adminReducer } from './adminSlice';
export { AdminPage } from './AdminPage';
export {
  fetchAllowedUsers,
  addAllowedUserAsync,
  removeAllowedUserAsync,
  updateAllowedUserRoleAsync,
} from './adminThunks';
export {
  selectAllowedUsers,
  selectAdminLoading,
  selectAdminSaving,
  selectAdminError,
  selectAdminCount,
  clearAdminError,
} from './adminSlice';
export { useAllowedUsers } from './hooks';
export type { UseAllowedUsersResult } from './hooks';
export type { AdminState } from './adminSlice';
export type { AdminPageProps } from './AdminPage';
