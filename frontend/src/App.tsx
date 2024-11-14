import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardView } from "./components/Dashboard/DashboardView";
import { StreamControlView } from "./components/StreamControl/StreamControlView";
import { ToastContainer } from "react-toastify";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<DashboardView />} />
          <Route path="/stream/:streamId" element={<StreamControlView />} />
        </Routes>
      </BrowserRouter>
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        style={{ width: "auto", maxWidth: "400px" }}
      />
    </>
  );
}

export default App;
