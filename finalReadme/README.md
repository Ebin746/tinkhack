# project

## File List

- client\.eslintrc.cjs
- client\index.html
- client\package.json
- client\README.md
- client\src\App.jsx
- client\src\components\navBar.jsx
- client\src\components\PodcastCard.jsx
- client\src\components\sideBar.jsx
- client\src\index.css
- client\src\main.jsx
- client\src\pages\DashBord.jsx
- client\src\pages\Favorite.jsx
- client\src\pages\login.jsx
- client\src\pages\Logoutpage.jsx
- client\src\pages\Search.jsx
- client\src\utils\Data.js
- client\src\utils\PodcastDetails.json
- client\src\utils\Themes.js
- README.md

## File Contents

### client\.eslintrc.cjs
```
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  settings: { react: { version: '18.2' } },
  plugins: ['react-refresh'],
  rules: {
    'react/jsx-no-target-blank': 'off',
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
  },
}

```

### client\index.html
```
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Podcast App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>

```

### client\package.json
```
{
  "name": "client",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build --outDir=build",
    "lint": "eslint . --ext js,jsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview"
  },
  "dependencies": {
    "@emotion/react": "^11.11.4",
    "@emotion/styled": "^11.11.0",
    "@mui/icons-material": "^5.15.11",
    "@mui/material": "^5.15.11",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-hash-link": "^1.0.2",
    "react-router-dom": "^6.22.2",
    "react-router-hash-link": "^2.4.3",
    "styled-components": "^6.1.8"
  },
  "devDependencies": {
    "@types/react": "^18.2.56",
    "@types/react-dom": "^18.2.19",
    "@vitejs/plugin-react": "^4.2.1",
    "eslint": "^8.56.0",
    "eslint-plugin-react": "^7.33.2",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "vite": "^5.1.4"
  }
}

```

### client\README.md
```
# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

```

### client\src\App.jsx
```
import React, { useState } from "react";
import { styled, ThemeProvider } from "styled-components";
import { darkTheme, lightTheme } from "./utils/Themes";
import SideBar from "./components/sideBar.jsx";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import NavBar from "./components/navBar.jsx";
import DashBord from "./pages/DashBord.jsx";
import Search from "./pages/Search.jsx";
import Favorite from "./pages/Favorite.jsx";
import Login from "./pages/login.jsx";
import LogoutCard from "./pages/Logoutpage.jsx";

const App = () => {
  const [darkMod, setDarkMod] = useState(true);
  const [menuOpen, setMenuOpen] = useState(true);
  const [islogin, setIsLogin] = useState(false);

  function handleLogin() {
    setIsLogin((islogin) => !islogin);
    console.log("clicked login");
  }

  const [islogout, setIsLogout] = useState(false);

  function handleLogout() {
    setIsLogout((islogout) => !islogout);
    console.log("clicked logout");
  }

  function MenuOpenClose() {
    setMenuOpen((menuOpen) => !menuOpen);
    console.log("changed");
  }

  let ids = [
    "culture",
    "business",
    "education",
    "health",
    "comedy",
    "news",
    "science",
    "history",
    "religion",
    "development",
    "sports",
    "crime",
  ];

  return (
    <ThemeProvider theme={darkMod ? darkTheme : lightTheme}>
      <BrowserRouter>
        <Container>
          <SideBar
            menuOpen={menuOpen}
            setMenuOpen={setMenuOpen}
            darkMod={darkMod}
            setDarkMod={setDarkMod}
            handleLogout={handleLogout}
          />
          <Frame>
            <NavBar toggle={MenuOpenClose} handleLogin={handleLogin} />
            <LoginDiv className={islogin ? "active" : ""}>
              <Login handleLogin={handleLogin} />
            </LoginDiv>
            <LogOutDiv className={islogout ? "active" : ""}>
              <LogoutCard handleLogout={handleLogout} />
            </LogOutDiv>
            <Routes>
              <Route
                path="/"
                element={
                  <DashBord islogin={islogin} handleLogin={handleLogin} />
                }
              />
              <Route path="/search" element={<Search />} />
              <Route path="/favorite" element={<Favorite />} />
            </Routes>
          </Frame>
        </Container>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;

const Container = styled.div`
  background-color: ${({ theme }) => theme.bgLight};
  height: 100vh;
  width: 100%;
  display: flex;
  overflow-x: hidden;
  overflow-y: hidden;
`;

const Frame = styled.div`
  display: flex;
  flex-direction: column;
  flex: 3;
`;

const LoginDiv = styled.div`
  z-index: 4;
  position: fixed; 
  top: 0px;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.4);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease-in-out;

  &.active {
    z-index: 5;
    opacity: 1;
    pointer-events: auto;
  }
`;

const LogOutDiv = styled.div`
  z-index: 4;
  position: fixed; 
  top: 0px;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex; 
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.4); 
  opacity: 0; 
  pointer-events: none; 
  transition: opacity 0.3s ease-in-out; 

  &.active {
    z-index: 5;
    opacity: 1; 
    pointer-events: auto; 
  }
`;

```

### client\src\components\navBar.jsx
```
import React, { useState } from "react";
import styled from "styled-components";
import Person2RoundedIcon from "@mui/icons-material/Person2Rounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";

const navBar = ({ toggle, handleLogin }) => {
  return (
    <>
      <NavBarDiv>
        <MenuRoundedIcon className="menu" onClick={() => toggle()} />
        <ButtonId onClick={() => handleLogin()}>
          <Person2RoundedIcon />
          <p>Login</p>
        </ButtonId>
      </NavBarDiv>
    </>
  );
};

export default navBar;

const NavBarDiv = styled.div`
  display: flex;
  padding: 10px 0px 0px;
  justify-content: space-between;
  width: 100%;
  align-items: center;
  background-color: ${({ theme }) => theme.bg};
  color: ${({ theme }) => theme.text_primary};
  border-radius: 16px;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(5.7px);
  -webkit-backdrop-filter: blur(5.7);
  color: ${({ theme }) => theme.primary};
  .menu {
    margin-left: 20px;
    cursor: pointer;
    font-size: 30px;
  }
`;

const ButtonId = styled.div`
  display: flex;
  max-width: 80px;
  justify-content: space-around;
  align-items: center;
  margin-right: 10px;
  height: 40px;
  gap: 8px;
  padding: 0px 5px;
  cursor: pointer;
  border: 1px solid ${({ theme }) => theme.primary};
  border-radius: 15px;
  font-size: 14px;
  p {
    font-weight: bold;
    display: block;
  }
  @media (max-width: 360px) {
    margin-right: 20px;
  }
`;

```

### client\src\components\PodcastCard.jsx
```
import React, { useState } from "react";
import FavoriteIcon from "@mui/icons-material/Favorite";
import styled from "styled-components";
import images from "/images/podcast-neon-signs-style-text-free-vector.jpg";

const PodcastCard = ({ title, about, views, creator }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const makeFavorite = () => {
    setIsFavorite((e) => !e);
  };
  return (
    <Card>
      <Top>
        <FavoriteIconStyled
          className="icons"
          onClick={makeFavorite}
          isFavorite={isFavorite}
        />
        <CardImage src={images} />
      </Top>
      <CardDetails>
        <MainInfo>
          <Title>{title}</Title>
          <About>{about}</About>
          <CreatorsInfo>
            <Creators>
              <Profile className="Profile">p</Profile>
              <Name>{creator}</Name>
            </Creators>
            <Views>{views}</Views>
          </CreatorsInfo>
        </MainInfo>
      </CardDetails>
    </Card>
  );
};

export default PodcastCard;

const Card = styled.div`
  margin-top: 20px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  background-color: ${({ theme }) => theme.bg};
  width: 220px;
  height: 300px;
  justify-content: space-around;
  padding: 7px;
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.05);
  }
`;

const CardDetails = styled.div``;

const MainInfo = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const CreatorsInfo = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  margin: 6px;
  font-size: 12px;
  width: 100%;
`;

const Views = styled.div``;

const Creators = styled.div`
  display: flex;
  flex-direction: row;
  gap: 10px;
`;

const Name = styled.div``;

const Profile = styled.div`
  background-color: rgb(4, 108, 108);
  width: 30px;
  height: 28px;
  border-radius: 50px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const About = styled.div`
  font-size: 14px;
  width: 200px;
  height: 80px;
  white-space: wrap;
  overflow: clip;
  text-overflow: ellipsis;
`;

const Title = styled.div`
  font-size: 20px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Top = styled.div`
  display: flex;
  position: relative;
  object-fit: cover;

  .icons {
    position: absolute;
    right: 8px;
    top: 8px;
  }
`;

const CardImage = styled.img`
  width: 100%;
  border-radius: 10px;
  height: 160px;
  display: block;
  transition: filter 0.3s ease-in-out;
`;
const FavoriteIconStyled = styled(FavoriteIcon)`
  position: absolute;
  right: 8px;
  top: 8px;
  color: ${({ isFavorite }) => (isFavorite ? "red" : "#ccc")};
  cursor: pointer;
  transition: color 1s ease-in-out, transform 0.7s ease-in-out,
    box-shadow 1s ease-in-out;

  &:hover {
    transition: color 0.4s ease-in-out, transform 0.7s ease-in-out;
    color: ${({ isFavorite }) => (isFavorite ? "red" : "#ccccccde")};
    transform: scale(1.7); /* Scale up on hover */
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.3); /* Add box-shadow on hover */
  }

  &:active {
    transform: scale(1.3); /* Scale down when clicked */
  }
`;

```

### client\src\components\sideBar.jsx
```
import React, { createElement, useState } from "react";
import styled from "styled-components";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import MicNoneRoundedIcon from "@mui/icons-material/MicNoneRounded";
import SearchIcon from "@mui/icons-material/Search";
import FavoriteIcon from "@mui/icons-material/Favorite";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import { Link } from "react-router-dom";
import LogoutCard from "../pages/Logoutpage";
const SideBar = ({
  menuOpen,
  setMenuOpen,
  darkMod,
  setDarkMod,
  handleLogout,
}) => {
 
  const Menuitems = [
    {
      link: "/",
      name: "Dashbord",
      icon: <HomeRoundedIcon />,
    },
    {
      link: "/search",
      name: "Search",
      icon: <SearchIcon />,
    },
    {
      link: "/favorite",
      name: "Favourites",
      icon: <FavoriteIcon />,
    },
  ];
  const buttons = [
    {
      fun: () => {
        createElement("input").type("file");
      },
      name: (
        <label htmlFor={"upload"}>
          {" "}
          <input
            id="upload"
            type="file"
            placeholder="Upload"
            style={{ display: "none" }}
          />
          Upload
        </label>
      ),
      icon: <CloudUploadRoundedIcon />,
    },
    {
      fun: () => setDarkMod((darkMod) => !darkMod),
      name: darkMod ? "Dark mod " : "Light Mod",
      icon: darkMod ? <DarkModeRoundedIcon /> : <LightModeRoundedIcon />,
    },
    {
      fun: () => handleLogout(),
      name: "Log Out",
      icon: <LogoutRoundedIcon />,
    },
  ];

  return (
    <MenuContainer menuOpen={menuOpen}>
      {" "}
      <Flex>
        <Mic>
          <MicNoneRoundedIcon />
        </Mic>
        <Logo>PodCastStream</Logo>
        <Close>
          <CloseRoundedIcon
            onClick={() => {
              setMenuOpen((menuOpen) => !menuOpen);
            }}
            style={{ cursor: "pointer" }}
          />
        </Close>
      </Flex>
      {Menuitems.map((item, index) => (
        <Link key={index} to={item.link} style={{ textDecoration: "none" }}>
          <Elements>
            {item.icon}
            <NavText>{item.name}</NavText>
          </Elements>
        </Link>
      ))}
      <HR />
      {buttons.map((items, i) => (
        <Elements key={i} onClick={items.fun}>
          {items.icon}
          <NavText>{items.name}</NavText>
        </Elements>
      ))}
    </MenuContainer>
  );
};

export default SideBar;

const MenuContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  flex: 0.5;
  background-color: ${({ theme }) => theme.bg};
  color: ${({ theme }) => theme.text_primary};
  @media (max-width: 1100px) {
    position: fixed;
    z-index: 1000;
    width: 100%;
    max-width: 250px;
    left: ${(props) => (props.menuOpen ? "0" : "-100%")};
    transition: 0.3s ease-in-out;
  }
`;

const Flex = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 0px 5px;
`;

const Logo = styled.div`
  width: 100%;
  color: ${({ theme }) => theme.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 20px;
  font-weight: bold;
  margin: 16px 0px;
`;

const Close = styled.div`
  display: none;
  @media (max-width: 1100px) {
    display: block;
  }
  margin: 0px 0px 0px 7px;
`;

const Elements = styled.div`
  padding: 10px 20px;
  gap: 10px;
  width: 100%;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  cursor: pointer;
  text-decoration: none !important;
  color: ${({ theme }) => theme.text_secondary};
  :hover {
    background-color: ${({ theme }) => theme.text_secondary};
    color: ${({ theme }) => theme.text_primary};
  }
`;

const Mic = styled.div`
  height: 40px;
  margin-left: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  display: block;
`;

const NavText = styled.span`
  padding: 0px 12px;
  text-decoration: none !important;
`;

const HR = styled.div`
  height: 1px;
  width: 100%;
  background-color: ${({ theme }) => theme.text_secondary};
  margin: 10px 0px;
`;

```

### client\src\index.css
```
@import url("https://fonts.googleapis.com/css2?family=Poppins:wght@100;300;400;500;600&display=swap");
html {
  scroll-behavior: smooth;
}
body {
  margin: 0;
  padding: 0;
  font-family: "Poppins", sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* width */
::-webkit-scrollbar {
  width: 2px;
}
/* Track */
::-webkit-scrollbar-track {
}

/* Handle */
::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 6px;
  height: 50px;
}
```

### client\src\main.jsx
```
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

```

### client\src\pages\DashBord.jsx
```
import React from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import PodcastCard from "../components/PodcastCard";
import PodcastDetails from "../utils/PodcastDetails.json";

const DashBord = () => {
  const genres = [
    "culture",
    "business",
    "education",
    "health",
    "comedy",
    "news",
    "science",
    "history",
    "religion",
    "development",
    "sports",
    "crime",
  ];
  console.log(PodcastDetails[genres[1]]);
  return (
    <MainDashBoard>
      {genres.map((category, i) => (
        <Filter key={i} id={category}>
          <Topic>
            {category.toLocaleUpperCase()}
            <Link className="categorys" to={"#"}>
              <span>Show all</span>
            </Link>
          </Topic>
          <PodCast>
            {PodcastDetails[category].map((podcast, j) => (
              <PodcastCard
                key={j}
                title={podcast.title}
                about={podcast.about}
                creator={podcast.creator.name}
                views={podcast.views}
              />
            ))}
          </PodCast>
        </Filter>
      ))}
    </MainDashBoard>
  );
};

export default DashBord;

const MainDashBoard = styled.div`
  margin: 16px;
  display: flex;
  flex-direction: column;
  padding: 10px 20px;
  padding-bottom: 200px;
  height: 100%;
  flex-direction: scroll;
  gap: 10px;
  overflow-y: scroll;
  @media (max-width: 720px) {
    padding: 6px 10px;
    margin: 8px;
  }
`;
const Topic = styled.div`
  font-weight: bold;
  display: flex;
  justify-content: space-between;
  width: 100%;
  align-items: center;
  padding: 2px;
  font-size: 24px;
  .categorys {
    text-decoration: none;
    font-weight: 300;
    color: ${({ theme }) => theme.primary};
    font-size: 20px;
    @media (max-width: 720px) {
      font-size: 14px;
    }
  }
  @media (max-width: 720px) {
    font-size: 18px;
  }
`;

const Filter = styled.div`
  display: block;
  background-color: ${({ theme }) => theme.bg};
  border: none;
  border-radius: 5px;

  padding: 6px;
  font-size: 15px;
  color: ${({ theme }) => theme.text_primary};
  margin-bottom: 20px;
`;

const PodCast = styled.div`
  z-index: 3;
  display: flex;
  flex-wrap: wrap;
  gap: 60px;
  align-items: center;
  padding-left: 30px;
  background-color: ${({ theme }) => theme.bgLight};
  @media (max-width: 720px) {
    justify-content: center;
    flex-direction: column;
    padding: 10px;
    gap: 30px;
  }
`;

```

### client\src\pages\Favorite.jsx
```
import React from 'react'
import PodcastCard from '../components/PodcastCard'
import styled from 'styled-components'
const Favorite = () => {
  return (
 <>
<Filter>
<PodCast>
<PodcastCard
          key={`podcast-${1}`} 
          title="Sample Podcast Title" 
          about="A short description about the podcast." 
          creator="Sample Creator" 
          views={1500}
        />
</PodCast>
</Filter>
 </>
  )
}

export default Favorite


const PodCast = styled.div`
z-index: 3;
  display: flex;
  flex-wrap: wrap;
  gap: 60px;
  align-items: center;
  padding-left: 30px;
  background-color: ${({ theme }) => theme.bgLight};
  @media (max-width: 720px) {
    justify-content: center;
    flex-direction: column;
    padding: 10px;
    gap: 30px;
  }
`;
const Filter = styled.div`
  display: block;
  background-color: ${({ theme }) => theme.bg};
  border: none;
  border-radius: 5px;

  padding: 6px;
  font-size: 15px;
  color: ${({ theme }) => theme.text_primary};
  margin-bottom: 20px; 
`;
```

### client\src\pages\login.jsx
```
import React, { useState } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  background-color:transparent;

  @media (max-width: 768px) {
    padding: 5px;
    width: 200px;
  }
`;

const Card = styled.div`
  display: flex;
  flex-direction: column;
  padding: 30px;
  border-radius: 5px;
  background-color: white;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  width: 200px;
  position: relative;

  @media (max-width: 768px) {
    width: 190px;
  }
`;

const Title = styled.h2`
  text-align: center;
  margin-bottom: 20px;
`;

const InputContainer = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 15px;
`;

const InputLabel = styled.label`
  margin-bottom: 5px;
`;

const Input = styled.input`
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 3px;
  &::focus {
    outline: none;
    border-color: #999;
  }
`;

const Button = styled.button`
  padding: 10px 20px;
  border: none;
  border-radius: 3px;
  background-color: #8e47f1;
  color: white;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;

  &::hover {
    background-color: #be1adb;
  }
`;

const ErrorMessage = styled.p`
  color: red;
  font-weight: bold;
  margin: 10px 0;
  text-align: center;
`;

const CloseButton = styled.button`
color: black;
  position: absolute;
  top: 10px;
  right: 20px;
  padding: 5px;
  border: none;
  background-color: transparent;
  cursor: pointer;
  @media (max-width:420) {
    right: 25px;
  }
  &::before,
  &::after {
    content: '';
    display: block;
    width: 15px;
    height: 2px;
    background-color: #ccc;
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
  }

  &::before {
    transform: rotate(45deg);
  }

  &::after {
    transform: rotate(-45deg);
  }
`;

const Login = ({ handleLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    if (username === '' || password === '') {
      setErrorMessage('Please enter username and password');
      return;
    }

    setUsername('');
    setPassword('');
    setErrorMessage('');

    alert('Login successful!');
  };

  return (
    <Container>
      <Card>
        <CloseButton onClick={() => { handleLogin() }} />
        <Title>Login</Title>
        <form onSubmit={handleSubmit}>
          <InputContainer>
            <InputLabel htmlFor="username">Username</InputLabel>
            <Input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </InputContainer>
          <InputContainer>
            <InputLabel htmlFor="password">Password</InputLabel>
            <Input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </InputContainer>
          {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
          <Button type="submit">Login</Button>
        </form>
      </Card>
    </Container>
  );
};

export default Login;

```

### client\src\pages\Logoutpage.jsx
```
import React from 'react';
import styled from 'styled-components';

const LogoutCardContainer = styled.div`
  position: absolute;
  width: 200px;
  height: 100px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: #fff;
  padding: 20px;
  border-radius: 5px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
`;

const LogoutContent = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 10px;
`;

const LogoutText = styled.p`
  font-size: 16px;
  margin: 0;
  color: #333;
  text-align: center;
`;

const LogoutButton = styled.button`
  margin: 10px 0px 10px 2px;
  background-color: #be1adb;
  color: #fff;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.3) ease-in;
  }
`;

const NotNowButton = styled(LogoutButton)`
  background-color: #e0e0e0;
  color: #333;
`;

const LogoutCard = ({ handleLogout }) => {

    function ConformLogout(){
        alert("Logout done")
    }
  return (
    <LogoutCardContainer className={'visible'}>
      <LogoutContent>
        <LogoutText>Are you sure you want to log out?</LogoutText>
        <div>
          <LogoutButton onClick={() => ConformLogout()}>Confirm</LogoutButton>
          <NotNowButton onClick={handleLogout}>Not Now</NotNowButton>
        </div>
      </LogoutContent>
    </LogoutCardContainer>
  );
};

export default LogoutCard;

```

### client\src\pages\Search.jsx
```
import React from "react";
import { styled, keyframes } from "styled-components";
import SearchIcon from "@mui/icons-material/Search";
import MicNoneRoundedIcon from "@mui/icons-material/MicNoneRounded";
import { Category } from "../utils/Data";
import { Link } from "react-router-dom";
import { HashLink } from "react-router-hash-link";
const Search = () => {
  return (
    <SearchContainer>
      <p className="Heading"> Find your podcast</p>
      <BottomSearch>
        <SearchBar>
          <SearchInput placeholder="Search Podcast" />
          <SearchIcon className="search" />
        </SearchBar>
        {Category.map((e, i) => (
          <HashLink
            key={i}
            to={`/#${e.name.toLocaleLowerCase()}`}
            style={{ textDecoration: "none" }}
          >
            <Sections props={e.color}>
              <PodcastPic>
                <img src={e.img} alt="pic" />
              </PodcastPic>
              <PodcastTitle>
                <p>{e.name}</p>
              </PodcastTitle>
            </Sections>
          </HashLink>
        ))}
      </BottomSearch>
    </SearchContainer>
  );
};

export default Search;

const gradientAnimation = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;

const SearchContainer = styled.div`
  display: flex;
  flex-direction: column;
  margin: 3px;
  background-color: ${({ theme }) => theme.bgLight};
  color: ${({ theme }) => theme.text_primary};
  overflow-y: scroll;
  overflow-x: hidden;

  .Heading {
    text-align: center;
    margin: 0px 0px 3px 0px;
    width: 100%;
    height: 40px;
    background-image: repeating-linear-gradient(
      to right,
      #553c9a,
      #ee4b2b 10%,
      #553c9a 20%
    );
    background-size: 200% auto;
    color: white;
    padding: 10px 20px;
    border-radius: 10px;
    font-size: 2em;
    animation: ${gradientAnimation} 5s linear infinite;
    transition: transform 0.3s ease-in-out;
    cursor: pointer;
    @media (max-width: 470px) {
      margin: 0px 4px 2px 10px;
      text-align: start;
      font-size: 1.4em;
    }
    &:hover {
      transform: scale(1.1);
    }
  }
`;
const SearchInput = styled.input`
  width: 50px;
  height: 50px;
  outline: none;
  border: 1px solid white;

  background: ${({ theme }) => theme.bgLight};
  color: white;
  text-shadow: 0 0 10px ${({ theme }) => theme.primary};
  padding: 0 30px 0 20px;
  border-radius: 30px;
  box-shadow: 0 0 25px 0 ${({ theme }) => theme.primary},
    0 20px 25px 0 rgba(0, 0, 0, 0.2);

  transition: all 1s;

  &:hover {
    cursor: pointer;
  }

  &:focus {
    width: 300px;
    opacity: 1;
    cursor: text;
    ~ .search {
      transform: 1s all;
      font-size: 45px;
      transform: rotate(360deg);
      color: ${({ theme }) => theme.primary};
    }
  }
  ~ .search {
    font-size: 30px;
    transition: all 0.5s ease;
  }
  @media (max-width: 720px) {
    &:focus {
      width: 250px;
    }
  }
  @media (max-width: 420px) {
    width: 30px;
    &:focus {
      width: 150px;
    }
  }
`;
const SearchBar = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
`;
//Sections
const Sections = styled.div`
  border-radius: 1%;
  height: 120px;
  width: 100%;
  background-color: ${({ props }) => props};
  display: flex;
  flex-direction: row;
  margin: 10px 0px 10px 10px;
  padding-right: 10px;
`;
const BottomSearch = styled.div`
  background-color: ${({ theme }) => theme.bg};
  display: flex;
  flex-direction: column;
`;
const PodcastPic = styled.div`
  height: 100%;
  width: 300px;
  display: flex;
  justify-content: center;
  align-items: center;

  img {
    width: 210px;
    height: 110px;
    object-fit: fill;
    border: none;
    border-radius: 10%;
    cursor: pointer;
    @media (max-width: 420px) {
      width: 100px;
    }
  }

  @media (max-width: 420px) {
    width: 200px;
  }
`;
const PodcastTitle = styled.div`
  color: ${({ theme }) => theme.text_primary};
  height: 100%;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 20px;
  p {
    font-size: 90px;
    display: inline-block;
    font-weight: 600;

    @media (max-width: 350px) {
      font-size: 20px;
      font-weight: 700;
    }

    @media (min-width: 351px) and (max-width: 420px) {
      font-size: 20px;
    }

    @media (min-width: 421px) and (max-width: 720px) {
      font-size: 30px;
    }
    @media (min-width: 720px) and (max-width: 1000px) {
      font-size: 60px;
    }
  }
`;

```

### client\src\utils\Data.js
```
export const Category = [
    {
        name: "Culture",
        img: "https://media.npr.org/assets/img/2020/12/07/99percent_custom-ad44d7569e602b2698267142396e71e91c539149.jpg",
        color: "#e8562a"
    },
    {
        name: "Business",
        img: "https://m.media-amazon.com/images/I/41-7FShV-3L.jpg",
        color: "#c9b2ab"
    },
    {
        name: "Education",
        img: "https://m.media-amazon.com/images/M/MV5BMTc0Mjg1Nzc0MF5BMl5BanBnXkFtZTcwODM5OTcwOQ@@._V1_.jpg",
        color: "#8cabaa"
    },
    {
        name: "Health",
        img: "https://m.media-amazon.com/images/M/MV5BMjNjYjJkYTYtYjI5Zi00NWE4LWFiZjItMjM0N2VlZjgxY2U0XkEyXkFqcGdeQXVyNzg3NjQyOQ@@._V1_.jpg",
        color: "#62bf62"
    },
    {
        name: "Comedy",
        img: "https://deadline.com/wp-content/uploads/2023/03/LLZA-_Prime-Video-Brings-Trevor-Noah-Home-To-Host-Its-First-South-African-Original_LOL-Last-One-Laughing-South-Africa.jpg?w=1024",
        color: "#ed4c59"
    },
    {
        name: "News",
        img: "https://i.scdn.co/image/1b5af843be11feb6c563e0d95f5fe0dad659b757",
        color: "#ba7538",
    },
    {
        name: "Science",
        img: "https://t3.ftcdn.net/jpg/02/06/22/40/360_F_206224040_ejMSpHtBCxGpzM96b3rKPCkbqhfZNUpr.jpg",
        color: "#6c9dad",
    },
    {
        name: "History",
        img: "https://ssl-static.libsyn.com/p/assets/6/b/f/e/6bfe939ed4336498/HHA-1400px_b.jpg?crop=1:1,offset-y0",
        color: "#de577f"
    },
    {
        name: "Religion",
        img: "https://d1bsmz3sdihplr.cloudfront.net/media/podcast-shows/BP_podcast_cover_2-optimized.jpg",
        color: "#aeb4b5"
    },
    {
        name: "Development",
        img: "https://i.scdn.co/image/ab6765630000ba8a1d971613512218740199a755",
        color: "#74d0d6"
    },
    {
        name: "Sports",
        img: "https://api.wbez.org/v2/images/5f8278f7-6fbf-46b5-bdc1-dab0e31bf050.jpg?mode=FILL&width=696&height=696",
        color: "#7dba3c"
    },
    {
        name: "Crime",
        img: "https://images.squarespace-cdn.com/content/v1/5b6a11479f87707f6722bd01/1541786848970-Y0SCCZBCEY6OAE790VFB/MFM.jpg?format=1000w",
        color: "#6c4bb8"
    },

]
```

### client\src\utils\PodcastDetails.json
```
{
  "culture": [
    {
      "id": 1,
      "title": "Cultural Podcast 1",
      "about": "Explore diverse cultural topics and traditions from around the globe.",
      "creator": {
        "name": "Culture Aficionado 1",
        "avatar": "/images/avatar_culture1.jpg"
      },
      "views": 2500,
      "imageUrl": "/images/podcast_culture1.jpg"
    }
  ],
  "business": [
    {
      "id": 1,
      "title": "Business Podcast 1",
      "about": "Discover innovative business strategies and success stories from industry leaders.",
      "creator": {
        "name": "Business Expert 1",
        "avatar": "/images/avatar_business1.jpg"
      },
      "views": 2200,
      "imageUrl": "/images/podcast_business1.jpg"
    },
    {
      "id": 2,
      "title": "Business Hacks",
      "about": "Learn actionable tips and hacks to boost your business efficiency and growth.",
      "creator": {
        "name": "Business Coach 2",
        "avatar": "/images/avatar_business2.jpg"
      },
      "views": 1800,
      "imageUrl": "/images/podcast_business2.jpg"
    },
    {
      "id": 3,
      "title": "Interviews ",
      "about": "Gain insights from successful entrepreneurs and executives in various industries.",
      "creator": {
        "name": "Market Analyst 3",
        "avatar": "/images/avatar_business3.jpg"
      },
      "views": 3500,
      "imageUrl": "/images/podcast_business3.jpg"
    },
    {
      "id": 4,
      "title": "The Future of Business",
      "about": "Explore emerging trends and technologies shaping the future of the business landscape.",
      "creator": {
        "name": "Futurist 4",
        "avatar": "/images/avatar_business4.jpg"
      },
      "views": 1200,
      "imageUrl": "/images/podcast_business4.jpg"
    },
    {
      "id": 5,
      "title": "Marketing Strategies",
      "about": "Discover effective marketing strategies to attract customers and scale your business.",
      "creator": {
        "name": "Marketing Expert 5",
        "avatar": "/images/avatar_business5.jpg"
      },
      "views": 2700,
      "imageUrl": "/images/podcast_business5.jpg"
    }
  ],
  "education": [
    {
      "id": 1,
      "title": "Educational  Podcast 1",
      "about": "Gain valuable insights and knowledge on various educational topics and methodologies.",
      "creator": {
        "name": "Education Guru 1",
        "avatar": "/images/avatar_education1.jpg"
      },
      "views": 3000,
      "imageUrl": "/images/podcast_education1.jpg"
    }
  ],
  "health": [
    {
      "id": 1,
      "title": "Wellness Podcast 1",
      "about": "Learn about maintaining good health and wellness through expert advice and tips.",
      "creator": {
        "name": "Health Enthusiast 1",
        "avatar": "/images/avatar_health1.jpg"
      },
      "views": 2800,
      "imageUrl": "/images/podcast_health1.jpg"
    }
  ],
  "comedy": [
    {
      "id": 1,
      "title": "Comedy Podcast 1",
      "about": "Laugh out loud with hilarious comedy sketches and funny anecdotes.",
      "creator": {
        "name": "Comedian 1",
        "avatar": "/images/avatar_comedy1.jpg"
      },
      "views": 1200,
      "imageUrl": "/images/podcast_comedy1.jpg"
    },
    {
      "id": 2,
      "title": "Comedy Podcast 2",
      "about": "Get ready for non-stop laughter with this comedy podcast featuring stand-up routines and comedic discussions.",
      "creator": {
        "name": "Comedian 2",
        "avatar": "/images/avatar_comedy2.jpg"
      },
      "views": 900,
      "imageUrl": "/images/podcast_comedy2.jpg"
    },
    {
      "id": 3,
      "title": "Comedy Podcast 3",
      "about": "Join the funniest comedians as they share hilarious stories and jokes in this comedy podcast.",
      "creator": {
        "name": "Comedian 3",
        "avatar": "/images/avatar_comedy3.jpg"
      },
      "views": 1500,
      "imageUrl": "/images/podcast_comedy3.jpg"
    },
    {
      "id": 4,
      "title": "Comedy Podcast 4",
      "about": "Chuckle your way through the day with this side-splitting comedy podcast featuring witty banter and humorous anecdotes.",
      "creator": {
        "name": "Comedian 4",
        "avatar": "/images/avatar_comedy4.jpg"
      },
      "views": 1100,
      "imageUrl": "/images/podcast_comedy4.jpg"
    },
    {
      "id": 5,
      "title": "Comedy Podcast 5",
      "about": "Prepare to laugh until it hurts with this comedy podcast that promises to tickle your funny bone.",
      "creator": {
        "name": "Comedian 5",
        "avatar": "/images/avatar_comedy5.jpg"
      },
      "views": 1300,
      "imageUrl": "/images/podcast_comedy5.jpg"
    }
  ],
  "news": [
    {
      "id": 1,
      "title": " News Podcast 1",
      "about": "Stay updated with the latest breaking news and headlines from around the world.",
      "creator": {
        "name": "News Reporter 1",
        "avatar": "/images/avatar_news1.jpg"
      },
      "views": 2700,
      "imageUrl": "/images/podcast_news1.jpg"
    }
  ],
  "science": [
    {
      "id": 1,
      "title": "Science  Podcast 1",
      "about": "Explore fascinating scientific discoveries and theories with leading experts.",
      "creator": {
        "name": "Science Enthusiast 1",
        "avatar": "/images/avatar_science1.jpg"
      },
      "views": 3100,
      "imageUrl": "/images/podcast_science1.jpg"
    }
  ],
  "history": [
    {
      "id": 1,
      "title": "Historical Podcast 1",
      "about": "Delve into intriguing historical events and figures from different eras.",
      "creator": {
        "name": "History Buff 1",
        "avatar": "/images/avatar_history1.jpg"
      },
      "views": 2600,
      "imageUrl": "/images/podcast_history1.jpg"
    }
  ],
  "religion": [
    {
      "id": 1,
      "title": "Religious  Podcast 1",
      "about": "Reflect on spiritual teachings and beliefs from various religious traditions.",
      "creator": {
        "name": "Religion Scholar 1",
        "avatar": "/images/avatar_religion1.jpg"
      },
      "views": 2400,
      "imageUrl": "/images/podcast_religion1.jpg"
    }
  ],
  "development": [
    {
      "id": 1,
      "title": " Development Podcast",
      "about": "Achieve personal growth and development with insightful tips and strategies.",
      "creator": {
        "name": "Development Coach 1",
        "avatar": "/images/avatar_development1.jpg"
      },
      "views": 2900,
      "imageUrl": "/images/podcast_development1.jpg"
    }
  ],
  "sports": [
    {
      "id": 1,
      "title": "Sports  Podcast 1",
      "about": "Stay updated with the latest sports news, analysis, and discussions.",
      "creator": {
        "name": "Sports Enthusiast 1",
        "avatar": "/images/avatar_sports1.jpg"
      },
      "views": 3300,
      "imageUrl": "/images/podcast_sports1.jpg"
    }
  ],
  "crime": [
    {
      "id": 1,
      "title": " Crime Podcast 1",
      "about": "Uncover gripping true crime stories and mysteries from around the world.",
      "creator": {
        "name": "Crime Enthusiast 1",
        "avatar": "/images/avatar_crime1.jpg"
      },
      "views": 1800,
      "imageUrl": "/images/podcast_crime1.jpg"
    }
  ]
}

```

### client\src\utils\Themes.js
```
export const darkTheme = {
    bg:"#15171E",
    bgLight: "#1C1E27",
    primary:"#be1adb",
    text_primary:"#F2F3F4",
    text_secondary:"#b1b2b3",
    card:"#121212",
    button:"#5c5b5b",
}

export const lightTheme = {
    bg:"#FFFFFF",
    bgLight: "#f0f0f0",
    primary:"#be1adb",
    text_primary:"#111111",
    text_secondary:"#48494a",
    card:"#FFFFFF",
    button:"#5c5b5b",
}
```

### README.md
```

# 🎧 PodcastStream

[![Version](https://img.shields.io/badge/version-0.0.0-blue.svg)](https://semver.org)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://example.com/build)

A modern web application for discovering and listening to podcasts.

## ✨ Features

*   **🔧 Browse Podcasts:** Explore a wide range of podcasts across various categories.
*   **🔍 Search Functionality:** Quickly find podcasts using keywords and titles.
*   **💖 Favorite Podcasts:** Save your favorite podcasts for easy access.
*   **🌙 Theme Switching:** Toggle between light and dark modes for optimal viewing experience.
*   **👤 User Login:**  Login to personalize your podcast experience.
*   **🚀 Easy Navigation:**  Navigate through the app with a responsive sidebar.
*   **📤 Upload Podcast:** Upload you own podcast to share with the community.

## 🛠️ Tech Stack

| Category   | Technologies                         | Documentation                                                                                                                |
|------------|--------------------------------------|----------------------------------------------------------------------------------------------------------------------------|
| Frontend   | React v18.2.0, Vite v5.1.4         | [React Docs][react-url], [Vite Docs][vite-url]                                                                              |
| Styling    | styled-components v6.1.8, Material UI v5.15.11 | [styled-components Docs][styled-components-url], [Material UI Docs][material-ui-url]                                                                              |
| Routing    | react-router-dom v6.22.2, react-router-hash-link v2.4.3 | [react-router-dom Docs][react-router-dom-url], [react-router-hash-link][react-router-hash-link-url]
| Other      | ESLint, HashLink

## 🚀 Quick Start

### Prerequisites

*   Node.js v18 or higher
*   npm v8 or higher (or yarn)

### Installation

bash
git clone [repo-url]
cd client
npm install # or yarn install


### Environment

No environment variables are required for the client-side application.

## 💻 Development

### Commands

bash
npm run dev   # Start development server (or yarn dev)
npm run build # Create production build (or yarn build)
npm run lint  # Run ESLint (or yarn lint)


### Testing

Currently, the project does not include a dedicated testing strategy. Consider implementing unit, integration, or end-to-end tests for increased code reliability.

## 📦 Deployment

### Vercel

1.  Sign up for a [Vercel](https://vercel.com/) account.
2.  Install the Vercel CLI: `npm install -g vercel` or `yarn global add vercel`.
3.  Deploy the project: `vercel` from the project root.

### Netlify

1.  Sign up for a [Netlify](https://www.netlify.com/) account.
2.  Install the Netlify CLI: `npm install -g netlify-cli` or `yarn global add netlify-cli`.
3.  Deploy the project: `netlify deploy --prod` from the `build` directory.

## 🤝 Contributing

We welcome contributions to PodcastStream! Please follow these guidelines:

*   **Branch Naming:** Use `feat/`, `bugfix/`, or `chore/` prefixes. For example: `feat/new-podcast-card`.
*   **Commit Messages:** Write clear and concise commit messages. Use the present tense (e.g., "Add new feature" instead of "Added new feature").
*   **Pull Requests:**
    *   Ensure your code adheres to the project's coding standards (run `npm run lint` or `yarn lint`).
    *   Include relevant tests.
    *   Provide a clear description of the changes made.

> [!NOTE]
> Before submitting a pull request, ensure that all tests pass and that the code is properly formatted.

[react-url]: https://react.dev/
[vite-url]: https://vitejs.dev/
[styled-components-url]: https://styled-components.com/
[material-ui-url]: https://mui.com/
[react-router-dom-url]: https://reactrouter.com/en/main
[react-router-hash-link-url]: https://www.npmjs.com/package/react-router-hash-link

```

