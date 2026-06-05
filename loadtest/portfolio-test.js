import http from "k6/http";
import { API_URL } from "@/config/api";

export const options = {
  vus: 10,
  duration: "30s",
};

const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3ODA2NDkyMDcsInVzZXJfaWQiOiIwNDUzYTg2OC0xZDI2LTQ5MDEtYjQ2Yy03MjAwMjJjZWQwMGMifQ.3q66TEpgmZDz4bTvDqIiUdouRmW7JnySlxLjWMy7zvQ";

export default function () {
  http.get(
    `${API_URL}/portfolio`,
    {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
      },
    }
  );
}