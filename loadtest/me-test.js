import http from 'k6/http';

export const options = {
  vus: 10,
  duration: '30s',
};

export default function () {
  http.get(
    'http://localhost:8080/me',
    {
      headers: {
        Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3ODA2NDkyMDcsInVzZXJfaWQiOiIwNDUzYTg2OC0xZDI2LTQ5MDEtYjQ2Yy03MjAwMjJjZWQwMGMifQ.3q66TEpgmZDz4bTvDqIiUdouRmW7JnySlxLjWMy7zvQ',
      },
    }
  );
}