import { IdempotencyInterceptor } from './idempotency.interceptor';

describe('IdempotencyInterceptor', () => {
  it('should be defined', () => {
    expect(new IdempotencyInterceptor()).toBeDefined();
  });
});
