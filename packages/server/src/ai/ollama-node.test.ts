import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { OllamaNodeExecutor } from './ollama-node.js';

vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

describe('OllamaNodeExecutor', () => {
  let executor: OllamaNodeExecutor;

  beforeEach(() => {
    executor = new OllamaNodeExecutor();
    vi.clearAllMocks();
  });

  it('should execute Ollama node with basic prompt', async () => {
    const mockResponse = {
      data: {
        model: 'gpt-oss-20b',
        message: {
          content: 'This is a test response'
        },
        created_at: '2025-09-30T12:00:00Z',
        done: true,
        total_duration: 1000000000,
        load_duration: 500000000,
        prompt_eval_count: 10,
        eval_count: 20
      }
    };

    mockedAxios.post.mockResolvedValue(mockResponse);

    const context = { 
      workflowId: 'test-workflow',
      executionId: 'test-exec',
      data: {},
      logs: []
    };
    const nodeData = {
      config: {
        model: 'gpt-oss-20b',
        prompt: 'Hello, AI!'
      }
    };

    const result = await executor.execute(context, nodeData);

    expect(result.success).toBe(true);
    expect(result.response).toBe('This is a test response');
    expect(result.model).toBe('gpt-oss-20b');
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://localhost:11434/api/chat',
      expect.objectContaining({
        model: 'gpt-oss-20b',
        messages: expect.arrayContaining([
          expect.objectContaining({ role: 'user', content: 'Hello, AI!' })
        ])
      }),
      expect.any(Object)
    );
  });

  it('should replace variables in prompt', async () => {
    const mockResponse = {
      data: {
        model: 'gpt-oss-20b',
        message: { content: 'Response' },
        done: true
      }
    };

    mockedAxios.post.mockResolvedValue(mockResponse);

    const context = { 
      workflowId: 'test-workflow',
      executionId: 'test-exec',
      data: { 
        user: { name: 'John' },
        message: 'Test message'
      },
      logs: []
    };
    const nodeData = {
      config: {
        prompt: 'Hello ${user.name}, you said: ${message}'
      }
    };

    await executor.execute(context, nodeData);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({ 
            role: 'user', 
            content: 'Hello John, you said: Test message' 
          })
        ])
      }),
      expect.any(Object)
    );
  });

  it('should use custom base URL when provided', async () => {
    const mockResponse = {
      data: {
        model: 'gpt-oss-20b',
        message: { content: 'Response' },
        done: true
      }
    };

    mockedAxios.post.mockResolvedValue(mockResponse);

    const context = { 
      workflowId: 'test-workflow',
      executionId: 'test-exec',
      data: {},
      logs: []
    };
    const nodeData = {
      config: {
        baseUrl: 'http://custom-ollama:11434',
        prompt: 'Test'
      }
    };

    await executor.execute(context, nodeData);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://custom-ollama:11434/api/chat',
      expect.any(Object),
      expect.any(Object)
    );
  });

  it('should throw error when prompt is missing', async () => {
    const context = { 
      workflowId: 'test-workflow',
      executionId: 'test-exec',
      data: {},
      logs: []
    };
    const nodeData = { config: {} };

    await expect(executor.execute(context, nodeData)).rejects.toThrow(
      'Prompt is required for Ollama AI node'
    );
  });

  it('should handle connection refused error', async () => {
    mockedAxios.post.mockRejectedValue({ code: 'ECONNREFUSED' });

    const context = { 
      workflowId: 'test-workflow',
      executionId: 'test-exec',
      data: {},
      logs: []
    };
    const nodeData = {
      config: { prompt: 'Test' }
    };

    await expect(executor.execute(context, nodeData)).rejects.toThrow(
      'Cannot connect to Ollama at http://localhost:11434'
    );
  });

  it('should apply temperature and system prompt', async () => {
    const mockResponse = {
      data: {
        model: 'gpt-oss-20b',
        message: { content: 'Response' },
        done: true
      }
    };

    mockedAxios.post.mockResolvedValue(mockResponse);

    const context = { 
      workflowId: 'test-workflow',
      executionId: 'test-exec',
      data: {},
      logs: []
    };
    const nodeData = {
      config: {
        prompt: 'Test',
        systemPrompt: 'You are a coding assistant',
        temperature: 0.9
      }
    };

    await executor.execute(context, nodeData);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        messages: expect.arrayContaining([
          { role: 'system', content: 'You are a coding assistant' },
          { role: 'user', content: 'Test' }
        ]),
        options: { temperature: 0.9 }
      }),
      expect.any(Object)
    );
  });
});
