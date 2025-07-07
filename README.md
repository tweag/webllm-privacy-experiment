# WebLLM Privacy Experiment

A privacy-first React application that demonstrates intelligent routing between local browser-based AI inference (WebLLM) and cloud-based models (OpenAI) with automatic PII redaction and complexity analysis.

## What is WebLLM?

[WebLLM](https://github.com/mlc-ai/web-llm) is a framework that enables **local execution of Large Language Models (LLMs) directly in the browser** using WebGPU acceleration. Instead of relying on external servers, users can download compact models and perform inference directly on their machines.

### How WebLLM Works

- **WebGPU Acceleration**: Uses WebGPU kernels for high-performance computation, maintaining approximately 85% of native performance
- **Cross-Platform GPU Support**: WebGPU acts as an abstraction layer, running efficiently across different GPUs (NVIDIA, AMD, Apple Metal)
- **Browser Caching**: Model weights and WebAssembly libraries are downloaded once and cached in IndexedDB for future use
- **Privacy-First**: All inference happens locally - your data never leaves your browser

## System Requirements

### Hardware Requirements
- **GPU**: Modern GPU with WebGPU support (integrated or dedicated)
- **RAM**: Minimum 8GB system RAM (4GB+ available for the browser)
- **Storage**: ~700MB-1GB free space for model caching

### Browser Support
- **Chrome/Edge**: Version 113+ with WebGPU enabled
- **Firefox**: Experimental WebGPU support (requires enabling in `about:config`)
- **Safari**: WebGPU support in Safari 17+

**Note**: WebLLM is currently **not supported on most mobile devices** including iPhones and many Android devices due to memory constraints and limited WebGPU support.

### Enabling WebGPU
If WebGPU is not available by default:
1. **Chrome/Edge**: Go to `chrome://flags` and enable "Unsafe WebGPU"
2. **Firefox**: Go to `about:config` and set `dom.webgpu.enabled` to `true`

## Installation & Setup

### Prerequisites
- Node.js 18+ and npm/yarn
- A modern browser with WebGPU support

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/webllm-privacy-experiment.git
   cd webllm-privacy-experiment
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables** (optional for OpenAI integration)
   ```bash
   cp .env.example .env
   # Add your OpenAI API key
   echo "VITE_OPENAI_API_KEY=your-api-key-here" >> .env
   ```

4. **Start the development server**
   ```bash
   npm run dev
   # or
   npm start
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

### Available Scripts

- `npm run dev` / `npm start` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## First-Time Setup Experience

When you first launch the application, WebLLM will download and cache the AI model:

- **Download Size**: ~700MB (Llama-3.2-1B model)
- **Download Time**: Varies by connection speed:
  - 1 Gbps fiber: ~30 seconds
  - 50 Mbps cable: ~3-4 minutes
  - Rural 4G (12 Mbps): ~20-45 minutes

The model is cached in your browser's IndexedDB, so subsequent visits will load instantly.

## Key Features

### 1. **Intelligent Model Routing**
The application automatically analyzes query complexity and routes requests to the most appropriate model:

- **Simple queries** → WebLLM (local, private, fast)
- **Complex queries** → OpenAI (cloud-based, more capable)

### 2. **Manual Model Selection**
Override automatic selection using mentions:

```
@webllm What is the capital of France?
@openai Explain quantum computing in detail
```

### 3. **Privacy Redaction**
For queries sent to OpenAI, the application automatically:

- Detects personally identifiable information (PII)
- Replaces names with placeholders (e.g., `PERSON_1`, `ORG_1`)
- Sends redacted query to OpenAI
- Restores original names in the response

**Example:**
```
Input: "Tell John Smith at Microsoft about our new product"
Sent to OpenAI: "Tell PERSON_1 at ORG_1 about our new product"
Response: "I'll help you tell John Smith at Microsoft about your new product"
```

### 4. **Complexity Analysis**
The system uses a 5-point complexity scale:
- **1-2**: Simple queries (handled by WebLLM)
- **3-5**: Complex queries (sent to OpenAI)

**Complexity Factors:**
- Word count and query length
- Domain-specific terminology
- Multi-step reasoning requirements
- Context complexity

## Usage Examples

### Basic Chat
```
User: What is 2+2?
→ WebLLM: 2+2 equals 4.
```

### Complex Query
```
User: Explain the implications of quantum computing on cryptography
→ OpenAI: [Detailed explanation about quantum computing and its impact on cryptographic systems...]
```

### Privacy Redaction
```
User: Draft an email to Sarah Johnson at Apple about our collaboration
→ Redacted: "Draft an email to PERSON_1 at ORG_1 about our collaboration"
→ Response: "Here's a draft email to Sarah Johnson at Apple about your collaboration..."
```

### Model Override
```
User: @webllm Write a simple poem about cats
→ WebLLM: [Generates poem locally]

User: @openai Write a complex analysis of modern literature
→ OpenAI: [Generates detailed analysis via cloud API]
```

## Technical Architecture

### Core Components

- **`useChatModel`**: Main orchestration hook
- **`useWebLlm`**: WebLLM integration and local inference
- **`useOpenAi`**: OpenAI API integration
- **`useComplexityAnalysis`**: Query complexity evaluation
- **`usePrivacyRedaction`**: PII detection and redaction

### Model Configuration
```typescript
MODEL: {
  WEB_LLM: {
    DEFAULT_MODEL: 'Llama-3.2-1B-Instruct-q4f32_1-MLC',
    VRAM_REQUIRED_MB: 1128.82,
    CONTEXT_WINDOW_SIZE: 4096
  }
}
```

### Project Structure

```
src/
├── components/     # React components
├── hooks/         # Custom React hooks
├── models/        # Type definitions and interfaces
├── utils/         # Utility functions
├── config/        # Configuration files
└── assets/        # Static assets
```

## Performance Characteristics

### WebLLM (Local)
- **First Token**: < 1 second
- **Privacy**: Complete privacy (no network requests)
- **Cost**: Free after initial download
- **Reliability**: Good for simple queries

### OpenAI (Cloud)
- **First Token**: ~8 seconds (including network latency)
- **Privacy**: PII redacted before sending
- **Cost**: Pay-per-use API calls
- **Reliability**: Excellent for complex queries

## Privacy Benefits

1. **Local Processing**: Simple queries never leave your browser
2. **PII Redaction**: Personal information is automatically stripped from cloud requests
3. **Selective Routing**: Only complex queries that require advanced capabilities are sent to the cloud
4. **Compliance Ready**: Helps meet GDPR, HIPAA, and other privacy regulations

## Limitations & Considerations

### WebLLM Limitations
- **Model Size**: Currently limited to smaller models (1B-8B parameters)
- **Hardware Dependency**: Requires WebGPU-compatible hardware
- **Mobile Support**: Limited support on mobile devices
- **Consistency**: May be unpredictable for edge cases

### General Limitations
- **Initial Download**: Large one-time download required
- **Browser Compatibility**: Limited to WebGPU-enabled browsers
- **Resource Usage**: Consumes significant GPU memory during inference

## Future Enhancements

- **Fine-tuned PII Models**: Specialized models for better privacy redaction
- **Mobile Optimization**: Smaller models for mobile device compatibility
- **Offline Mode**: Complete offline operation for privacy-sensitive environments
- **Multi-Model Support**: Support for different specialized models

## Development

This project uses ESLint for code quality. The configuration can be expanded to enable type-aware lint rules as described in the original template:

```js
export default tseslint.config({
  languageOptions: {
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [WebLLM](https://github.com/mlc-ai/web-llm) for enabling browser-based LLM inference
- [OpenAI](https://openai.com) for providing cloud-based AI capabilities
- The React and TypeScript communities for excellent development tools

## Support

If you encounter issues:

1. **WebGPU Support**: Check if your browser supports WebGPU
2. **Memory Issues**: Ensure you have sufficient RAM (8GB+ recommended)
3. **Network Issues**: Verify internet connection for initial model download
4. **Browser Compatibility**: Try Chrome/Edge with WebGPU enabled

For technical issues, please open an issue on GitHub with:
- Browser version and WebGPU support status
- System specifications (RAM, GPU)
- Error messages or console logs