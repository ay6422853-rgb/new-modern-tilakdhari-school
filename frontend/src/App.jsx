import React from "react";
import {
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import "./styles/main.css";

import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./layouts/AppLayout";

// =========================
// PUBLIC PAGES
// =========================

import Home from "./pages/public/Home";
import Login from "./pages/public/Login";
import ChangePassword from "./pages/public/ChangePassword";

// =========================
// PRINCIPAL
// =========================

import PrincipalDash from "./pages/principal/Dashboard";
import PStudents from "./pages/principal/Students";
import PReg from "./pages/principal/Registration";
import PFees from "./pages/principal/Fees";
import PExpenses from "./pages/principal/Expenses";
import PCash from "./pages/principal/CashBook";
import PAttendance from "./pages/principal/Attendance";
import PExams from "./pages/principal/Exams";
import PMarks from "./pages/principal/Marks";
import PResults from "./pages/principal/Results";
import PHomework from "./pages/principal/Homework";
import PClasses from "./pages/principal/Classes";
import PSubjects from "./pages/principal/Subjects";
import PTeachers from "./pages/principal/Teachers";
import PNotices from "./pages/principal/Notices";
import PEvents from "./pages/principal/Events";
import PReports from "./pages/principal/Reports";
import PSettings from "./pages/principal/Settings";
import PProfile from "./pages/principal/Profile";
import PUsers from "./pages/principal/Users";
import PPayments from "./pages/principal/Payments";

// =========================
// ACCOUNTANT
// =========================

import ADash from "./pages/accountant/Dashboard";
import AReg from "./pages/accountant/Registration";
import AStudents from "./pages/accountant/Students";
import AFees from "./pages/accountant/Fees";
import AFeeStructure from "./pages/accountant/FeeStructures"
import AExpenses from "./pages/accountant/Expenses";
import ACash from "./pages/accountant/CashBook";
import AFS from "./pages/accountant/FeeStructures";
import AReports from "./pages/accountant/Reports";
import AProfile from "./pages/accountant/Profile";
import APayments from "./pages/accountant/Payments";

// =========================
// OPERATOR
// =========================

import ODash from "./pages/operator/Dashboard";
import OStudents from "./pages/operator/Students";
import OReg from "./pages/operator/Registration";
import OAttendance from "./pages/operator/Attendance";
import OClasses from "./pages/operator/Classes";
import OSubjects from "./pages/operator/Subjects";
import OTeachers from "./pages/operator/Teachers";
import OExams from "./pages/operator/Exams";
import OMarks from "./pages/operator/Marks";
import OHomework from "./pages/operator/Homework";
import ONotices from "./pages/operator/Notices";
import OEvents from "./pages/operator/Events";
import OProfile from "./pages/operator/Profile";
import OAccounts from "./pages/operator/Accounts";
import OTimeTable from "./pages/operator/TimeTable";

// =========================
// TEACHER
// =========================

import TDash from "./pages/teacher/Dashboard";
import TStudents from "./pages/teacher/Students";
import TClasses from "./pages/teacher/Classes";
import TAttendance from "./pages/teacher/Attendance";
import TExams from "./pages/teacher/Exams";
import TMarks from "./pages/teacher/Marks";
import THomework from "./pages/teacher/TimeTable";
import TNotices from "./pages/teacher/Notices";
import TProfile from "./pages/teacher/Profile";

// =========================
// PARENT
// =========================

import ParentDash from "./pages/parent/Dashboard";
import Child from "./pages/parent/Child";
import ParentAttendance from "./pages/parent/Attendance";
import ParentFees from "./pages/parent/Fees";
import ParentHomework from "./pages/parent/Homework";
import ParentResults from "./pages/parent/Results";
import ParentNotices from "./pages/parent/Notices";

// =========================
// STUDENT
// =========================

import StudentDash from "./pages/student/Dashboard";
import StudentProfile from "./pages/student/Profile";
import StudentAttendance from "./pages/student/Attendance";
import StudentFees from "./pages/student/Fees";
import StudentHomework from "./pages/student/Homework";
import StudentResults from "./pages/student/Results";
import StudentNotices from "./pages/student/Notices";
import StudentTimeTable from "./pages/student/TimeTable";
import StudentExam from "./pages/student/Exams";


// =====================================================
// ROLE GUARD
// =====================================================

function Guard({ role, children }) {
  return (
    <ProtectedRoute
      roles={[role.toUpperCase()]}
    >
      {children}
    </ProtectedRoute>
  );
}


// =====================================================
// APP ROUTES
// =====================================================

function RoutesFor() {
  return (
    <Routes>

      {/* =================================================
          PUBLIC
      ================================================= */}

      <Route
        path="/"
        element={<Home />}
      />

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/change-password"
        element={<ChangePassword />}
      />


      {/* =================================================
          PRINCIPAL PANEL
      ================================================= */}

      <Route
        element={
          <Guard role="principal">
            <AppLayout role="PRINCIPAL" />
          </Guard>
        }
      >

        <Route
          path="/principal"
          element={<PrincipalDash />}
        />

        <Route
          path="/principal/students"
          element={<PStudents />}
        />

        <Route
          path="/principal/registration"
          element={<PReg />}
        />

        <Route
          path="/principal/fees"
          element={<PFees />}
        />

        <Route
          path="/principal/expenses"
          element={<PExpenses />}
        />

        <Route
          path="/principal/cashbook"
          element={<PCash />}
        />

        <Route
          path="/principal/attendance"
          element={<PAttendance />}
        />

        <Route
          path="/principal/exams"
          element={<PExams />}
        />

        <Route
          path="/principal/marks"
          element={<PMarks />}
        />

        <Route
          path="/principal/results"
          element={<PResults />}
        />

        <Route
          path="/principal/homework"
          element={<PHomework />}
        />

        <Route
          path="/principal/classes"
          element={<PClasses />}
        />

        <Route
          path="/principal/users"
          element={<PUsers />}
        />

        <Route
          path="/principal/subjects"
          element={<PSubjects />}
        />

        <Route
          path="/principal/teachers"
          element={<PTeachers />}
        />

        <Route
          path="/principal/notices"
          element={<PNotices />}
        />

        <Route
          path="/principal/events"
          element={<PEvents />}
        />

        <Route
          path="/principal/reports"
          element={<PReports />}
        />

        <Route
          path="/principal/settings"
          element={<PSettings />}
        />

        <Route
          path="/principal/profile"
          element={<PProfile />}
        />

        <Route
          path="/principal/payments"
          element={<PPayments />}
        />

      </Route>


      {/* =================================================
          ACCOUNTANT PANEL
      ================================================= */}

      <Route
        element={
          <Guard role="accountant">
            <AppLayout role="ACCOUNTANT" />
          </Guard>
        }
      >

        <Route
          path="/accountant"
          element={<ADash />}
        />

        <Route
          path="/accountant/registration"
          element={<AReg />}
        />

        

        <Route
          path="/accountant/students"
          element={<AStudents />}
        />

        <Route
          path="/accountant/fees"
          element={<AFees />}
        />

        <Route
          path="/accountant/expenses"
          element={<AExpenses />}
        />

        <Route
          path="/accountant/cashbook"
          element={<ACash />}
        />

        <Route
          path="/accountant/fee-structures"
          element={<AFS />}
        />

        <Route
          path="/accountant/reports"
          element={<AReports />}
        />

        <Route
          path="/accountant/profile"
          element={<AProfile />}
        />

        <Route
          path="/accountant/payments"
          element={<APayments />}
        />

        <Route
          path="/accountant/fee-structure"
          element={<AFeeStructure />}
        />

      </Route>


      {/* =================================================
          OPERATOR PANEL
      ================================================= */}

      <Route
        element={
          <Guard role="operator">
            <AppLayout role="OPERATOR" />
          </Guard>
        }
      >

        <Route
          path="/operator"
          element={<ODash />}
        />

        <Route
          path="/operator/students"
          element={<OStudents />}
        />

        <Route
          path="/operator/registration"
          element={<OReg />}
        />


        <Route
          path="/operator/attendance"
          element={<OAttendance />}
        />

        <Route
          path="/operator/classes"
          element={<OClasses />}
        />

        <Route
          path="/operator/subjects"
          element={<OSubjects />}
        />

        <Route
          path="/operator/teachers"
          element={<OTeachers />}
        />

        <Route
          path="/operator/exams"
          element={<OExams />}
        />

        <Route
          path="/operator/marks"
          element={<OMarks />}
        />

        <Route
          path="/operator/homework"
          element={<OHomework />}
        />

        <Route
          path="/operator/notices"
          element={<ONotices />}
        />

        <Route
          path="/operator/events"
          element={<OEvents />}
        />

        <Route
          path="/operator/profile"
          element={<OProfile />}
        />

        <Route
          path="/operator/accounts"
          element={<OAccounts />}
        />

        <Route
          path="/operator/timetable"
          element={<OTimeTable />}
        />

      </Route>


      {/* =================================================
          TEACHER PANEL
      ================================================= */}

      <Route
        element={
          <Guard role="teacher">
            <AppLayout role="TEACHER" />
          </Guard>
        }
      >

        <Route
          path="/teacher"
          element={<TDash />}
        />

        <Route
          path="/teacher/students"
          element={<TStudents />}
        />

        <Route
          path="/teacher/classes"
          element={<TClasses />}
        />

        <Route
          path="/teacher/attendance"
          element={<TAttendance />}
        />

        <Route
          path="/teacher/exams"
          element={<TExams />}
        />

        <Route
          path="/teacher/marks"
          element={<TMarks />}
        />

        <Route
          path="/teacher/homework"
          element={<THomework />}
        />

        <Route
          path="/teacher/notices"
          element={<TNotices />}
        />

        <Route
          path="/teacher/profile"
          element={<TProfile />}
        />

      </Route>


      {/* =================================================
          PARENT PANEL
      ================================================= */}

      <Route
        element={
          <Guard role="parent">
            <AppLayout role="PARENT" />
          </Guard>
        }
      >

        <Route
          path="/parent"
          element={<ParentDash />}
        />

        <Route
          path="/parent/child"
          element={<Child />}
        />

        <Route
          path="/parent/attendance"
          element={<ParentAttendance />}
        />

        <Route
          path="/parent/fees"
          element={<ParentFees />}
        />

        <Route
          path="/parent/homework"
          element={<ParentHomework />}
        />

        <Route
          path="/parent/results"
          element={<ParentResults />}
        />

        <Route
          path="/parent/notices"
          element={<ParentNotices />}
        />

        <Route
          path="/parent/profile"
          element={<Child />}
        />

      </Route>


      {/* =================================================
          STUDENT PANEL
      ================================================= */}

      <Route
        element={
          <Guard role="student">
            <AppLayout role="STUDENT" />
          </Guard>
        }
      >

        <Route
          path="/student"
          element={<StudentDash />}
        />

        <Route
          path="/student/timetable"
          element={<StudentTimeTable />}
        />

        <Route
          path="/student/exams"
          element={<StudentExam />}
        />

        <Route
          path="/student/profile"
          element={<StudentProfile />}
        />

        <Route
          path="/student/attendance"
          element={<StudentAttendance />}
        />

        <Route
          path="/student/fees"
          element={<StudentFees />}
        />

        <Route
          path="/student/homework"
          element={<StudentHomework />}
        />

        <Route
          path="/student/results"
          element={<StudentResults />}
        />

        <Route
          path="/student/notices"
          element={<StudentNotices />}
        />

      </Route>


      {/* =================================================
          FALLBACK
      ================================================= */}

      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />

    </Routes>
  );
}


// =====================================================
// EXPORT
// =====================================================

export default RoutesFor;