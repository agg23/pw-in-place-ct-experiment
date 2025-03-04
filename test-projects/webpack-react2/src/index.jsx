const { createRoot } = require("react-dom/client");
const React = require('react');

const { App } = require("./App.jsx");

const container = document.getElementById("root");
const root = createRoot(container);
root.render(<App />);
