import { BookingStatus, Prisma, Booking } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { IBookingRepository, DbClient } from "../types";

export class PrismaBookingRepository implements IBookingRepository {
	private getClient(tx?: DbClient) {
		return tx || prisma;
	}

	async findById(
		id: string,
		options?: { include?: Prisma.BookingInclude },
		tx?: DbClient
	): Promise<any | null> {
		const client = this.getClient(tx);
		return client.booking.findUnique({
			where: { id },
			include: options?.include,
		});
	}

	async findByUserId(userId: string, tx?: DbClient): Promise<any[]> {
		const client = this.getClient(tx);
		return client.booking.findMany({
			where: {
				OR: [{ parentUserId: userId }, { studentId: userId }],
			},
		});
	}

	async findActiveByTeacherId(
		teacherId: string,
		from: Date,
		to: Date,
		tx?: DbClient
	): Promise<any[]> {
		const client = this.getClient(tx);
		return client.booking.findMany({
			where: {
				teacherService: { teacherId },
				status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
				startTime: { gte: from, lte: to },
			},
			select: { startTime: true, duration: true },
		});
	}

	async findActiveByStudentId(
		studentId: string,
		from: Date,
		to: Date,
		tx?: DbClient
	): Promise<any[]> {
		const client = this.getClient(tx);
		return client.booking.findMany({
			where: {
				studentId,
				status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
				startTime: { gte: from, lte: to },
			},
			select: { startTime: true, duration: true },
		});
	}

	async findActiveByTeacherIds(
		teacherIds: string[],
		from: Date,
		to: Date,
		tx?: DbClient
	): Promise<any[]> {
		const client = this.getClient(tx);
		return client.booking.findMany({
			where: {
				teacherService: { teacherId: { in: teacherIds } },
				status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
				startTime: { gte: from, lte: to },
			},
			select: {
				startTime: true,
				duration: true,
				teacherService: {
					select: { teacherId: true },
				},
			},
		});
	}

	async create(data: Prisma.BookingUncheckedCreateInput, tx?: DbClient): Promise<any> {
		const client = this.getClient(tx);
		return client.booking.create({
			data,
		});
	}

	async update(
		id: string,
		data: Prisma.BookingUncheckedUpdateInput,
		tx?: DbClient
	): Promise<any> {
		const client = this.getClient(tx);
		return client.booking.update({
			where: { id },
			data,
		});
	}

	async updateStatus(
		id: string,
		status: BookingStatus,
		tx?: DbClient
	): Promise<any> {
		const client = this.getClient(tx);
		return client.booking.update({
			where: { id },
			data: { status },
		});
	}
}

export const bookingRepository = new PrismaBookingRepository();
