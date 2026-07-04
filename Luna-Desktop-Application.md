# Luna Desktop Application Hackathon

Luna is an AI-powered personal desktop assistant that lives directly on the user's computer. Unlike traditional cloud-based AI assistants, Luna is designed to run primarily using local AI models, giving users a faster, more private, and personalized experience.

The vision behind Luna is to create an assistant that can understand conversations, remember user preferences, perform tasks, interact with desktop applications, and help users organize everyday life from one place.

Rather than being just another chatbot, Luna should feel like an intelligent desktop companion that can assist users throughout their day while keeping as much processing as possible on the user's own device.

For this assignment, participants will build a functional desktop prototype that demonstrates how a local AI assistant can combine conversation, automation, and personalization into a single experience.

The application should be packaged as a runnable desktop application (.exe for Windows or a native macOS application) that runs locally on the user's machine.

---

# 🎯 What We Need

Create a desktop AI assistant that demonstrates how a personal AI can help users complete real-world tasks directly from their own computer.

The objective is **not** to build a production-ready assistant.

Instead, participants should focus on building a polished prototype that showcases excellent product thinking, strong AI integration, and practical desktop automation.

One of the most important parts of this assignment is selecting an appropriate open-source AI model that can run efficiently on consumer hardware. Participants are encouraged to research different local models and choose the one that best balances performance, quality, and hardware requirements.

---

# Scope Rules (Important)

- Build a desktop application that runs locally.
- The application should be packaged as a runnable executable.
- AI inference should happen locally whenever possible using an open-source model.
- Participants are encouraged to research and choose the best local model for their implementation.
- Cloud APIs may be used only where absolutely necessary.
- Desktop integrations should use appropriate operating system APIs.
- Features may be simplified but should work end-to-end.
- Product quality and overall user experience will carry more weight than the total number of implemented features.
- Participants are encouraged to extend the experience with their own ideas.

---

# 💻 Desktop Application Flow

## 1. Welcome Experience

When users launch Luna, they should immediately understand what the assistant is capable of.

Create a clean onboarding experience that communicates ideas such as:

- Your AI assistant that runs locally
- Privacy-first AI
- Intelligent desktop automation
- Personalized conversations
- Control your digital workspace

These are only examples. Participants are encouraged to create their own onboarding experience.

---

## 2. Initial Setup

Allow users to configure Luna before starting.

Possible setup includes:

- User name
- AI assistant name
- Preferred language
- Theme selection
- AI model selection (if multiple models are supported)

Participants may simplify this flow if needed.

---

## 3. AI Chat Experience

This should be the primary experience of the application.

Users should be able to:

- Chat naturally
- Ask questions
- Continue conversations
- Upload files
- Upload images
- Receive streamed responses
- Start new conversations
- View conversation history

The interface should feel responsive and polished.

---

## 4. Local AI Processing

One of the core objectives of this assignment.

Participants should integrate an open-source model capable of running locally.

Examples include:

- Llama
- Gemma
- Qwen
- Phi
- DeepSeek
- Mistral
- Any other suitable local model

Participants should choose the model they believe provides the best experience for this use case.

Mock responses should only be used if hardware limitations prevent complete implementation.

---

## 5. Personal Memory

Luna should gradually become personalized.

Possible capabilities include:

- Remember user preferences
- Remember favorite applications
- Remember writing style
- Remember important information
- Remember previous conversations

Users should always be able to review or remove stored memories.

---

## 6. Desktop Task Assistant

Allow Luna to perform useful desktop tasks.

Examples include:

- Create notes
- Draft emails
- Summarize documents
- Organize files
- Rename files
- Search local files
- Create reminders
- Generate to-do lists
- Launch installed applications

Participants are encouraged to implement whichever tasks best demonstrate the product vision.

---

## 7. Desktop Integrations

Allow Luna to interact with commonly used applications.

Possible integrations include:

- Calendar
- Email
- Browser
- Local files
- Music player
- Notes
- Contacts

Whenever an action requires access to another application, Luna should request user permission before proceeding.

---

## 8. Intelligent Automation

This is one of the primary evaluation areas.

Users should be able to ask Luna to complete tasks such as:

- "Summarize this PDF."
- "Create a reminder for tomorrow."
- "Find my resume."
- "Open Spotify."
- "Organize my Downloads folder."

Participants are encouraged to build an intelligent action pipeline instead of relying only on conversational responses.

---

## 9. Voice Experience (Optional)

Participants may add voice capabilities such as:

- Speech-to-text
- Text-to-speech
- Wake word detection
- Voice conversations

Voice interactions should feel natural whenever possible.

---

## 10. Personalization & Settings

Allow users to customize their assistant.

Examples include:

- Assistant name
- Theme
- Font size
- AI personality
- Response length
- Memory management

---

## 11. Privacy Dashboard

Since Luna is privacy-focused, users should have visibility into what the assistant can access.

Possible features include:

- Granted permissions
- Connected applications
- Stored memories
- Activity history
- Delete personal data

---

## 12. Smart Device Integration (Bonus)

This is completely optional but will receive significant bonus consideration.

Participants may integrate Luna with compatible smart devices or IoT platforms.

Examples include:

- Smart lights
- Smart plugs
- Smart speakers
- Home Assistant
- Philips Hue
- Homebridge
- MQTT devices
- Smart thermostats

The focus is not on supporting every ecosystem but demonstrating how Luna could extend beyond the desktop.

---

# 🧰 Tech Expectations

### Desktop Application (Required)

Participants may use any desktop framework, including:

- Electron
- Tauri
- Flutter Desktop
- .NET (WPF, WinUI)
- Qt
- Native desktop frameworks

The final application should be distributed as a runnable executable for the target operating system.

---

### Backend

Participants may use:

- Node.js
- Python
- Rust
- Go
- C#
- Local services where appropriate

---

### AI

Participants are encouraged to research and integrate an open-source model that runs locally.

Possible options include:

- Ollama
- llama.cpp
- LM Studio
- LocalAI
- Transformers
- GGUF models

The choice of model should be justified based on usability, speed, and hardware requirements.

---

### Storage

Participants may use:

- SQLite
- Local JSON
- PostgreSQL
- MongoDB
- Any lightweight local database

---

# 📝 Points to Note

- UI/UX quality is an important evaluation factor.
- The application should run locally on the user's machine.
- Local AI processing is strongly encouraged.
- Participants should carefully choose an open-source model suitable for consumer hardware.
- Core user flows should work end-to-end.
- Desktop automation should be safe and permission-based.
- AI functionality should feel useful rather than purely conversational.
- Participants are encouraged to use AI development tools to improve productivity.
- Product thinking, engineering quality, AI integration, and overall user experience will carry more weight than the total number of implemented features.
- Creativity is highly encouraged. If you believe a feature makes Luna more useful or delightful, feel free to build beyond the scope of this document

# 📤 Submission Instructions

## Required Submission

### 1. Demo Video (3–5 Minutes)

Walk through your entire product.

### 2. Functional Mobile Application

Submit one of the following:

- Windows executable (.exe) or installer (.msi) - Primary
- macOS application (.app) or installer (.dmg)

---

## Source Code

**Source code submission is strictly not required.**

---

## Submission Group

**The Telegram submission group will be attached here.**

Link:→ https://t.me/+XqlCfvOuPOoxYjBl

---

# 🏆 **Prizes and Opportunities**

- 🥇 **Hackathon Winner**:
  - The most functional and user-friendly platform creator will receive a **full-time job offer** as a **founding member with a high CTC and base pay**.
- 🎖️ **Certificates**:
  - Participants with functional MVPs, even if not winners, will receive **certificates of appreciation** if their submissions are liked by the founders.
- 🎖️ Prizes:
  - Depending on the submissions, prizes may be distributed to the top 3 winners. The prize consideration depends upon team and will be shared later.

---

# 🌟 Closing Note

This hackathon is more than a challenge it’s a chance to **shape your future** while working on one of the most **advanced projects** out there.

It’s a test for your **dedication and obsession** towards your role not just how much you know, but how much you’re willing to figure out.

It’s a **test of skills over resumes** in the era of AI, you’re **completely free to use any AI tool** to do this assignment. What matters is how smartly you use it and how much ownership you show.

We want to work with **people who enjoy challenges**, the ones who keep pushing even when things break, and **don’t stop until it finally works.**

Once you’re onboard, you’ll be working with a **team of geniuses** and on some seriously exciting stuff. But before that, you’ve got to **prove you’re the right fit** for this role.

So yeah thank you for being here, and all the very best for this Hackathon!!

We’re looking forward to connecting/working with the person who can ultimately get recognized as an winner of this challenge.

Also, to those who stay till the end and give it their best shot but ultimately don’t end up winning, we’ll be giving a **Certificate of Appreciation** for their **hard work, consistency, determination, and dedication. Cheers and ALL THE BEST!!!** 😉🔥.
