import "bootstrap/dist/css/bootstrap.min.css";
import { useEffect, useState } from "react";



import { Routes, Route, Navigate,useNavigate } from "react-router";
import { LoginForm } from "./components/AuthComponents";
import DefaultLayout from "./components/DefaultLayout";
import  HomePage from "./components/HomePage";
import UserProfile from "./components/UserProfile";
import GamePage from "./components/GamePage";
import NotFound from "./components/NotFound";
import API from "./API/API.mjs";
function App() {

  const [loggedIn, setLoggedIn] = useState(false);
  const [message, setMessage] = useState({});
  const [user, setUser] = useState('');
  const navigate = useNavigate();
  useEffect(() => {
  const checkAuth = async () => {
    const user = await API.getUserInfo(); // we have the user info here
    setLoggedIn(true);
    setUser(user);
  };
  checkAuth();
}, []);

  const handleLogin = async (credentials) => {
  try {
    const user = await API.logIn(credentials);
    setLoggedIn(true);
    setUser(user);
    setMessage({msg: `Welcome, ${user.username}!`, type: 'success'});
  } catch(err) {
    
    setMessage({msg: err.message ? err.message : String(err), type: 'danger'});
  }
};

  const handleLogout = async () => {
  await API.logOut();
  setLoggedIn(false);
  setUser('');
  setMessage({});
  
};

  return (
    <Routes>
      <Route element={ <DefaultLayout loggedIn={loggedIn} handleLogout={handleLogout} message={message} setMessage={setMessage} /> } >
        <Route path="/" element={ <HomePage loggedIn={loggedIn} /> } />
        <Route path='/login' element={loggedIn ? <Navigate replace to={`/${user.id}`}/> : <LoginForm handleLogin={handleLogin} />} />
        <Route path="/:userId" element={loggedIn ? <UserProfile user={user} /> : <Navigate to="/" />} />
        
        
      </Route>
      <Route path="/:userId/game/:gameId" element={loggedIn ? <GamePage user={user} /> : <Navigate to="/" />} />
      <Route path="*" element={ <NotFound /> } />
    </Routes>
  )
}

export default App
