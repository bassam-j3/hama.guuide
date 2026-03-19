export const QUERY_KEYS = {
    sections: {
        all: ['sections'],
        list: (parentId, level) => ['sections', 'list', parentId, level],
        detail: (id) => ['sections', 'detail', id],
        services: (id) => ['sections', 'services', id],
    },
    services: {
        all: ['services'],
        list: () => ['services', 'list'],
        detail: (id) => ['services', 'detail', id],
    },
    posts: {
        all: (slug) => ['posts', slug],
        detail: (slug, id) => ['posts', slug, id],
    },
    schemas: {
        all: ['schemas'],
        detail: (serviceId) => ['schemas', 'detail', serviceId],
    },
    users: {
        all: ['users'],
        list: (page, sortBy, sortAsc) => ['users', 'list', page, sortBy, sortAsc],
        detail: (id) => ['users', 'detail', id],
    },
};