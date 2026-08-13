import axios from "axios";

const API = axios.create({
  baseURL: "https://splitmate-wcl7.onrender.com/api",
});

export default API;