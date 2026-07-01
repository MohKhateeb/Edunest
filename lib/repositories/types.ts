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
	findById(id: string, options?: { include?: Prisma.BookingInclude }, tx?: DbClient): Promise<any | null>;
	findByUserId(userId: string, tx?: DbClient): Promise<any[]>;
	findActiveByTeacherId(teacherId: string, from: Date, to: Date, tx?: DbClient): Promise<any[]>;
	findActiveByStudentId(studentId: string, from: Date, to: Date, tx?: DbClient): Promise<any[]>;
	findActiveByTeacherIds(teacherIds: string[], from: Date, to: Date, tx?: DbClient): Promise<any[]>;
	create(data: Prisma.BookingUncheckedCreateInput, tx?: DbClient): Promise<any>;
	update(id: string, data: Prisma.BookingUncheckedUpdateInput, tx?: DbClient): Promise<any>;
	updateStatus(id: string, status: BookingStatus, tx?: DbClient): Promise<any>;
}

export interface ITeacherRepository {
	create(data: Prisma.TeacherUncheckedCreateInput, tx?: DbClient): Promise<any>;
	upsert(where: Prisma.TeacherWhereUniqueInput, create: Prisma.TeacherUncheckedCreateInput | Prisma.TeacherCreateInput, update: Prisma.TeacherUncheckedUpdateInput | Prisma.TeacherUpdateInput, tx?: DbClient): Promise<any>;
	findBySlug(slug: string, options?: { include?: Prisma.TeacherInclude }, tx?: DbClient): Promise<any | null>;
	findByUserId(userId: string, options?: { include?: Prisma.TeacherInclude }, tx?: DbClient): Promise<any | null>;
	update(id: string, data: Prisma.TeacherUncheckedUpdateInput | Prisma.TeacherUpdateInput, tx?: DbClient): Promise<any>;
	updateAvailability(id: string, isAvailableNow: boolean, tx?: DbClient): Promise<any>;
}

export interface IStudentRepository {
	create(data: Prisma.StudentUncheckedCreateInput, tx?: DbClient): Promise<any>;
	findById(id: string, options?: { include?: Prisma.StudentInclude }, tx?: DbClient): Promise<any | null>;
	update(id: string, data: Prisma.StudentUpdateInput, tx?: DbClient): Promise<any>;
}

export interface ISystemSettingRepository {
	upsert(key: string, value: string, description?: string, updatedBy?: string, tx?: DbClient): Promise<any>;
	findByKey(key: string, tx?: DbClient): Promise<any | null>;
	update(key: string, data: Prisma.SystemSettingUpdateInput, tx?: DbClient): Promise<any>;
}

export interface ITeacherVerificationRepository {
	update(teacherId: string, data: Prisma.TeacherVerificationUncheckedUpdateInput | Prisma.TeacherVerificationUpdateInput, tx?: DbClient): Promise<any>;
	findByTeacherId(teacherId: string, tx?: DbClient): Promise<any | null>;
}
