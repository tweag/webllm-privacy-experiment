/**
 * Application Constants
 */

// Model Constants
export const MODEL = {
  DEFAULT_CONFIG: {
    MODEL: 'gpt-4',
    TEMPERATURE: 0.7,
    MAX_TOKENS: 1000,
    API_URL: 'https://api.openai.com/v1/chat/completions'
  },
  AVAILABLE_MODELS: [
    { value: 'gpt-4', label: 'GPT-4' },
    { value: 'Hermes-2-Pro-Llama-3-8B-q4f16_1-MLC', label: 'Hermes 2 Pro' }
  ],
  WEB_LLM: {
    DEFAULT_MODEL: 'Llama-3.2-1B-Instruct-q4f32_1-MLC',
    MODEL_URL: 'https://huggingface.co/mlc-ai/Llama-3.2-1B-Instruct-q4f32_1-MLC',
    MODEL_LIB: 'https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_48/Llama-3.2-1B-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm',
    VRAM_REQUIRED_MB: 1128.82,
    CONTEXT_WINDOW_SIZE: 4096
  }
};

// Chat Constants
export const CHAT = {
  MAX_TOKENS: 500,
  MESSAGE_SOURCE: {
    USER: 'user',
    AI: 'ai',
    ANALYZING: 'analyzing'
  }
}; 