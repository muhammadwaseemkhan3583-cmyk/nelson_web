import { toWords } from "number-to-words";
import { auth } from "./firebase";

export const formatCurrencyToWords = (amount: number): string => {
  if (!amount || isNaN(amount)) return "Zero PKR Only.";
  
  try {
    const words = toWords(amount);
    // Capitalize first letter and format
    const formattedWords = words.charAt(0).toUpperCase() + words.slice(1);
    return `Rupees ${formattedWords.replace(/-/g, ' ')} Only.`.replace(/ and /g, ' ');
  } catch (e) {
    return "Amount too large to process.";
  }
};

export const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("No authenticated user found.");
  }

  const token = await user.getIdToken();
  const headers = {
    ...options.headers,
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  return fetch(url, { ...options, headers });
};
