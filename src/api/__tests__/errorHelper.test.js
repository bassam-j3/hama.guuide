import { describe, it, expect } from 'vitest';
import { extractErrorMessage } from '../../utils/errorHelper';

describe('extractErrorMessage', () => {
    it('returns default fallback message if error is null or undefined', () => {
        expect(extractErrorMessage(null)).toBe('حدث خطأ غير متوقع. يرجى المحاولة لاحقاً.');
        expect(extractErrorMessage(undefined)).toBe('حدث خطأ غير متوقع. يرجى المحاولة لاحقاً.');
    });

    it('returns error string if error itself is a string', () => {
        expect(extractErrorMessage('Something went wrong')).toBe('Something went wrong');
    });

    it('extracts direct string response from error.response.data', () => {
        const error = {
            response: {
                status: 400,
                data: 'Email already exists'
            }
        };
        expect(extractErrorMessage(error)).toBe('Email already exists');
    });

    it('extracts validation errors from ModelState dictionary', () => {
        const error = {
            response: {
                status: 400,
                data: {
                    title: 'One or more validation errors occurred.',
                    errors: {
                        Password: ['Passwords must have at least one non alphanumeric character.'],
                        Email: ['The Email field is not a valid e-mail address.']
                    }
                }
            }
        };
        expect(extractErrorMessage(error)).toBe(
            'Passwords must have at least one non alphanumeric character.\nThe Email field is not a valid e-mail address.'
        );
    });

    it('extracts Identity errors from array of error objects with description', () => {
        const error = {
            response: {
                status: 400,
                data: [
                    { code: 'PasswordRequiresNonAlphanumeric', description: 'Password requires a non-alphanumeric character' },
                    { code: 'PasswordTooShort', description: 'Password must be at least 6 characters' }
                ]
            }
        };
        expect(extractErrorMessage(error)).toBe(
            'Password requires a non-alphanumeric character\nPassword must be at least 6 characters'
        );
    });

    it('extracts detail from ASP.NET ProblemDetails', () => {
        const error = {
            response: {
                status: 400,
                data: {
                    title: 'Bad Request',
                    detail: 'Password requires a non-alphanumeric character'
                }
            }
        };
        expect(extractErrorMessage(error)).toBe('Password requires a non-alphanumeric character');
    });

    it('extracts title when detail and errors are absent', () => {
        const error = {
            response: {
                status: 400,
                data: {
                    title: 'Specified role does not exist'
                }
            }
        };
        expect(extractErrorMessage(error)).toBe('Specified role does not exist');
    });

    it('extracts message property if present', () => {
        const error = {
            response: {
                status: 400,
                data: {
                    message: 'User already exists'
                }
            }
        };
        expect(extractErrorMessage(error)).toBe('User already exists');
    });

    it('falls back to error.message when response has no data', () => {
        const error = new Error('Network Error');
        expect(extractErrorMessage(error)).toBe('Network Error');
    });

    it('extracts Identity errors with PascalCase properties and username validation messages', () => {
        const error = {
            response: {
                status: 400,
                data: [
                    {
                        Code: 'InvalidUserName',
                        Description: "Username 'BASSAM JAMMAL' is invalid, can only contain letters or digits."
                    }
                ]
            }
        };
        expect(extractErrorMessage(error)).toBe(
            "Username 'BASSAM JAMMAL' is invalid, can only contain letters or digits."
        );
    });

    it('extracts Identity code when description is not provided', () => {
        const error = {
            response: {
                status: 400,
                data: [{ code: 'DuplicateUserName' }]
            }
        };
        expect(extractErrorMessage(error)).toBe('DuplicateUserName');
    });

    it('extracts PascalCase Detail from ProblemDetails', () => {
        const error = {
            response: {
                status: 400,
                data: {
                    Detail: "Username 'BASSAM JAMMAL' is invalid, can only contain letters or digits."
                }
            }
        };
        expect(extractErrorMessage(error)).toBe(
            "Username 'BASSAM JAMMAL' is invalid, can only contain letters or digits."
        );
    });

    it('extracts PascalCase Errors dictionary from FluentValidation', () => {
        const error = {
            response: {
                status: 400,
                data: {
                    Errors: {
                        UserName: ["Username 'BASSAM JAMMAL' is invalid, can only contain letters or digits."]
                    }
                }
            }
        };
        expect(extractErrorMessage(error)).toBe(
            "Username 'BASSAM JAMMAL' is invalid, can only contain letters or digits."
        );
    });
});

