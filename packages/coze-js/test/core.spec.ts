import { fetchAPI } from '../src/fetcher';
import { APIError } from '../src/error';
import { APIClient } from '../src/core';

vi.mock('../src/fetcher');

describe('APIClient', () => {
  const mockConfig = {
    baseURL: 'https://api.example.com',
    token: 'test-token',
    debug: true,
  };

  let client: APIClient;

  beforeEach(() => {
    client = new APIClient(mockConfig);
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with correct values', () => {
      expect(client.baseURL).toBe(mockConfig.baseURL);
      expect(client.token).toBe(mockConfig.token);
      expect(client.debug).toBe(mockConfig.debug);
    });
  });

  describe('makeRequest', () => {
    const mockResponse = {
      status: 200,
      headers: { 'content-type': 'application/json' },
    };

    it('should make a successful request', async () => {
      const mockJson = vi.fn().mockResolvedValue({ code: 0, data: 'success' });
      (fetchAPI as vi.Mock).mockResolvedValue({
        response: mockResponse,
        json: mockJson,
      });

      const result = await client.makeRequest('/test', 'GET');
      expect(result).toEqual({ code: 0, data: 'success' });
      expect(fetchAPI).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            authorization: 'Bearer test-token',
          }),
        }),
      );
    });

    it('should handle errors', async () => {
      const mockJson = vi
        .fn()
        .mockResolvedValue({ code: 400, msg: 'Bad Request' });
      (fetchAPI as vi.Mock).mockResolvedValue({
        response: { ...mockResponse, status: 400 },
        json: mockJson,
      });

      await expect(client.makeRequest('/test', 'GET')).rejects.toThrow(
        APIError,
      );
    });

    it('should handle streaming responses', async () => {
      const mockStream = vi.fn().mockReturnValue('stream-data');
      (fetchAPI as vi.Mock).mockResolvedValue({
        response: {
          ...mockResponse,
          headers: { 'content-type': 'application/octet-stream' },
        },
        stream: mockStream,
      });

      const result = await client.makeRequest('/test', 'GET', undefined, true);
      expect(result).toBe('stream-data');
      expect(mockStream).toHaveBeenCalled();
    });
  });

  describe('HTTP methods', () => {
    beforeEach(() => {
      vi.spyOn(client as any, 'makeRequest').mockResolvedValue('success');
    });

    it('should make a GET request', async () => {
      await client.get('/test', { param: 'value' });
      expect(client.makeRequest).toHaveBeenCalledWith(
        '/test?param=value',
        'GET',
        undefined,
        undefined,
        undefined,
      );
    });

    it('should make a POST request', async () => {
      await client.post('/test', { data: 'value' });
      expect(client.makeRequest).toHaveBeenCalledWith(
        '/test',
        'POST',
        { data: 'value' },
        false,
        undefined,
      );
    });

    it('should make a PUT request', async () => {
      await client.put('/test', { data: 'value' });
      expect(client.makeRequest).toHaveBeenCalledWith(
        '/test',
        'PUT',
        { data: 'value' },
        undefined,
        undefined,
      );
    });

    it('should make a DELETE request', async () => {
      await client.delete('/test');
      expect(client.makeRequest).toHaveBeenCalledWith(
        '/test',
        'DELETE',
        undefined,
        undefined,
        undefined,
      );
    });
  });

  describe('debugLog', () => {
    it('should log when debug is true', () => {
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation();
      client.debugLog('test message');
      expect(consoleSpy).toHaveBeenCalledWith('test message');
    });

    it('should not log when debug is false', () => {
      client.debug = false;
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation();
      client.debugLog('test message');
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });
});
