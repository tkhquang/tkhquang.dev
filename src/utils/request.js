import axios from "axios";

const request = axios.create({
  baseURL: `${process.env.GRIDSOME_SITE_API}`
});

export default request;
