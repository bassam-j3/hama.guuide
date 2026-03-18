import { describe, it, expect } from 'vitest';
import { buildTree } from '../../utils/treeBuilder';

describe('treeBuilder utility', () => {
    it('returns empty array when input is empty', () => {
        expect(buildTree([])).toEqual([]);
    });

    it('returns flat array when no parents exist', () => {
        const input = [
            { id: 1, title: 'Root 1' },
            { id: 2, title: 'Root 2' }
        ];
        const result = buildTree(input);
        expect(result).toHaveLength(2);
        expect(result[0].children).toEqual([]);
    });

    it('builds nested tree correctly', () => {
        const input = [
            { id: 1, title: 'Root 1', parentId: null },
            { id: 2, title: 'Child 1', parentId: 1 },
            { id: 3, title: 'Grandchild 1', parentId: 2 }
        ];
        const result = buildTree(input);
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe(1);
        expect(result[0].children).toHaveLength(1);
        expect(result[0].children[0].id).toBe(2);
        expect(result[0].children[0].children[0].id).toBe(3);
    });

    it('handles orphaned nodes gracefully by treating them as roots', () => {
        const input = [
            { id: 1, title: 'Orphan', parentId: 999 } // 999 does not exist
        ];
        const result = buildTree(input);
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe(1);
    });

    it('does not mutate original array', () => {
        const input = [{ id: 1, title: 'Root 1' }];
        const result = buildTree(input);
        expect(result[0]).not.toBe(input[0]); // References must be completely different
        expect(input[0].children).toBeUndefined(); // Original shouldn't be touched
    });
});