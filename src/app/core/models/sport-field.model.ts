export type SportType = 'football' | 'basketball' | 'volleyball' | 'tennis' | 'multiple';
export type FieldStatus = 'active' | 'inactive' | 'maintenance';

export interface Schedule {
  dayOfWeek: number; // 0=Sunday, 6=Saturday
  openTime: string;  // 'HH:mm'
  closeTime: string;
}

export interface SportField {
  _id: string;
  name: string;
  sportType: SportType;
  location: string;
  description: string;
  images: string[];
  capacity: number;
  pricePerHour: number;
  schedule: Schedule[];
  status: FieldStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFieldDto {
  name: string;
  sportType: SportType;
  location: string;
  description: string;
  images?: string[];
  capacity: number;
  pricePerHour: number;
  schedule: Schedule[];
}

export interface FieldAvailability {
  date: string;
  slots: TimeSlot[];
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}
