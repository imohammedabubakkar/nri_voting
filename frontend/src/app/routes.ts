import { createBrowserRouter } from "react-router";
import { HomePage } from "./pages/HomePage";
import { AdminLoginPage } from "./pages/AdminLoginPage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { CreateUserPage } from "./pages/CreateUserPage";
import { RegisteredUsersPage } from "./pages/RegisteredUsersPage";
import { UserLoginPage } from "./pages/UserLoginPage";
import { UserDashboardPage } from "./pages/UserDashboardPage";
import { VotingPage } from "./pages/VotingPage";
import { VoteConfirmationPage } from "./pages/VoteConfirmationPage";
import { ElectionResultsPage } from "./pages/ElectionResultsPage";
import { DownloadVotersPage } from "./pages/DownloadVotersPage";
import { CandidateRegistrationPage } from "./pages/CandidateRegistrationPage";
import { ElectionStartPage } from "./pages/ElectionStartPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: HomePage,
  },
  {
    path: "/admin/login",
    Component: AdminLoginPage,
  },
  {
    path: "/admin/dashboard",
    Component: AdminDashboardPage,
  },
  {
    path: "/admin/create-user",
    Component: CreateUserPage,
  },
  {
    path: "/admin/registered-users",
    Component: RegisteredUsersPage,
  },
  {
    path: "/admin/election-results",
    Component: ElectionResultsPage,
  },
  {
    path: "/admin/download-voters",
    Component: DownloadVotersPage,
  },
  {
    path: "/admin/candidate-registration",
    Component: CandidateRegistrationPage,
  },
  {
    path: "/admin/election-start",
    Component: ElectionStartPage,
  },
  {
    path: "/user/login",
    Component: UserLoginPage,
  },
  {
    path: "/user/dashboard",
    Component: UserDashboardPage,
  },
  {
    path: "/user/voting",
    Component: VotingPage,
  },
  {
    path: "/user/vote-confirmation",
    Component: VoteConfirmationPage,
  },
]);
