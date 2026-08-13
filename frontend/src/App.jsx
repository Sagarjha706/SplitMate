import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import GroupDetails from "./pages/GroupDetails";
import CreateGroup from "./pages/CreateGroup";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route path="/login" element={<Login />} />

        <Route path="/signup" element={<Signup />} />

        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/groups/:groupId" element={<GroupDetails />} />

        <Route path="/groups/create" element={<CreateGroup />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
