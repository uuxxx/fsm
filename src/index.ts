export const sum = (a: number, b: number): number => a + b;

/**
 * @note Тестовое описание
 */
export const wait = async (delay: number) => new Promise(resolve => {
	setTimeout(resolve, delay);
});
