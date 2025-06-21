import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from './firebaseConfig';

// // Set up reCAPTCHA verifier
// export const setUpRecaptcha = (elementId: string) => {
//   return new RecaptchaVerifier(auth, 'sign-in-button',{
//     'size': 'invisible', // or 'normal' based on your need
//     callback: (response: any) => {
//       // reCAPTCHA solved - allow phone authentication
//     },
//     'expired-callback': () => {
//       // Handle expired reCAPTCHA
//     },
//   });
// };

// // Function to send OTP
// export const sendOtp = async (phoneNumber: string) => {
//   setUpRecaptcha('recaptcha-container'); // Set up reCAPTCHA
//   const appVerifier = RecaptchaVerifier ;

//   try {
//     const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
//     window.recaptchaVerifier = confirmationResult;
//   } catch (error) {
//     console.error('Error sending OTP: ', error);
//     throw error;
//   }
// };

// // Function to verify OTP
// export const verifyOtp = async (confirmationResult: any, otp: string) => {
//   try {
//     const result = await confirmationResult.confirm(otp);
//     return result.user; // Authenticated user
//   } catch (error) {
//     console.error('Error verifying OTP: ', error);
//     throw error;
//   }
// };


// import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
// import { auth } from './firebaseConfig'; // Make sure your firebaseConfig is correctly imported

// // Set up the reCAPTCHA verifier
// export const setUpRecaptcha = (elementId: string) => {
//   return new RecaptchaVerifier(
//     auth, 'sign-in-button',{
//       'size':'invisible',
//       'callback': (response) => {
//         // onSignInSubmit();
//       }
//     }
//   );
// };

// // Function to send OTP to the user's phone
// export const sendOtp = async (phoneNumber: string) => {
//   const recaptchaVerifier = setUpRecaptcha('recaptcha-container'); // Set up the recaptchaVerifier

//   try {
//     const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
//     // Save the confirmation result to be used later for OTP verification
//     window.confirmationResult = confirmationResult;
//     return confirmationResult;
//   } catch (error) {
//     console.error('Error sending OTP: ', error);
//     throw error;
//   }
// };

// // Function to verify the OTP code entered by the user
// export const verifyOtp = async (otp: string) => {
//   try {
//     const confirmationResult = window.confirmationResult;
//     const result = await confirmationResult.confirm(otp); // Confirm the OTP code
//     const user = result.user; // Authenticated user
//     return user;
//   } catch (error) {
//     console.error('Error verifying OTP: ', error);
//     throw error;
//   }
// };

// // Reset reCAPTCHA after it has expired or been used
// export const resetRecaptcha = () => {
//   if (window.recaptchaVerifier) {
//     window.recaptchaVerifier.render().then(function (widgetId: any) {
//       grecaptcha.reset(widgetId); // Reset the reCAPTCHA
//     });
//   }
// };
