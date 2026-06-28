import { vi } from 'vitest';

const createMockModel = () => ({
	findFirst: vi.fn().mockResolvedValue(null),
	findMany: vi.fn().mockResolvedValue([]),
	findUnique: vi.fn().mockResolvedValue(null),
	create: vi.fn().mockResolvedValue(null),
	update: vi.fn().mockResolvedValue(null),
	delete: vi.fn().mockResolvedValue(null),
	updateMany: vi.fn().mockResolvedValue({ count: 0 }),
	aggregate: vi.fn().mockResolvedValue({}),
	groupBy: vi.fn().mockResolvedValue([]),
	count: vi.fn().mockResolvedValue(0),
});

const mockPrismaClientInner = {
	$queryRaw: vi.fn().mockResolvedValue([]),
	$transaction: vi.fn().mockImplementation((cb) => {
		if (typeof cb === 'function') {
			return cb(mockPrismaClient);
		}
		return Promise.resolve(cb);
	}),
};

export const mockPrismaClient = new Proxy(mockPrismaClientInner, {
	get(target, prop) {
		if (prop in target) {
			return target[prop as keyof typeof target];
		}
		if (typeof prop === 'string' && !prop.startsWith('$')) {
			(target as any)[prop] = createMockModel();
			return (target as any)[prop];
		}
		return undefined;
	}
}) as any;

export function resetAllPrismaMocks() {
	vi.clearAllMocks();
}
