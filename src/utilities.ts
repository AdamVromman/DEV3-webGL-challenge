export const lerp = (x: number, y: number, a: number) => x * (1 - a) + y * a;

export const clamp = (a: number, min = 0, max = 1) => Math.min(max, Math.max(min, a));

export const easeOutQuart = (x: number): number => {
	return 1 - Math.pow(1 - x, 4);
};