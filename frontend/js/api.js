const API_URL = "/api";


async function apiRequest(
  endpoint,
  options = {}
) {

  const token =
    localStorage.getItem(
      "token"
    );


  const headers = {

    "Content-Type":
      "application/json",

    ...(options.headers || {})

  };


  if (token) {

    headers.Authorization =
      `Bearer ${token}`;

  }


  const response =
    await fetch(
      `${API_URL}${endpoint}`,
      {
        ...options,
        headers
      }
    );


  let data = {};


  try {

    data =
      await response.json();

  } catch (error) {

    data = {};

  }


  if (!response.ok) {

    throw new Error(

      data.message ||
      "Ocorreu um erro na requisição."

    );

  }


  return data;

}