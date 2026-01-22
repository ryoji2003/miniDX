# Staff Day-Off Request Feature Implementation Request

## Project Overview
- **Project Name**: miniDX (Care Facility Shift Management System)
- **GitHub**: https://github.com/ryoji2003/miniDX
- **Tech Stack**: Python (FastAPI), JavaScript, SQLAlchemy

## Feature to Implement: Staff Day-Off Request Management System

---

## 📋 Requirements Definition

### 1. Staff Interface
Dedicated interface for staff to manage their day-off requests

#### 1.1 Day-Off Request Submission
**Requirements:**
- Select and submit day-off request dates
- Support multiple consecutive day-off requests
- Optional reason field for submission
- Display list of submitted requests
- Visual display of request status (pending/approved/rejected)

**UI Requirements:**
- Interactive calendar UI for date selection
- Date range selection capability
- Modern and simple form design
- Mobile responsive design

#### 1.2 View Other Staff's Day-Off Requests
**Requirements:**
- Positioned below the personal request form
- Display other staff's day-offs in monthly calendar view
- Staff names and day-off dates clearly visible
- Show only approved requests (hide pending)
- Privacy consideration: Don't display reasons

**UI Requirements:**
- Calendar format display (monthly)
- Color-coded by staff member
- Highlight overlapping day-off dates
- Smooth month navigation (previous/next buttons)

#### 1.3 Modify Day-Off Requests
**Requirements:**
- Edit submitted and pending requests
- Approved requests require new change request submission
- Allow deletion of requests
- Maintain change history

**UI Requirements:**
- Edit button from list opens modal/form
- Optional change reason input
- Confirmation dialog to prevent accidental actions

---

### 2. Admin Interface
Interface for administrators to approve and manage day-off requests

#### 2.1 Day-Off Approval Function
**Requirements:**
- Display all staff day-off requests in list
- Filter by pending/approved/rejected status
- Batch approval and individual approval
- Input rejection reason when rejecting
- Notify staff on approval/rejection (future enhancement)

**UI Requirements:**
- Clear table format display
- Status badges for visualization
- Sort functionality (date, staff name, status)
- Search functionality (staff name, date range)

#### 2.2 Calendar View
**Requirements:**
- Overview of all staff day-offs in monthly calendar
- Display number of day-off requests per day
- Reference material for shift creation
- Warning display for days with many requests

**UI Requirements:**
- Calendar format (monthly)
- Display day-off count per date
- Emphasize high-request days with warning color
- Click date for detailed view

---

## 🎨 Design Requirements (Critical)

### Design System
```
Color Palette:
- Primary: #3B82F6 (Blue)
- Secondary: #10B981 (Green)
- Warning: #F59E0B (Orange)
- Danger: #EF4444 (Red)
- Background: #F9FAFB (Light Gray)
- Surface: #FFFFFF (White)

Typography:
- Font: System font (sans-serif)
- Headings: 600 weight
- Body: 400 weight
```

### UI Component Requirements
- Style using **Tailwind CSS**
- Utilize **shadcn/ui** components (recommended)
- Use **react-big-calendar** or **FullCalendar** for calendar component
- Form validation with **React Hook Form** + **Zod**
- Date handling with **date-fns**

### Accessibility
- WCAG 2.1 Level AA compliant
- Keyboard navigation support
- Screen reader support
- Sufficient color contrast

### Responsive Design
- Mobile-first approach
- Breakpoints: sm(640px), md(768px), lg(1024px), xl(1280px)
- Touch-friendly UI (minimum button size 44x44px)

---

## 🗂️ Database Schema

### RequestedDayOff Table
```python
class RequestedDayOff(Base):
    __tablename__ = "requested_days_off"
    
    id = Column(Integer, primary_key=True, index=True)
    staff_id = Column(Integer, ForeignKey("staffs.id"), nullable=False)
    request_date = Column(Date, nullable=False)  # Day-off date
    reason = Column(String(500), nullable=True)  # Reason (optional)
    status = Column(String(20), default="pending")  # pending/approved/rejected
    rejection_reason = Column(String(500), nullable=True)  # Rejection reason
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    approved_at = Column(DateTime, nullable=True)
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)  # Approver
    
    # Relationships
    staff = relationship("Staff", back_populates="requested_days_off")
    approver = relationship("User", foreign_keys=[approved_by])
```

---

## 🔧 Technical Implementation Requirements

### Backend (FastAPI)

#### Endpoint Design
```python
# Staff endpoints
POST   /api/staff/requested-days-off           # Submit day-off request
GET    /api/staff/requested-days-off           # List own day-off requests
GET    /api/staff/requested-days-off/{id}      # Day-off request details
PUT    /api/staff/requested-days-off/{id}      # Modify day-off request
DELETE /api/staff/requested-days-off/{id}      # Delete day-off request
GET    /api/staff/requested-days-off/calendar  # All staff day-off calendar

# Admin endpoints
GET    /api/admin/requested-days-off           # List all day-off requests
PUT    /api/admin/requested-days-off/{id}/approve    # Approve
PUT    /api/admin/requested-days-off/{id}/reject     # Reject
GET    /api/admin/requested-days-off/calendar       # Calendar view
GET    /api/admin/requested-days-off/statistics     # Statistics
```

#### Validation
- Past dates cannot be requested
- No duplicate requests for already submitted dates
- Reason limited to 500 characters
- Approval/rejection requires admin privileges

### Frontend

#### Directory Structure
```
care-shift-app/
├── src/
│   ├── components/
│   │   ├── staff/
│   │   │   ├── RequestDayOffForm.jsx          # Day-off request form
│   │   │   ├── MyRequestedDaysOffList.jsx     # Personal day-off list
│   │   │   ├── StaffDayOffCalendar.jsx        # All staff calendar
│   │   │   └── EditRequestDayOffModal.jsx     # Edit modal
│   │   ├── admin/
│   │   │   ├── RequestDayOffApprovalList.jsx  # Approval list
│   │   │   ├── AdminDayOffCalendar.jsx        # Admin calendar
│   │   │   └── DayOffStatistics.jsx           # Statistics dashboard
│   │   └── shared/
│   │       ├── Calendar.jsx                    # Shared calendar
│   │       └── DateRangePicker.jsx            # Date range picker
│   ├── pages/
│   │   ├── staff/
│   │   │   └── RequestDayOffPage.jsx          # Staff main page
│   │   └── admin/
│   │       └── ManageRequestDayOffPage.jsx    # Admin main page
│   ├── hooks/
│   │   ├── useRequestDayOff.js                # Day-off operations hook
│   │   └── useDayOffCalendar.js               # Calendar data hook
│   └── api/
│       └── requestDayOff.js                   # API calls
```

---

## ✅ Implementation Steps (Instructions for Claude Code)

### Phase 1: Database Layer
1. Add `RequestedDayOff` model to `models.py`
2. Add Pydantic schemas to `schemas.py`
3. Create migration script (Alembic recommended)

### Phase 2: Backend API
1. Implement staff endpoints in `routers/staff.py`
2. Implement admin endpoints in `routers/admin.py`
3. Implement validation logic
4. Implement permission check functionality

### Phase 3: Frontend (Staff Interface)
1. Create day-off request form component
   - Calendar UI for date selection
   - Form with validation
2. Display personal day-off request list
   - Status badges
   - Edit/delete buttons
3. Display all staff calendar
   - Monthly calendar view
   - Color-coded by staff
4. Implement edit modal

### Phase 4: Frontend (Admin Interface)
1. Day-off approval list
   - Table format
   - Filtering functionality
2. Approve/reject functionality
   - Modal confirmation
   - Rejection reason input
3. Admin calendar view
   - Display day-off count per day
   - Warning display feature

### Phase 5: Integration and Testing
1. End-to-end testing
2. Mobile responsiveness verification
3. Accessibility check
4. Performance optimization

---

## 🎯 Expected Deliverables

### Required Deliverables
- [ ] Migration files
- [ ] Backend API endpoints (all 10)
- [ ] Staff interface UI components (4+)
- [ ] Admin interface UI components (3+)
- [ ] API integration code
- [ ] Basic error handling

### Recommended Deliverables
- [ ] Unit tests (for main features)
- [ ] API documentation (OpenAPI/Swagger)
- [ ] Component storybook (Storybook)
- [ ] Deployment guide

---

## 📝 Important Notes

### Security
- Staff can only access their own day-off requests
- Must implement admin privilege checks
- SQL injection protection
- XSS protection

### Performance
- Calendar data paginated by month
- Add indexes for large datasets
- Frontend optimized with React.memo

### Usability
- Clearly indicate loading states
- Clear, understandable error messages
- Toast notifications on success
- Cancel/undo functionality for actions

---

## 🚀 Specific Instructions for Claude Code

```
Using this request.md as reference, please implement in the following priority order:

1. First, review the existing codebase and understand the project structure
2. Implement from Phase 1 sequentially, verifying functionality after each Phase
3. For UI, must use Tailwind CSS with modern, polished design
4. Use existing calendar library (FullCalendar recommended) for calendar components
5. Add appropriate comments in English in the code
6. Must implement error handling
7. Must consider responsive design

If you have any questions, please ask. Proceed with implementation step by step, checking at each stage.
```

---

## 📞 Reference Links
- Project Repository: https://github.com/ryoji2003/miniDX
- Tailwind CSS: https://tailwindcss.com/
- shadcn/ui: https://ui.shadcn.com/
- React Big Calendar: https://jquense.github.io/react-big-calendar/
- FastAPI: https://fastapi.tiangolo.com/

---