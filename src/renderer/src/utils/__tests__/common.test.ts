import { describe, it, expect } from 'vitest';
import { endpointId } from '../common';

describe('endpointId', () => {
  it('should return string when source is a string', () => {
    expect(endpointId('node-1')).toBe('node-1');
  });

  it('should return cell id when source is an object', () => {
    expect(endpointId({ cell: 'node-2', port: 'port-1' })).toBe('node-2');
  });
});
