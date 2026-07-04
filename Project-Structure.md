luna-ai/
│
├── apps/
│ │
│ ├── luna/ # Desktop Application
│ │ │
│ │ ├── backend/ # Electron Main Process
│ │ │ ├── src/
│ │ │ │ ├── controllers/
│ │ │ │ ├── routes/ # Express routes (if using Express)
│ │ │ │ ├── services/
│ │ │ │ ├── repositories/
│ │ │ │ ├── middleware/
│ │ │ │ ├── lib/
│ │ │ │ │ ├── prisma.ts
│ │ │ │ │ ├── ollama.ts
│ │ │ │ │ └── logger.ts
│ │ │ │ ├── desktop/
│ │ │ │ │ ├── filesystem.ts
│ │ │ │ │ ├── applications.ts
│ │ │ │ │ ├── notifications.ts
│ │ │ │ │ └── reminders.ts
│ │ │ │ ├── ipc/ # Electron IPC handlers
│ │ │ │ ├── utils/
│ │ │ │ ├── types/
│ │ │ │ ├── app.ts # Express app
│ │ │ │ ├── server.ts # Express server
│ │ │ │ ├── electron.ts # Electron main process
│ │ │ │ └── index.ts
│ │ │ │
│ │ │ ├── prisma/
│ │ │ │ ├── schema.prisma
│ │ │ │ └── migrations/
│ │ │ │
│ │ │ └── package.json
│ │ │
│ │ ├── frontend/
│ │ │ ├── src/
│ │ │ │ ├── app/
│ │ │ │ ├── components/
│ │ │ │ ├── features/
│ │ │ │ │ ├── chat/
│ │ │ │ │ ├── settings/
│ │ │ │ │ ├── memory/
│ │ │ │ │ └── onboarding/
│ │ │ │ ├── hooks/
│ │ │ │ ├── services/ # API client
│ │ │ │ ├── stores/
│ │ │ │ ├── lib/
│ │ │ │ ├── types/
│ │ │ │ └── main.tsx
│ │ │ │
│ │ │ ├── public/
│ │ │ └── package.json
│ │ │
│ │ ├── preload/
│ │ │ ├── src/
│ │ │ │ └── index.ts
│ │ │ └── package.json
│ │ │
│ │ ├── shared/
│ │ │ ├── src/
│ │ │ │ ├── types/
│ │ │ │ ├── schemas/
│ │ │ │ ├── constants/
│ │ │ │ └── utils/
│ │ │ └── package.json
│ │ │
│ │ ├── electron-builder.json
│ │ └── package.json
│ │
│ └── luna-web/ # Marketing / Download Website
│ ├── app/
│ ├── components/
│ ├── public/
│ └── package.json
│
├── packages/
│ ├── ui/
│ ├── config/
│ ├── eslint/
│ ├── tsconfig/
│ └── utils/
│
├── package.json
├── pnpm-workspace.yaml
└── pnpm-lock.yaml
