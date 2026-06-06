export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: Pagination;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface AuthResponse {
  user: import('./user.model').User;
  accessToken: string;
  refreshToken: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface DashboardStats {
  totalRevenue: number;
  activeReservations: number;
  totalUsers: number;
  totalFields: number;
  recentReservations: import('./reservation.model').Reservation[];
  revenueByMonth: { month: string; revenue: number }[];
  reservationsByField: { fieldName: string; count: number }[];
  occupancyRate: number;
}

export interface UserDashboardStats {
  upcomingReservations: import('./reservation.model').Reservation[];
  totalReservations: number;
  totalSpent: number;
  unreadNotifications: number;
}
