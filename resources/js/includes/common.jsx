import React from "react";
import { createRoot } from "react-dom/client";
import '../../css/includes.css';
import Header from "./navbar.jsx";
import Footer from "./footer.jsx";
import Welcome from "./welcome.jsx";

const header = document.getElementById("header");
if (header) createRoot(header).render(<Header />);

const welcome = document.getElementById("welcome");
if(welcome){
  const user = welcome.dataset.user ? JSON.parse(welcome.dataset.user) : null;
  createRoot(welcome).render(<Welcome user={user} />);
}

const footer = document.getElementById("footer");
if (footer) createRoot(footer).render(<Footer />);