import { describe, it, expect } from 'vitest';
import {
  ApplicationError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
} from '../errors';

describe('Application Errors', () => {
  describe('ApplicationError', () => {
    it('메시지와 함께 에러를 생성해야 함', () => {
      const error = new ApplicationError('Test error message');

      expect(error.message).toBe('Test error message');
      expect(error.name).toBe('ApplicationError');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApplicationError);
    });
  });

  describe('ValidationError', () => {
    it('ValidationError를 생성해야 함', () => {
      const error = new ValidationError('Invalid input');

      expect(error.message).toBe('Invalid input');
      expect(error.name).toBe('ValidationError');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApplicationError);
      expect(error).toBeInstanceOf(ValidationError);
    });
  });

  describe('NotFoundError', () => {
    it('리소스 이름과 함께 NotFoundError를 생성해야 함', () => {
      const error = new NotFoundError('User');

      expect(error.message).toBe('User not found');
      expect(error.name).toBe('NotFoundError');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApplicationError);
      expect(error).toBeInstanceOf(NotFoundError);
    });

    it('다양한 리소스 타입에 대해 동작해야 함', () => {
      const userError = new NotFoundError('User');
      const postError = new NotFoundError('Post');
      const commentError = new NotFoundError('Comment');

      expect(userError.message).toBe('User not found');
      expect(postError.message).toBe('Post not found');
      expect(commentError.message).toBe('Comment not found');
    });
  });

  describe('UnauthorizedError', () => {
    it('기본 메시지로 UnauthorizedError를 생성해야 함', () => {
      const error = new UnauthorizedError();

      expect(error.message).toBe('Unauthorized access');
      expect(error.name).toBe('UnauthorizedError');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApplicationError);
      expect(error).toBeInstanceOf(UnauthorizedError);
    });

    it('커스텀 메시지로 UnauthorizedError를 생성해야 함', () => {
      const error = new UnauthorizedError('Token expired');

      expect(error.message).toBe('Token expired');
      expect(error.name).toBe('UnauthorizedError');
    });
  });
});
