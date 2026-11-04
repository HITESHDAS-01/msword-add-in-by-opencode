# Smart QP Formatter — MS Word Add-in

Convert raw, unformatted Word documents into **print-ready Question Papers** with 1-click presets, advanced forms, or AI prompts.

## ✨ Features

| Mode | Description |
|------|-------------|
| **⚡ Presets** | 5 built-in exam templates (Unit Test, Half-Yearly, Board Pattern, MCQ/OMR, Notice) |
| **🎛️ Advanced Form** | 6 collapsible sections: Page Setup, Header, Typography, Numbering/Marks, MCQ/Tables, Footer |
| **💬 Prompt + Style Cloner** | Natural language commands + upload `.docx`/`.pdf`/image to clone exact formatting |

### Core Capabilities
- **Right Tab-Stop Marks Engine** — Perfect right-aligned marks (no spacebars)
- **Smart MCQ Layout** — Auto 1-line / 2×2 grid / 4 vertical based on option length
- **Bilingual Font Pairing** — English + Assamese/Hindi/Bengali fonts with independent sizing
- **Match-the-Following & Assertion-Reason** — Auto table conversion
- **P.T.O., Page Numbers, Watermarks** — Professional finishing touches
- **Selection Mode** — Format only selected text, leave rest untouched

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Microsoft Word (Desktop, Windows/Mac)
- **AI API Key** (choose one):
  - **Google Gemini** — [Get free key](https://makersuite.google.com/app/apikey)
  - **NVIDIA NIM** — [Get key from NVIDIA Build](https://build.nvidia.com/)

### Installation

```bash
# Clone / navigate to project
cd word-question-formatter

# Install dependencies
npm install

# Copy env template and add your API key
cp .env.example .env.local
# Edit .env.local - see configuration below

# Start dev server (HTTPS required for Office.js)
npm run dev
```

The app runs at `https://localhost:3000` (Next.js auto-generates self-signed certs).

### Sideload into MS Word (Windows)

1. **Trust the dev certificate** (first time only):
   ```bash
   # In PowerShell as Admin
   cd word-question-formatter
   npx office-addin-dev-certs install
   ```

2. **Sideload the manifest**:
   - Open Word → **Insert** → **Add-ins** → **My Add-ins** → **Upload My Add-in**
   - Select `manifest.xml` from project root
   - Click **Add**

3. **Open the Task Pane**:
   - Go to **Home** tab → **Smart QP Formatter** button
   - Task pane opens on the right (~380px)

### Sideload into MS Word (Mac)
- Use the [Office Add-in Debugger](https://learn.microsoft.com/en-us/office/dev/add-ins/testing/debug-office-add-ins-on-ipad-and-mac) or upload manifest via **Insert → Add-ins → Upload My Add-in**

## 📖 Usage Guide

### 1. Presets Mode (Fastest)
- Click a preset card → **Format Document**
- Or **Load into Form & Edit** to tweak class/subject/date first

### 2. Advanced Form Mode
- Expand 6 accordion sections
- Configure every detail: margins, fonts, marks format, MCQ layout, etc.
- Click **Format Document** (or **Selection** for selected text only)

### 3. Prompt Mode + Style Cloner
- **Upload Sample**: Drag `.docx`/`.pdf`/image → **Extract Style** → **Apply to Form** or **Save as Preset**
- **Natural Language**: Type `"Convert Q3-Q5 to 2×2 MCQ grid"` → **Apply**
- **Quick Chips**: One-click fixes for common issues

### Scope Selector
- **Full Document** — Processes entire document
- **Selection** — Only formats highlighted text (great for editing specific questions)

## 🔧 Configuration

### Environment Variables (`.env.local`)

```env
# ===========================================
# AI Provider Configuration
# ===========================================
# Choose your AI provider: 'gemini' or 'nim'
AI_PROVIDER=gemini

# -------------------------------------------
# Google Gemini (Default)
# Get API key from: https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash

# -------------------------------------------
# NVIDIA NIM (Alternative)
# Get API key from: https://build.nvidia.com/
# Base URL: https://integrate.api.nvidia.com (or your self-hosted NIM endpoint)
NIM_API_KEY=your_nim_api_key_here
NIM_BASE_URL=https://integrate.api.nvidia.com
NIM_MODEL=meta/llama-3.1-405b-instruct
# Other NIM model options:
# - nvidia/nemotron-3-ultra
# - meta/llama-3.1-70b-instruct
# - meta/llama-3.1-8b-instruct
# - mistralai/mixtral-8x7b-instruct-v0.1
```

### AI Provider Comparison

| Feature | Google Gemini | NVIDIA NIM |
|---------|---------------|------------|
| **Cost** | Free tier (15 RPM) | Pay-per-use / Self-hosted |
| **Models** | Gemini 2.5 Flash, Pro | Llama 3.1, Nemotron, Mixtral, etc. |
| **Vision** | ✅ Native | ✅ Via compatible models |
| **JSON Schema** | ✅ Native | ✅ OpenAI-compatible |
| **Latency** | Low | Very low (edge deploy) |
| **Privacy** | Cloud | Cloud or On-premise |
| **Rate Limits** | Strict free tier | Higher limits / Self-hosted |

### Switching Providers
1. Set `AI_PROVIDER=gemini` or `AI_PROVIDER=nim` in `.env.local`
2. Add the corresponding API key
3. Restart dev server: `npm run dev`

### Customizing Presets
Edit `src/lib/defaultPresets.ts` to modify built-in templates or add new ones.

### Office.js API Requirements
- `ReadWriteDocument` permission (set in manifest.xml)
- Word API set 1.3+ (supported in Word 2016+)

## 🏗️ Project Structure

```
word-question-formatter/
├── manifest.xml                 # Office Add-in manifest
├── package.json
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
├── .env.example
└── src/
    ├── app/
    │   ├── layout.tsx           # Office.js script + Tailwind
    │   ├── page.tsx             # Main 3-tab controller
    │   ├── globals.css
    │   └── api/
    │       ├── parse-doc/       # AI: Raw text → Structured JSON
    │       ├── extract-sample/  # AI Vision: PDF/Image → FormattingConfig
    │       └── prompt-edit/     # AI: Custom prompt on parsed JSON
    ├── components/
    │   ├── NavbarTabs.tsx       # Presets | Form | Prompt tabs
    │   ├── ScopeBar.tsx         # Full Document vs Selection
    │   ├── ProviderSelector.tsx # AI Provider picker (UI component)
    │   ├── presets/PresetsTab.tsx
    │   ├── form/FormTab.tsx     # 6 accordion sections
    │   └── prompt/PromptTab.tsx # Chat + Sample Dropzone
    ├── lib/
    │   ├── aiProvider.ts        # Unified AI provider (Gemini + NIM)
    │   ├── defaultPresets.ts    # 5 built-in exam templates
    │   ├── docxStyleExtractor.ts # JSZip + XML parser for .docx
    │   ├── wordEngine.ts        # Office.js document builder
    │   └── selectionEngine.ts   # Selection read/write + quick actions
    └── types/schema.ts          # TypeScript interfaces
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Office.js not loaded" | Ensure `https://appsforoffice.microsoft.com/lib/1/hosted/office.js` loads in layout.tsx |
| CORS errors | Dev server includes CORS headers in `next.config.mjs` |
| Certificate warning | Run `npx office-addin-dev-certs install` as Admin |
| Add-in not showing | Check manifest.xml ID is unique; re-upload in Word |
| AI API errors | Verify API key in `.env.local`; check quota at provider dashboard |
| NIM connection failed | Check `NIM_BASE_URL` (use `https://integrate.api.nvidia.com` for cloud) |

## 📝 License

MIT — Free for personal and commercial use.

## 🤝 Contributing

PRs welcome! Please follow the existing code style (TypeScript, Tailwind, functional components).

---

**Built with:** Next.js 14, React 18, Office.js, Tailwind CSS, **Google Gemini 2.5 Flash** / **NVIDIA NIM**, JSZip, fast-xml-parser