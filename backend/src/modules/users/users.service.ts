import User from './user.model';
import { IUser } from '../../interfaces';
import { getPagination, buildPaginationMeta } from '../../utils/pagination.utils';
import { FilterQuery } from 'mongoose';

export interface UserFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: 'ADMIN' | 'USER';
  status?: 'active' | 'inactive' | 'blocked';
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
}

export const getAll = async (filters: UserFilters) => {
  const { skip, limit, page } = getPagination(filters.page || 1, filters.limit || 10);

  const query: FilterQuery<IUser> = {};

  if (filters.search) {
    const searchRegex = new RegExp(filters.search, 'i');
    query['$or'] = [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { email: searchRegex },
    ];
  }

  if (filters.role) query['role'] = filters.role;
  if (filters.status) query['status'] = filters.status;

  const [users, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(query),
  ]);

  return {
    users,
    pagination: buildPaginationMeta(total, page, limit),
  };
};

export const getById = async (id: string): Promise<IUser> => {
  const user = await User.findById(id);
  if (!user) {
    throw Object.assign(new Error('User not found'), { statusCode: 404 });
  }
  return user;
};

export const update = async (id: string, dto: UpdateUserDto): Promise<IUser> => {
  const user = await User.findByIdAndUpdate(
    id,
    {
      ...(dto.firstName && { firstName: dto.firstName }),
      ...(dto.lastName && { lastName: dto.lastName }),
      ...(dto.phone !== undefined && { phone: dto.phone }),
      ...(dto.avatar !== undefined && { avatar: dto.avatar }),
    },
    { new: true, runValidators: true }
  );

  if (!user) {
    throw Object.assign(new Error('User not found'), { statusCode: 404 });
  }

  return user;
};

export const deleteUser = async (id: string): Promise<void> => {
  const user = await User.findByIdAndDelete(id);
  if (!user) {
    throw Object.assign(new Error('User not found'), { statusCode: 404 });
  }
};

export const updateStatus = async (
  id: string,
  status: 'active' | 'inactive' | 'blocked'
): Promise<IUser> => {
  const user = await User.findByIdAndUpdate(
    id,
    { status },
    { new: true, runValidators: true }
  );

  if (!user) {
    throw Object.assign(new Error('User not found'), { statusCode: 404 });
  }

  return user;
};

export const updateRole = async (
  id: string,
  role: 'ADMIN' | 'USER'
): Promise<IUser> => {
  const user = await User.findByIdAndUpdate(
    id,
    { role },
    { new: true, runValidators: true }
  );

  if (!user) {
    throw Object.assign(new Error('User not found'), { statusCode: 404 });
  }

  return user;
};
