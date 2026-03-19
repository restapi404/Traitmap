import axios from "axios";
import Cookies from "js-cookie";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
});

api.interceptors.request.use((config) => {
  const token = Cookies.get("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;

export interface User {
  user_id: number;
  username: string;
  email: string;
  age?: number;
  education_level?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface MBTIScores {
  extraversion_score: number;
  introversion_score: number;
  sensing_score: number;
  intuition_score: number;
  thinking_score: number;
  feeling_score: number;
  judging_score: number;
  perceiving_score: number;
}

export interface Recommendation {
  rank: number;
  job_title: string;
  job_description?: string;
  department?: string;
  jobfield_name: string;
  salary_min?: number;
  salary_max?: number;
  recommendation_type: string;
  cbf_score?: number;
  cf_score?: number;
  final_score: number;
}

export interface QuizResult {
  mbti_type: string;
  mbti_label: string;
  scores: MBTIScores;
  recommendations: Recommendation[];
}

export interface Question {
  position: number;
  text: string;
  answers: string[];
}