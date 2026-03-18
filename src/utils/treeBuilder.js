/**
 * Builds a nested tree structure from a flat array of items.
 * Handles missing parents (orphans) by elevating them to root nodes.
 * Deeply clones objects to ensure the original array is never mutated.
 * * @param {Array} items - The flat array of objects
 * @param {string} idKey - The property name for the unique identifier
 * @param {string} parentIdKey - The property name for the parent reference
 * @returns {Array} Nested tree structure
 */
export const buildTree = (items, idKey = 'id', parentIdKey = 'parentId') => {
    if (!Array.isArray(items)) return [];

    const clonedItems = items.map(item => ({ ...item, children: [] }));
    const itemMap = new Map(clonedItems.map(item => [item[idKey], item]));
    const rootNodes = [];

    clonedItems.forEach(item => {
        const parentId = item[parentIdKey];
        if (parentId && itemMap.has(parentId)) {
            itemMap.get(parentId).children.push(item);
        } else {
            rootNodes.push(item);
        }
    });

    return rootNodes;
};