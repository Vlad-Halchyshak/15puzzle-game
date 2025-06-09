export function checkAllElementsLocked(elements, matrix) {
  for (const type of [9, 10, 11, 12]) {
    const element = elements.find((e) => e.type === type);
    if (!element) return false;

    const expectedSlot = 100 + type;
    const currentCell = matrix[element.y]?.[element.x];

    if (currentCell !== expectedSlot) return false;
  }

  return true;
}
