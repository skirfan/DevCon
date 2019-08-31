import { GET_ERRORS, SET_CURRENT_USER } from "./types";
import axios from "axios";
import setAuthToken from "./../utils/setAuthToken";
import jwt_decode from "jwt-decode";

// Register User
export const registerUser = (userData, history) => dispatch => {
  axios
    .post("/api/users/register", userData)
    .then(result => {
      history.push("/login");
    })
    .catch(error => {
      dispatch({
        type: GET_ERRORS,
        payload: error.response.data
      });
    });
};

// Login User
export const loginUser = userData => dispatch => {
  axios
    .post("/api/users/login", userData)
    .then(result => {
      console.info("[authAction.js] userData ======>", userData);

      // Save to local storage
      const { token } = result.data;
      // Set token to local storage
      localStorage.setItem("jwtToken", token);

      // Set token to auth header
      setAuthToken(token);
      // Decode Token to get user data
      const decoded = jwt_decode(token);
      // Set current user
      dispatch({
        type: SET_CURRENT_USER,
        payload: decoded
      });
    })
    .catch(error => {
      console.info("[authAction.js] error ======>", error);
      dispatch({
        type: GET_ERRORS,
        payload: error.response.data
      });
    });
};

// Set logged in user
// export const setCurrentUser = decoded => {
//   return {
//     dispatch: {
//       type: SET_CURRENT_USER,
//       payload: decoded
//     }
//   };
// };

// Logout action
export const logoutUser = () => dispatch => {
  // remove token from local storage
  localStorage.removeItem("jwtToken");
  // Remove the auth header for future request
  setAuthToken(false);
};
