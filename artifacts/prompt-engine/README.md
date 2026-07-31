# Prompt Reasoning Engine

A focused tool for people who think carefully about how they communicate with AI. Describe a situation or goal, and the app generates an optimized prompt for it. Then, using AI reasoning, it produces a progressively better prompt on each iteration — showing the reasoning behind each improvement.

## Design Direction

**Layout Paradigm:** Dense cockpit — information-rich cards with clear hierarchy

**Mood Aesthetic:** Signal from noise — deep indigo backgrounds with electric cyan accents

**Typography:**
- Display: Space Grotesk
- Monospace: IBM Plex Mono

**Color Story:** Deep space blues (HSL 225 28% 8% for dark backgrounds) with vivid cyan highlights (HSL 193 95% 52%) — the color of insight breaking through darkness.

**Motion:** Staggered reveals, streaming text animations with typing cursors, subtle glow pulses during generation

## Features

- **Session Management:** Create and manage multiple prompt reasoning sessions
- **Iterative Refinement:** Generate progressively better prompts through AI-powered iteration
- **Real-time Streaming:** Watch as the AI reasons through improvements and generates new prompts character-by-character
- **Focus Areas:** Direct the refinement process by focusing on specific aspects (clarity, specificity, tone, context, constraints, examples, format)
- **User Feedback:** Provide custom feedback to guide the next iteration
- **Settings:** Configure API credentials and model preferences

## Routes

- `/` — Home / Sessions list
- `/sessions/:id` — Session workspace
- `/settings` — API configuration

## Technical Stack

- React + TypeScript
- Wouter for routing
- TanStack Query for data management
- Tailwind CSS + shadcn/ui components
- SSE streaming for real-time prompt generation

## Key Interactions

1. **Create Session:** Opens a dialog to input title and situation
2. **View Session:** Displays all iterations with reasoning and prompts
3. **Generate Iteration:** Streams new iteration in real-time (auto-triggers on first visit if no iterations exist)
4. **Copy Prompt:** One-click copy to clipboard with visual feedback
5. **Refine:** Optional user feedback and focus area selection for targeted improvement
