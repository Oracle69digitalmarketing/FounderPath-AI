# FounderPath AI: Dual-Engine Architecture

FounderPath AI is built on a "Coordinator-Worker" agentic pattern designed for reliable economic modeling.

## 🧠 The Dual-Engine Pattern

The system separates "Discovery" from "Architecture" to ensure that the user's vocational reality is fully understood before capital is committed to a recommendation.

### 1. SkillThinker™ (The Auditor)
- **Role**: Fact-finding and Nuance Extraction.
- **Model Paths**: 
  - **Gemini 3 Flash (Default)**: Used for rapid multimodal processing of voice notes (mp3/wav) and certificates (jpg/png).
  - **NVIDIA NIM (Production Scale)**: Optimized for high-throughput text-based skill taxonomy mapping.
- **Outputs**: Verified `SkillProfile` JSON.

### 2. AutoThinker™ (The Architect)
- **Role**: Creative Reasoning and Financial Modeling.
- **Complexity**: High-reasoning tasks. It performs "Local Market Lookup" simulations to verify if a catering skill in Ibadan has a different CPM (Cost Per Meal) than in Lagos.
- **Outputs**: Exhaustive `VentureRecommendation` (Plan, Pitch, GTM, Budget).

## 🚀 Scaling Path: NVIDIA NIM Integration

To address the **BCT 3.0 Bluechip Sponsorship**, the architecture includes a `ModelProvider` abstraction in `/src/lib/llm.ts`. 

- **Enterprise Readiness**: For production deployments requiring 100k+ blueprints per day, the system is designed to route text-only reasoning to **NVIDIA NIM (Llama-3.1-Nemotron-70B)**.
- **Differentiator**: Using NIM allows FounderPath to run locally within Nigerian data centers, reducing latency and ensuring data sovereignty for micro-venture founders.

## 🛠 Orchestration Flow

1. **User Input** (Voice/Text/Image) -> `Coordinator.ts`
2. `Coordinator` -> `SkillThinker.audit()`
3. **If Vague**: `SkillThinker` triggers "Discovery Loop" (Questions).
4. **If Sufficient**: `Coordinator` -> `AutoThinker.architect()`
5. **Final Blueprint** -> Firestore + Real-time Nudge Center.

---
*Architectural Document v1.2*
*BCT 3.0 Hackathon Submission*
