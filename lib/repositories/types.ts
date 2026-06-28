import { Booking, BookingStatus, Prisma, User, PrismaClient } from "@prisma/client";

export type DbClient = Prisma.TransactionClient | PrismaClient;

export interface IUserRepository {
	findById(id: string, options?: { include?: Prisma.UserInclude }, tx?: DbClient): Promise<any | null>;
	findByEmail(email: string, options?: { include?: Prisma.UserInclude }, tx?: DbClient): Promise<any | null>;
	findByEmailExcludingId(email: string, excludeId: string, tx?: DbClient): Promise<User | null>;
	create(data: Prisma.UserCreateInput, tx?: DbClient): Promise<User>;
	update(id: string, data: Prisma.UserUpdateInput, tx?: DbClient): Promise<User>;
	delete(id: string, tx?: DbClient): Promise<User>;
}

export interface IBookingRepository {
	findById(id: string, tx?: DbClient): Promise<Booking | null>;
	findByUserId(userId: string, tx?: DbClient): Promise<Booking[]>;
	create(data: Prisma.BookingCreateInput, tx?: DbClient): Promise<Booking>;
	update(id: string, data: Prisma.BookingUpdateInput, tx?: DbClient): Promise<Booking>;
	updateStatus(id: string, status: BookingStatus, tx?: DbClient): Promise<Booking>;
}

export interface ITeacherRepository {
	create(data: Prisma.TeacherUncheckedCreateInput, tx?: DbClient): Promise<any>;
}

export interface IStudentRepository {
	create(data: Prisma.StudentUncheckedCreateInput, tx?: DbClient): Promise<any>;
	findById(id: string, options?: { include?: Prisma.StudentInclude }, tx?: DbClient): Promise<any | null>;
	update(id: string, data: Prisma.StudentUpdateInput, tx?: DbClient): Promise<any>;
}
