# MiniDX Project - Claude Code Development Guide

## Project Overview
Shift management and care record system for Kawahigashi Day Service Center.
React version is officially adopted (Static version has been deleted).

## Important Reference Documents
- **Development Specification**: `spec_for_development.md` - Read this file first
- **Meeting Minutes**: `2025_12_22_議事録.pdf` - Contains requirement decisions

## Tech Stack
- **Frontend**: React.js
- **UI Library**: react-big-calendar or FullCalendar for React (calendar-style UI)
- **Drag & Drop**: react-dnd (for manual adjustment features)
- **State Management**: React Hooks (useState, useContext)
- **Deployment**: Web application (cloud-based, low-spec PC compatible)

## Development Approach

### Step 1: Must Do First
1. Read `spec_for_development.md` thoroughly
2. Analyze current codebase and identify implemented/unimplemented features
3. Start with Phase 1 (Shift Management Features)

### Step 2: Priorities
**Highest Priority (by Jan 14):**
1. Implement shift generation algorithm (constraint-priority type)
2. Implement calendar-style UI
3. Implement constraint input form

**Next Priority (mid-Jan to Feb):**
4. Manual adjustment feature (drag & drop)
5. AI care record feature (prototype)
6. Authentication feature (ID/PASS)

## Coding Standards

### File Structure
```
src/
├── components/
│   ├── ShiftManagement/     # Shift management related
│   ├── CareRecord/          # Care record related
│   └── Common/              # Common components
├── services/                # Business logic
├── utils/                   # Utility functions
└── App.jsx                  # Entry point
```

### Code Style
- Use ES6+ syntax (import/export)
- Prefer functional components + Hooks
- Use PropTypes or TypeScript for type definitions
- Component names in PascalCase
- File names in `ComponentName.jsx` format

### Naming Conventions
- Components: `ShiftCalendar`, `StaffAssignment`
- Services: `shiftAlgorithm.js`, `aiService.js`
- Utils: `dateHelpers.js`, `validation.js`

## Shift Generation Algorithm Specification

### Processing Flow (IMPORTANT!)
```
1. Initialize staff list for all dates
2. For each date:
   a. Exclude staff with requested days off
   b. Place fixed assignments (training, office work, etc.)
   c. Assign remaining free staff by priority:
      - Nursing (minimum 1 required)
      - Driving (minimum 6 required)
      - Bathing assistance (approximately 6)
      - Other roles
   d. Execute constraint check
   e. Record warnings if any
3. Return results
```

### Role and Constraint Rules
- **Nursing**: Minimum 1 person required daily
- **Driving (Transportation)**: 6+ people required
- **Bathing Assistance**: Approximately 6 people (special bath + regular bath total)
- **Training**: Can be handled by any job type
- **Concurrent Role Rules**:
  - Driving and training can be concurrent
  - Driving and bathing assistance are basically non-concurrent

### Data Structure Example
```javascript
// Input
const staff = [
  {
    id: 1,
    name: "Yamada Taro",
    qualifications: ["nursing", "driving"],
    requestedDaysOff: ["2025-01-05", "2025-01-12"]
  }
];

const constraints = {
  fixedAssignments: [
    { date: "2025-01-10", staffId: 3, role: "training" }
  ],
  dailyRequirements: {
    nursing: { min: 1 },
    driving: { min: 6 },
    bathing: { min: 6 }
  }
};

// Output
const generatedShift = {
  "2025-01-05": [
    { staffId: 1, role: "nursing" },
    { staffId: 2, role: "driving" },
    { staffId: 2, role: "training" } // Concurrent
  ],
  warnings: [
    { date: "2025-01-08", message: "Only 5 driving staff (6 required)" }
  ]
};
```

## UI Implementation Notes

### Calendar View
- **Adopted**: Calendar format (Design Option 2)
- **Rejected**: List format (Design Option 1) ← Already deleted
- Display "Staff Name" and "Role" in date cells
- Color-code by role (e.g., nursing=blue, driving=green, bathing=orange)
- Show detail popup on click

### Interaction
- Drag & drop to move staff (manual adjustment)
- Display warnings on constraint violations (e.g., "0 nursing staff", "5 driving staff")
- Real-time validation

## Performance Considerations

### Low-Spec PC Support
- Heavy processing on server-side (AI summary, etc.)
- Client-side only lightweight rendering
- Use lazy loading (React.lazy)
- Avoid unnecessary re-renders (React.memo, useMemo)

## Testing Strategy
- Unit tests for algorithm are mandatory
- Test constraint check functionality
- Component rendering tests (Jest + React Testing Library)

## Development Checklist
When implementing new features, verify:
- [ ] Checked relevant section in `spec_for_development.md`
- [ ] Constraint rules correctly implemented
- [ ] Works on low-spec PCs
- [ ] Error handling implemented
- [ ] Unit tests created
- [ ] Clear commit messages

## Git Workflow
- Branch names: `feature/feature-name` or `fix/bug-name`
- Always run tests before commit
- Run lint before creating PR

## AI Care Record Feature (Phase 2)
- **Implementation Condition**: After infrastructure setup (Wi-Fi, devices)
- **Access**: Web browser + ID/PASS authentication
- **Features**: Voice input → AI summary → Data accumulation
- **API**: ChatGPT/Gemini, etc. (pay-as-you-go)

## Important Notes
1. **Static version deleted** - Remove any remaining Static version code
2. **List format UI rejected** - Only implement calendar format
3. **Constraint-priority type** - Not fully automatic; fix conditions → auto-assign remainder
4. **Security**: Handle personal information (user info) carefully

## Next Review
- **Date**: Around January 14, 2025
- **Completion Goal**: Mid-January to February 2025

## When in Trouble
- Re-check `spec_for_development.md`
- Verify decisions in meeting minutes PDF
- Ask questions before implementation if unclear
