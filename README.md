# GroupForge AI

**Intelligent Team Formation for Academia**

GroupForge AI is a web-based platform that uses Google Gemini to conduct adaptive skill assessments and form balanced, complementary student teams.

## Features

- 🧠 **AI-Powered Skill Assessments** - Adaptive evaluations using Google Gemini
- 👥 **Intelligent Team Formation** - Balanced teams based on leadership, creativity, analytical thinking, and execution
- 📊 **Faculty Dashboards** - Analytics and team management tools
- � **GitHub Integration** - Analyze coding profiles for technical skill verification
- 📄 **Resume Analysis** - Optional CV parsing to enrich skill profiles
- 🔐 **Firebase Authentication** - Secure login with Google/GitHub/email

## Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Firebase (Auth, Firestore, Storage, Functions)
- **AI**: Google Gemini 2.0 Flash
- **Routing**: React Router v6
- **Build**: Vite

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Firebase project
- Google Gemini API key

### Installation

1. Clone the repository:
   ```bash
   cd groupforge-ai
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Add your Firebase and Gemini credentials to `.env`

5. Start the development server:
   ```bash
   npm run dev
   ```

## Firebase Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Authentication (Email/Password, Google, and GitHub providers)
3. Create a Firestore database
4. Enable Storage
5. Copy your config values to `.env`

### GitHub OAuth Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in:
   - Application name: GroupForge AI
   - Homepage URL: `http://localhost:5173` (development) or your production URL
   - Authorization callback URL: Your Firebase Auth domain (e.g., `your-project.firebaseapp.com/__/auth/handler`)
4. Copy the Client ID and Client Secret
5. In Firebase Console > Authentication > Sign-in method > GitHub:
   - Enable GitHub provider
   - Add your Client ID and Client Secret
   - Copy the callback URL if needed

## Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Assessments are private to the user
    match /assessments/{assessmentId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    // Teams are readable by members
    match /teams/{teamId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'faculty';
    }
    
    // Courses are readable by enrolled students and faculty
    match /courses/{courseId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['faculty', 'admin'];
    }
  }
}
```

## Project Structure

```
groupforge-ai/
├── src/
│   ├── components/
│   │   ├── layout/       # Sidebar, DashboardLayout
│   │   └── ui/           # Button, Card, Input, SkillBar
│   ├── config/
│   │   ├── firebase.ts   # Firebase initialization
│   │   └── gemini.ts     # Gemini AI configuration
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   │   └── AssessmentContext.tsx
│   ├── pages/
│   │   ├── LandingPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── SignupPage.tsx
│   │   ├── DashboardPage.tsx
│   │   └── AssessmentPage.tsx
│   ├── services/
│   │   ├── teamFormation.ts
│   │   └── resumeParser.ts
│   ├── types/
│   │   ├── user.ts
│   │   ├── assessment.ts
│   │   ├── team.ts
│   │   └── course.ts
│   ├── lib/
│   │   └── utils.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## License

MIT
