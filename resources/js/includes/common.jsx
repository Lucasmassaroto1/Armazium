import React from "react";
import { createRoot } from "react-dom/client";
import '../../css/includes.css';
import Header from "./navbar.jsx";
import Footer from "./footer.jsx";

const header = document.getElementById("header");
if (header) createRoot(header).render(<Header />);

const footer = document.getElementById("footer");
if (footer) createRoot(footer).render(<Footer />);