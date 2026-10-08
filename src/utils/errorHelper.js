const DEFAULT_ERROR_MESSAGE = "حدث خطأ غير متوقع. يرجى المحاولة لاحقاً.";

/**
 * Extracts a user-friendly error message from various error formats,
 * including ASP.NET Core Identity errors, ModelState validation errors,
 * ProblemDetails, Axios errors, and standard JS Errors.
 *
 * @param {any} error - The error object or string
 * @param {string} [defaultMessage=DEFAULT_ERROR_MESSAGE] - Fallback message if no error message can be resolved
 * @returns {string} - Extracted error message
 */
export const extractErrorMessage = (error, defaultMessage = DEFAULT_ERROR_MESSAGE) => {
    // 1. If error is string: return error
    if (typeof error === 'string') {
        return error.trim() ? error.trim() : defaultMessage;
    }

    if (!error || typeof error !== 'object') {
        return defaultMessage;
    }

    // 2. If error.response?.data is a string: return it
    if (typeof error.response?.data === 'string' && error.response.data.trim()) {
        return error.response.data.trim();
    }

    const data = error.response?.data;

    if (data && typeof data === 'object') {
        // 3. Identity errors: array of objects with description/message, or array of strings
        const identityErrors = Array.isArray(data) 
            ? data 
            : (Array.isArray(data.errors) ? data.errors : null);

        if (identityErrors && identityErrors.length > 0) {
            const messages = identityErrors
                .map(e => {
                    if (typeof e === 'string' && e.trim()) return e.trim();
                    if (e && typeof e === 'object') {
                        if (typeof e.description === 'string' && e.description.trim()) return e.description.trim();
                        if (typeof e.message === 'string' && e.message.trim()) return e.message.trim();
                    }
                    return null;
                })
                .filter(Boolean);

            if (messages.length > 0) {
                return messages.join('\n');
            }
        }

        // 4. ASP.NET ModelState validation dictionary in error.response.data.errors: extract all strings and join
        if (data.errors && typeof data.errors === 'object' && !Array.isArray(data.errors)) {
            const messages = [];
            for (const key of Object.keys(data.errors)) {
                const val = data.errors[key];
                if (Array.isArray(val)) {
                    val.forEach(item => {
                        if (typeof item === 'string' && item.trim()) {
                            messages.push(item.trim());
                        } else if (item && typeof item === 'object') {
                            const desc = item.description || item.message;
                            if (typeof desc === 'string' && desc.trim()) {
                                messages.push(desc.trim());
                            }
                        }
                    });
                } else if (typeof val === 'string' && val.trim()) {
                    messages.push(val.trim());
                }
            }
            if (messages.length > 0) {
                return messages.join('\n');
            }
        }

        // 5. ASP.NET ProblemDetails: error.response.data.detail, then error.response.data.title, then error.response.data.message
        if (typeof data.detail === 'string' && data.detail.trim()) {
            return data.detail.trim();
        }

        if (typeof data.title === 'string' && data.title.trim()) {
            return data.title.trim();
        }

        if (typeof data.message === 'string' && data.message.trim()) {
            return data.message.trim();
        }
    }

    // 6. Fallback: error.message || default message.
    if (typeof error.message === 'string' && error.message.trim()) {
        return error.message.trim();
    }

    return defaultMessage;
};
