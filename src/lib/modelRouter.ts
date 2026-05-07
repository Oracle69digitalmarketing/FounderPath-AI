
export type ModelProvider = 'gemini' | 'nim';

interface ModelConfig {
  provider: ModelProvider;
  endpoint: string;
  apiKey: string;
  model: string;
}

export type AgentType = 'skill' | 'auto';

export function getModelConfig(agent?: AgentType): ModelConfig {
  const provider = (import.meta.env.VITE_MODEL_PROVIDER as ModelProvider) || 'gemini';

  if (provider === 'nim') {
    // NVIDIA NIM is often used for high-throughput or specific text tasks
    return {
      provider: 'nim',
      endpoint: import.meta.env.VITE_NIM_ENDPOINT || 'https://integrate.api.nvidia.com/v1',
      apiKey: import.meta.env.VITE_NVIDIA_API_KEY || '',
      model: import.meta.env.VITE_NIM_MODEL || 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning',
    };
  }

  // default Gemini
  // Use Flash for Skill Audit (multimodal/fast), potentially Pro for AutoThinker (complex reasoning)
  let model = import.meta.env.VITE_GEMINI_MODEL || 'gemini-3-flash-preview';
  
  if (agent === 'auto') {
    // If we had a specific model for high-reasoning, we'd use it here
    // For now, using the most capable one available or configured
    model = import.meta.env.VITE_AUTOTHINKER_MODEL || model;
  }

  return {
    provider: 'gemini',
    endpoint: '',
    apiKey: process.env.GEMINI_API_KEY || '',
    model: model,
  };
}
