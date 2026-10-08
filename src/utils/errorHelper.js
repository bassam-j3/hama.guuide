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

    const data = error.response?.data || error.data;

    if (data && typeof data === 'object') {
        const messages = [];

        // 3. Identity errors: array of objects with description/code (case-insensitive/PascalCase)
        const identityErrors = Array.isArray(data) 
            ? data 
            : (Array.isArray(data.errors) ? data.errors : (Array.isArray(data.Errors) ? data.Errors : null));

        if (identityErrors && identityErrors.length > 0) {
            identityErrors.forEach(e => {
                if (typeof e === 'string' && e.trim()) {
                    messages.push(e.trim());
                } else if (e && typeof e === 'object') {
                    const desc = e.description || e.Description || e.message || e.Message;
                    const code = e.code || e.Code;
                    if (typeof desc === 'string' && desc.trim()) {
                        messages.push(desc.trim());
                    } else if (typeof code === 'string' && code.trim()) {
                        messages.push(code.trim());
                    }
                }
            });

            if (messages.length > 0) {
                return messages.join('\n');
            }
        }

        // 4. ASP.NET ModelState/FluentValidation dictionary in error.response.data.errors or Errors
        const validationErrors = data.errors || data.Errors;
        if (validationErrors && typeof validationErrors === 'object' && !Array.isArray(validationErrors)) {
            for (const key of Object.keys(validationErrors)) {
                const val = validationErrors[key];
                if (Array.isArray(val)) {
                    val.forEach(item => {
                        if (typeof item === 'string' && item.trim()) {
                            messages.push(item.trim());
                        } else if (item && typeof item === 'object') {
                            const desc = item.description || item.Description || item.message || item.Message;
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

        // 5. ASP.NET ProblemDetails: detail/Detail, then title/Title, then message/Message
        const detail = data.detail || data.Detail;
        if (typeof detail === 'string' && detail.trim()) {
            return detail.trim();
        }

        const title = data.title || data.Title;
        if (typeof title === 'string' && title.trim()) {
            return title.trim();
        }

        const message = data.message || data.Message;
        if (typeof message === 'string' && message.trim()) {
            return message.trim();
        }
    }

    // 6. Fallback: error.message || default message.
    if (typeof error.message === 'string' && error.message.trim()) {
        return error.message.trim();
    }

    return defaultMessage;
};
