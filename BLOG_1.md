# Running LLMs in the Browser – A Proof of Concept with WebLLM

As AI continues to evolve, the demand for **fast, cost-effective, and privacy-conscious** applications is growing. Traditionally, large language models (LLMs) like ChatGPT run on powerful and expensive backend servers, requiring constant API calls for inference. However, **WebLLM** introduces a new paradigm: running LLMs **directly in the browser** using WebGPU, eliminating the need for cloud-based requests.

While this technology presents exciting possibilities, it is still in its early stages. In this post, we will walk through our **proof of concept**, discussing its capabilities, limitations, and what improvements are needed for WebLLM to become a viable solution for production applications.

## What is WebLLM?

WebLLM is a framework that enables **local execution of LLMs within the browser** using WebGPU acceleration. Instead of relying on external servers, users can download a **compact model**, such as **Llama 3 (8 billion parameters)**, and perform inference directly on their machines.

### Key Considerations:

- **Model size and download time** – The initial download can be significant; in our case, it took **45 minutes**.
- **Hardware dependency** – Requires a GPU-compatible browser and adequate system resources. Not all browsers support WebGPU, which can limit accessibility and performance across different devices.
- **Mobile device limitations** – WebLLM is currently **not supported on iPhones and most Android devices**, making it less accessible for mobile applications.
- **Inference performance** – While functional, it is not yet as reliable as larger cloud-hosted models.

## The Proof of Concept

We developed a **chat interface** using **ReactJS** that determines whether to use **WebLLM or OpenAI’s API** based on the complexity of the user’s query.

### How It Works:

1. **Simple queries (e.g., “What is the capital of the United States?”)** are processed directly in the browser using WebLLM.
2. **Complex queries (e.g., “What is the purpose of life?”)** are routed to OpenAI’s API.

This hybrid approach balances **cost efficiency and responsiveness**, leveraging WebLLM where possible while ensuring accuracy for more nuanced questions.

## First-Time User Experience

One of the key challenges with WebLLM is the **initial setup**.

- **Large model downloads** can be time-consuming, depending on internet speed. In our case, the initial download took over **45 minutes**, which could vary based on network conditions and hardware capabilities.
- **First-time execution requires model preparation**, which introduces an additional delay.
- **Subsequent runs benefit from browser caching (IndexedDB)**, eliminating the need for repeated downloads. However, even with caching, each page reload requires reading from the cache, which can take a few seconds.

While caching improves long-term usability, the onboarding experience needs refinement for broader adoption.

## Challenges and Limitations

### Prompt for Complexity Analysis

To determine whether a query should be handled by WebLLM or OpenAI, we implemented the following prompt:

```
Analyze the complexity of the following user prompt and decide which LLM should handle it:
  - "webllm" for very simple queries that are suitable for small, in-browser models.
  - "openai" for complex queries that require a more advanced model.

Your response must follow this exact format:
LLM: [webllm or openai]
Explanation: [a brief explanation of your decision]

User Prompt:
```

While WebLLM introduces a compelling approach to local inference, it remains **unpredictable** in certain cases.

For example, when asked:
👉 *“What is the sum of 2 + 2?”*

Instead of processing this simple arithmetic question locally, WebLLM **classified it as complex** and forwarded it to OpenAI’s API. The inconsistency in inference logic highlights areas that require further optimization.

However, this **unreliability is more related to the smaller models** than to WebLLM itself. Even if the same smaller models were running server-side, we would likely see similar unpredictability in responses.

Additionally, performance varies significantly based on hardware capabilities, making standardization across user environments a challenge.

## Enhancing Control with Mentions

To improve user experience, we implemented a **mention-based system**:

- If a user types `@WebLLM`, the system **forces WebLLM to generate the response**.
- Without a mention, the system dynamically selects either WebLLM or OpenAI.

This gives users greater control over inference execution and helps mitigate some of the unpredictability in query classification.

## Potential Future Use Cases

While WebLLM is still evolving, several **real-world applications** could emerge as it matures:

- **Offline AI Applications** – Running WebLLM in offline mode on installed browsers or mobile apps would enable AI-powered interactions in areas with **no internet access**. However, running WebLLM on mobile devices presents significant challenges due to memory constraints. One user reported: "Nice, had to enable experimental WebGPU in chrome://flags on my Samsung Galaxy S24, but then it worked. Unfortunately, 8GB RAM seems not enough for loading a 4GB model because OS and apps already occupy more than 4GB. The chat crashes while loading the model from cache." This highlights the need for optimizations in model size and memory management for broader adoption on mobile platforms.

- **Smaller, Task-Specific Models** – One way to address the memory constraint issue reported by users is by using **smaller, goal-oriented models** that are optimized for specific tasks. Instead of running a single large model, deploying multiple lightweight models tailored for different functionalities could improve efficiency and usability on resource-constrained devices.

- **Writing Assistance Tools** – WebLLM could power a **privacy-first** browser extension for tasks like text rephrasing, grammar correction, or auto-suggestions.

- **Summarization of Web Content** – Users could highlight text on a webpage to generate concise summaries. A **chat-based interface** could enhance interactivity by answering user-specific questions about the content.

- **Privacy-Preserving AI Proxy** – A hybrid WebLLM/OpenAI API solution could preprocess user queries, masking **personally identifiable information (PII)** before forwarding them to external APIs. This would ensure compliance with **GDPR, HIPAA**, and other data privacy regulations.

## Code Examples from the Proof of Concept

### Model Configuration:

```javascript
export const MODEL = {
  DEFAULT_CONFIG: {
    MODEL: 'gpt-4',
    TEMPERATURE: 0.3,
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
```

### Creating the WebLLM Component:

```javascript
CreateMLCEngine(MODEL.WEB_LLM.DEFAULT_MODEL, { 
      initProgressCallback,
      appConfig: {
        // This is key for performance
        useIndexedDBCache: true, 
        model_list: [
            { 
              model: MODEL.WEB_LLM.MODEL_URL,
              model_id: MODEL.WEB_LLM.DEFAULT_MODEL,
              model_lib: MODEL.WEB_LLM.MODEL_LIB,
              vram_required_MB: MODEL.WEB_LLM.VRAM_REQUIRED_MB,
              low_resource_required: true,
              overrides: {
                context_window_size: MODEL.WEB_LLM.CONTEXT_WINDOW_SIZE,
              },
            },
        ],
      }
     }).then(engine => {  
      setEngine(engine);
      setReady(true);
    }).catch(error => {
      console.error('Error initializing WebLLM:', error);
    });
```

### Chat Handling:

```javascript
const chatMessages = [
    { role: "system", content: "You are a helpful AI assistant." },
    ...currentMessages.map(msg => ({
      role: msg.isUser ? "user" : "assistant",
      content: msg.text
    })),
    { role: "user", content: message }
];

const chunks = await engine.chat.completions.create({
    messages: chatMessages,
    temperature: 0.3,
    max_tokens: 1000,
    stream: true
});

let streamedText = '';
for await (const chunk of chunks) {
    streamedText += chunk.choices[0]?.delta.content || '';
    onUpdate(streamedText);
}
```

## Future Enhancements

A key enhancement we plan to explore is **fine-tuning a model specifically for PII redaction** as a privacy feature. This would enable WebLLM to preprocess user queries by removing sensitive details before sending them to an external API like OpenAI. By automatically detecting and replacing personally identifiable information (PII) with placeholders, we can ensure compliance with privacy regulations such as GDPR and HIPAA while maintaining response accuracy. This capability would be particularly useful in industries like healthcare, finance, and legal services where data security is critical.

## What’s Next?

We will continue refining this proof of concept, testing edge cases, and exploring optimizations. As WebLLM matures, we will share further insights on its viability for real-world applications.

For now, it remains **an exciting area of experimentation** that could redefine how AI-powered frontend architectures operate. If you have thoughts or questions, we’d love to hear them!


