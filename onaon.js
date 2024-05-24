const firebase = require("firebase/app");
require("firebase/firestore");

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCEB61CX_yCqs1o43hwkwm6j605zlfb-JY",
  authDomain: "netsocdateregularprod.firebaseapp.com",
  databaseURL: "https://netsocdateregularprod.firebaseio.com",
  projectId: "netsocdateregularprod",
  storageBucket: "netsocdateregularprod.appspot.com",
  messagingSenderId: "423060889807",
  appId: "1:423060889807:web:7aae5eabd39456b55217ba",
  measurementId: "G-3NR2R0NLSH",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore
const db = firebase.firestore();

// Example function to fetch data from a collection
async function fetchData(collectionName) {
  try {
    const snapshot = await db.collection(collectionName).get();
    snapshot.forEach((doc) => {
      console.log(doc.id, "=>", doc.data());
    });
  } catch (error) {
    console.error("Error fetching data: ", error);
  }
}

// Replace 'your_collection_name' with the name of your collection
fetchData("users");
