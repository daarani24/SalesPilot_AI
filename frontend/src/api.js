import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
 
const client = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

export async function sendChatMessage(message, sessionId) {
  const response = await client.post("/chat", {
    message,
    session_id: sessionId || null,
  });
  return response.data;
}

export async function requestQuotation(customerName, productQuery, isStudent = false) {
  const response = await client.post("/quote", {
    customer_name: customerName,
    product_query: productQuery,
    is_student: isStudent,
  });
  return response.data;
}
 
export async function fetchLeads() {
  const response = await client.get("/leads");
  return response.data;
}
 
export function getFileUrl(relativePath) {
  return `${BASE_URL}${relativePath}`;
}
 
export default client;
 